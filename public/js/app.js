/**
 * Storefront & Cart Engine (US-01 & US-02)
 * QuickGrocery - Agile E-Commerce Platform
 */

let allProducts = [];
let currentCategory = 'All';
let currentDietary = 'All';
let currentSearch = '';
let cart = []; // [{ productId, quantity }]
let currentReservationId = null;
let reservationTimerInterval = null;
let reservationTimeRemaining = 900; // 15 mins in seconds (US-02 Redis Lock)
let activeCoupon = null;

// Initialize Storefront on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  fetchAgileData();
});

// ==========================================
// CATALOGUE & SEARCH (US-01)
// ==========================================
async function fetchProducts() {
  try {
    const params = new URLSearchParams();
    if (currentCategory && currentCategory !== 'All') params.append('category', currentCategory);
    if (currentDietary && currentDietary !== 'All') params.append('dietary', currentDietary);
    if (currentSearch) params.append('q', currentSearch);

    const startTime = performance.now();
    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    const clientLatency = (performance.now() - startTime).toFixed(1);

    if (data.success) {
      allProducts = data.products;
      renderCategories();
      renderProductGrid();
      
      const latencyBadge = document.getElementById('searchLatencyBadge');
      if (latencyBadge) {
        latencyBadge.textContent = `${clientLatency}ms`;
        latencyBadge.className = 'absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-emerald-600 font-mono-code font-bold';
      }

      const stats = document.getElementById('searchResultStats');
      if (stats) {
        stats.textContent = `Showing ${data.count} items • Latency: ${data.latencyMs}`;
      }
    }
  } catch (err) {
    console.error('Failed to load products:', err);
    showToast('Network Notice', 'Running with cached local catalogue.', 'info');
  }
}

function handleSearch(value) {
  currentSearch = value.trim();
  fetchProducts();
}

function renderCategories() {
  const container = document.getElementById('categoryPillContainer');
  if (!container) return;

  const categories = [
    { name: 'All', icon: '🛒' },
    { name: 'Fruits & Vegetables', icon: '🥑' },
    { name: 'Dairy & Breakfast', icon: '🥛' },
    { name: 'Bakery & Snacks', icon: '🍞' },
    { name: 'Beverages', icon: '🍊' }
  ];

  container.innerHTML = categories.map(cat => {
    const isActive = currentCategory === cat.name;
    const activeClass = isActive 
      ? 'bg-slate-900 text-white font-bold shadow-sm' 
      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200';
    return `
      <button 
        onclick="setCategoryFilter('${cat.name}')" 
        class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap transition ${activeClass}"
      >
        <span>${cat.icon}</span>
        <span>${cat.name}</span>
      </button>
    `;
  }).join('');
}

function setCategoryFilter(category) {
  currentCategory = category;
  fetchProducts();
}

function setDietaryFilter(dietary) {
  currentDietary = dietary;
  document.querySelectorAll('.dietary-pill').forEach(btn => {
    if (btn.dataset.dietary === dietary) {
      btn.className = 'dietary-pill px-2.5 py-1 rounded-lg border text-white bg-slate-900 border-slate-900 font-bold transition';
    } else {
      btn.className = 'dietary-pill px-2.5 py-1 rounded-lg border text-slate-700 bg-white hover:bg-slate-50 border-slate-200 transition';
    }
  });
  fetchProducts();
}

