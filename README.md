# LogistikApp — Sistem Manajemen Logistik dan Pengiriman

Aplikasi fullstack untuk manajemen logistik: kelola pelanggan, kurir, gudang, barang, dan pengiriman terintegrasi. Dibangun dengan **React (Vite) + Tailwind CSS** di frontend dan **Node.js/Express + MySQL** di backend.

---

## Fitur

- **Dashboard** — Ringkasan statistik: jumlah pelanggan, kurir, gudang, pengiriman, barang.
- **Pelanggan** — CRUD data pelanggan (nama, alamat, no. telepon).
- **Kurir** — CRUD data kurir (nama, no. telepon, kendaraan).
- **Gudang** — CRUD data gudang (nama, alamat, kota).
- **Barang** — CRUD master data barang (nama, jumlah, berat, kategori, status). Barang bersifat independen (tidak terikat ke pengiriman).
- **Pengiriman (Order)** — Buat pengiriman baru dengan memilih pelanggan, kurir, gudang asal, gudang tujuan, dan satu/beberapa barang. Proses multi-tabel dalam satu transaksi.
- **Lacak Kiriman** — Riwayat lokasi & status tiap pengiriman.
- **Penyimpanan** — Catatan barang masuk/keluar dari gudang.
- **Audit Log** — Catatan perubahan data di semua tabel.
- **Autentikasi JWT** — Login multi-role, proteksi rute.
- **Export CSV** — Ekspor data tabel ke file CSV.

---

## Teknologi

### Frontend
- React 19 + Vite
- React Router DOM v6
- Tailwind CSS + shadcn/ui
- Axios
- Recharts (dashboard)

### Backend
- Node.js + Express.js
- MySQL  (mysql2/promise)
- JWT (jsonwebtoken)
- bcryptjs
- dotenv

---

## Struktur Proyek

```
LogistikApp/
├── backend/
│   ├── .env                    # Konfigurasi koneksi DB & server
│   ├── middleware/
│   │   └── auth.js             # Middleware JWT: authenticate & authorize
│   ├── db.js                   # Koneksi MySQL (pool)
│   ├── logistik_db.sql         # Skema database + seed data
│   ├── migrate-db.js           # Script migrasi runtime (tanpa drop DB)
│   ├── server.js               # Entry point Express API
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx             # Router utama
│       ├── main.jsx            # Entry point React
│       ├── index.css           # Tailwind entry
│       ├── components/         # UI komponen reusable
│       │   ├── Layout.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── PageHeader.jsx
│       │   ├── SectionCard.jsx
│       │   ├── DataTable.jsx
│       │   ├── FormField.jsx
│       │   ├── Modal.jsx
│       │   ├── StatusBadge.jsx
│       │   └── ui.js           # Utility class CSS
│       ├── context/
│       │   └── AuthContext.jsx  # Auth state management
│       ├── lib/
│       │   ├── api.js          # Axios instance + interceptor token
│       │   ├── auth.js         # localStorage session helper
│       │   ├── errors.js       # Error message parser
│       │   └── export.js       # Export CSV logic
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Login.jsx
│           ├── Customers.jsx
│           ├── Orders.jsx
│           ├── Couriers.jsx
│           ├── Warehouses.jsx
│           ├── Items.jsx
│           ├── Treks.jsx
│           ├── Penyimpanans.jsx
│           ├── AuditLogs.jsx
│           └── NotFound.jsx
└── README.md
```

---

## Instalasi & Menjalankan

### Prasyarat

- Node.js 18+ dan npm
- MySQL (XAMPP / MariaDB / standalone)

### 1. Backend

```bash
cd backend
npm install
```

Buat file `backend/.env`:

```ini
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=logistik_db
PORT=5001
JWT_SECRET=su4RaH4s1l4211597!
```

Import database:

```bash
mysql -u root < logistik_db.sql
```

Atau lewat phpMyAdmin: import `backend/logistik_db.sql`.

Jalankan server:

```bash
npm start
```

Backend berjalan di http://localhost:5001.

> Jika database sudah ada (upgrade dari versi lama), jalankan migrasi:
> ```bash
> node migrate-db.js
> ```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di http://localhost:5173.

---

## Akun Login

| Username/Email       | Password   | Role          |
| :------------------- | :--------- | :------------ |
| `admin@admin.com`    | `admin123` | Administrator |

---

## Flow Penggunaan Aplikasi

### Alur Membuat Pengiriman Baru

```
Login → Buka menu "Pengiriman" → Klik "+" (Buat Pengiriman)
  │
  ├─ 1. Pilih Pelanggan → otomatis isi nama, no HP, alamat pengirim
  ├─ 2. Pilih Gudang Asal (gudang pengirim)
  ├─ 3. Pilih Kurir
  ├─ 4. Pilih Gudang Tujuan (gudang transit)
  ├─ 5. Isi data pengirim (nama, no HP, alamat)
  ├─ 6. Atur tanggal kirim & estimasi sampai
  ├─ 7. Pilih Barang + jumlah (bisa tambah multiple barang)
  └─ 8. Klik "Buat Pengiriman"
       │
       └─ Sistem otomatis membuat:
            ├─ Order baru (tabel `order`)
            ├─ Relasi barang ke order (tabel `order_barang`)
            ├─ Catatan penyimpanan barang keluar (tabel `penyimpanan_barang`)
            ├─ Trek awal pengiriman (tabel `trek`)
            └─ Audit log
```

