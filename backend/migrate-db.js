const pool = require('./db');

async function migrateDb() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('Adding columns to `login`...');
    try { await conn.query('ALTER TABLE `login` ADD COLUMN `role` VARCHAR(50) DEFAULT \'Administrator\''); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `login` ADD COLUMN `name` VARCHAR(100) DEFAULT \'\''); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }

    console.log('Adding columns to `order`...');
    try { await conn.query('ALTER TABLE `order` ADD COLUMN `status` VARCHAR(50) DEFAULT \'Diproses\''); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `order` ADD COLUMN `total` DECIMAL(12,2) DEFAULT 0'); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `order` ADD COLUMN `idgudang_pengirim` INT(11) DEFAULT NULL'); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `order` ADD KEY `idgudang_pengirim` (`idgudang_pengirim`)'); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try {
      await conn.query('ALTER TABLE `order` ADD CONSTRAINT order_fk_gudang_pengirim FOREIGN KEY (idgudang_pengirim) REFERENCES gudang (idgudang) ON DELETE SET NULL');
    } catch (e) { if (!e.message.includes('Duplicate')) throw e; }

    console.log('Adding columns to `barang`...');
    try { await conn.query('ALTER TABLE `barang` ADD COLUMN `kategori` VARCHAR(100) DEFAULT \'Umum\''); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `barang` ADD COLUMN `status` VARCHAR(50) DEFAULT \'Tersedia\''); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `barang` ADD COLUMN `jumlah` INT DEFAULT 1'); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `barang` ADD COLUMN `harga` DECIMAL(12,2) DEFAULT 0'); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }

    console.log('Making `barang` independent (drop idpengiriman FK & column)...');
    const [fkRows] = await conn.query(`SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_NAME='barang' AND TABLE_SCHEMA='logistik_db' AND CONSTRAINT_TYPE='FOREIGN KEY'`);
    if (fkRows.length) {
      for (const fk of fkRows) {
        try { await conn.query(`ALTER TABLE \`barang\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``); } catch (e) { console.error('  FK drop warning:', e.message); }
      }
    }
    try { await conn.query('ALTER TABLE `barang` DROP COLUMN `idpengiriman`'); } catch (e) { if (!e.message.toLowerCase().includes('column')) throw e; }

    console.log('Creating `order_barang` table...');
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS order_barang (
          id INT(11) NOT NULL AUTO_INCREMENT,
          idpengiriman INT(11) NOT NULL,
          idbarang INT(11) NOT NULL,
          jumlah INT DEFAULT 1,
          PRIMARY KEY (id),
          KEY idpengiriman (idpengiriman),
          KEY idbarang (idbarang),
          CONSTRAINT ob_fk_order FOREIGN KEY (idpengiriman) REFERENCES \`order\`(idpengiriman) ON DELETE CASCADE,
          CONSTRAINT ob_fk_barang FOREIGN KEY (idbarang) REFERENCES barang(idbarang) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } catch (e) { console.error('order_barang table error:', e.message); }

    console.log('Adding columns to `penyimpanan_barang`...');
    try { await conn.query('ALTER TABLE `penyimpanan_barang` ADD COLUMN `jumlah_masuk` INT DEFAULT 1'); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `penyimpanan_barang` ADD COLUMN `jumlah_keluar` INT DEFAULT NULL'); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }

    console.log('Creating audit_log table...');
    try {
      await conn.query(`
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } catch (e) { console.error('audit_log table error:', e.message); }

    console.log('Updating stored procedures...');
    await conn.query('DROP PROCEDURE IF EXISTS `OrderDetail`');
    await conn.query(`
      CREATE PROCEDURE \`OrderDetail\`()
      BEGIN
          SELECT o.idpengiriman, c.nama AS nama_pelanggan, k.nama AS nama_kurir,
                 g.namagudang AS nama_gudang, o.nama_pengirim, o.no_hp_pengirim,
                 o.alamat_pengirim, o.estimasi_sampai, o.tanggalpengiriman,
                 o.status, o.total
          FROM \`order\` o
          JOIN customer c ON o.idpelanggan = c.idpelanggan
          JOIN kurir k ON o.idkurir = k.idkurir
          JOIN gudang g ON o.idgudang = g.idgudang;
      END
    `);

    await conn.query('DROP PROCEDURE IF EXISTS `BarangPelanggan`');
    await conn.query(`
      CREATE PROCEDURE \`BarangPelanggan\`()
      BEGIN
          SELECT b.* FROM barang b ORDER BY b.idbarang;
      END
    `);

    await conn.query('DROP PROCEDURE IF EXISTS `TrekDetail`');
    await conn.query(`
      CREATE PROCEDURE \`TrekDetail\`()
      BEGIN
          SELECT t.*, o.idpelanggan, c.nama AS nama_pelanggan
          FROM trek t
          JOIN \`order\` o ON t.idpengiriman = o.idpengiriman
          JOIN customer c ON o.idpelanggan = c.idpelanggan
          ORDER BY t.waktuupdate DESC;
      END
    `);

    await conn.query('DROP PROCEDURE IF EXISTS `PenyimpananDetail`');
    await conn.query(`
      CREATE PROCEDURE \`PenyimpananDetail\`()
      BEGIN
          SELECT p.idpenyimpanan, p.idbarang, p.idgudang, p.jumlah_masuk, p.jumlah_keluar,
                 p.waktu_masuk, p.waktu_keluar, b.nama_barang, g.namagudang
          FROM penyimpanan_barang p
          JOIN barang b ON p.idbarang = b.idbarang
          JOIN gudang g ON p.idgudang = g.idgudang
          ORDER BY p.waktu_masuk DESC;
      END
    `);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Migration completed successfully.');
    process.exitCode = 0;
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    conn.release();
  }
}

migrateDb();
