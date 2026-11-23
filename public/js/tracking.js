/**
 * Live GPS Tracking & Automated Alerts Engine (US-05 & US-06)
 * QuickGrocery - Agile E-Commerce Platform
 */

let activeOrderId = null;
let trackingData = null;
let leafletMap = null;
let riderMarker = null;
let routePolyline = null;
let trackingPollInterval = null;
let autoAdvanceInterval = null;

// Route Coordinates (Pune Hub #4 Kothrud -> MIT Campus / Paud Road)
const SIMULATED_ROUTE = [
  { lat: 18.5204, lng: 73.8567, name: 'Pune Central Hub #4' },
  { lat: 18.5180, lng: 73.8450, name: 'Deccan Gymkhana' },
  { lat: 18.5150, lng: 73.8300, name: 'Karve Road Crossing' },
  { lat: 18.5100, lng: 73.8150, name: 'Paud Road Flyover' },
  { lat: 18.5074, lng: 73.8077, name: 'MIT Campus / Customer Destination' }
];

async function startOrderTracking(orderId) {
  activeOrderId = orderId;
  
  // Switch view to tracking
  document.getElementById('storefrontView').classList.add('hidden');
  const trackingView = document.getElementById('trackingView');
  trackingView.classList.remove('hidden');

  await loadTrackingData();
  renderTrackingInterface();
  initDeliveryMap();

  // Poll for tracking updates every 5 seconds
  if (trackingPollInterval) clearInterval(trackingPollInterval);
  trackingPollInterval = setInterval(loadTrackingData, 5000);
}

function showStorefront() {
  document.getElementById('trackingView').classList.add('hidden');
  document.getElementById('storefrontView').classList.remove('hidden');
  if (trackingPollInterval) clearInterval(trackingPollInterval);
  if (autoAdvanceInterval) clearInterval(autoAdvanceInterval);
}

async function loadTrackingData() {
  if (!activeOrderId) return;
  try {
    const res = await fetch(`/api/orders/${activeOrderId}/track`);
    const data = await res.json();
    if (data.success) {
      trackingData = data;
      updateTrackingDisplay();
    }
  } catch (err) {
    console.error('Tracking fetch error:', err);
  }
}

