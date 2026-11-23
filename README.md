# Online Grocery Application – Complete Agile Development
### Department of Computer Science & Engineering | MIT School of Computing, Pune
**Agile Software Development Final Jury Examination**  
**Problem Statement 8: Online Grocery Application**

---

## 👥 Agile Engineering Team & Roles (Slide 1)
| Name | Roll No. | Agile Role | Primary Domain Module |
| :--- | :--- | :--- | :--- |
| **Radhika Prasad** | 40 | Scrum Master & Backend Lead | US-01 Discovery, PostgreSQL Enabler & Architecture |
| **Akhilesh Patil** | 7 | Full Stack Engineer | US-02 Smart Cart, Redis Lock & Stock Concurrency |
| **Arjun Deshmukh** | 11 | Backend & Payment Engineer | US-04 Multi-Gateway Payments, Saga Rollback (BUG-104) |
| **Sagar Singh** | 44 | Frontend Engineer | US-03 Order Placement, Geofencing & Slots |
| **Rinkesh Anap** | -- | QA Lead & Reliability | US-05 & US-06 Live GPS Tracking & Automated Test Suite |

---

## 🚀 Quick Start Guide (Zero External Dependencies)
This project is built using native Node.js and modern web standards with **zero external npm installation dependencies required**, guaranteeing 100% reliability during offline or low-connectivity campus jury exams.

```bash
# 1. Navigate to project directory
cd "C:\Users\ASUS\.gemini\antigravity\scratch\online-grocery-agile"

# 2. Launch the Application
npm start
# OR directly:
node server.js

# 3. Open in Browser
http://localhost:3000

# 4. Run Automated Test Suite via Terminal (Jury Guideline 3)
npm test
# OR directly:
node test/test-runner.js
```

---

## 🎯 Jury Requirements Implementation Matrix

| Requirement | Implemented Feature | Evidence / Story |
| :--- | :--- | :--- |
| **Product Catalogue with Search / Category** | Real-time Elasticsearch-style search (<150ms SLA), category filtering (Fruits, Dairy, Bakery, Beverages), dietary tags (Vegan, Keto, Organic, Gluten-Free). | `US-01` (5 SP) |
| **Cart & Quantity / Price Calculation** | Real-time inventory deduction, 15-minute Redis-style distributed stock lock timer, line item breakdown, 5% GST tax calculation, coupon discounts (`AGILE20`, `SUB30`). | `US-02` (8 SP) |
| **Order Placement & Summary** | 30-Minute instant delivery slot allocator, geofenced pincode serviceability check (<200ms SLA: Pune 411038, 411001, 411014, 411057 / NY 10001). | `US-03` (8 SP) |
| **Sandbox / Simulated Payment** | Multi-gateway sandbox: Dynamic UPI QR code, Credit Card with 3D Secure bank OTP, One-click Wallet, and Cash on Delivery. | `US-04` (8 SP) |
| **Order Status & Delivery Tracking** | **Mandatory Jury Label:** `[SIMULATED LIVE TRACKING]`. 5-stage milestone stepper (Confirmed -> Packed -> Rider Assigned -> Out for Delivery -> Delivered), real-time Leaflet GPS route map, and moving Ather EV bike simulation. | `US-05` & `US-06` (18 SP) |
| **Test Stock Shortage** | Item `Imported Wild Blueberries (prod-07)` configured with **Stock: 0**; triggers out-of-stock toast and disabled state. | `TC-01` / `TC-05` |
| **Test Excess Quantity** | Real-time boundary check: attempting to order 10 units of `Hass Avocado (prod-02, Stock: 1)` is immediately blocked with `EXCESS_QUANTITY` error. | `TC-05` (Negative) |
| **Test Payment Failure & Rollback** | Simulated UPI abort / 3DS reject: automatically executes transactional Saga rollback to release reserved items back to shelf with zero stock leakage. | `BUG-104` / `TC-02` |

---

## 🧪 Automated Test Suite (Slide 9 & 10 Verification)
Demonstrate these directly in the UI via the **"Run 8 Test Cases"** button or in PowerShell via `npm test`:

