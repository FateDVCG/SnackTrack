# MVP Build Tasks – Messenger-Based Ordering System

Each task below is small, focused, and testable. You can run these one-by-one with an engineering LLM or junior developer.

---

## 📦 Backend

### 1. Initialize Backend Project

- **Start:** Create `/backend` folder
- **End:** `npm init -y` with Express installed

### 2. Setup Entry Server

- **Start:** Create `index.js`
- **End:** Basic Express server running on `PORT`

### 3. Create Webhook Endpoint

- **Start:** Add `routes/webhook.js`
- **End:** Route accepts POST from Messenger

### 4. Add Webhook Verification Logic

- **Start:** Implement GET verification check (via `FB_VERIFY_TOKEN`)
- **End:** Messenger can verify webhook successfully

### 5. Parse Incoming Messenger Messages

- **Start:** Add `messengerController.js`
- **End:** Messages logged + parsed from body payload

### 6. Send Reply to Messenger

- **Start:** Create `utils/messengerAPI.js`
- **End:** Function posts back via Graph API

### 7. Set Up Order Data Model

- **Start:** Create `models/orderModel.js`
- **End:** Contains `createOrder`, `getOrders`, `updateOrderStatus`

### 8. Hook Controller to Model

- **Start:** Create `orderController.js`
- **End:** Can call model functions from controller

### 9. Build `/api/orders` Route

- **Start:** Add `routes/orders.js`
- **End:** Supports `GET` all, `POST` new, `PATCH` update

### 10. Add Analytics View Queries

- **Start:** Create `analyticsModel.js`
- **End:** Contains SQL queries for day/week/month sales

### 11. Build `/api/analytics` Route

- **Start:** Add `routes/analytics.js`
- **End:** Supports `GET ?range=day|week|month`

### 12. Add `.env` Support

- **Start:** Install `dotenv`, add config
- **End:** App pulls from `.env` file

---

## 🧾 Database

### 13. Write Order Table SQL

- **Start:** Create `init.sql`
- **End:** Includes `orders` table with expected schema

### 14. Write Analytics Views

- **Start:** Create `analytics_views.sql`
- **End:** View(s) for daily, weekly, monthly summaries

---

## 💻 Frontend

### 15. Initialize Frontend (Vite)

- **Start:** Create `/frontend` with Vite or Next.js
- **End:** Project runs `localhost:5173` (or 3000)

### 16. Build Order Dashboard Page

- **Start:** Create `Dashboard.jsx`
- **End:** Displays orders from API

### 17. Build OrderCard Component

- **Start:** Create `OrderCard.jsx`
- **End:** Accepts order props, renders card

### 18. Hook Order State

- **Start:** Create `useOrders.js`
- **End:** Fetches from `/api/orders`

### 19. Add OrderService API Wrapper

- **Start:** Create `orderService.js`
- **End:** Handles `GET`, `POST`, `PATCH` calls

### 20. Build Analytics Page

- **Start:** Create `Analytics.jsx`
- **End:** Displays basic stats: revenue/orders

### 21. Build FilterTabs Component

- **Start:** Create `FilterTabs.jsx`
- **End:** Lets user switch day/week/month

### 22. Hook Analytics State

- **Start:** Create `useAnalytics.js`
- **End:** Fetches stats from `/api/analytics`

### 23. Add AnalyticsService API Wrapper

- **Start:** Create `analyticsService.js`
- **End:** Makes call to analytics endpoint

---

## 🚀 Deployment + Integration

### 24. Deploy Backend

- **Start:** Push to Railway/Render
- **End:** Live API endpoint working

### 25. Deploy Frontend

- **Start:** Push to Vercel or Railway
- **End:** Live dashboard loading orders

### 26. Connect Messenger Webhook

- **Start:** Register Facebook App + set webhook URL
- **End:** Messages successfully hit your webhook

---

Each of these can be run and validated in isolation. Ready to feed into task automation or CI workflows.
