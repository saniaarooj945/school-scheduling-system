# Timetable System Instructions

This project uses React frontend + Node.js/Express backend + MongoDB.

## Run steps

1. Start MongoDB.
2. Start backend:

```bash
cd backend-node
npm install
npm run seed:mongo
npm run dev
```

3. Start frontend:

```bash
cd frontend-react
npm install
npm run dev
```

4. Open the frontend URL shown by Vite (usually `http://localhost:5173`).

## Credentials

- Admin: `admin@isp.edu.pk` / `admin123`
- Faculty: `dr.ahmed@seed.edu` / `faculty123`
- Student: `student1@seed.edu` / `student123`

## Optional legacy data migration

If you have an old SQL dump from the previous system:

PowerShell:

```powershell
cd backend-node
$env:LEGACY_SQL_DUMP = 'C:\path\to\legacy_dump.sql'
npm run migrate:legacy-sql
```
