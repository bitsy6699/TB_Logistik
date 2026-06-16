-- Tables-only schema for MySQL 8.0 (no stored procedures)
-- Original: logistik_db.sql (MariaDB dump)
-- Use: import via Node.js script or mysql client

-- Table structure for table `barang`
CREATE TABLE IF NOT EXISTS `barang` (
  `idbarang` int(11) NOT NULL,
  `idpengiriman` int(11) NOT NULL,
  `nama_barang` varchar(100) NOT NULL,
  `berat` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `customer`
CREATE TABLE IF NOT EXISTS `customer` (
  `idpelanggan` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `alamat` text NOT NULL,
  `notelepon` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `gudang`
CREATE TABLE IF NOT EXISTS `gudang` (
  `idgudang` int(11) NOT NULL,
  `namagudang` varchar(100) NOT NULL,
  `alamat` text NOT NULL,
  `kota` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `kurir`
CREATE TABLE IF NOT EXISTS `kurir` (
  `idkurir` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `notelepon` varchar(20) NOT NULL,
  `kendaraan` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `login`
CREATE TABLE IF NOT EXISTS `login` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `order`
CREATE TABLE IF NOT EXISTS `order` (
  `idpengiriman` int(11) NOT NULL,
  `idpelanggan` int(11) NOT NULL,
  `idkurir` int(11) NOT NULL,
  `idgudang` int(11) NOT NULL,
  `nama_pengirim` varchar(100) NOT NULL,
  `no_hp_pengirim` varchar(20) NOT NULL,
  `alamat_pengirim` text NOT NULL,
  `estimasi_sampai` date NOT NULL,
  `tanggalpengiriman` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `penyimpanan_barang`
CREATE TABLE IF NOT EXISTS `penyimpanan_barang` (
  `idpenyimpanan` int(11) NOT NULL,
  `idbarang` int(11) NOT NULL,
  `idgudang` int(11) NOT NULL,
  `waktu_masuk` datetime NOT NULL,
  `waktu_keluar` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `trek`
CREATE TABLE IF NOT EXISTS `trek` (
  `idtrek` int(11) NOT NULL,
  `idpengiriman` int(11) NOT NULL,
  `lokasiterakhir` varchar(255) NOT NULL,
  `waktuupdate` datetime NOT NULL,
  `status` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Indexes
ALTER TABLE `barang`
  ADD PRIMARY KEY (`idbarang`),
  ADD KEY `idpengiriman` (`idpengiriman`);

ALTER TABLE `customer`
  ADD PRIMARY KEY (`idpelanggan`);

ALTER TABLE `gudang`
  ADD PRIMARY KEY (`idgudang`);

ALTER TABLE `kurir`
  ADD PRIMARY KEY (`idkurir`);

ALTER TABLE `login`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `order`
  ADD PRIMARY KEY (`idpengiriman`),
  ADD KEY `idpelanggan` (`idpelanggan`),
  ADD KEY `idkurir` (`idkurir`),
  ADD KEY `idgudang` (`idgudang`);

ALTER TABLE `penyimpanan_barang`
  ADD PRIMARY KEY (`idpenyimpanan`),
  ADD KEY `idbarang` (`idbarang`),
  ADD KEY `idgudang` (`idgudang`);

ALTER TABLE `trek`
  ADD PRIMARY KEY (`idtrek`),
  ADD KEY `idpengiriman` (`idpengiriman`);

-- AUTO_INCREMENT
ALTER TABLE `barang`
  MODIFY `idbarang` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `customer`
  MODIFY `idpelanggan` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `gudang`
  MODIFY `idgudang` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `kurir`
  MODIFY `idkurir` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `order`
  MODIFY `idpengiriman` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `penyimpanan_barang`
  MODIFY `idpenyimpanan` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `trek`
  MODIFY `idtrek` int(11) NOT NULL AUTO_INCREMENT;

-- Foreign keys
ALTER TABLE `barang`
  ADD CONSTRAINT `barang_ibfk_1` FOREIGN KEY (`idpengiriman`) REFERENCES `order` (`idpengiriman`) ON DELETE CASCADE;

ALTER TABLE `order`
  ADD CONSTRAINT `order_ibfk_1` FOREIGN KEY (`idpelanggan`) REFERENCES `customer` (`idpelanggan`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_ibfk_2` FOREIGN KEY (`idkurir`) REFERENCES `kurir` (`idkurir`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_ibfk_3` FOREIGN KEY (`idgudang`) REFERENCES `gudang` (`idgudang`) ON DELETE CASCADE;

ALTER TABLE `penyimpanan_barang`
  ADD CONSTRAINT `penyimpanan_barang_ibfk_1` FOREIGN KEY (`idbarang`) REFERENCES `barang` (`idbarang`) ON DELETE CASCADE,
  ADD CONSTRAINT `penyimpanan_barang_ibfk_2` FOREIGN KEY (`idgudang`) REFERENCES `gudang` (`idgudang`) ON DELETE CASCADE;

ALTER TABLE `trek`
  ADD CONSTRAINT `trek_ibfk_1` FOREIGN KEY (`idpengiriman`) REFERENCES `order` (`idpengiriman`) ON DELETE CASCADE;
