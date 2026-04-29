// ================= Script JavaScript cơ bản =================

document.addEventListener("DOMContentLoaded", function () {
  // ================= CART =================
  let cart = getCart();
  let allProducts = []; // Store all products for search
  const cartIcon = document.querySelector(".cart-icon");

  // Detect which grid to use based on page
  let productsGrid =
    document.getElementById("productsGrid") ||
    document.getElementById("dealsGrid") ||
    document.getElementById("weeklyGrid") ||
    document.getElementById("smartProductsGrid") ||
    document.getElementById("featuredProductsGrid");

  // Get search elements
  const searchInput = document.querySelector(".search-bar input");
  const searchBtn = document.querySelector(".search-btn");

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);

    // Track add to cart
    if (typeof tracker !== "undefined") {
      tracker.trackAddToCart(product.id, existing ? existing.quantity : 1);
    }

    alert(product.name + " đã được thêm vào giỏ hàng!");
  }

  // ================= FORMAT PRICE =================
  function formatPrice(value) {
    return Number(value).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }

  // ================= SEARCH PRODUCTS =================
  function searchProducts(query) {
    if (!query.trim()) {
      renderProducts(allProducts);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = allProducts.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      const category = (product.category_name || "").toLowerCase();

      return (
        name.includes(searchTerm) ||
        description.includes(searchTerm) ||
        category.includes(searchTerm)
      );
    });

    // Track search
    if (typeof tracker !== "undefined") {
      tracker.trackSearch(query, filtered.length);
    }

    renderProducts(filtered);
  }

  // ================= SETUP SEARCH EVENTS =================
  function setupSearchEvents() {
    if (searchInput && searchBtn) {
      // Search on button click
      searchBtn.addEventListener("click", function () {
        searchProducts(searchInput.value);
      });

      // Search on Enter key
      searchInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          searchProducts(searchInput.value);
        }
      });

      // Real-time search as user types (with small delay)
      let searchTimeout;
      searchInput.addEventListener("input", function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchProducts(searchInput.value);
        }, 300);
      });
    }
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
          <article class="product-card" data-purchase-count="${product.purchase_count || 0}">
            <img src="${image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150?text=Error'" loading="lazy" />
            <h3>${product.name}</h3>
            <p>${product.description || ""}</p>
            <div class="price-row">
              <span class="current-price">${formatPrice(product.price)}</span>
            </div>
            <div class="rating">
              <span class="stars">★★★★★</span>
              <span class="purchase-count">Đã bán: ${product.purchase_count || 0}</span>
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
      const API = "http://localhost:3000";
      const response = await fetch(`${API}/api/products`);

      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu sản phẩm");
      }

      const products = await response.json();
      allProducts = products; // Store all products for search

      renderProducts(products);
      setupSearchEvents(); // Enable search after products are loaded
    } catch (err) {
      productsGrid.innerHTML = `<div class="empty-state">Lỗi: ${err.message}</div>`;
      console.error(err);
    }
  }

  // ================= INIT =================
  loadProducts();
});
