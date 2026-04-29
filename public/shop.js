// Hàm dùng chung để render sao
function renderStars(rating = 0) {
  const r = Number(rating) || 0;
  const fullStars = Math.round(r);

  let html = "";
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      html += `<span style="color: #ffc107; font-size: 16px; margin-right: 2px;">★</span>`; // Sao vàng
    } else {
      html += `<span style="color: #e0e0e0; font-size: 16px; margin-right: 2px;">★</span>`; // Sao xám
    }
  }
  return html;
}

// Map Category ID sang Tên (Dựa trên DB của bạn)
const dbCategoryMap = {
  4: "Điện thoại",
  5: "Laptop",
  6: "Smart TV",
  7: "PC Gaming",
};

document.addEventListener("DOMContentLoaded", function () {
  const productsGrid = document.getElementById("productsGrid");
  const searchInput = document.querySelector(".search-bar input");
  const searchBtn = document.querySelector(".search-btn");
  const shopFilterButtons = document.querySelectorAll(".filter-btn");

  let productsData = [];

  function formatPrice(value) {
    return Number(value).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }

  // Render products without inline onclick (CSP compliance)
  function renderProducts(items, grid = productsGrid) {
    if (!grid) return;
    if (!items || items.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">Không tìm thấy sản phẩm phù hợp.</div>';
      return;
    }

    grid.innerHTML = items
      .map((product) => {
        const catLabel = dbCategoryMap[product.category_id] || "Sản phẩm";
        const image = product.image_url
          ? `${window.location.origin}${product.image_url}`
          : "https://via.placeholder.com/150?text=No+Image";
        const price = formatPrice(product.price || 0);
        const sold = product.sold || product.purchase_count || 0;
        const ratingValue = parseFloat(product.rating) || 5;

        return `
              <article class="product-card" data-id="${product.id}">
                <div class="product-clickable" style="cursor:pointer;">
                  <img src="${image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150?text=Error'" loading="lazy" />
                  <span class="cat-label">${catLabel}</span>
                  <h3>${product.name || "Sản phẩm"}</h3>
                </div>
                <div class="price-row">
                  <span class="current-price">${price}</span>
                </div>
                <div class="rating">
                  <span class="stars">${renderStars(ratingValue)}</span>
                  <span class="purchase-count">Đã bán: ${sold}</span>
                </div>
                <button class="select-options-btn add-to-cart-btn" data-id="${product.id}">Thêm vào giỏ</button>
              </article>`;
      })
      .join("");

    attachAddToCartListeners(grid);
    attachProductClickListeners(grid);
  }

  function attachProductClickListeners(grid) {
    grid.querySelectorAll(".product-clickable").forEach((card) => {
      card.addEventListener("click", function () {
        const productId = this.closest(".product-card").dataset.id;
        if (productId) {
          // Track view product
          if (typeof tracker !== "undefined") {
            tracker.trackViewProduct(parseInt(productId));
          }
          openProductDetail(parseInt(productId));
        }
      });
    });
  }

  function attachAddToCartListeners(grid) {
    grid.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const id = parseInt(this.dataset.id);
        const product = productsData.find((p) => p.id === id);
        if (product) addToCart(product);
      });
    });
  }

  function addToCart(product, quantity = 1) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...product, quantity: quantity });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();

    // Track add to cart
    if (typeof tracker !== "undefined") {
      tracker.trackAddToCart(product.id, quantity);
    }

    alert(`Đã thêm ${product.name} vào giỏ hàng!`);
  }

  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountSpan = document.querySelector(".cart-count");
    if (cartCountSpan) cartCountSpan.textContent = total;
  }

  async function loadProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML =
      '<div class="loading-message">Đang tải sản phẩm...</div>';
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Không thể tải dữ liệu sản phẩm");
      productsData = await response.json();

      // Render dữ liệu
      window.appProductsData = productsData; // Lưu biến global để modal dùng
      const featured = productsData.slice(0, 4);
      renderProducts(featured, document.getElementById("featuredGrid"));
      renderProducts(productsData);
    } catch (err) {
      productsGrid.innerHTML = `<div class="empty-state">Lỗi tải sản phẩm: ${err.message}</div>`;
      console.error(err);
    }
  }

  // ================= SEARCH FUNCTIONALITY =================
  function searchProducts(query) {
    if (!query.trim()) {
      renderProducts(productsData);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = productsData.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      const categoryName = (
        dbCategoryMap[product.category_id] || ""
      ).toLowerCase();

      return (
        name.includes(searchTerm) ||
        description.includes(searchTerm) ||
        categoryName.includes(searchTerm)
      );
    });

    // Track search
    if (typeof tracker !== "undefined") {
      tracker.trackSearch(query, filtered.length);
    }

    renderProducts(filtered);
  }

  // Setup search events
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

    // Real-time search as user types
    let searchTimeout;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchProducts(searchInput.value);
      }, 300);
    });
  }

  // Logic Modal
  let currentSelectedProduct = null;

  window.openProductDetail = function (productId) {
    const pData = window.appProductsData || productsData;

    // SỬA CHỖ 1: Ép kiểu về số để tìm chính xác 100%
    const product = pData.find((p) => parseInt(p.id) === parseInt(productId));
    if (!product) {
      console.error("Không tìm thấy sản phẩm!");
      return;
    }

    currentSelectedProduct = product;

    document.getElementById("modalProductImage").src = product.image_url
      ? `${window.location.origin}${product.image_url}`
      : "https://via.placeholder.com/150?text=No+Image";

    document.getElementById("modalProductTitle").textContent =
      product.name || "Đang cập nhật";
    document.getElementById("modalProductPrice").textContent = formatPrice(
      product.price || 0,
    );
    document.getElementById("modalProductStock").textContent =
      product.stock || 0;

    const soldCount = product.sold || product.purchase_count || 0;
    document.getElementById("modalProductSold").textContent =
      `Đã bán: ${soldCount}`;

    // SỬA CHỖ 2: Hiện thêm điểm số và (số lượt đánh giá) cho xịn xò
    const ratingValue = parseFloat(product.rating) || 5;
    const reviewCount = parseInt(product.review_count) || 0;
    document.getElementById("modalProductRating").innerHTML = `
    <span style="color: #ee4d2d; font-weight: bold; margin-right: 5px;">${ratingValue.toFixed(1)}</span>
    ${renderStars(ratingValue)}
    <span style="color: #767676; margin-left: 8px; font-size: 13px;">(${reviewCount} đánh giá)</span>
  `;

    // Tự nhận diện Brand
    let brandName = "Khác";
    const nameLower = (product.name || "").toLowerCase();
    if (nameLower.includes("iphone") || nameLower.includes("macbook"))
      brandName = "Apple";
    else if (nameLower.includes("samsung") || nameLower.includes("galaxy"))
      brandName = "Samsung";
    else if (nameLower.includes("dell")) brandName = "Dell";
    else if (nameLower.includes("asus")) brandName = "Asus";
    else if (nameLower.includes("hp")) brandName = "HP";
    else if (nameLower.includes("lenovo")) brandName = "Lenovo";

    document.getElementById("modalProductCat").textContent =
      dbCategoryMap[product.category_id] || "Thiết bị công nghệ";
    document.getElementById("modalProductBrand").textContent = brandName;
    document.getElementById("modalProductWarrantyType").textContent =
      "Bảo hành điện tử chính hãng";
    document.getElementById("modalProductWarrantyTime").textContent =
      "12 Tháng";
    document.getElementById("modalProductOrigin").textContent = "Chính hãng";

    if (product.description) {
      const safeDesc = product.description
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      document.getElementById("modalProductDesc").innerHTML =
        `<strong>Đặc điểm nổi bật:</strong><br>${safeDesc.replace(/\n/g, "<br>")}`;
    } else {
      document.getElementById("modalProductDesc").innerHTML =
        "Chưa có thông tin mô tả chi tiết cho sản phẩm này.";
    }

    document.getElementById("modalQty").value = 1;
    document.getElementById("productModal").style.display = "flex";
  };

  // Event Listeners cho Modal
  document.getElementById("closeProductModal").addEventListener("click", () => {
    document.getElementById("productModal").style.display = "none";
  });

  document.getElementById("productModal").addEventListener("click", (e) => {
    if (e.target.id === "productModal")
      document.getElementById("productModal").style.display = "none";
  });

  document.getElementById("modalAddToCart").addEventListener("click", () => {
    if (currentSelectedProduct) {
      const qty = parseInt(document.getElementById("modalQty").value) || 1;
      addToCart(currentSelectedProduct, qty);
      document.getElementById("productModal").style.display = "none";
    }
  });

  document.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = document.getElementById("modalQty");
      let val = parseInt(input.value);
      if (this.classList.contains("plus")) val++;
      if (this.classList.contains("minus") && val > 1) val--;
      input.value = val;
    });
  });

  // Khởi tạo
  updateCartCount();
  loadProducts();
});
