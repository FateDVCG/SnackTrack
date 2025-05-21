
# Messenger-Based Ordering System – Architecture

This document outlines the full system architecture for a Messenger-integrated ordering system for a small cafe/shop. Customers order via Messenger. The system processes these orders, stores them, and displays them to staff through a web-based dashboard. It also includes basic sales analytics with historical tracking.

---

## 🧱 Overview

- **Frontend (Employee Dashboard):** React (Vite or Next.js)
- **Backend (Webhook + REST API):** Node.js with Express
- **Database:** PostgreSQL (via Supabase or Railway)
- **Analytics Support:** Daily, weekly, and monthly summaries
- **Hosting:** Railway or Render (API), Vercel (frontend optional)
- **Messenger API Integration:** Facebook Graph API (Webhook)

---

## 📁 File + Folder Structure

```
/project-root
│
├── backend/                        # API and webhook server
│   ├── routes/
│   │   ├── webhook.js              # Messenger webhook endpoint
│   │   ├── orders.js               # CRUD for orders
│   │   └── analytics.js            # Analytics endpoints
│   ├── controllers/
│   │   ├── messengerController.js  # Parses Messenger messages
│   │   ├── orderController.js      # Order business logic
│   │   └── analyticsController.js  # Analytics logic
│   ├── models/
│   │   ├── orderModel.js           # Order DB queries
│   │   └── analyticsModel.js       # Aggregated sales queries
│   ├── utils/
│   │   └── messengerAPI.js         # Sends replies to Messenger
│   ├── index.js                    # Entry point
│   └── .env                        # Secrets and config
│
├── frontend/                       # Employee-facing dashboard
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── OrderCard.jsx
│   │   │   └── FilterTabs.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Order interface
│   │   │   └── Analytics.jsx       # Sales analytics
│   │   ├── services/
│   │   │   ├── orderService.js
│   │   │   └── analyticsService.js
│   │   ├── hooks/
│   │   │   ├── useOrders.js
│   │   │   └── useAnalytics.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
├── db/
│   ├── init.sql                    # DB schema
│   └── analytics_views.sql         # Views for daily/weekly/monthly reports
│
├── architecture.md                 # This file
├── README.md
├── package.json
└── .gitignore
```

---

## ⚙️ What Each Part Does

### 🔙 Backend

- **Webhook Route**: Receives and verifies Messenger POST requests.
- **Messenger Controller**: Extracts messages and triggers order creation.
- **Order Controller**: Stores, updates, and fetches order data.
- **Analytics Controller**: Returns revenue, order count, bestsellers for day/week/month.
- **Messenger Utils**: Sends confirmation or response messages via Graph API.

### 🧾 Frontend

- **Dashboard (Dashboard.jsx)**: Shows real-time orders.
- **Analytics Page (Analytics.jsx)**:
  - Shows sales today, this week, this month
  - Displays top items sold
- **Hooks**:
  - `useOrders`: Loads and manages order queue
  - `useAnalytics`: Loads historical metrics
- **Services**:
  - API wrappers for order and analytics endpoints

### 🗃 Database

- **Tables**:
  - `orders`: Stores customer orders
- **Analytics Views** (`analytics_views.sql`):
  - Daily Sales
  - Weekly Sales
  - Monthly Revenue
  - Top Selling Items
- **Example Query View**:
  ```sql
  CREATE VIEW monthly_sales AS
  SELECT
    DATE_TRUNC('month', timestamp) AS month,
    COUNT(*) AS total_orders,
    SUM(total_price) AS total_revenue
  FROM orders
  GROUP BY 1
  ORDER BY 1 DESC;
  ```

---

## 🔄 System Workflow

### ✅ Order Flow

1. **Customer → Messenger Page**
2. **Messenger → Webhook (`/webhook`)**
3. **Webhook → Messenger Controller**
4. **Controller → Order Saved in DB**
5. **Dashboard (frontend)** loads from `/api/orders`
6. **Staff → Accept/Complete/Reject → Update Order**
7. **(Optional)**: Messenger reply confirms status to customer

### 📊 Analytics Flow

1. **Frontend → `/api/analytics?range=monthly`**
2. **Controller fetches from SQL View**
3. **Frontend renders charts/stats**
4. **User can toggle day/week/month from dropdown or buttons**

---

## 🧠 State Management

- **Frontend**: React state via hooks (order + analytics state)
- **Backend**: Stateless; DB is source of truth
- **Database**: Historical state permanently stored for long-term reporting

---

## 🌍 Hosting + Integration

| Component     | Suggested Host        | Example URL                          |
|---------------|------------------------|---------------------------------------|
| Backend API   | Railway / Render       | `https://shop-api.railway.app`        |
| Frontend      | Vercel (or Railway)    | `https://shop-dashboard.vercel.app`   |
| Database      | Supabase / Railway     | Included with backend host            |
| Messenger API | Facebook Developer App | Connects via webhook to your backend  |

---

## 🔐 `.env` Example

```env
PORT=3000
DATABASE_URL=postgres://user:pass@host:port/dbname
FB_PAGE_TOKEN=your_fb_page_token
FB_VERIFY_TOKEN=webhook_verification_token
```

---

## 📌 Development Checklist

- [x] Set up Facebook Developer App
- [x] Configure webhook + tokens
- [x] Build backend (orders + analytics)
- [x] Build dashboard + analytics page
- [x] Deploy backend (Railway/Render)
- [x] Deploy frontend (Vercel)
- [x] Test full flow end-to-end

---

## 📈 Future Features

- [ ] Inventory tracking (link orders to ingredients)
- [ ] Alerts when items run low
- [ ] Export CSV reports
- [ ] Login/authentication for staff

---

## ✅ Summary

This architecture gives you:
- A **low-cost**, scalable system
- Real-time order management via **Messenger**
- Easy-to-use **staff dashboard**
- **Historical analytics** (sales, orders, bestsellers)
