// Script riêng cho trang index
document.addEventListener("DOMContentLoaded", function () {
  const categoriesGrid = document.getElementById("categoriesGrid");
  const featuredProductsGrid = document.getElementById("featuredProductsGrid");

  function formatPrice(value) {
    return Number(value).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }

  function renderCategories(categories) {
    if (!categoriesGrid) return;
    if (!categories || categories.length === 0) {
      categoriesGrid.innerHTML =
        '<div class="empty-state">Không có danh mục.</div>';
      return;
    }

    categoriesGrid.innerHTML = categories
      .map((cat, index) => {
        const iconMap = {
          electronics: "fas fa-mobile-alt",
          appliances: "fas fa-blender",
          smart: "fas fa-home",
          "dien-thoai": "fas fa-phone",
          laptop: "fas fa-laptop",
          tv: "fas fa-tv",
          pc: "fas fa-desktop",
          "phu-kien": "fas fa-headphones",
          "an-ninh": "fas fa-shield-alt",
          "am-thanh": "fas fa-volume-up",
          mang: "fas fa-wifi",
        };
        const icon = iconMap[cat.slug] || "fas fa-tag";
        return `
                <a href="shop.html?category=${cat.slug}" class="category-item" style="animation: fadeInUp 0.6s ease-out ${index * 0.1}s both;">
                  <i class="${icon}"></i>
                  <span class="cat-name">${cat.name}</span>
                  <span class="product-count">Sản phẩm</span>
                </a>`;
      })
      .join("");
  }

  function renderFeaturedProducts(products) {
    if (!featuredProductsGrid) return;
    if (!products || products.length === 0) {
      featuredProductsGrid.innerHTML =
        '<div class="empty-state">Không có sản phẩm nổi bật.</div>';
      return;
    }

    featuredProductsGrid.innerHTML = products
      .map((product, index) => {
        const image = product.image_url
          ? `${window.location.origin}${product.image_url}`
          : "https://via.placeholder.com/150?text=No+Image";
        const price = formatPrice(product.price || 0);
        return `
                <article class="product-card" data-purchase-count="${product.purchase_count || 0}" style="animation: fadeInUp 0.6s ease-out ${index * 0.1}s both;">
                  <img src="${image}" alt="${product.name || "Sản phẩm"}" onerror="this.src='https://via.placeholder.com/150?text=Error'" loading="lazy" />
                  <span class="cat-label">${product.category_name || "Khác"}</span>
                  <h3>${product.name || "Sản phẩm"}</h3>
                  <p class="weight">${product.description || ""}</p>
                  <div class="price-row">
                    <span class="current-price">${price}</span>
                  </div>
                  <div class="rating">
                    <span class="stars">★★★★★</span>
                    <span class="purchase-count">Đã bán: ${product.purchase_count || 0}</span>
                  </div>
                  <a href="shop.html" class="select-options-btn">Thêm vào giỏ</a>
                </article>`;
      })
      .join("");
  }

  async function loadCategories() {
    if (!categoriesGrid) return;
    categoriesGrid.innerHTML =
      '<div class="loading-message">Đang tải danh mục...</div>';
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Không thể tải danh mục");
      const categories = await response.json();
      renderCategories(categories);
    } catch (err) {
      categoriesGrid.innerHTML = `<div class="empty-state">Lỗi tải danh mục: ${err.message}</div>`;
      console.error(err);
    }
  }

  async function loadFeaturedProducts() {
    if (!featuredProductsGrid) return;
    featuredProductsGrid.innerHTML =
      '<div class="loading-message">Đang tải sản phẩm nổi bật...</div>';
    try {
      const response = await fetch("/api/products/featured");
      if (!response.ok) throw new Error("Không thể tải sản phẩm nổi bật");
      const products = await response.json();
      renderFeaturedProducts(products);
    } catch (err) {
      featuredProductsGrid.innerHTML = `<div class="empty-state">Lỗi tải sản phẩm: ${err.message}</div>`;
      console.error(err);
    }
  }

  loadCategories();
  loadFeaturedProducts();
});
