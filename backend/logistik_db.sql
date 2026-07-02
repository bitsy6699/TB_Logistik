-- ============================================================
-- LogistikApp — Full MySQL Schema + Stored Procedures + Seed Data
-- Jalankan: mysql -u root -p < logistik_db.sql
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

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
  idkurir INT(11) DEFAULT NULL,
  idpelanggan INT(11) DEFAULT NULL,
  idpengirim INT(11) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order` (
  idpengiriman INT(11) NOT NULL AUTO_INCREMENT,
  idpelanggan INT(11) NOT NULL,
  idkurir INT(11) DEFAULT NULL,
  idgudang INT(11) DEFAULT NULL,
  idgudang_pengirim INT(11) DEFAULT NULL,
  nama_pengirim VARCHAR(100) NOT NULL,
  no_hp_pengirim VARCHAR(20) NOT NULL,
  alamat_pengirim TEXT NOT NULL,
  estimasi_sampai DATE NOT NULL,
  tanggalpengiriman DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Diproses',
  total DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  PRIMARY KEY (idpengiriman),
  KEY idpelanggan (idpelanggan),
  KEY idkurir (idkurir),
  KEY idgudang (idgudang),
  KEY idgudang_pengirim (idgudang_pengirim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS barang (
  idbarang INT(11) NOT NULL AUTO_INCREMENT,
  nama_barang VARCHAR(100) NOT NULL,
  jumlah INT(11) DEFAULT 1,
  berat DECIMAL(10,2) NOT NULL,
  harga DECIMAL(12,2) DEFAULT 0.00,
  kategori VARCHAR(100) DEFAULT 'Umum',
  idpengirim INT(11) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Tersedia',
  PRIMARY KEY (idbarang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Pengirim ──

CREATE TABLE IF NOT EXISTS pengirim (
  idpengirim INT(11) NOT NULL AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  alamat TEXT,
  notelepon VARCHAR(20),
  PRIMARY KEY (idpengirim)
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

CREATE TABLE IF NOT EXISTS order_barang (
  id INT(11) NOT NULL AUTO_INCREMENT,
  idpengiriman INT(11) NOT NULL,
  idbarang INT(11) NOT NULL,
  jumlah INT DEFAULT 1,
  seller_confirmed TINYINT(1) DEFAULT 0,
  confirmed_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idpengiriman (idpengiriman),
  KEY idbarang (idbarang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS penyimpanan_barang (
  idpenyimpanan INT(11) NOT NULL AUTO_INCREMENT,
  idbarang INT(11) NOT NULL,
  idgudang INT(11) NOT NULL,
  jumlah_masuk INT DEFAULT 1,
  jumlah_keluar INT DEFAULT NULL,
  waktu_masuk DATETIME NOT NULL,
  waktu_keluar DATETIME DEFAULT NULL,
  PRIMARY KEY (idpenyimpanan),
  KEY idbarang (idbarang),
  KEY idgudang (idgudang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  id INT(11) NOT NULL AUTO_INCREMENT,
  table_name VARCHAR(100) NOT NULL,
  record_id INT(11) DEFAULT NULL,
  action VARCHAR(50) NOT NULL,
  old_data JSON DEFAULT NULL,
  new_data JSON DEFAULT NULL,
  user_id INT(11) DEFAULT NULL,
  user_name VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- FOREIGN KEYS
-- -----------------------------------------------------------

ALTER TABLE `order`
  ADD CONSTRAINT order_fk_pelanggan FOREIGN KEY (idpelanggan) REFERENCES customer (idpelanggan) ON DELETE CASCADE,
  ADD CONSTRAINT order_fk_kurir FOREIGN KEY (idkurir) REFERENCES kurir (idkurir) ON DELETE CASCADE,
  ADD CONSTRAINT order_fk_gudang FOREIGN KEY (idgudang) REFERENCES gudang (idgudang) ON DELETE CASCADE,
  ADD CONSTRAINT order_fk_gudang_pengirim FOREIGN KEY (idgudang_pengirim) REFERENCES gudang (idgudang) ON DELETE SET NULL;

ALTER TABLE trek
  ADD CONSTRAINT trek_fk_order FOREIGN KEY (idpengiriman) REFERENCES `order` (idpengiriman) ON DELETE CASCADE;

ALTER TABLE order_barang
  ADD CONSTRAINT ob_fk_order FOREIGN KEY (idpengiriman) REFERENCES `order` (idpengiriman) ON DELETE CASCADE,
  ADD CONSTRAINT ob_fk_barang FOREIGN KEY (idbarang) REFERENCES barang (idbarang) ON DELETE CASCADE;

ALTER TABLE penyimpanan_barang
  ADD CONSTRAINT simpan_fk_barang FOREIGN KEY (idbarang) REFERENCES barang (idbarang) ON DELETE CASCADE,
  ADD CONSTRAINT simpan_fk_gudang FOREIGN KEY (idgudang) REFERENCES gudang (idgudang) ON DELETE CASCADE;

ALTER TABLE login
  ADD CONSTRAINT login_fk_kurir FOREIGN KEY (idkurir) REFERENCES kurir (idkurir) ON DELETE SET NULL,
  ADD CONSTRAINT login_fk_pelanggan FOREIGN KEY (idpelanggan) REFERENCES customer (idpelanggan) ON DELETE SET NULL,
  ADD CONSTRAINT login_fk_pengirim FOREIGN KEY (idpengirim) REFERENCES pengirim (idpengirim) ON DELETE SET NULL;

ALTER TABLE barang
  ADD CONSTRAINT barang_fk_pengirim FOREIGN KEY (idpengirim) REFERENCES pengirim (idpengirim) ON DELETE SET NULL;

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
    SELECT b.* FROM barang b ORDER BY b.idbarang;
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
    SELECT p.idpenyimpanan, p.idbarang, p.idgudang, p.jumlah_masuk, p.jumlah_keluar,
           p.waktu_masuk, p.waktu_keluar, b.nama_barang, g.namagudang
    FROM penyimpanan_barang p
    JOIN barang b ON p.idbarang = b.idbarang
    JOIN gudang g ON p.idgudang = g.idgudang
    ORDER BY p.waktu_masuk DESC;
END$$
DELIMITER ;

-- -----------------------------------------------------------
-- SEED DATA
-- -----------------------------------------------------------

INSERT INTO login (id, email, password, role, name, idkurir, idpelanggan, idpengirim) VALUES
(1, 'admin@admin.com', 'admin123', 'Administrator', 'Admin', NULL, NULL, NULL),
(2, 'kurir1@kurir.com', 'kurir123', 'Kurir', 'Ahmad Fauzi', 1, NULL, NULL),
(3, 'kurir2@kurir.com', 'kurir123', 'Kurir', 'Doni Prasetyo', 2, NULL, NULL),
(4, 'siti@email.com', 'pelanggan123', 'Pelanggan', 'Siti Aminah', NULL, 1, NULL),
(5, 'budi@email.com', 'pelanggan123', 'Pelanggan', 'Budi Santoso', NULL, 2, NULL),
(6, 'citra@email.com', 'pelanggan123', 'Pelanggan', 'Citra Dewi', NULL, 3, NULL),
(7, 'pengirim1@email.com', 'pengirim123', 'Pengirim', 'PT Sumber Makmur', NULL, NULL, 1),
(8, 'pengirim2@email.com', 'pengirim123', 'Pengirim', 'CV Berkah Jaya', NULL, NULL, 2)
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO customer (idpelanggan, nama, alamat, notelepon) VALUES
(1, 'Siti Aminah', 'Jl. Cempaka No. 10, Jakarta', '081234567890'),
(2, 'Budi Santoso', 'Jl. Merdeka No. 25, Bandung', '081234567891'),
(3, 'Citra Dewi', 'Jl. Kenanga No. 5, Surabaya', '081234567892');

INSERT INTO kurir (idkurir, nama, notelepon, kendaraan) VALUES
(1, 'Ahmad Fauzi', '081212345678', 'Motor Box'),
(2, 'Doni Prasetyo', '081312345679', 'Mobil Pickup'),
(3, 'Eko Saputra', '081412345680', 'Motor Box');

INSERT INTO pengirim (idpengirim, nama, alamat, notelepon) VALUES
(1, 'PT Sumber Makmur', 'Jl. Gatot Subroto No. 99, Jakarta', '021-12345678'),
(2, 'CV Berkah Jaya', 'Jl. Diponegoro No. 45, Bandung', '022-87654321');

INSERT INTO gudang (idgudang, namagudang, alamat, kota) VALUES
(1, 'Gudang Utama Jakarta', 'Jl. Industri Raya No. 88, Jakarta', 'Jakarta'),
(2, 'Gudang Bandung', 'Jl. Soekarno-Hatta No. 120, Bandung', 'Bandung'),
(3, 'Gudang Surabaya', 'Jl. Raya Surabaya No. 45, Surabaya', 'Surabaya');

INSERT INTO `order` (idpengiriman, idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status, total) VALUES
(1, 1, 1, 1, 'Siti Aminah', '081234567890', 'Jl. Cempaka No. 10, Jakarta', '2026-06-24', '2026-06-21', 'Diproses', 150000.00),
(2, 2, 2, 2, 'Budi Santoso', '081234567891', 'Jl. Merdeka No. 25, Bandung', '2026-06-25', '2026-06-22', 'Diproses', 250000.00);

INSERT INTO barang (idbarang, nama_barang, jumlah, berat, harga, kategori, status) VALUES
(1, 'Karton Lipat', 50, 5.00, 5000, 'Kemasan', 'Tersedia'),
(2, 'Bubble Wrap', 100, 2.00, 2500, 'Perlindungan', 'Tersedia'),
(3, 'Label Barcode', 200, 0.50, 1000, 'Dokumen', 'Tersedia');

INSERT INTO trek (idtrek, idpengiriman, lokasiterakhir, waktuupdate, status) VALUES
(1, 1, 'Jakarta - Gudang Utama', NOW(), 'Dalam perjalanan'),
(2, 2, 'Bandung - Gudang Transit', NOW(), 'Diproses');

INSERT INTO penyimpanan_barang (idpenyimpanan, idbarang, idgudang, waktu_masuk, waktu_keluar) VALUES
(1, 1, 1, NOW(), NULL),
(2, 2, 1, NOW(), NULL),
(3, 3, 2, NOW(), NULL);

COMMIT;
