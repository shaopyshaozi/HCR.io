let generateCartSummary = () => {
  cartItems.innerHTML = basket.map(item => {
    let product = shopItemsData.find(p => p.id === item.id);
    return` 
    <div class="cart-item">
  <img width="100" src="${product.img}" alt="${product.name}" class="cart-item-img">
  <div class="details">
    <div class="title-price-x">
      <h4 class="product-name">${product.name}</h4>
    </div>

    <div class="total-price">
      <strong>Price:</strong> $${(product.price).toFixed(2)}
    </div>

    <div class="quantity-info">
      <strong>Quantity:</strong> ${item.item}
    </div>    
  </div>
</div>
`;
  }).join("") || `<h2>Cart is Empty</h2>`;
};

function initializeSocket() {
  let socket;

  try {
    socket = io("http://13.60.218.54:5001", {
      transports: ["websocket"],  // Ensure using WebSocket transport
    });

    console.log("✅ Socket.IO connected successfully.");

    // Listen for cart_update event
    socket.on("cart_update", (data) => {
      console.log("Received cart update:", data);
      const { productId, quantity } = data;

      // Find the product in the basket
      let search = basket.find(x => x.id === productId);

      if (search) {
        search.item += quantity;
      } else {
        basket.push({ id: productId, item: quantity });
      }

      // Update cart display
      updateCart();
    });

    // Listen for 'payment' event from server
    socket.on("payment", (data) => {
      console.log("Received payment event:", data);
      if (data.success === 1) {
        console.log("✅ Payment successful. Redirecting...");
        clearInterval(countdownInterval); // Stop the countdown
        clearCart(); // Clear the cart
        window.location.href = "success.html"; // Redirect to index
      }
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
    });

    socket.on("disconnect", () => {
      console.warn("⚠️ Socket.IO disconnected.");
    });

  } catch (error) {
    console.error("❌ Failed to initialize Socket.IO:", error);
  }
}

function handleCheckout() {
  // Calculate the total amount
  const totalAmount = basket.reduce((sum, item) => {
    const product = shopItemsData.find(p => p.id === item.id);
    return sum + (item.item * product.price);
  }, 0);

  if (totalAmount > 0) {
    // Proceed to checkout if total is greater than 0
    window.location.href = "checkout.html";
  } else {
    // Alert user if cart is empty
    alert("Your cart is empty! Please add items before checking out.");
  }
}



// 获取DOM元素
const shop = document.getElementById("shop");
const cartItems = document.getElementById("cart-items");
let basket = JSON.parse(localStorage.getItem("data")) || [];

// ======================
// 全局函数定义（关键修改）
// ======================
window.increment = function(id) {
  let search = basket.find(x => x.id === id);
  if (search) {
    search.item += 1;
  } else {
    basket.push({ id: id, item: 1 });
  }
  updateCart();
};

window.decrement = function(id) {
  let search = basket.find(x => x.id === id);
  if (!search) return;
  search.item -= 1;
  basket = basket.filter(x => x.item > 0);
  updateCart();
};

window.removeItem = function(id) {
  basket = basket.filter(x => x.id !== id);
  updateCart();
};

window.clearCart = function() {
  basket = [];
  localStorage.setItem("data", "[]"); // 强制写入空数组
  updateCart();
  
  // 跨页面同步
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("cart_channel");
    channel.postMessage({ type: "cart_cleared" });
  }
};

// ======================
// 核心功能
// ======================
const generateShop = () => {
  if (!shop) return;
  
  shop.innerHTML = shopItemsData.map(item => {
    const { id, name, price, desc, img } = item;
    const search = basket.find(x => x.id === id) || { item: 0 };
    
    return `
    <div id="product-${id}" class="item">
      <img width="220" src="${img}" alt="${name}">
      <div class="details">
        <h3>${name}</h3>
        <p>${desc}</p>
        <div class="price-quantity">
          <h2>$ ${price.toFixed(2)}</h2>
          <div class="buttons">
            <i onclick="decrement(${id})" class="bi bi-dash-lg"></i>
            <div id="${id}" class="quantity">${search.item}</div>
            <i onclick="increment(${id})" class="bi bi-plus-lg"></i>
          </div>
        </div>
      </div>
    </div>`;
  }).join("");
};

// ======================
// 购物车逻辑
// ======================
const updateCart = () => {
  generateShop();
  generateCartItems();
  updateTotal();
  localStorage.setItem("data", JSON.stringify(basket));
};

const generateCartItems = () => {
  if (!cartItems) return;
  
  cartItems.innerHTML = basket.length ? basket.map(item => {
    const product = shopItemsData.find(p => p.id === item.id);
    return ` 
    <div class="cart-item">
      <img width="100" src="${product.img}" alt="${product.name}">
      <div class="details">
        <div class="title-price-x">
            <h4>${product.name}</h4>
        </div>
        <h4 class="cart-item-price">$ ${product.price}</h4>
        <div class="buttons">
          
          <i onclick="decrement(${item.id})" class="bi bi-dash-lg"></i>
          <div class="quantity">${item.item}</div>
          <i onclick="increment(${item.id})" class="bi bi-plus-lg"></i>
          <i onclick="removeItem(${item.id})" class="bi bi-trash"></i>
        </div>
        <h4>$ ${(item.item * product.price).toFixed(2)}</h4>
      </div>
    </div>`;
  }).join("") : `<h2>Cart is Empty</h2>`;
};

const updateTotal = () => {
  const total = basket.reduce((sum, item) => {
    const product = shopItemsData.find(p => p.id === item.id);
    return sum + (item.item * product.price);
  }, 0);

  // 更新所有页面的总金额
  document.querySelectorAll("#total-amount").forEach(element => {
    element.textContent = total.toFixed(2);
  });
  
  // 更新所有页面的购物车角标
  document.querySelectorAll("#cartAmount").forEach(element => {
    element.textContent = basket.reduce((a, b) => a + b.item, 0);
  });
};

// ======================
// 初始化
// ======================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded, initializing shop...");

  // Initialize the shop
  generateShop();
  generateCartItems();
  updateTotal();

  // Initialize Socket.IO after shop is generated
  initializeSocket();
});
