# SnackTrack

SnackTrack is a full-stack application for managing and analyzing food orders, supporting both English and Tagalog (Filipino) order parsing. It features a Messenger chatbot interface, analytics dashboard, and menu management tools.

## Features

- Messenger chatbot for order intake (English/Tagalog/Taglish)
- Natural language order parsing with error handling
- Menu management (CRUD)
- Analytics dashboard (sales, items, trends)
- Real-time updates via WebSockets
- Multi-language support
- Comprehensive test suites (backend & frontend)

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React, Vite
- **Testing:** Mocha, Chai (backend), Jest/Vitest (frontend)
- **Messenger Integration:** Facebook Messenger API

## Folder Structure

```
backend/    # Node.js/Express API, order parsing, DB models, controllers
frontend/   # React app, dashboard, menu management
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL

### Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Configure your database in `backend/config/db.js`.
3. Run migrations and seed sample data:
   ```bash
   node runMigration.js
   node scripts/initDb.js
   node scripts/populate-menu.js
   ```
4. Start the backend server:
   ```bash
   node index.js
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the frontend dev server:
   ```bash
   npm run dev
   ```

### Running Tests

- **Backend:**
  ```bash
  cd backend
  npm test
  ```
- **Frontend:**
  ```bash
  cd frontend
  npm test
  ```
- **Restart the Database contents:**
  TRUNCATE TABLE orders, menu_items RESTART IDENTITY CASCADE;

## Documentation

- **Order Parsing:** See `backend/utils/orderParser.js` and tests in `backend/test/utils/orderParser.test.js`.
- **API Endpoints:** See `backend/routes/` and controller files in `backend/controllers/`.
- **Messenger Integration:** See `backend/controllers/messengerController.js` and `backend/utils/messengerAPI.js`.
- **Frontend Components:** See `frontend/src/components/` and `frontend/src/pages/`.

## Contributing

1. Fork the repo and create your branch (`git checkout -b feature/fooBar`)
2. Commit your changes (`git commit -am 'Add some fooBar'`)
3. Push to the branch (`git push origin feature/fooBar`)
4. Create a new Pull Request

## License

MIT

---

For more details, see the `architecture.md` and `tasks.md` files.
