document.addEventListener("DOMContentLoaded", () => {

  const API_URL = "data-minifed.json";
  let products = [];
  let cart = loadCart();

  const views = document.querySelectorAll(".view");

  // Buttons
  const homeBtn = document.getElementById("homeBtn");
  const browseBtn = document.getElementById("browseBtn");
  const aboutBtn = document.getElementById("aboutBtn");
  const cartBtn = document.getElementById("cartBtn");
  const aboutDialog = document.getElementById("about");
  const closeAbout = document.getElementById("closeAbout");
  const logo = document.querySelector(".logo");

  // FILTER ELEMENTS FOR BROWSE PAGE
  const genderSelect = document.getElementById("genderSelect");
  const categorySelect = document.getElementById("categorySelect");
  const sortSelect = document.getElementById("sortSelect");
  const clearBtn = document.getElementById("clearFilters");
  const searchInput = document.getElementById("searchInput");

  // FILTER STATE
  let filterGender = "";
  let filterCategory = "";
  let sortOption = "name";
  let searchValue = "";

  // -------------------------
  // CART & SHIPPING CONSTANTS
  const TAX_RATE = 0.05; 
  const FREE_SHIPPING_THRESHOLD = 500;
  
  const SHIPPING_RATES = {
    standard: { ca: 10, us: 15, int: 20 },
    express: { ca: 25, us: 25, int: 30 },
    priority: { ca: 35, us: 50, int: 50 }
  };


  let selectedShippingMethod = 'standard';
  let selectedDestination = 'ca';
  // -------------------------

  // FUNCTIONS --------------------

  function showView(id) {
    views.forEach(v => v.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }

  // Load data
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      products = data;

      showHome(products);
      applyFilters(); 
      loadShippingState();
      showCart(); 
      updateCartCountDisplay();

      showView("home");
    });

  // HOME VIEW
  function showHome(products) {
    const container = document.getElementById("homeTrending");
    if (!container) return;

    container.innerHTML = ""; 

    const trending = [...products]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    container.innerHTML = `
      <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12 lg:max-w-7xl lg:px-8">
        <h2 class="text-2xl font-bold tracking-tight text-gray-900 mb-4">Trending Picks</h2>
        <div id="trendingGrid" class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8"></div>
      </div>
    `;

    const grid = document.getElementById("trendingGrid");

    trending.forEach(prod => {
      const card = document.createElement("div");
      card.className = "group relative cursor-pointer";

      card.innerHTML = `
        <div class="aspect-square w-full rounded-md bg-gray-200 flex items-center justify-center group-hover:opacity-75 lg:aspect-auto lg:h-80">
          <span class="text-gray-500">${prod.category}</span>
        </div>

        <div class="mt-4 flex justify-between">
          <div>
            <h3 class="text-sm text-gray-700">${prod.name}</h3>
            <p class="mt-1 text-sm text-gray-500 capitalize">${prod.gender}</p>
          </div>
          <p class="text-sm font-medium text-gray-900">$${prod.price}</p>
        </div>
      `;
      
      card.addEventListener("click", () => showSingleProduct(prod.id));

      grid.appendChild(card);
    });

  }
    
  // Load/Save Cart and Shipping State
  function saveCart() {
    localStorage.setItem("shoppee-cart", JSON.stringify(cart));
  }

  function loadCart() {
    return JSON.parse(localStorage.getItem("shoppee-cart")) || [];
  }

  function saveShippingState() {
    localStorage.setItem('shoppee-shipping-method', selectedShippingMethod);
    localStorage.setItem('shoppee-destination', selectedDestination);
  }

  function loadShippingState() {
    selectedShippingMethod = localStorage.getItem('shoppee-shipping-method') || 'standard';
    selectedDestination = localStorage.getItem('shoppee-destination') || 'ca';
  }

  // Helper for Shipping Cost Calculation
  function calculateShippingCost(subtotal, method, destination) {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    
    if (SHIPPING_RATES[method] && SHIPPING_RATES[method][destination] !== undefined) {
      return SHIPPING_RATES[method][destination];
    }

    return 0; 
  }

  // Helper for Cart Icon Count
  function updateCartCountDisplay() {
    const countElement = document.getElementById("cartCount");
    if (!countElement) return;

    let totalItems = 0;
    cart.forEach(item => {
      totalItems += item.quantity; 
    });

    countElement.textContent = totalItems;
    
    if (totalItems > 0) {
        countElement.style.display = 'inline-block';
    } else {
        countElement.style.display = 'none';
    }
  }
  
  // Helper for related products
  function getRelatedProducts(currentProductId, limit = 4) {
    const currentProduct = products.find(p => p.id == currentProductId);
    if (!currentProduct) return [];

    const related = products.filter(p => 
      p.category === currentProduct.category && p.id !== currentProductId
    );

    return related
      .sort(() => 0.5 - Math.random()) 
      .slice(0, limit); 
  }


  // CART FUNCTIONS
  function removeFromCart(id, size) {
    cart = cart.filter(item => !(item.id == id && item.size === size));
    saveCart();
    showCart(); 
    updateCartCountDisplay();
  }

  function updateQuantity(id, size, newQuantity) {
    const item = cart.find(i => i.id == id && i.size === size);
    if (item) {
        const qty = parseInt(newQuantity);
        if (qty <= 0 || isNaN(qty)) {
            removeFromCart(id, size);
        } else {
            item.quantity = qty;
            saveCart();
            showCart(); 
            updateCartCountDisplay();
        }
    }
  }

  function addToCart(id, quantity = 1, size = null) {
    const existing = cart.find(item => item.id == id && item.size === size);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id, quantity, size });
    }

    saveCart();
    updateCartCountDisplay();
  }


  // Browse View

  function showBrowse(productsList) {
    const container = document.getElementById("results");
    container.innerHTML = "";

    if (!productsList || productsList.length === 0) {
      container.innerHTML = `<p class="mt-4 text-gray-600">No matching products found.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="bg-white">
        <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <h2 class="sr-only">Products</h2>

          <div id="browseGrid" class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          </div>
        </div>
      </div>
    `;

    const grid = document.getElementById("browseGrid");

    productsList.forEach(prod => {
      const card = document.createElement("a");
      card.href = "#";
      card.className = "group browse-card";

      card.innerHTML = `
        <div class="aspect-square w-full rounded-lg bg-gray-200 flex items-center justify-center group-hover:opacity-75 xl:aspect-7/8">
          <span class="text-sm text-gray-500">${prod.category}</span>
        </div>

        <h3 class="mt-4 text-sm text-gray-700">${prod.name}</h3>
        <p class="mt-1 text-xs text-gray-500 capitalize">${prod.gender}</p>
        
        <div class="flex justify-between items-center mt-1">
            <p class="text-lg font-medium text-gray-900">$${prod.price}</p>
            <button class="add-to-cart-btn bg-indigo-600 text-white text-xs px-3 py-1 rounded hover:bg-indigo-700 transition duration-150" 
                    data-id="${prod.id}">
                + Cart
            </button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        e.preventDefault();
        showSingleProduct(prod.id);
      });

      grid.appendChild(card);
    });

    grid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            const id = button.dataset.id;
            addToCart(id, 1, null); 
            showSingleProduct(id);
        });
    });
  }

  // APPLY FILTERS / SORTING / SEARCH

  function applyFilters() {
    let filtered = [...products];

    // SEARCH
    if (searchValue.trim() !== "") {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // GENDER
    if (filterGender) {
      filtered = filtered.filter(p => p.gender === filterGender);
    }

    // CATEGORY
    if (filterCategory) {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    // SORTING
    if (sortOption === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } 
    else if (sortOption === "category") {
      filtered.sort((a, b) => a.category.localeCompare(b.category));
    } 
    else if (sortOption === "lowPrice") {
      filtered.sort((a, b) => a.price - b.price);
    } 
    else if (sortOption === "highPrice") {
      filtered.sort((a, b) => b.price - a.price);
    }

    showBrowse(filtered);
  }

  // Single product view

  function showSingleProduct(id) {
    const product = products.find(p => p.id == id);
    const details = document.getElementById("singleProduct");
    
    let selectedSize = null;
    let selectedQuantity = 1;

    details.innerHTML = `
    <div class="bg-white">
      <div class="pt-6">

        <button id="backToBrowse" class="ml-6 mb-6 border border-black text-black px-4 py-2 rounded hover:bg-black hover:text-white">
          ← Back
        </button>

        <nav aria-label="Breadcrumb">
          <ol role="list" class="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <li>
              <a class="mr-2 text-sm font-medium text-gray-900">${product.gender}</a>
            </li>
            <li>
              <a class="mr-2 text-sm font-medium text-gray-900">${product.category}</a>
            </li>
            <li class="text-sm">
              <span class="font-medium text-gray-500">${product.name}</span>
            </li>
          </ol>
        </nav>

        <div id="productDetailsContent">
          <div class="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-8 lg:px-8">
            <div class="aspect-square w-full rounded-lg bg-gray-200 flex justify-center items-center text-gray-500 text-sm">
              No Image
            </div>
          </div>

          <div class="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 
              lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] 
              lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">

            <div class="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
              <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">${product.name}</h1>
            </div>

            <div class="mt-4 lg:row-span-3 lg:mt-0">
              <p class="text-3xl tracking-tight text-gray-900">$${product.price}</p>

              <div class="mt-10">
                <h3 class="text-sm font-medium text-gray-900">Size</h3>
                <fieldset class="mt-4">
                  <div class="grid grid-cols-4 gap-3">
                    ${product.sizes.map(size => `
                      <label data-size="${size}" 
                        class="sizeSelect group relative flex cursor-pointer items-center justify-center 
                        rounded-md border border-gray-400 bg-white text-black p-3 hover:bg-black hover:text-white">
                        <span class="text-sm font-medium uppercase">${size}</span>
                      </label>
                    `).join("")}
                  </div>
                  <p id="sizeWarning" class="text-red-500 text-sm mt-2 hidden">Please select a size.</p>
                </fieldset>
              </div>
              
              <div class="mt-10">
                <h3 class="text-sm font-medium text-gray-900">Quantity</h3>
                <input type="number" id="quantityInput" value="1" min="1" max="100" 
                  class="w-20 mt-2 border border-gray-300 rounded-md p-2 text-center"
                >
              </div>

              <button id="addBtn" 
                class="mt-10 flex w-full items-center justify-center rounded-md border 
                border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white 
                hover:bg-indigo-700">Add to Cart</button>
            </div>

            <div class="py-10 lg:col-span-2 lg:col-start-1 
              lg:border-r lg:border-gray-200 lg:pt-6 lg:pr-8 lg:pb-16">

              <h3 class="text-sm font-medium text-gray-900">Description</h3>
              <p class="mt-4 text-gray-600">${product.description || "No description provided."}</p>

              <h3 class="mt-10 text-sm font-medium text-gray-900">Material</h3>
              <p class="mt-2 text-gray-600">${product.material || "Unknown"}</p>

            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="relatedProductsContainer" class="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
    </div>
    `;

    showView("singleProduct");

    const relatedProducts = getRelatedProducts(product.id, 4); 
    const relatedContainer = document.getElementById("relatedProductsContainer");

    if (relatedProducts.length > 0 && relatedContainer) {
      relatedContainer.innerHTML = `
          <section class="mt-10 border-t border-gray-200 pt-10">
            <h2 class="text-2xl font-bold tracking-tight text-gray-900 mb-6">Related Products</h2>
            <div class="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
              ${relatedProducts.map(prod => `
                <a href="#" class="group related-card" data-id="${prod.id}">
                  <div class="aspect-square w-full rounded-lg bg-gray-200 flex items-center justify-center group-hover:opacity-75">
                    <span class="text-sm text-gray-500">${prod.category}</span>
                  </div>
                  <h3 class="mt-4 text-sm text-gray-700">${prod.name}</h3>
                  <p class="mt-1 text-xs text-gray-500 capitalize">${prod.gender}</p>
                  
                  <div class="flex justify-between items-center mt-1">
                      <p class="text-lg font-medium text-gray-900">$${prod.price}</p>
                      <button class="add-to-cart-btn bg-indigo-600 text-white text-xs px-3 py-1 rounded hover:bg-indigo-700 transition duration-150" 
                              data-id="${prod.id}">
                          + Cart
                      </button>
                  </div>
                </a>
              `).join('')}
            </div>
          </section>
      `;
      

      relatedContainer.querySelectorAll('.related-card').forEach(card => {
          card.addEventListener('click', (e) => {
              e.preventDefault();
              const relatedId = card.dataset.id;
              showSingleProduct(relatedId); 
          });
      });
      
      relatedContainer.querySelectorAll('.add-to-cart-btn').forEach(button => {
          button.addEventListener('click', (e) => {
              e.preventDefault(); 
              e.stopPropagation(); 
              const id = button.dataset.id;
              addToCart(id, 1, null); 
              showSingleProduct(id);
          });
      });
    }

    document.getElementById("backToBrowse").addEventListener("click", () => {
      applyFilters(); 
      showView("browse");
    });

    document.querySelectorAll(".sizeSelect").forEach(btn => {
      btn.addEventListener("click", () => {
      selectedSize = btn.dataset.size;
      document.getElementById("sizeWarning").classList.add("hidden");

      document.querySelectorAll(".sizeSelect").forEach(b => {
        b.classList.remove("bg-black", "text-white");
        b.classList.add("bg-white", "text-black");
      });

      btn.classList.remove("bg-white", "text-black");
      btn.classList.add("bg-black", "text-white");
      });
  });

    const quantityInput = document.getElementById("quantityInput");
    quantityInput.addEventListener("change", (e) => {
      selectedQuantity = parseInt(e.target.value);
      if (selectedQuantity < 1 || isNaN(selectedQuantity)) {
        selectedQuantity = 1;
        e.target.value = 1;
      }
    });

    document.getElementById("addBtn").addEventListener("click", () => {
      if (!selectedSize) {
        document.getElementById("sizeWarning").classList.remove("hidden");
        return;
      }

      addToCart(product.id, selectedQuantity, selectedSize); 
      alert("✔ Added to cart!");
    });
  }
  
  // SHOW CART 

  function showCart() {
    const container = document.getElementById("cartContent");
    
    if (!container) return;
    container.innerHTML = "";

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="text-center py-20">
          <p class="text-gray-500 text-lg">Your cart is empty.</p>
          <button id="cartGoBrowse" class="mt-6 font-medium text-indigo-600 hover:text-indigo-500">
            Continue Shopping <span aria-hidden="true"> &rarr;</span>
          </button>
        </div>
      `;
      document.getElementById("cartGoBrowse").addEventListener("click", () => showView("browse"));
      updateCartCountDisplay();
      return;
    }

    let subtotal = 0;
    let cartItemsHtml = '';
    
    cart.forEach(item => {
      const product = products.find(p => p.id == item.id);
      if (!product) return;
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      const size = item.size ? `Size: ${item.size}` : '';
      const uniqueId = `${product.id}_${item.size || 'no-size'}`; 

      cartItemsHtml += `
        <li class="flex py-6">
          <div class="size-24 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center">
            <span class="text-xs text-gray-500">${product.category}</span>
          </div>

          <div class="ml-4 flex flex-1 flex-col">
            <div>
              <div class="flex justify-between text-base font-medium text-gray-900">
                <h3>
                  <a href="#">${product.name}</a>
                </h3>
                <p class="ml-4">$${itemTotal.toFixed(2)}</p>
              </div>
              <p class="mt-1 text-sm text-gray-500 capitalize">${size}</p>
            </div>
            
            <div class="flex flex-1 items-end justify-between text-sm">
              <div class="text-gray-500 flex items-center gap-2">
                <label for="qty-${uniqueId}">Qty:</label>
                <input type="number" 
                  id="qty-${uniqueId}" 
                  value="${item.quantity}" 
                  min="1" 
                  max="100" 
                  data-id="${product.id}" 
                  data-size="${item.size || ''}" 
                  class="qty-input w-16 border border-gray-300 rounded-md p-1 text-center text-sm"
                >
              </div>

              <div class="flex">
                <button type="button" class="remove-btn font-medium text-indigo-600 hover:text-indigo-500" 
                  data-id="${product.id}" data-size="${item.size || ''}">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </li>
      `;
    });
    
    const shippingCost = calculateShippingCost(subtotal, selectedShippingMethod, selectedDestination);
    const tax = subtotal * TAX_RATE;
    const grandTotal = subtotal + tax + shippingCost;
    
    const shippingMethodLabel = selectedShippingMethod.charAt(0).toUpperCase() + selectedShippingMethod.slice(1);
    const destinationLabel = { ca: 'Canada', us: 'US', int: 'International' }[selectedDestination];

    container.innerHTML = `
      <div class="flow-root">
        <ul role="list" class="-my-6 divide-y divide-gray-200">
          ${cartItemsHtml}
        </ul>
      </div>

      <div class="border-t border-gray-200 px-4 py-6 sm:px-6 mt-10">
        
        <div class="mb-4">
          <label for="destinationSelect" class="block text-sm font-medium text-gray-700 mb-1">Destination</label>
          <select id="destinationSelect" class="border rounded px-3 py-2 w-full">
            <option value="ca">Canada</option>
            <option value="us">United States</option>
            <option value="int">International</option>
          </select>
        </div>

        <div class="mb-4">
          <label for="shippingSelect" class="block text-sm font-medium text-gray-700 mb-1">Shipping Method</label>
          <select id="shippingSelect" class="border rounded px-3 py-2 w-full">
            <option value="standard">Standard</option>
            <option value="express">Express</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        <div class="space-y-1 pt-2 border-t">
            <div class="flex justify-between text-base">
                <p>Subtotal</p>
                <p>$${subtotal.toFixed(2)}</p>
            </div>
            
            <div class="flex justify-between text-sm text-gray-600">
                <p>Shipping (${shippingMethodLabel} to ${destinationLabel})</p>
                <p>${shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</p>
            </div>
            
            <div class="flex justify-between text-sm text-gray-600">
                <p>Tax (${(TAX_RATE * 100).toFixed(1)}%)</p>
                <p>$${tax.toFixed(2)}</p>
            </div>
            
            <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-400">
                <p>Grand Total</p>
                <p>$${grandTotal.toFixed(2)}</p>
            </div>
        </div>

        <div class="mt-6">
          <button id="checkoutBtn" class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700">
            Proceed to Checkout
          </button>
        </div>
        <div class="mt-6 flex justify-center text-center text-sm text-gray-500">
          <p>
            or
            <button id="continueShoppingBtn" type="button" class="font-medium text-indigo-600 hover:text-indigo-500">
              Continue Shopping
              <span aria-hidden="true"> &rarr;</span>
            </button>
          </p>
        </div>
      </div>
    `;
    
    container.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const size = btn.dataset.size || null;
        removeFromCart(id, size);
      });
    });

    container.querySelectorAll(".qty-input").forEach(input => {
      input.addEventListener("change", (e) => {
        const id = e.target.dataset.id;
        const size = e.target.dataset.size || null;
        const newQuantity = parseInt(e.target.value);
        updateQuantity(id, size, newQuantity);
      });
    });

    document.getElementById("checkoutBtn").addEventListener("click", () => {
      alert(`Checking out for $${grandTotal.toFixed(2)}!`);
      cart = []; 
      saveCart();
      showCart(); 
      updateCartCountDisplay(); 
      showView("cart");
    });

    document.getElementById("continueShoppingBtn").addEventListener("click", () => {
      showView("browse");
    });


    const destinationSelect = document.getElementById('destinationSelect');
    const shippingSelect = document.getElementById('shippingSelect');
    

    destinationSelect.value = selectedDestination;
    shippingSelect.value = selectedShippingMethod;

    destinationSelect.addEventListener('change', (e) => {
        selectedDestination = e.target.value;
        saveShippingState(); 
        showCart(); 
    });

    shippingSelect.addEventListener('change', (e) => {
        selectedShippingMethod = e.target.value;
        saveShippingState(); 
        showCart(); 
    });
  }

  // 
  // NAV LISTENERS 

  homeBtn.addEventListener("click", () => showView("home"));
  browseBtn.addEventListener("click", () => {
    applyFilters();
    showView("browse");
  });
  
  cartBtn.addEventListener("click", () => {
    showCart();
    showView("cart");
  });

  aboutBtn.addEventListener("click", () => aboutDialog.showModal());
  closeAbout.addEventListener("click", () => aboutDialog.close());
  logo.addEventListener("click", () => showView("home"));

  // Filter Listeners
  genderSelect.addEventListener("change", () => {
    filterGender = genderSelect.value;
    applyFilters();
  });

  categorySelect.addEventListener("change", () => {
    filterCategory = categorySelect.value;
    applyFilters();
  });

  sortSelect.addEventListener("change", () => {
    sortOption = sortSelect.value;
    applyFilters();
  });

  searchInput.addEventListener("input", () => {
    searchValue = searchInput.value;
    applyFilters();
  });

  clearBtn.addEventListener("click", () => {
    filterGender = "";
    filterCategory = "";
    sortOption = "name";
    searchValue = "";

    genderSelect.value = "";
    categorySelect.value = "";
    sortSelect.value = "name";
    searchInput.value = "";

    applyFilters();
  });

});