### Alur CRUD Data Master

```
┌─────────────┐    ┌─────────┐    ┌───────┐    ┌────────┐
│   Dashboard │    │ Barang  │    │ Kurir │    │ Gudang │
│ (ringkasan) │    │ (master)│    │(master)│    │(master)│
└─────────────┘    └─────────┘    └───────┘    └────────┘
                           \          |          /
                            \         |         /
                         ┌─────────────────────┐
                         │   PENGIRIMAN (Order) │
                         │  (relasi semua data) │
                         └─────────────────────┘
                                  |
                         ┌─────────────────────┐
                         │   Lacak Kiriman     │
                         │   (trek tracking)   │
                         └─────────────────────┘
                                  |
                         ┌─────────────────────┐
                         │   Penyimpanan       │
                         │   (log barang gudang)│
                         └─────────────────────┘
```

---

## Flow Database

### Entity Relationship Diagram (Relasi Antar Tabel)

```
customer ──┐
           │ 1
           ├────< order >──── 1 ── kurir
           │     │              │
           │     │ 1            │ 1
           │     │              │
           │  ┌──┴───┐         │
           │  │gudang│ (tujuan) │
           │  └──────┘         │
           │     │ 1           │
           │  ┌──┴─────────────┘
           │  │gudang_pengirim (asal)
           │  └──
           │
           │  order_barang ──── barang ──── penyimpanan_barang ──── gudang
           │        M             1               M                  1
           │        │                                                  │
           │        └──── order ←── 1 ── trek ────────────────────────┘
           │                                    M
           └──────────────────────────────────────────────────────────┘
```

### Struktur Tabel Utama

| Tabel | Keterangan |
| :--- | :--- |
| `customer` | Data pelanggan |
| `kurir` | Data kurir |
| `gudang` | Data gudang |
| `barang` | Master barang (independen, tidak terikat order) |
| `order` | Pengiriman — relasi ke customer, kurir, gudang_tujuan, gudang_pengirim |
| `order_barang` | Link table many-to-many order ↔ barang |
| `trek` | Riwayat lacak pengiriman per order |
| `penyimpanan_barang` | Catatan barang masuk/keluar gudang |
| `audit_log` | Log perubahan data semua tabel |
| `login` | User untuk autentikasi |

### Relasi Foreign Key

```
order.idpelanggan       → customer.idpelanggan       (CASCADE)
order.idkurir           → kurir.idkurir               (CASCADE)
order.idgudang          → gudang.idgudang             (CASCADE)
order.idgudang_pengirim → gudang.idgudang             (SET NULL)
trek.idpengiriman       → order.idpengiriman          (CASCADE)
order_barang.idpengiriman → order.idpengiriman        (CASCADE)
order_barang.idbarang   → barang.idbarang             (CASCADE)
penyimpanan_barang.idbarang → barang.idbarang         (CASCADE)
penyimpanan_barang.idgudang → gudang.idgudang         (CASCADE)
```

### API Endpoint Utama

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| POST | `/api/auth/login` | Login user |
| GET | `/api/dashboard` | Statistik dashboard |
| GET/POST | `/api/customers` | CRUD pelanggan |
| GET/POST | `/api/kurirs` | CRUD kurir |
| GET/POST | `/api/gudangs` | CRUD gudang |
| GET/POST | `/api/barangs` | CRUD master barang |
| GET/POST | `/api/orders` | CRUD pengiriman |
| PATCH | `/api/orders/:id/status` | Update status pengiriman |
| POST | `/api/pengiriman-terpadu` | Buat pengiriman + barang + penyimpanan + trek (1 transaksi) |
| GET/POST | `/api/treks` | CRUD trek |
| GET/POST | `/api/penyimpanans` | CRUD penyimpanan barang |
| GET/POST/DELETE | `/api/audit-logs` | CRUD audit log |

---

## Catatan

- Semua operasi CREATE/UPDATE/DELETE dicatat di tabel `audit_log` dengan data lama (`old_data`) dan data baru (`new_data`).
- Endpoint `POST /api/pengiriman-terpadu` menggunakan **database transaction** — rollback otomatis jika salah satu langkah gagal.
- Barang bersifat **master data independen** — bisa ditambahkan/dihapus tanpa terkait order. Hubungan barang ke order dijembatani tabel `order_barang`.
- Migration script (`migrate-db.js`) aman dijalankan berulang — hanya menambahkan yang belum ada.
- Frontend menggunakan **axios interceptor** untuk menyisipkan token JWT secara otomatis dari localStorage.
