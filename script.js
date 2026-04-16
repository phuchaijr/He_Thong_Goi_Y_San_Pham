// ================= Script JavaScript cơ bản =================

document.addEventListener("DOMContentLoaded", function () {
  // Cart management
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartIcon = document.querySelector(".cart-icon");
  const cartCountSpan = document.querySelector(".cart-count");

  function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountSpan) cartCountSpan.textContent = total;
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    alert(`${product.name} đã được thêm vào giỏ hàng!`);
  }

  updateCartCount();

  if (cartIcon) {
    cartIcon.addEventListener("click", function (e) {
      e.preventDefault();
      // Có thể mở modal cart ở đây
      console.log('Cart:', cart);
    });
  }

  const productsGrid = document.getElementById("productsGrid");
  const searchInput = document.querySelector(".search-bar input");
  const searchBtn = document.querySelector(".search-btn");
  const shopFilterButtons = document.querySelectorAll(".filter-btn");
  const categoryLabelMap = {
    electronics: "Điện tử",
    appliances: "Gia dụng",
    smart: "Nhà thông minh",
    "dien-thoai": "Điện thoại",
    laptop: "Laptop",
    tv: "TV",
    pc: "PC",
    "phu-kien": "Phụ kiện",
    "an-ninh": "An ninh",
    "am-thanh": "Âm thanh",
    mang: "Mạng",
  };
  let productsData = [];

  function formatPrice(value) {
    return Number(value).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }

  function normalizeCategory(category) {
    if (!category) return null;
    const key = category.toString().toLowerCase();
    if (key === "all" || key === "tất cả") return null;
    return key;
  }

  function renderProducts(items) {
    if (!productsGrid) return;
    if (!items || items.length === 0) {
      productsGrid.innerHTML =
        '<div class="empty-state">Không tìm thấy sản phẩm phù hợp.</div>';
      return;
    }

    productsGrid.innerHTML = items
      .map((product) => {
        const catKey = product.category?.toString().toLowerCase() || "";
        const catLabel = categoryLabelMap[catKey] || product.category || "Khác";
        const image =
          product.image_url || "https://via.placeholder.com/150?text=Sản+phẩm";
        const price = formatPrice(product.price || 0);
        const discount = product.discount ? `- ${product.discount}%` : "";
        return `
          <article class="product-card" data-category="${catKey}">
            <img src="${image}" alt="${product.name || "Sản phẩm"}" />
            <span class="cat-label">${catLabel}</span>
            <h3>${product.name || "Sản phẩm"}</h3>
            <p class="weight">${product.description || ""}</p>
            <div class="price-row">
              <span class="current-price">${price}</span>
              ${discount ? `<span class="discount-badge">${discount}</span>` : ""}
            </div>
            <a href="#" class="select-options-btn">Thêm vào giỏ</a>
          </article>`;
      })
      .join("");
  }

  async function loadProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML =
      '<div class="loading-message">Đang tải sản phẩm...</div>';
    try {
      const response = await fetch("http://localhost:3000/api/products");
      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu sản phẩm");
      }
      productsData = await response.json();
      renderProducts(productsData);
    } catch (err) {
      productsGrid.innerHTML = `<div class="empty-state">Lỗi tải sản phẩm: ${err.message}</div>`;
      console.error(err);
    }
  }

  function filterProducts(category = "all", query = "") {
    if (!productsGrid) return;
    const normalized = normalizeCategory(category);
    const searchTerm = query.toString().toLowerCase().trim();
    const filtered = productsData.filter((product) => {
      const catKey = product.category?.toString().toLowerCase() || "";
      const title = product.name?.toLowerCase() || "";
      const desc = product.description?.toLowerCase() || "";
      const matchesCategory = !normalized || catKey === normalized;
      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        desc.includes(searchTerm) ||
        (categoryLabelMap[catKey] || catKey).toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });
    renderProducts(filtered);
  }

  shopFilterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      shopFilterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      const category = this.dataset.category || "all";
      filterProducts(category, searchInput?.value || "");
    });
  });

  // 2. Xử lý Menu Burger cho điện thoại
  const menuBurgerBtn = document.querySelector(".menu-burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeMenuBtn = document.querySelector(".close-menu");

  if (menuBurgerBtn && mobileMenu && closeMenuBtn) {
    menuBurgerBtn.addEventListener("click", function () {
      mobileMenu.classList.remove("hidden");
    });

    closeMenuBtn.addEventListener("click", function () {
      mobileMenu.classList.add("hidden");
    });
  }

  // 3. Chuyển trang nội bộ
  const pageLinks = document.querySelectorAll(".nav-links a[data-page]");
  const pageButtons = document.querySelectorAll("button[data-page]");
  const pageSections = document.querySelectorAll(".page-section");
  const filterTabs = document.querySelectorAll(".filter-tabs a");
  const categoryDropdownLinks = document.querySelectorAll(
    ".categories-dropdown .dropdown-menu a[data-category]",
  );
  const categoryItems = document.querySelectorAll(
    ".category-item[data-category]",
  );
  const productCards = document.querySelectorAll(".product-card");

  if (pageLinks.length === 0 && pageButtons.length === 0 && pageSections.length === 0) {
    // Nếu không có page-section elements, skip multi-page code
  } else {
    function setActiveNav(pageId) {
      pageLinks.forEach((link) => {
        if (link.dataset.page === pageId) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    function showPage(pageId) {
      pageSections.forEach((section) => {
        if (section.id === pageId) {
          section.classList.add("active");
          section.classList.remove("hidden");
        } else {
          section.classList.remove("active");
          section.classList.add("hidden");
        }
      });
      setActiveNav(pageId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function getActiveTab() {
      const activeTab = Array.from(filterTabs).find((tab) =>
        tab.classList.contains("active"),
      );
      return activeTab ? activeTab.textContent.trim() : "Tất cả";
    }

    function setActiveTab(category) {
      filterTabs.forEach((tab) => {
        const tabText = tab.textContent.trim();
        if (tabText === category) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });
    }

    pageLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const pageId = this.dataset.page;
        if (window.AIChat) {
          AIChat.setUserBehavior("page", pageId);
        }
        showPage(pageId);
        if (pageId === "shop") {
          filterProducts(getActiveTab(), searchInput.value);
        }
      });
    });

    pageButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const pageId = this.dataset.page;
        if (pageId) {
          showPage(pageId);
          if (pageId === "shop") {
            filterProducts(getActiveTab(), searchInput.value);
          }
        }
        if (mobileMenu) mobileMenu.classList.add("hidden");
      });
    });

    filterTabs.forEach((tab) => {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        const category = this.textContent.trim();
        setActiveTab(category);
        if (window.AIChat) {
          AIChat.setUserBehavior("category", category);
        }
        showPage("shop");
        filterProducts(category, searchInput.value);
      });
    });

    categoryDropdownLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const category = this.dataset.category;
        setActiveTab(category);
        if (window.AIChat) {
          AIChat.setUserBehavior("category", category);
        }
        showPage("shop");
        filterProducts(category, "");
      });
    });

    categoryItems.forEach((item) => {
      item.addEventListener("click", function () {
        const category = this.dataset.category;
        setActiveTab(category);
        if (window.AIChat) {
          AIChat.setUserBehavior("category", category);
        }
        showPage("shop");
        filterProducts(category, "");
      });
    });

    function searchProducts() {
      const query = searchInput.value;
      if (window.AIChat) {
        AIChat.setUserBehavior("search", query);
      }
      showPage("shop");
      filterProducts(getActiveTab(), query);
    }

    searchBtn.addEventListener("click", function () {
      searchProducts();
    });

    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchProducts();
      }
    });

    const shopButtons = document.querySelectorAll(".shop-now-btn");
    shopButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.AIChat) {
          AIChat.setUserBehavior("shop-action", "mua sắm");
        }
        showPage("shop");
        setActiveTab("Tất cả");
        filterProducts("Tất cả", "");
      });
    });

    showPage("home");
    loadProducts();
  }
});


    searchBtn.addEventListener("click", function () {
      searchProducts();
    });

    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchProducts();
      }
    });

    const shopButtons = document.querySelectorAll(".shop-now-btn");
    shopButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.AIChat) {
          AIChat.setUserBehavior("shop-action", "mua sắm");
        }
        showPage("shop");
        setActiveTab("Tất cả");
        filterProducts("Tất cả", "");
      });
    });

    showPage("home");
    loadProducts();
  }
});
