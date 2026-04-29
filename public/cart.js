document.addEventListener("DOMContentLoaded", function () {
  const cartOverlay = document.getElementById("cartOverlay");
  const cartIcon = document.querySelector(".cart-icon");
  const closeCartBtn = document.getElementById("closeCart");
  const continueShoppingBtn = document.getElementById("continueShopping");
  const cartItemsContainer = document.getElementById("cartItems");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  function formatPrice(value) {
    return Number(value).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }

  function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
  }

  function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function updateCartCount() {
    const cart = getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.querySelector(".cart-count");
    if (cartCount) cartCount.textContent = totalQty;
  }

  function renderCart() {
    const cart = getCart();

    if (cart.length === 0) {
      cartItemsContainer.innerHTML =
        '<div class="empty-state">Giỏ hàng trống</div>';
      subtotalEl.textContent = "0 đ";
      totalEl.textContent = "0 đ";
      return;
    }

    let subtotal = 0;

    cartItemsContainer.innerHTML = cart
      .map((item) => {
        subtotal += item.price * item.quantity;

        return `
        <div class="cart-item">
          <img src="${item.image_url}" width="60" />
          <div class="cart-info">
            <h4>${item.name}</h4>
            <p>${formatPrice(item.price)}</p>
            <div class="cart-controls">
  <div class="cart-qty">
    <button class="decrease" data-id="${item.id}">-</button>
    <span>${item.quantity}</span>
    <button class="increase" data-id="${item.id}">+</button>
  </div>
  <button class="remove" data-id="${item.id}">&times;</button>
</div>
          </div>
        </div>
      `;
      })
      .join("");

    subtotalEl.textContent = formatPrice(subtotal);
    totalEl.textContent = formatPrice(subtotal);

    attachCartEvents();
  }

  function attachCartEvents() {
    document.querySelectorAll(".increase").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = parseInt(this.dataset.id);
        const cart = getCart();
        const item = cart.find((i) => i.id === id);
        if (item) item.quantity++;
        saveCart(cart);
        renderCart();
        updateCartCount();
      });
    });

    document.querySelectorAll(".decrease").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = parseInt(this.dataset.id);
        let cart = getCart();
        const item = cart.find((i) => i.id === id);
        if (item) {
          item.quantity--;
          if (item.quantity <= 0) {
            cart = cart.filter((i) => i.id !== id);
          }
        }
        saveCart(cart);
        renderCart();
        updateCartCount();
      });
    });

    document.querySelectorAll(".remove").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = parseInt(this.dataset.id);
        let cart = getCart();

        // Track remove from cart
        if (typeof tracker !== "undefined") {
          tracker.trackRemoveFromCart(id);
        }

        cart = cart.filter((i) => i.id !== id);
        saveCart(cart);
        renderCart();
        updateCartCount();
      });
    });
  }

  function openCart() {
    renderCart();
    cartOverlay.style.display = "flex";
  }

  function closeCart() {
    cartOverlay.style.display = "none";
  }

  async function checkout() {
    const cart = getCart();

    if (cart.length === 0) {
      alert("Giỏ hàng trống, không thể thanh toán");
      return;
    }

    // Get user ID if logged in
    const authData = localStorage.getItem("authData");
    const userId = authData ? JSON.parse(authData).user?.id : null;

    // Prepare cart items for checkout
    const cartItems = cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          cart_items: cartItems,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear local cart
        localStorage.removeItem("cart");
        updateCartCount();

        // Show success message
        alert(
          `✅ Thanh toán thành công!\n\nĐã xử lý ${result.processed_items} sản phẩm.`,
        );

        // Close cart overlay
        closeCart();

        // Refresh current page so sold counts and deal views update immediately
        window.location.reload();

        // Log purchase events
        if (typeof tracker !== "undefined") {
          for (const item of cart) {
            tracker.trackPurchase(item.id);
          }
        }
      } else {
        alert("❌ Thanh toán thất bại: " + result.error);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("❌ Lỗi kết nối: " + err.message);
    }
  }

  cartIcon?.addEventListener("click", function (e) {
    e.preventDefault();
    openCart();
  });

  closeCartBtn?.addEventListener("click", closeCart);
  continueShoppingBtn?.addEventListener("click", closeCart);

  // Add checkout button listener
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkout);
  }

  updateCartCount();
});
const productModal = document.getElementById("productModal");
const productDetail = document.getElementById("productDetail");
const closeProductModal = document.getElementById("closeProductModal");

// OPEN MODAL
function openProductModal(product) {
  const price = Number(product.price || 0).toLocaleString("vi-VN");

  productDetail.innerHTML = `
    <div class="detail-left">
      <img src="${product.image_url || "https://via.placeholder.com/300"}" />
    </div>

    <div class="detail-right">
      <h2>${product.name}</h2>
      <p>${product.description || ""}</p>

      <div class="detail-price">${price} đ</div>

      <div class="rating-box">
        ⭐⭐⭐⭐⭐ <span>(4.7/5 - 120 đánh giá)</span>
      </div>

      <div class="detail-actions">
        <button class="buy-now-btn">Mua ngay</button>
        <button class="select-options-btn" id="modalAddCart">
          Thêm vào giỏ
        </button>
      </div>

      <div class="review-box">
        <h3>Đánh giá sản phẩm</h3>
        <textarea placeholder="Viết đánh giá..."></textarea>
        <button class="submit-review">Gửi đánh giá</button>
      </div>
    </div>
  `;

  productModal.style.display = "flex";

  document.getElementById("modalAddCart").onclick = () => {
    addToCart(product);
  };
}

// CLOSE
closeProductModal.onclick = () => {
  productModal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === productModal) {
    productModal.style.display = "none";
  }
};

// attach view buttons
function attachViewListeners(grid) {
  grid.querySelectorAll(".view-product-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      const product = productsData.find((p) => p.id === id);
      if (product) openProductModal(product);
    });
  });
}
