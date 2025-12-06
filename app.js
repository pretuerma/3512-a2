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
  const backToBrowseBtn = document.getElementById("backToBrowse");

  // FUNCTIONS
  function showView(id) {
    views.forEach(v => v.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }

  // LOAD API
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      products = data;

      showHome(products);
      showBrowse(products);
      showCart();

      showView("home");
    });

  // LISTENERS
  homeBtn.addEventListener("click", () => showView("home"));

  browseBtn.addEventListener("click", () => {
    showBrowse(products);
    showView("browse");
  });

  cartBtn.addEventListener("click", () => {
    showCart();
    showView("cart");
  });

  aboutBtn.addEventListener("click", () => aboutDialog.showModal());
  closeAbout.addEventListener("click", () => aboutDialog.close());

 
  // showHome
  function showHome(products) {
    const container = document.getElementById("homeFeaturedItems");
    container.innerHTML = "<h3>Featured Items</h3>";

    const featured = products.slice(0, 3);

    featured.forEach(prod => {
      const card = document.createElement("article");
      card.classList.add("product-card");

      card.innerHTML = `
        <h4>${prod.name}</h4>
        <p>${prod.category} · ${prod.gender}</p>
        <p><strong>$${prod.price}</strong></p>
      `;

      container.appendChild(card);
    });
  }

  // showBrowse
  function showBrowse(products) {
    const container = document.getElementById("results");
    container.innerHTML = "";

    products.forEach(prod => {
        const card = document.createElement("article");
        card.classList.add("product-card");

        card.innerHTML = `
        <h4>${prod.name}</h4>
        <p>${prod.category} • ${prod.gender}</p>
        <p><strong>$${prod.price}</strong></p>
        <button class="viewDetails" data-id="${prod.id}">Details</button>
        `;

        container.appendChild(card);
    });

    container.querySelectorAll(".viewDetails").forEach(btn => {
        btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        showSingleProduct(id);
        });
    });
    }

  // showSingleProduct
  function showSingleProduct(id) {
    const product = products.find(p => p.id == id);
    const details = document.getElementById("productDetails");

    details.innerHTML = `
      <h2>${product.name}</h2>
      <p>${product.description}</p>
      <p><strong>$${product.price}</strong></p>
      <label>Qty:
        <input type="number" min="1" value="1" id="qtyInput">
      </label>
      <button id="addToCartBtn">Add to Cart</button>
    `;

    document.getElementById("addToCartBtn").addEventListener("click", () => {
      const qty = parseInt(document.getElementById("qtyInput").value, 10) || 1;
      addToCart(id, qty);
      alert("✔ Added to cart!");
    });

    showView("singleProduct");
  }

  // addToCart
  function addToCart(id, quantity = 1) {
    const existing = cart.find(item => item.id == id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id, quantity });
    }
    saveCart();
    showCart();
  }

  function saveCart() {
    localStorage.setItem("shoppee-cart", JSON.stringify(cart));
  }

  function loadCart() {
    return JSON.parse(localStorage.getItem("shoppee-cart")) || [];
  }

  function showCart() {
    const container = document.getElementById("cartItems");
    const summary = document.getElementById("cartSummary");

    container.innerHTML = "";
    summary.innerHTML = "";

    if (cart.length === 0) {
      container.innerHTML = "<p>Your cart is empty.</p>";
      return;
    }

    let total = 0;

    cart.forEach(item => {
      const product = products.find(p => p.id == item.id);
      if (!product) return;

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      const row = document.createElement("div");
      row.classList.add("cart-row");
      row.innerHTML = `
        <p><strong>${product.name}</strong> (x${item.quantity})</p>
        <p>$${itemTotal.toFixed(2)}</p>
        <button class="removeItem" data-id="${item.id}">Remove</button>
      `;
      container.appendChild(row);
    });

    summary.innerHTML = `<h3>Total: $${total.toFixed(2)}</h3>`;

    container.querySelectorAll(".removeItem").forEach(btn => {
      btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
    });
  }

  function removeFromCart(id) {
    cart = cart.filter(item => item.id != id);
    saveCart();
    showCart();
  }


});
