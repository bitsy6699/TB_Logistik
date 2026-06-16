-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 13, 2026 at 04:53 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `logistik_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `BarangPelanggan` ()   BEGIN
    SELECT b.idbarang, b.idpengiriman, c.nama AS pelanggan, b.nama_barang, b.berat 
    FROM barang b
    JOIN `order` o ON b.idpengiriman = o.idpengiriman
    JOIN customer c ON o.idpelanggan = c.idpelanggan;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `OrderDetail` ()   BEGIN
    SELECT o.idpengiriman, c.nama AS nama_pelanggan, k.nama AS nama_kurir, g.namagudang AS nama_gudang, 
           o.nama_pengirim, o.no_hp_pengirim, o.alamat_pengirim, o.estimasi_sampai, o.tanggalpengiriman
    FROM `order` o
    JOIN customer c ON o.idpelanggan = c.idpelanggan
    JOIN kurir k ON o.idkurir = k.idkurir
    JOIN gudang g ON o.idgudang = g.idgudang;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Penyimpanan` ()   BEGIN
    SELECT p.idpenyimpanan, b.nama_barang, g.namagudang, p.waktu_masuk, p.waktu_keluar 
    FROM penyimpanan_barang p
    JOIN barang b ON p.idbarang = b.idbarang
    JOIN gudang g ON p.idgudang = g.idgudang;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `barang`
--

CREATE TABLE `barang` (
  `idbarang` int(11) NOT NULL,
  `idpengiriman` int(11) NOT NULL,
  `nama_barang` varchar(100) NOT NULL,
  `berat` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `idpelanggan` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `alamat` text NOT NULL,
  `notelepon` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gudang`
--

CREATE TABLE `gudang` (
  `idgudang` int(11) NOT NULL,
  `namagudang` varchar(100) NOT NULL,
  `alamat` text NOT NULL,
  `kota` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kurir`
--

CREATE TABLE `kurir` (
  `idkurir` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `notelepon` varchar(20) NOT NULL,
  `kendaraan` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login`
--

CREATE TABLE `login` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login`
--

INSERT INTO `login` (`id`, `email`, `password`) VALUES
(1, 'admin@admin.com', 'admin123');

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
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

-- --------------------------------------------------------

--
-- Table structure for table `penyimpanan_barang`
--

CREATE TABLE `penyimpanan_barang` (
  `idpenyimpanan` int(11) NOT NULL,
  `idbarang` int(11) NOT NULL,
  `idgudang` int(11) NOT NULL,
  `waktu_masuk` datetime NOT NULL,
  `waktu_keluar` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trek`
--

CREATE TABLE `trek` (
  `idtrek` int(11) NOT NULL,
  `idpengiriman` int(11) NOT NULL,
  `lokasiterakhir` varchar(255) NOT NULL,
  `waktuupdate` datetime NOT NULL,
  `status` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_order_customer`
-- (See below for the actual view)
--
CREATE TABLE `view_order_customer` (
`idpengiriman` int(11)
,`idpelanggan` int(11)
,`idkurir` int(11)
,`idgudang` int(11)
,`tanggalpengiriman` date
,`nama_pelanggan` varchar(100)
,`alamat_pelanggan` text
,`notelepon_pelanggan` varchar(20)
,`kota_pelanggan` varchar(100)
,`kota_pengirim` varchar(100)
);

-- --------------------------------------------------------

--
-- Structure for view `view_order_customer`
--
DROP TABLE IF EXISTS `view_order_customer`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_order_customer`  AS SELECT `o`.`idpengiriman` AS `idpengiriman`, `o`.`idpelanggan` AS `idpelanggan`, `o`.`idkurir` AS `idkurir`, `o`.`idgudang` AS `idgudang`, `o`.`tanggalpengiriman` AS `tanggalpengiriman`, `c`.`nama` AS `nama_pelanggan`, `c`.`alamat` AS `alamat_pelanggan`, `c`.`notelepon` AS `notelepon_pelanggan`, `g`.`kota` AS `kota_pelanggan`, `g2`.`kota` AS `kota_pengirim` FROM (((`order` `o` join `customer` `c` on(`o`.`idpelanggan` = `c`.`idpelanggan`)) left join `gudang` `g` on(`c`.`alamat` like concat('%',`g`.`kota`,'%'))) left join `gudang` `g2` on(`o`.`alamat_pengirim` like concat('%',`g2`.`kota`,'%'))) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `barang`
--
ALTER TABLE `barang`
  ADD PRIMARY KEY (`idbarang`),
  ADD KEY `idpengiriman` (`idpengiriman`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`idpelanggan`);

--
-- Indexes for table `gudang`
--
ALTER TABLE `gudang`
  ADD PRIMARY KEY (`idgudang`);

--
-- Indexes for table `kurir`
--
ALTER TABLE `kurir`
  ADD PRIMARY KEY (`idkurir`);

--
-- Indexes for table `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`idpengiriman`),
  ADD KEY `idpelanggan` (`idpelanggan`),
  ADD KEY `idkurir` (`idkurir`),
  ADD KEY `idgudang` (`idgudang`);

--
-- Indexes for table `penyimpanan_barang`
--
ALTER TABLE `penyimpanan_barang`
  ADD PRIMARY KEY (`idpenyimpanan`),
  ADD KEY `idbarang` (`idbarang`),
  ADD KEY `idgudang` (`idgudang`);

--
-- Indexes for table `trek`
--
ALTER TABLE `trek`
  ADD PRIMARY KEY (`idtrek`),
  ADD KEY `idpengiriman` (`idpengiriman`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `barang`
--
ALTER TABLE `barang`
  MODIFY `idbarang` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `idpelanggan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gudang`
--
ALTER TABLE `gudang`
  MODIFY `idgudang` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kurir`
--
ALTER TABLE `kurir`
  MODIFY `idkurir` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login`
--
ALTER TABLE `login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order`
--
ALTER TABLE `order`
  MODIFY `idpengiriman` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penyimpanan_barang`
--
ALTER TABLE `penyimpanan_barang`
  MODIFY `idpenyimpanan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trek`
--
ALTER TABLE `trek`
  MODIFY `idtrek` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `barang`
--
ALTER TABLE `barang`
  ADD CONSTRAINT `barang_ibfk_1` FOREIGN KEY (`idpengiriman`) REFERENCES `order` (`idpengiriman`) ON DELETE CASCADE;

--
-- Constraints for table `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `order_ibfk_1` FOREIGN KEY (`idpelanggan`) REFERENCES `customer` (`idpelanggan`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_ibfk_2` FOREIGN KEY (`idkurir`) REFERENCES `kurir` (`idkurir`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_ibfk_3` FOREIGN KEY (`idgudang`) REFERENCES `gudang` (`idgudang`) ON DELETE CASCADE;

--
-- Constraints for table `penyimpanan_barang`
--
ALTER TABLE `penyimpanan_barang`
  ADD CONSTRAINT `penyimpanan_barang_ibfk_1` FOREIGN KEY (`idbarang`) REFERENCES `barang` (`idbarang`) ON DELETE CASCADE,
  ADD CONSTRAINT `penyimpanan_barang_ibfk_2` FOREIGN KEY (`idgudang`) REFERENCES `gudang` (`idgudang`) ON DELETE CASCADE;

--
-- Constraints for table `trek`
--
ALTER TABLE `trek`
  ADD CONSTRAINT `trek_ibfk_1` FOREIGN KEY (`idpengiriman`) REFERENCES `order` (`idpengiriman`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
