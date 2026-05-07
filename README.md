# JCOM Website

This project is now organized into two top-level apps:

- `frontend/` — React web app
- `backend/` — Express API server

## Project Structure

```text
jcom-website/
|-- frontend/
|   |-- public/
|   |-- src/
|   |-- package.json
|-- backend/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- utils/
|   |-- server.js
|   |-- package.json
|-- package.json
```

## Root Scripts

Run these from the repository root:

- `npm start` — start the frontend app from the root
- `npm run dev` — start frontend and backend together
- `npm run frontend` — start the React app
- `npm run server` — start the API server
- `npm run backend` — start the API server
- `npm run build` — build the frontend app
- `npm test` — run frontend tests
- `npm run frontend:install` — install frontend dependencies
- `npm run backend:install` — install backend dependencies

## Frontend

```bash
cd frontend
npm start
```

## Backend

```bash
cd backend
npm run dev
```
