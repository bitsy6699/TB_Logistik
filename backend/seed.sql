-- ============================================================
-- LogistikApp — Database Setup + Seed Data for MySQL
-- Jalankan: mysql -u root -p < seed.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS logistik_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE logistik_db;

-- -----------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer (
  idpelanggan INT(11) NOT NULL AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  alamat TEXT NOT NULL,
  notelepon VARCHAR(20) NOT NULL,
  PRIMARY KEY (idpelanggan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kurir (
  idkurir INT(11) NOT NULL AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  notelepon VARCHAR(20) NOT NULL,
  kendaraan VARCHAR(50) NOT NULL,
  PRIMARY KEY (idkurir)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gudang (
  idgudang INT(11) NOT NULL AUTO_INCREMENT,
  namagudang VARCHAR(100) NOT NULL,
  alamat TEXT NOT NULL,
  kota VARCHAR(100) NOT NULL,
  PRIMARY KEY (idgudang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login (
  id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Administrator',
  name VARCHAR(100) DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order` (
  idpengiriman INT(11) NOT NULL AUTO_INCREMENT,
  idpelanggan INT(11) NOT NULL,
  idkurir INT(11) NOT NULL,
  idgudang INT(11) NOT NULL,
  nama_pengirim VARCHAR(100) NOT NULL,
  no_hp_pengirim VARCHAR(20) NOT NULL,
  alamat_pengirim TEXT NOT NULL,
  estimasi_sampai DATE NOT NULL,
  tanggalpengiriman DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Diproses',
  total DECIMAL(12,2) DEFAULT 0,
  PRIMARY KEY (idpengiriman),
  KEY idpelanggan (idpelanggan),
  KEY idkurir (idkurir),
  KEY idgudang (idgudang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS barang (
  idbarang INT(11) NOT NULL AUTO_INCREMENT,
  idpengiriman INT(11) NOT NULL,
  nama_barang VARCHAR(100) NOT NULL,
  berat DECIMAL(10,2) NOT NULL,
  kategori VARCHAR(100) DEFAULT 'Umum',
  status VARCHAR(50) DEFAULT 'Tersedia',
  PRIMARY KEY (idbarang),
  KEY idpengiriman (idpengiriman)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trek (
  idtrek INT(11) NOT NULL AUTO_INCREMENT,
  idpengiriman INT(11) NOT NULL,
  lokasiterakhir VARCHAR(255) NOT NULL,
  waktuupdate DATETIME NOT NULL,
  status VARCHAR(100) NOT NULL,
  PRIMARY KEY (idtrek),
  KEY idpengiriman (idpengiriman)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS penyimpanan_barang (
  idpenyimpanan INT(11) NOT NULL AUTO_INCREMENT,
  idbarang INT(11) NOT NULL,
  idgudang INT(11) NOT NULL,
  waktu_masuk DATETIME NOT NULL,
  waktu_keluar DATETIME DEFAULT NULL,
  PRIMARY KEY (idpenyimpanan),
  KEY idbarang (idbarang),
  KEY idgudang (idgudang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- FOREIGN KEYS
-- -----------------------------------------------------------

ALTER TABLE `order`
  ADD CONSTRAINT order_fk_pelanggan FOREIGN KEY (idpelanggan) REFERENCES customer (idpelanggan) ON DELETE CASCADE,
  ADD CONSTRAINT order_fk_kurir FOREIGN KEY (idkurir) REFERENCES kurir (idkurir) ON DELETE CASCADE,
  ADD CONSTRAINT order_fk_gudang FOREIGN KEY (idgudang) REFERENCES gudang (idgudang) ON DELETE CASCADE;

ALTER TABLE barang
  ADD CONSTRAINT barang_fk_order FOREIGN KEY (idpengiriman) REFERENCES `order` (idpengiriman) ON DELETE CASCADE;

ALTER TABLE trek
  ADD CONSTRAINT trek_fk_order FOREIGN KEY (idpengiriman) REFERENCES `order` (idpengiriman) ON DELETE CASCADE;

ALTER TABLE penyimpanan_barang
  ADD CONSTRAINT simpan_fk_barang FOREIGN KEY (idbarang) REFERENCES barang (idbarang) ON DELETE CASCADE,
  ADD CONSTRAINT simpan_fk_gudang FOREIGN KEY (idgudang) REFERENCES gudang (idgudang) ON DELETE CASCADE;

-- -----------------------------------------------------------
-- STORED PROCEDURES
-- -----------------------------------------------------------

DROP PROCEDURE IF EXISTS OrderDetail;
DELIMITER $$
CREATE PROCEDURE OrderDetail()
BEGIN
    SELECT o.idpengiriman, c.nama AS nama_pelanggan, k.nama AS nama_kurir,
           g.namagudang AS nama_gudang, o.nama_pengirim, o.no_hp_pengirim,
           o.alamat_pengirim, o.estimasi_sampai, o.tanggalpengiriman,
           o.status, o.total,
           (SELECT COUNT(*) FROM order_barang ob WHERE ob.idpengiriman = o.idpengiriman) AS jumlah_barang,
           (SELECT GROUP_CONCAT(b.nama_barang SEPARATOR ', ')
            FROM order_barang ob JOIN barang b ON ob.idbarang = b.idbarang
            WHERE ob.idpengiriman = o.idpengiriman) AS nama_barang
    FROM `order` o
    JOIN customer c ON o.idpelanggan = c.idpelanggan
    JOIN kurir k ON o.idkurir = k.idkurir
    JOIN gudang g ON o.idgudang = g.idgudang;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS BarangPelanggan;
DELIMITER $$
CREATE PROCEDURE BarangPelanggan()
BEGIN
    SELECT b.idbarang, b.idpengiriman, c.nama AS pelanggan, b.nama_barang,
           b.berat, g.namagudang AS lokasi, b.kategori, b.status
    FROM barang b
    JOIN `order` o ON b.idpengiriman = o.idpengiriman
    JOIN customer c ON o.idpelanggan = c.idpelanggan
    JOIN gudang g ON o.idgudang = g.idgudang;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS TrekDetail;
DELIMITER $$
CREATE PROCEDURE TrekDetail()
BEGIN
    SELECT t.*, o.idpelanggan, c.nama AS nama_pelanggan
    FROM trek t
    JOIN `order` o ON t.idpengiriman = o.idpengiriman
    JOIN customer c ON o.idpelanggan = c.idpelanggan
    ORDER BY t.waktuupdate DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS PenyimpananDetail;
DELIMITER $$
CREATE PROCEDURE PenyimpananDetail()
BEGIN
    SELECT p.*, b.nama_barang, g.namagudang
    FROM penyimpanan_barang p
    JOIN barang b ON p.idbarang = b.idbarang
    JOIN gudang g ON p.idgudang = g.idgudang
    ORDER BY p.waktu_masuk DESC;
END$$
DELIMITER ;

-- -----------------------------------------------------------
-- SEED DATA
-- -----------------------------------------------------------

-- Login (admin — password akan di-hash bcrypt saat login pertama)
INSERT INTO login (id, email, password, role, name) VALUES
(1, 'admin@admin.com', 'admin123', 'Administrator', 'Admin');

-- Customer
INSERT INTO customer (idpelanggan, nama, alamat, notelepon) VALUES
(1, 'Siti Aminah', 'Jl. Cempaka No. 10, Jakarta', '081234567890'),
(2, 'Budi Santoso', 'Jl. Merdeka No. 25, Bandung', '081234567891'),
(3, 'Citra Dewi', 'Jl. Kenanga No. 5, Surabaya', '081234567892');

-- Kurir
INSERT INTO kurir (idkurir, nama, notelepon, kendaraan) VALUES
(1, 'Ahmad Fauzi', '081212345678', 'Motor Box'),
(2, 'Doni Prasetyo', '081312345679', 'Mobil Pickup'),
(3, 'Eko Saputra', '081412345680', 'Motor Box');

-- Gudang
INSERT INTO gudang (idgudang, namagudang, alamat, kota) VALUES
(1, 'Gudang Utama Jakarta', 'Jl. Industri Raya No. 88, Jakarta', 'Jakarta'),
(2, 'Gudang Bandung', 'Jl. Soekarno-Hatta No. 120, Bandung', 'Bandung'),
(3, 'Gudang Surabaya', 'Jl. Raya Surabaya No. 45, Surabaya', 'Surabaya');

-- Order (mengacu ke customer, kurir, gudang di atas)
INSERT INTO `order` (idpengiriman, idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status, total) VALUES
(1, 1, 1, 1, 'Siti Aminah', '081234567890', 'Jl. Cempaka No. 10, Jakarta', '2026-06-24', '2026-06-21', 'Diproses', 150000.00),
(2, 2, 2, 2, 'Budi Santoso', '081234567891', 'Jl. Merdeka No. 25, Bandung', '2026-06-25', '2026-06-22', 'Diproses', 250000.00);

-- Barang (mengacu ke order di atas)
INSERT INTO barang (idbarang, idpengiriman, nama_barang, berat, kategori, status) VALUES
(1, 1, 'Karton Lipat', 5.00, 'Kemasan', 'Tersedia'),
(2, 1, 'Bubble Wrap', 2.00, 'Perlindungan', 'Tersedia'),
(3, 2, 'Label Barcode', 0.50, 'Dokumen', 'Tersedia');

-- Trek (mengacu ke order di atas)
INSERT INTO trek (idtrek, idpengiriman, lokasiterakhir, waktuupdate, status) VALUES
(1, 1, 'Jakarta - Gudang Utama', NOW(), 'Dalam perjalanan'),
(2, 2, 'Bandung - Gudang Transit', NOW(), 'Diproses');

-- Penyimpanan Barang (mengacu ke barang dan gudang di atas)
INSERT INTO penyimpanan_barang (idpenyimpanan, idbarang, idgudang, waktu_masuk, waktu_keluar) VALUES
(1, 1, 1, NOW(), NULL),
(2, 2, 1, NOW(), NULL),
(3, 3, 2, NOW(), NULL);