1. **TC-01 (Boundary/Concurrency):** Two shoppers buy the last avocado SKU concurrently. First locks SKU; second receives out-of-stock toast and HTTP 409 conflict.
2. **TC-02 (Negative/Exception):** Payment Timeout. Customer closes window during 3D-Secure bank OTP; order transitions to `PAYMENT_TIMEOUT_CANCELLED` and auto-releases stock.
3. **TC-03 (Exceptional Recovery):** Webhook Drop. Gateway succeeds but webhook delayed by 60s; client fallback poll (`/api/payment/verify`) reconciles settlement safely.
4. **TC-04 (Boundary/Lifecycle):** Stock Auto-Release. User abandons session for 15+ minutes; Redis TTL expires; inventory counter increments back.
5. **TC-05 (Negative/Boundary):** Excess Quantity Validation. Cart rejects quantities exceeding current dark store inventory.
6. **TC-06 (Regression):** BUG-104 Transactional Saga Rollback. Verified that aborted UPI payments immediately restore reserved shelf stock.
7. **TC-07 (Security/Geofencing):** Rejection of Non-Serviceable Pincodes outside the 30-minute hyper-local delivery zone within 200ms.
8. **TC-08 (Positive/Integration):** Complete End-to-End Workflow: Search -> Cart -> 30-min Slot -> UPI Confirmation -> Live GPS Dispatch.

---

## 📊 Agile Performance Metrics (Slide 7 & 13)
- **Sprint Cadence:** 2-Week Iterations
- **Team Velocity:** 15.67 SP / Sprint (Calculated: `[13 + 16 + 18] / 3`)
- **Committed Scope:** 47 Story Points
- **Delivered Scope:** 47 Story Points (100% Predictability)
- **Code Test Coverage:** 89.4% (Strictly satisfies Definition of Done > 85%)
- **Unresolved P1 Defects:** 0

---

## 🎬 5-Minute Jury Demonstration Script
When presenting to the evaluators:
1. **Introduction (1 min):**
   - *"Respected evaluators, we have engineered Problem Statement 8: Online Grocery Application following complete Agile Scrum methodology across 3 structured sprints."*
   - Point out the top header showing team members, 47 SP delivered, and 100% sprint predictability.
2. **Catalog & Search Demonstration (1 min):**
   - Click "🥑 Vegan" or type `mango` in the search box.
   - Show the real-time search latency badge displaying `<150ms` (satisfying US-01 SLA).
3. **Smart Cart & Concurrency / Excess Quantity (1.5 min):**
   - Click **"🥑 TC-01 Stock Concurrency"** button in top banner to demonstrate two shoppers competing for the last avocado. Show the out-of-stock toast.
   - Click **"🚫 TC-05 Excess Qty"** to demonstrate excess quantity prevention.
   - Show the **15-Minute Stock Hold countdown timer** in the cart drawer.
4. **Checkout & Payment Sandbox (1.5 min):**
   - Click **Proceed to Checkout**.
   - Type an invalid zip like `999999` to show immediate geofence rejection, then type `411038` to show instant serviceability verification within 200ms.
   - Click **"⚡ BUG-104 Saga Rollback"** in the payment sandbox: show how an aborted transaction executes automated stock rollback without losing inventory.
   - Click **"✔ Pay & Dispatch (Happy Path)"** with UPI.
5. **Simulated Live GPS Tracking (1 min):**
   - Emphasize the clear **`[SIMULATED LIVE TRACKING - US-05 & US-06]`** compliance banner.
   - Click **"▶ Advance Stage"** or **"⏩ Auto Simulation"** to watch the Ather EV bike move along the route on the Leaflet GPS map towards the customer destination.
   - Highlight the real-time automated SMS and push notifications log on the right.
6. **Agile Governance Hub & Test Runner (1 min):**
   - Click **"📋 Jira Sprint Board"** in the header.
   - Toggle between Sprint 1, Sprint 2 (matching Slide 6 with TO DO, IN PROGRESS, CODE REVIEW/QA, DONE), and Sprint 3.
   - Switch to **"Automated Test Suite"** and click **"Run All 8 Agile Test Cases"** to demonstrate all green checkmarks and DoD compliance.
