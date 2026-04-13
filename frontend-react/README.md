# Timetable Frontend (React + shadcn/ui)

This folder contains the React frontend conversion of the timetable system.

## Stack

- React + Vite
- Tailwind CSS + shadcn/ui
- React Router
- Axios
- Sonner (toasts)

## Backend compatibility

- Backend is Node.js + Express + MongoDB.
- Frontend calls API endpoints under `/api/*`.
- Vite dev server proxies `/api` to `http://localhost:5000`.

## Development

1. Ensure backend API is running on `http://localhost:5000`.
2. From this folder:

```bash
npm install
npm run dev
```

3. Open the URL shown by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
```

Build output is in `dist/`.

## Notes

- Authentication uses JWT bearer tokens.
- Role routing is supported for Admin, Faculty, and Student.
- Some build-time CSS warnings from third-party Tailwind utilities may appear, but the production build succeeds.