function renderTrackingInterface() {
  const container = document.getElementById('trackingView');
  if (!container || !trackingData) return;

  const t = trackingData.tracking;
  const order = trackingData;

  container.innerHTML = `
    <!-- Top Bar with Back and Jury Simulation Banner -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <button onclick="showStorefront()" class="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition">
          ← Back to Grocery Store
        </button>
      </div>

      <!-- MANDATORY JURY SIMULATION LABEL -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
        <span>⚠️ [SIMULATED LIVE TRACKING - FOR JURY DEMONSTRATION - US-05 & US-06]</span>
      </div>

      <!-- Live Demo Stage Control Buttons -->
      <div class="flex items-center gap-2">
        <button onclick="advanceStageManually()" class="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition">
          <span>▶ Advance Stage</span>
        </button>
        <button onclick="toggleAutoAdvance(this)" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition">
          <span>⏩ Auto Simulation</span>
        </button>
      </div>
    </div>

    <!-- Main Grid: Left Map & Rider, Right Stages & Alerts -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- LEFT COLUMN: Live GPS Map & Rider Info (US-06) -->
      <div class="lg:col-span-7 space-y-6">
        
        <!-- Map Card -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🗺</span>
              <div>
                <h3 class="text-sm font-extrabold text-slate-900">Live Delivery Partner GPS Route</h3>
                <p class="text-[11px] text-slate-500">WebSocket / SSE location stream • Sub-30 Min Routing</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-brand-700 font-mono-code" id="liveEtaText">ETA: ${t.etaMinutes} mins</span>
              <div class="text-[10px] text-slate-400">Target: &lt;30 Mins</div>
            </div>
          </div>

          <!-- Interactive Leaflet Map Container -->
          <div id="map" class="relative"></div>

          <!-- Fallback Canvas Map (Zero-dependency backup if external tiles are blocked on campus) -->
          <canvas id="canvasMap" class="hidden"></canvas>

          <!-- Route Milestones Bar -->
          <div class="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-2 pt-1 border-t border-slate-100">
            <span class="flex items-center gap-1 text-slate-800">
              <span class="w-2 h-2 rounded-full bg-slate-900"></span> Pune Hub #4
            </span>
            <span class="text-brand-600 font-bold animate-pulse">● ● ● In Transit</span>
            <span class="flex items-center gap-1 text-emerald-600">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Destination: ${order.deliveryAddress.street}
            </span>
          </div>
        </div>

        <!-- Rider Profile Card -->
        ${t.rider ? `
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-3xl shadow-sm animate-bike">
                ${t.rider.avatar}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-extrabold text-sm text-slate-900">${t.rider.name}</h4>
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">${t.rider.rating}</span>
                </div>
                <div class="text-xs text-slate-500 font-medium">${t.rider.vehicle}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Vaccinated • Body Temp: ${t.rider.temperature}</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <a href="tel:${t.rider.phone}" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5">
                <span>📞</span> <span class="hidden sm:inline">Call Rider</span>
              </a>
              <button onclick="showToast('Rider Tip', 'Tip added to order total!', 'success')" class="px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition">
                <span>☕ Tip</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Order Summary & Invoice Mini -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-xs space-y-2">
          <div class="flex justify-between items-center font-bold text-slate-900 border-b border-slate-100 pb-2">
            <span>Order #${order.orderId}</span>
            <span class="text-brand-600 font-extrabold">₹${order.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0)}</span>
          </div>
          <div class="text-slate-600">
            <span class="font-semibold text-slate-800">Items:</span>
            ${order.items.map(i => `${i.name} (×${i.quantity})`).join(', ')}
          </div>
          <div class="text-slate-500 text-[11px]">
            Slot: <span class="font-semibold text-slate-700">${order.deliverySlot}</span> • Hub: <span class="font-semibold text-slate-700">${order.deliveryAddress.hub}</span>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: 5-Stage Stepper & US-05 Automated Alerts Feed -->
      <div class="lg:col-span-5 space-y-6">
        
        <!-- 5-Stage Delivery Stepper -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <span>📦</span> Delivery Milestones
            </h3>
            <span class="text-xs font-extrabold text-brand-600 font-mono-code" id="progressPercentage">
              ${t.progressPercent || 20}%
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div id="progressBarFill" class="bg-gradient-to-r from-brand-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500" style="width: ${t.progressPercent || 20}%"></div>
          </div>

          <!-- Steps List -->
          <div class="space-y-4 pt-2" id="milestonesList">
            ${renderMilestoneItem('ORDER_CONFIRMED', '1. Order Confirmed & Paid', 'Payment validated via sandbox 3D Secure / UPI', t.stage)}
            ${renderMilestoneItem('PACKING_AT_DARK_STORE', '2. Packed at Dark Store', 'Hygiene-checked & packed in eco-friendly kraft bag', t.stage)}
            ${renderMilestoneItem('RIDER_ASSIGNED', '3. Delivery Partner Assigned', 'Ramesh Kamble has picked up the package', t.stage)}
            ${renderMilestoneItem('OUT_FOR_DELIVERY', '4. Out for Delivery', 'Rider is on route via Paud Road flyover', t.stage)}
            ${renderMilestoneItem('DELIVERED', '5. Order Delivered', 'Package handed over at customer doorstep', t.stage)}
          </div>
        </div>

        <!-- US-05 Automated SMS & In-App Alerts Stream -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">📲</span>
              <div>
                <h3 class="font-extrabold text-sm text-slate-900">Automated Dispatch Alerts (US-05)</h3>
                <p class="text-[11px] text-slate-500">Automated SMS & In-App Push notifications log</p>
              </div>
            </div>
            <span class="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold font-mono-code">5 SP Story</span>
          </div>

          <!-- Alerts Feed -->
          <div class="space-y-2.5 max-h-64 overflow-y-auto" id="alertsFeedContainer">
            ${(t.alerts || []).map(alert => `
              <div class="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">${alert.type}</span>
                  <span class="text-slate-400 font-mono-code">${alert.time}</span>
                </div>
                <p class="text-slate-800 font-medium leading-relaxed">${alert.text}</p>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

    </div>
  `;
}

function renderMilestoneItem(stageKey, title, subtitle, currentStage) {
  const stageHierarchy = ['ORDER_CONFIRMED', 'PACKING_AT_DARK_STORE', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIdx = stageHierarchy.indexOf(currentStage);
  const thisIdx = stageHierarchy.indexOf(stageKey);

  const isDone = thisIdx < currentIdx;
  const isCurrent = thisIdx === currentIdx;

  let statusBadge = '';
  if (isDone) {
    statusBadge = `<div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">✓</div>`;
  } else if (isCurrent) {
    statusBadge = `<div class="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold animate-ping-subtle ring-4 ring-brand-100">●</div>`;
  } else {
    statusBadge = `<div class="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-200">${thisIdx + 1}</div>`;
  }

  const titleClass = isCurrent ? 'font-extrabold text-slate-900 text-xs' : isDone ? 'font-bold text-slate-700 text-xs' : 'font-medium text-slate-400 text-xs';
  const subtitleClass = isCurrent ? 'text-[11px] text-brand-700 font-semibold' : 'text-[11px] text-slate-400';

  return `
    <div class="flex items-start gap-3">
      ${statusBadge}
      <div class="flex-1">
        <h4 class="${titleClass}">${title}</h4>
        <p class="${subtitleClass}">${subtitle}</p>
      </div>
    </div>
  `;
}

function updateTrackingDisplay() {
  if (!trackingData) return;
  const t = trackingData.tracking;

  // Update ETA
  const etaEl = document.getElementById('liveEtaText');
  if (etaEl) etaEl.textContent = `ETA: ${t.etaMinutes} mins`;

  // Update Progress Bar
  const progEl = document.getElementById('progressBarFill');
  const progText = document.getElementById('progressPercentage');
  if (progEl) progEl.style.width = `${t.progressPercent}%`;
  if (progText) progText.textContent = `${t.progressPercent}%`;

  // Update Rider GPS position on Leaflet Map
  if (leafletMap && riderMarker && t.currentCoordinates) {
    riderMarker.setLatLng([t.currentCoordinates.lat, t.currentCoordinates.lng]);
    leafletMap.panTo([t.currentCoordinates.lat, t.currentCoordinates.lng]);
  }

  // Update Milestones & Alerts
  const milestonesList = document.getElementById('milestonesList');
  if (milestonesList) {
    milestonesList.innerHTML = `
      ${renderMilestoneItem('ORDER_CONFIRMED', '1. Order Confirmed & Paid', 'Payment validated via sandbox 3D Secure / UPI', t.stage)}
      ${renderMilestoneItem('PACKING_AT_DARK_STORE', '2. Packed at Dark Store', 'Hygiene-checked & packed in eco-friendly kraft bag', t.stage)}
      ${renderMilestoneItem('RIDER_ASSIGNED', '3. Delivery Partner Assigned', 'Ramesh Kamble has picked up the package', t.stage)}
      ${renderMilestoneItem('OUT_FOR_DELIVERY', '4. Out for Delivery', 'Rider is on route via Paud Road flyover', t.stage)}
      ${renderMilestoneItem('DELIVERED', '5. Order Delivered', 'Package handed over at customer doorstep', t.stage)}
    `;
  }

  const alertsContainer = document.getElementById('alertsFeedContainer');
  if (alertsContainer && t.alerts) {
    alertsContainer.innerHTML = t.alerts.map(alert => `
      <div class="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
        <div class="flex items-center justify-between text-[10px]">
          <span class="font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">${alert.type}</span>
          <span class="text-slate-400 font-mono-code">${alert.time}</span>
        </div>
        <p class="text-slate-800 font-medium leading-relaxed">${alert.text}</p>
      </div>
    `).join('');
  }
}

// Leaflet Map Initialization with Offline/Canvas fallback
function initDeliveryMap() {
  const mapDiv = document.getElementById('map');
  if (!mapDiv) return;

  try {
    if (typeof L !== 'undefined') {
      if (leafletMap) {
        leafletMap.remove();
      }

      // Center map around Pune Kothrud (Hub #4)
      leafletMap = L.map('map').setView([18.5140, 73.8320], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(leafletMap);

      // Add Start Hub Marker
      L.marker([18.5204, 73.8567], {
        title: 'Dark Store Hub #4'
      }).addTo(leafletMap).bindPopup('🏢 <b>Dark Store Hub #4</b><br>Kothrud Dispatch Center');

      // Add Destination Marker
      L.marker([18.5074, 73.8077], {
        title: 'Customer Delivery Destination'
      }).addTo(leafletMap).bindPopup('📍 <b>Customer Address</b><br>MIT Campus, Paud Road');

      // Draw polyline route
      const latlngs = SIMULATED_ROUTE.map(r => [r.lat, r.lng]);
      routePolyline = L.polyline(latlngs, {
        color: '#059669',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(leafletMap);

      // Create Custom Rider Icon (Ather EV bike)
      const bikeIcon = L.divIcon({
        className: 'custom-bike-marker',
        html: `<div style="background:#059669; color:white; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid white;">🛵</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const currentCoords = (trackingData && trackingData.tracking.currentCoordinates) 
        ? trackingData.tracking.currentCoordinates 
        : SIMULATED_ROUTE[0];

      riderMarker = L.marker([currentCoords.lat, currentCoords.lng], { icon: bikeIcon }).addTo(leafletMap);
      riderMarker.bindPopup('🛵 <b>Ramesh Kamble</b><br>Ather EV 450X (MH-12-AG-2026)');

      setTimeout(() => {
        leafletMap.invalidateSize();
      }, 300);

    } else {
      drawCanvasFallback();
    }
  } catch (e) {
    console.warn('Leaflet map error, switching to canvas fallback:', e);
    drawCanvasFallback();
  }
}

// Fallback Canvas Map (Guarantees zero-network reliability during campus presentation)
function drawCanvasFallback() {
  const mapDiv = document.getElementById('map');
  const canvas = document.getElementById('canvasMap');
  if (!canvas || !mapDiv) return;

  mapDiv.classList.add('hidden');
  canvas.classList.remove('hidden');

  canvas.width = 600;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  // Background grid
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 600, 320);

  // Roads
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(60, 260);
  ctx.bezierCurveTo(200, 240, 380, 100, 520, 60);
  ctx.stroke();

  // Active route
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 6;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hub Pin
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(60, 260, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('🏢 Dark Store #4', 80, 265);

  // Destination Pin
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(520, 60, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillText('📍 MIT Campus', 420, 55);

  // Rider Icon
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(280, 170, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('🛵', 270, 176);
}

// Manual Advance Stage (For jury presentation demo)
async function advanceStageManually() {
  if (!activeOrderId) return;
  try {
    const res = await fetch(`/api/orders/${activeOrderId}/advance-stage`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      trackingData.tracking = data.tracking;
      updateTrackingDisplay();
      showToast('Stage Advanced', `Delivery transitioned to: ${data.newStage}`, 'success');
    }
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

// Auto Simulation (Steps through stages automatically every 3 seconds)
function toggleAutoAdvance(btn) {
  if (autoAdvanceInterval) {
    clearInterval(autoAdvanceInterval);
    autoAdvanceInterval = null;
    btn.innerHTML = '<span>⏩ Auto Simulation</span>';
    btn.className = 'px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition';
  } else {
    btn.innerHTML = '<span>⏸ Pause Auto</span>';
    btn.className = 'px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition animate-pulse';
    autoAdvanceInterval = setInterval(async () => {
      if (trackingData && trackingData.tracking.stage === 'DELIVERED') {
        clearInterval(autoAdvanceInterval);
        autoAdvanceInterval = null;
        btn.innerHTML = '<span>⏩ Auto Simulation</span>';
        btn.className = 'px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition';
        return;
      }
      await advanceStageManually();
    }, 3200);
  }
}
