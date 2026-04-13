# Timetable Management System

This repository now runs as a full JavaScript stack:

- Frontend: React (Vite)
- Backend: Node.js + Express
- Database: MongoDB

Legacy PHP and MySQL runtime files were removed.

## Project folders

- `frontend-react/`: React application
- `backend-node/`: Express API + MongoDB models

## Quick start

## 1) Start MongoDB

Start your local MongoDB service so `mongodb://127.0.0.1:27017` is available.

## 2) Start backend

```bash
cd backend-node
npm install
npm run seed:mongo
npm run dev
```

Backend runs on `http://localhost:5000` by default.

## 3) Start frontend

Open another terminal:

```bash
cd frontend-react
npm install
npm run dev
```

Frontend runs on Vite (usually `http://localhost:5173`) and proxies API calls to backend.

## Optional: migrate from legacy SQL dump

If you have an old SQL dump with data, import it into MongoDB:

```bash
cd backend-node
set LEGACY_SQL_DUMP=C:\path\to\legacy_dump.sql
npm run migrate:legacy-sql
```

For PowerShell:

```powershell
$env:LEGACY_SQL_DUMP = 'C:\path\to\legacy_dump.sql'
npm run migrate:legacy-sql
```

## Default seeded logins

- Admin: `admin@isp.edu.pk` / `admin123`
- Faculty: `dr.ahmed@seed.edu` / `faculty123`
- Student: `student1@seed.edu` / `student123`
