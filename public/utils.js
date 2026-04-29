// ================= Utility Functions =================

// Format price to Vietnamese currency
function formatPrice(value) {
  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

// Render products to a grid
function renderProducts(items, grid = null, options = {}) {
  const targetGrid = grid || document.getElementById("productsGrid");
  if (!targetGrid) return;

  if (!items || items.length === 0) {
    targetGrid.innerHTML =
      "<div class=\"empty-state\">Không tìm thấy sản phẩm phù hợp.</div>";
    return;
  }

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
    ...options.categoryLabelMap
  };

  targetGrid.innerHTML = items
    .map((product) => {
      const catKey = product.category?.toString().toLowerCase() || "";
      const catLabel = categoryLabelMap[catKey] || product.category_name || "Khác";
      
      // Fix local image URLs
      const fixedImage = product.image_url?.startsWith("http") 
        ? product.image_url 
        : `http://localhost:3000${product.image_url || ""}`;
      
      const image = fixedImage || "https://via.placeholder.com/150?text=Sản+phẩm";
      const price = formatPrice(product.price || 0);
      const discount = product.discount ? `- ${product.discount}%` : "";
      const buttonText = options.buttonText || "Thêm vào giỏ";
      const buttonClass = options.buttonClass || "select-options-btn";

      return `
        <article class="product-card" data-category="${catKey}" data-id="${product.id || ""}">
          <img src="${image}" alt="${product.name || "Sản phẩm"}" onerror="this.src='https://via.placeholder.com/150?text=Error'" loading="lazy" />
          <span class="cat-label">${catLabel}</span>
          <h3>${product.name || "Sản phẩm"}</h3>
          <p class="weight">${product.description || ""}</p>
          <div class="price-row">
            <span class="current-price">${price}</span>
            ${discount ? `<span class="discount-badge">${discount}</span>` : ""}
          </div>
          <button class="${buttonClass} add-to-cart-btn" data-id="${product.id || ""}">${buttonText}</button>
        </article>`;
    })
    .join("");
}

// Load products from API
async function loadProductsFromAPI(url = "/api/products", grid = null, callback = null) {
  const targetGrid = grid || document.getElementById("productsGrid");
  if (!targetGrid) return;

  targetGrid.innerHTML =
    "<div class=\"loading-message\">Đang tải sản phẩm...</div>";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu sản phẩm");
    }
    const products = await response.json();

    if (callback) {
      callback(products);
    } else {
      renderProducts(products, targetGrid);
    }

    return products;
  } catch (err) {
    targetGrid.innerHTML = `<div class="empty-state">Lỗi tải sản phẩm: ${err.message}</div>`;
    console.error(err);
    throw err;
  }
}

// Update cart count display
function updateCartCount(count) {
  const cartCountSpan = document.querySelector(".cart-count");
  if (cartCountSpan) {
    cartCountSpan.textContent = count;
  }
}

// Get cart from localStorage
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
}

// Add product to cart
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  showNotification(`Đã thêm ${product.name} vào giỏ hàng!`);
}

// Show notification
function showNotification(message) {
  console.log(message);
  // You can implement a toast notification here
}
