# LogistikApp Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Remove dummy mode, fix all bugs, add trek & penyimpanan features, implement JWT auth, full MySQL-only.

**Architecture:** Backend Express + JWT middleware + MySQL (mysql2), Frontend React + Tailwind + Axios.

**Tech Stack:** Node.js, Express, MySQL2, jsonwebtoken, bcryptjs, Jest + supertest, Vitest

---

## File Mapping

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/.env` | Modify | `USE_MYSQL=true`, `JWT_SECRET=<random>` |
| `backend/package.json` | Modify | Add deps: jsonwebtoken, bcryptjs, jest, supertest |
| `backend/middleware/auth.js` | **Create** | JWT authenticate + authorize middleware |
| `backend/server.js` | **Rewrite** | MySQL-only, JWT auth, fix B1, add PUT/DELETE orders, trek & penyimpanan endpoints |
| `backend/dummyStore.js` | **Remove** | Replaced by MySQL |
| `backend/dummy-db.json` | **Remove** | Not needed |
| `backend/err.log` | **Remove** | Temp file |
| `backend/__tests__/auth.test.js` | **Create** | Auth middleware tests |
| `backend/__tests__/server.test.js` | **Create** | API integration tests |
| `frontend/src/pages/Orders.jsx` | Modify | Fix B2 + add columns (status, total, nama_pengirim, estimasi) |
| `frontend/src/pages/Items.jsx` | Modify | lokasi from DB |
| `frontend/src/pages/Treks.jsx` | **Create** | Tracking history page |
| `frontend/src/pages/Penyimpanans.jsx` | **Create** | Storage records page |
| `frontend/src/App.jsx` | Modify | Add routes for treks & penyimpanans |
| `frontend/src/components/Layout.jsx` | Modify | Add nav items |

---

## Task 0: Persiapan Database & Environment

- [ ] Update `.env` with `USE_MYSQL=true` and `JWT_SECRET`
- [ ] Install backend deps: jsonwebtoken, bcryptjs, jest, supertest
- [ ] Run migration SQL (add columns to order/barang, update SPs)
- [ ] Run migrate.js to move dummy data to MySQL
- [ ] Commit

## Task 1: JWT Auth Middleware

- [ ] Create `backend/middleware/auth.js` with `authenticate` and `authorize`
- [ ] Write tests, implement, verify, commit

## Task 2: Refactor Backend Server

- [ ] Rewrite `server.js` - MySQL-only, JWT auth on all routes except login
- [ ] Fix B1: compare password with bcrypt, fallback to plaintext for migration
- [ ] Add PUT/DELETE for orders
- [ ] Add trek & penyimpanan endpoints
- [ ] Remove dummyStore.js, dummy-db.json, err.log
- [ ] Write tests, verify, commit

## Task 3: Fix Frontend B2 + Update Orders/Items

- [ ] Fix B2: remove courier onChange overwriting sender fields
- [ ] Add missing columns: status, total, nama_pengirim, estimasi_sampai
- [ ] Update Items page for DB-driven lokasi
- [ ] Commit

## Task 4: Create Treks Page

- [ ] Create Treks.jsx with DataTable for tracking history + add modal
- [ ] Commit

## Task 5: Create Penyimpanans Page

- [ ] Create Penyimpanans.jsx with DataTable for storage records + add modal
- [ ] Commit

## Task 6: Update Routes & Navigation

- [ ] Add routes in App.jsx for /treks and /penyimpanans
- [ ] Add nav items in Layout.jsx
- [ ] Build frontend to verify
- [ ] Commit

## Task 7: Final Verification

- [ ] Start backend, test login flow
- [ ] Start frontend
- [ ] Run full test suite
- [ ] Run frontend lint
