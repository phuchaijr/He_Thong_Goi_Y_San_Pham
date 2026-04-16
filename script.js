document.addEventListener("DOMContentLoaded", function () {
  // ================= CART =================
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartIcon = document.querySelector(".cart-icon");
  const cartCountSpan = document.querySelector(".cart-count");
  const productsGrid = document.getElementById("productsGrid");

  function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountSpan) cartCountSpan.textContent = total;
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function addToCart(product) {
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartCount();
    alert(product.name + " đã được thêm vào giỏ hàng!");
  }

  updateCartCount();

  // ================= FORMAT PRICE =================
  function formatPrice(value) {
    return Number(value).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }

  // ================= RENDER PRODUCTS =================
  function renderProducts(items) {
    if (!productsGrid) return;

    if (!items || items.length === 0) {
      productsGrid.innerHTML =
        '<div class="empty-state">Không tìm thấy sản phẩm.</div>';
      return;
    }

    productsGrid.innerHTML = items
      .map((product) => {
        // 🔥 FIX ẢNH LOCAL
        const image = product.image_url
          ? `http://localhost:3000${product.image_url}`
          : "https://via.placeholder.com/150?text=No+Image";

        return `
          <article class="product-card">
            <img src="${image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150?text=Error'" loading="lazy" />
            <h3>${product.name}</h3>
            <p>${product.description || ""}</p>
            <div class="price-row">
              <span class="current-price">${formatPrice(product.price)}</span>
            </div>
            <button class="add-to-cart-btn" data-id="${product.id}">
              Thêm vào giỏ
            </button>
          </article>
        `;
      })
      .join("");

    // ================= ADD TO CART EVENT =================
    document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = parseInt(this.dataset.id);
        const product = items.find((p) => p.id === id);

        if (product) {
          addToCart({
            id: product.id, // 🔥 dùng ID database
            name: product.name,
            price: product.price,
            image: product.image_url
              ? `http://localhost:3000${product.image_url}`
              : "",
          });
        }
      });
    });
  }

  // ================= LOAD PRODUCTS FROM API =================
  async function loadProducts() {
    if (!productsGrid) return;

    productsGrid.innerHTML =
      '<div class="loading-message">Đang tải sản phẩm...</div>';

    try {
      const response = await fetch("http://localhost:3000/api/products");

      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu sản phẩm");
      }

      const products = await response.json();

      renderProducts(products);
    } catch (err) {
      productsGrid.innerHTML = `<div class="empty-state">Lỗi: ${err.message}</div>`;
      console.error(err);
    }
  }

  // ================= INIT =================
  loadProducts();
});
