# 📦 LogistikApp - Sistem Manajemen Logistik dan Pengiriman

Sistem informasi manajemen logistik berbasis fullstack web application untuk mencatat data pelanggan, mengelola kurir, memantau gudang penyimpanan, serta melihat daftar barang dan status pengiriman (order). Aplikasi ini dilengkapi dengan sistem login multi-role dan mode database fleksibel (dapat dijalankan dengan MySQL maupun in-memory Mock Store).

---

## ✨ Fitur Utama

- **📊 Dashboard**: Ringkasan data statistik aplikasi (jumlah pelanggan, kurir, gudang, pengiriman, dan barang).
- **👥 Manajemen Pelanggan (Customers)**: Pencatatan identitas pelanggan beserta alamat dan nomor telepon (mendukung Lihat dan Tambah).
- **🛵 Manajemen Kurir (Couriers)**: Pencatatan data kurir pengirim beserta tipe kendaraan yang digunakan (mendukung Lihat dan Tambah).
- **🏢 Manajemen Gudang (Warehouses)**: Pengelolaan gudang penyimpanan barang logistik yang tersebar di berbagai kota (mendukung Lihat dan Tambah).
- **🚚 Manajemen Pengiriman (Orders)**: Pembuatan transaksi pengiriman baru dengan merelasikan data Pelanggan, Kurir, dan Gudang secara dinamis (mendukung Lihat dan Tambah).
- **📦 Manajemen Barang (Items)**: Penambahan inventori barang logistik lengkap dengan beratnya yang dikaitkan ke rincian transaksi pengiriman (mendukung Lihat dan Tambah).
- **🔑 Keamanan & Multi-Role**: Sistem login terproteksi (Protected Routes) dengan integrasi tabel `login` MySQL atau fallback dummy store.
- **💾 Mode Database Fleksibel**: Dapat dijalankan langsung menggunakan basis data MySQL lokal atau mode in-memory (dummy) tanpa memerlukan konfigurasi database eksternal.

---

## 🛠️ Teknologi yang Digunakan

### Frontend

- **React.js** (Vite)
- **React Router DOM** (v6) untuk routing halaman
- **Tailwind CSS** untuk antarmuka responsif dan modern
- **Axios** untuk komunikasi data HTTP dengan server

### Backend & Database

- **Node.js** & **Express.js** untuk REST API server
- **MySQL** (driver `mysql2`) sebagai sistem basis data utama
- **In-Memory Dummy Database** (`dummy-db.json`) untuk pengujian cepat tanpa database lokal
- **dotenv** untuk manajemen konfigurasi environment variables

---

## 📁 Struktur Proyek

```text
LogistikApp/
├── backend/
│   ├── .env                 # File konfigurasi environment variables
│   ├── db.js                # Koneksi database MySQL
│   ├── dummy-db.json        # Database lokal cadangan (mode dummy)
│   ├── dummyStore.js        # Logika pembacaan & penulisan data dummy
│   ├── logistik_db.sql      # Skema database MySQL dan stored procedures
│   ├── package.json         # Dependensi backend
│   └── server.js            # Entry point Express API Server
│
├── frontend/
│   ├── index.html           # File template utama HTML
│   ├── package.json         # Dependensi frontend
│   ├── tailwind.config.js   # Konfigurasi Tailwind CSS
│   ├── vite.config.js       # Konfigurasi Vite
│   └── src/
│       ├── App.jsx          # Konfigurasi router utama React
│       ├── main.jsx         # Entry point React DOM
│       ├── index.css        # Entry style Tailwind
│       ├── components/      # Komponen pakai ulang (Layout, ProtectedRoute, dll.)
│       ├── context/         # AuthContext untuk status login user
│       └── pages/           # Halaman utama aplikasi (Dashboard, Customers, dll.)
└── README.md                # Dokumentasi proyek (file ini)
```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### Prerequisites

Pastikan Anda sudah menginstal **Node.js** dan **npm** di komputer Anda.

---

### 1. Konfigurasi Backend

Masuk ke folder `backend`:

```bash
cd backend
```

Instal dependensi backend:

```bash
npm install
```

Salin atau buat file konfigurasi `.env` di dalam folder `backend/`:

```ini
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=logistik_db
USE_MYSQL=false   # Ubah ke true jika ingin menggunakan MySQL database
PORT=5001
```

#### Pengaturan Basis Data (MySQL)

Jika Anda mengatur `USE_MYSQL=true`:

1. Buat database baru bernama `logistik_db` di server MySQL Anda (misal: phpMyAdmin/MariaDB).
2. Import berkas `backend/logistik_db.sql` untuk membuat tabel, relasi, stored procedures, serta memuat data awal.
3. Sesuaikan `DB_USER` dan `DB_PASSWORD` di `.env` dengan credential server MySQL Anda.

#### Menjalankan Server Backend:

```bash
npm start
```

Server backend akan berjalan di http://localhost:5001.

---

### 2. Konfigurasi Frontend

Buka terminal baru dan masuk ke folder `frontend`:

```bash
cd frontend
```

Instal dependensi frontend:

```bash
npm install
```

#### Menjalankan Server Frontend (Development Mode):

```bash
npm run dev
```

Secara default, Vite akan menjalankan frontend di http://localhost:5173.

---

## 🔑 Akun Login Pengujian

Gunakan akun di bawah ini untuk masuk ke dalam aplikasi dashboard:

### 1. Jika `USE_MYSQL=true` (Autentikasi MySQL)

Data dibaca langsung dari tabel `login` di database MySQL:

| Email / Username    | Password   | Role              | Keterangan                          |
| :------------------ | :--------- | :---------------- | :---------------------------------- |
| **admin@admin.com** | `admin123` | **Administrator** | Akun default di MySQL `logistik_db` |

### 2. Jika `USE_MYSQL=false` (Autentikasi Dummy/Fallback)

Data dibaca dari file lokal `dummy-db.json`:

| Username     | Password      | Role              | Deskripsi                 |
| :----------- | :------------ | :---------------- | :------------------------ |
| **admin**    | `admin123`    | **Administrator** | Akses penuh seluruh fitur |
| **operator** | `operator123` | **Operator**      | Akses terbatas            |

---

## 📝 Catatan Penting

- Saat menggunakan mode `USE_MYSQL=false`, semua perubahan data akan disimpan sementara ke dalam file `backend/dummy-db.json`.
- Dalam mode `USE_MYSQL=true`, data disimpan secara permanen ke dalam tabel MySQL. Form transaksi pengiriman (order) dan barang akan otomatis memvalidasi relasi _Foreign Key_ ke tabel `customer`, `kurir`, dan `gudang`.