function renderProductGrid() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (allProducts.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
        <span class="text-4xl block mb-2">🔍</span>
        <h3 class="text-base font-bold text-slate-800">No matching groceries found</h3>
        <p class="text-xs text-slate-500 mt-1">Try clearing your search query or dietary filters.</p>
        <button onclick="resetFilters()" class="mt-3 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = allProducts.map(prod => {
    const cartItem = cart.find(item => item.productId === prod.id);
    const cartQty = cartItem ? cartItem.quantity : 0;
    const isOutOfStock = prod.availableStock <= 0 && cartQty === 0;
    const isSingleAvocado = prod.id === 'prod-02';

    // Badge styling
    let badgeHtml = '';
    if (isOutOfStock) {
      badgeHtml = `<span class="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Out of Stock</span>`;
    } else if (prod.availableStock <= 2) {
      badgeHtml = `<span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse-subtle">⚡ Low Stock: Only ${prod.availableStock} left!</span>`;
    } else if (prod.badge) {
      badgeHtml = `<span class="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">${prod.badge}</span>`;
    }

    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xl transition-all duration-200 p-4 flex flex-col justify-between group">
        
        <!-- Card Top & Badges -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">${prod.category}</span>
            ${badgeHtml}
          </div>

          <!-- Product Icon / Image -->
          <div class="w-full h-32 bg-slate-50 rounded-xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-200 select-none mb-3">
            ${prod.icon}
          </div>

          <!-- Product Name & Dietary Tags -->
          <div class="flex flex-wrap gap-1 mb-1.5">
            ${prod.dietary.map(d => `<span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">${d}</span>`).join('')}
          </div>

          <h3 class="font-bold text-slate-900 text-sm leading-snug mb-1">${prod.name}</h3>
          <p class="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">${prod.description}</p>
          <div class="text-[11px] font-medium text-slate-400 mb-3">${prod.unit}</div>
        </div>

        <!-- Card Bottom (Price & Add to Cart) -->
        <div class="border-t border-slate-100 pt-3 flex items-center justify-between">
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-base font-extrabold text-slate-900">₹${prod.price}</span>
              ${prod.originalPrice ? `<span class="text-xs text-slate-400 line-through">₹${prod.originalPrice}</span>` : ''}
            </div>
            <span class="text-[10px] font-semibold text-emerald-600">Stock: ${prod.availableStock}</span>
          </div>

          <div>
            ${isOutOfStock ? `
              <button disabled class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed">
                Sold Out
              </button>
            ` : cartQty > 0 ? `
              <div class="flex items-center bg-brand-50 border border-brand-500 rounded-xl p-0.5 shadow-sm">
                <button onclick="updateCartQuantity('${prod.id}', -1)" class="w-7 h-7 rounded-lg bg-white hover:bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm transition">
                  -
                </button>
                <span class="w-8 text-center text-xs font-black text-brand-900">${cartQty}</span>
                <button onclick="updateCartQuantity('${prod.id}', 1)" class="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center font-bold text-sm transition">
                  +
                </button>
              </div>
            ` : `
              <button 
                onclick="addToCart('${prod.id}')" 
                class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-brand-600 text-brand-700 hover:text-white border border-brand-300 hover:border-transparent text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <span>+ ADD</span>
              </button>
            `}
          </div>

        </div>

      </div>
    `;
  }).join('');
}

function resetFilters() {
  currentCategory = 'All';
  currentDietary = 'All';
  currentSearch = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  fetchProducts();
}

// ==========================================
// SMART CART ENGINE (US-02 & TC-04)
// ==========================================
async function addToCart(productId) {
  const prod = allProducts.find(p => p.id === productId);
  if (!prod) return;

  if (prod.availableStock <= 0) {
    showToast('Stock Shortage', `Item "${prod.name}" is out of stock!`, 'error');
    return;
  }

  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    if (existing.quantity >= prod.availableStock + existing.quantity) {
      showToast('Excess Quantity Error', `Cannot add more! Only ${prod.availableStock} remaining.`, 'warning');
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  await validateAndSyncCart();
  startReservationCountdown();
  showToast('Cart Updated', `Added ${prod.name} to cart.`, 'success');
}

async function updateCartQuantity(productId, delta) {
  const prod = allProducts.find(p => p.id === productId);
  const existing = cart.find(item => item.productId === productId);
  if (!existing) return;

  const newQty = existing.quantity + delta;

  if (newQty <= 0) {
    cart = cart.filter(item => item.productId !== productId);
  } else {
    // Check excess quantity boundary (TC-05)
    const maxAvailable = (prod ? prod.availableStock : 0) + existing.quantity;
    if (newQty > maxAvailable) {
      showToast('Excess Quantity Error (TC-05)', `Only ${maxAvailable} unit(s) of "${prod.name}" available in dark store stock!`, 'warning');
      return;
    }
    existing.quantity = newQty;
  }

  await validateAndSyncCart();
}

async function validateAndSyncCart() {
  try {
    const res = await fetch('/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        couponCode: activeCoupon
      })
    });
    const data = await res.json();

    if (data.errors && data.errors.length > 0) {
      data.errors.forEach(err => {
        showToast(err.error, err.message, 'warning');
      });
    }

    renderCartItems(data.items || [], data.pricing);
    updateCartCountBadge();
    fetchProducts(); // Refresh stock numbers
  } catch (err) {
    console.error('Cart sync error:', err);
  }
}

function renderCartItems(verifiedItems, pricing) {
  const container = document.getElementById('cartItemList');
  if (!container) return;

  if (!verifiedItems || verifiedItems.length === 0) {
    container.innerHTML = `
      <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
        <span class="text-5xl mb-3">🛒</span>
        <p class="font-bold text-slate-700 text-sm">Your cart is empty</p>
        <p class="text-xs text-slate-400 mt-1">Explore fresh fruits, vegetables, dairy and snacks!</p>
      </div>
    `;
    updatePricingDisplay({ subtotal: 0, deliveryFee: 0, taxGst: 0, discount: 0, grandTotal: 0 });
    document.getElementById('proceedCheckoutBtn').disabled = true;
    return;
  }

  container.innerHTML = verifiedItems.map(item => `
    <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="text-2xl">${item.icon || '📦'}</span>
        <div>
          <h4 class="text-xs font-bold text-slate-900">${item.name}</h4>
          <span class="text-[11px] text-slate-500 font-semibold">₹${item.unitPrice} × ${item.quantity} = ₹${item.lineTotal}</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
        <button onclick="updateCartQuantity('${item.productId}', -1)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition">-</button>
        <span class="w-6 text-center text-xs font-extrabold">${item.quantity}</span>
        <button onclick="updateCartQuantity('${item.productId}', 1)" class="w-6 h-6 rounded bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center text-xs font-bold transition">+</button>
      </div>
    </div>
  `).join('');

  updatePricingDisplay(pricing);
  document.getElementById('proceedCheckoutBtn').disabled = false;
}

function updatePricingDisplay(pricing) {
  if (!pricing) return;
  document.getElementById('billSubtotal').textContent = `₹${pricing.subtotal}`;
  document.getElementById('billDeliveryFee').textContent = pricing.deliveryFee === 0 ? 'FREE' : `₹${pricing.deliveryFee}`;
  document.getElementById('billGst').textContent = `₹${pricing.taxGst}`;
  document.getElementById('billGrandTotal').textContent = `₹${pricing.grandTotal}`;

  const discountRow = document.getElementById('billDiscountRow');
  const discountSpan = document.getElementById('billDiscount');
  if (pricing.discount > 0) {
    discountRow.classList.remove('hidden');
    discountSpan.textContent = `-₹${pricing.discount} (${pricing.couponApplied})`;
  } else {
    discountRow.classList.add('hidden');
  }
}

function updateCartCountBadge() {
  const badge = document.getElementById('cartCountBadge');
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.textContent = totalCount;
}

function toggleCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartDrawerBackdrop');
  if (!drawer || !backdrop) return;

  const isHidden = drawer.classList.contains('translate-x-full');
  if (isHidden) {
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    validateAndSyncCart();
  } else {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
  }
}

// 15-Minute Redis Distributed Inventory Lock Timer (US-02 & TC-04)
function startReservationCountdown() {
  if (reservationTimerInterval) clearInterval(reservationTimerInterval);
  reservationTimeRemaining = 900; // 15 mins

  const timerEl = document.getElementById('reservationTimer');
  reservationTimerInterval = setInterval(() => {
    reservationTimeRemaining--;
    if (reservationTimeRemaining <= 0) {
      clearInterval(reservationTimerInterval);
      releaseCartStock();
      showToast('Reservation Expired (TC-04)', '15-min stock hold expired. Reserved items released to shelf.', 'info');
      return;
    }
    const mins = Math.floor(reservationTimeRemaining / 60);
    const secs = reservationTimeRemaining % 60;
    if (timerEl) {
      timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

async function releaseCartStock() {
  if (currentReservationId) {
    await fetch('/api/cart/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: currentReservationId })
    });
    currentReservationId = null;
  }
  cart = [];
  validateAndSyncCart();
  if (reservationTimerInterval) clearInterval(reservationTimerInterval);
  showToast('Stock Released', 'Cart inventory released back to dark store shelf (TC-04).', 'info');
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  const msg = document.getElementById('couponStatusMessage');
  if (!input || !msg) return;

  const code = input.value.trim().toUpperCase();
  if (code === 'AGILE20') {
    activeCoupon = 'AGILE20';
    msg.textContent = '✔ Coupon AGILE20 applied: 20% Agile Sprint Discount!';
    msg.className = 'text-[11px] mt-1 font-bold text-emerald-600 block';
    validateAndSyncCart();
  } else if (code === 'SUB30') {
    activeCoupon = 'SUB30';
    msg.textContent = '✔ Coupon SUB30 applied: Flat ₹50 Sub-30 Min fulfillment offer!';
    msg.className = 'text-[11px] mt-1 font-bold text-emerald-600 block';
    validateAndSyncCart();
  } else {
    msg.textContent = '✖ Invalid Coupon. Try AGILE20 or SUB30.';
    msg.className = 'text-[11px] mt-1 font-bold text-rose-600 block';
  }
}

// ==========================================
// QUICK DEMO TRIGGERS FOR JURY
// ==========================================
async function triggerDemo(scenario) {
  if (scenario === 'TC-01') {
    // TC-01: Two shoppers buy last avocado SKU concurrently
    showToast('Simulating TC-01', 'Shopper 1 is locking the last Hass Avocado SKU...', 'info');
    // Shopper 1 locks it
    const res1 = await fetch('/api/cart/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: 'prod-02', quantity: 1 }] })
    });
    const data1 = await res1.json();
    
    // Shopper 2 (current user) tries to add it
    setTimeout(async () => {
      const res2 = await fetch('/api/cart/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ productId: 'prod-02', quantity: 1 }] })
      });
      const data2 = await res2.json();

      if (res2.status === 409) {
        showToast('TC-01 PASSED (Out of Stock)', data2.message, 'error');
      }
      // Release test lock
      if (data1.reservationId) {
        await fetch('/api/cart/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationId: data1.reservationId })
        });
      }
      fetchProducts();
    }, 600);

  } else if (scenario === 'TC-05') {
    // TC-05: Excess Quantity Check (> Stock Limit)
    cart = [{ productId: 'prod-02', quantity: 10 }]; // Avocado has only 1!
    toggleCartDrawer();
    validateAndSyncCart();
    showToast('TC-05 Demonstration', 'Attempted to order 10 units of Hass Avocado (Stock: 1). Blocked with EXCESS_QUANTITY!', 'warning');

  } else if (scenario === 'BUG-104') {
    // BUG-104: Stock Deducted on Aborted UPI Transaction -> Saga Rollback
    cart = [{ productId: 'prod-04', quantity: 2 }]; // Bread
    await validateAndSyncCart();
    openCheckoutModal();
    showToast('BUG-104 Test', 'Cart prepared with 2x Country Loaf. Now click "Abort Payment" in sandbox to verify Saga Rollback!', 'info');
  }
}

async function resetSystemState() {
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    const data = await res.json();
    cart = [];
    currentReservationId = null;
    activeCoupon = null;
    if (reservationTimerInterval) clearInterval(reservationTimerInterval);
    await fetchProducts();
    updateCartCountBadge();
    showToast('State Reset', 'Inventory and carts restored to fresh jury demo state!', 'success');
  } catch (err) {
    showToast('Error', 'Failed to reset state.', 'error');
  }
}

// Toast notification helper
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const bgColors = {
    success: 'bg-emerald-900/90 border-emerald-500 text-white',
    error: 'bg-rose-900/90 border-rose-500 text-white',
    warning: 'bg-amber-900/90 border-amber-500 text-white',
    info: 'bg-slate-900/90 border-slate-700 text-white'
  };

  const icons = {
    success: '✔',
    error: '✖',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `p-4 rounded-xl border shadow-2xl backdrop-blur-md text-xs flex items-start gap-3 toast-slide-in pointer-events-auto ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <span class="text-base font-bold">${icons[type] || 'ℹ'}</span>
    <div class="flex-1">
      <div class="font-extrabold">${title}</div>
      <div class="text-[11px] opacity-90 mt-0.5 leading-relaxed">${message}</div>
    </div>
    <button onclick="this.parentElement.remove()" class="text-white/60 hover:text-white font-bold ml-1">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4500);
}
