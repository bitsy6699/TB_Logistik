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

    console.log('Adding columns to `barang`...');
    try { await conn.query('ALTER TABLE `barang` ADD COLUMN `kategori` VARCHAR(100) DEFAULT \'Umum\''); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    try { await conn.query('ALTER TABLE `barang` ADD COLUMN `status` VARCHAR(50) DEFAULT \'Tersedia\''); } catch (e) { if (!e.message.includes('Duplicate')) throw e; }

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
          SELECT b.idbarang, b.idpengiriman, c.nama AS pelanggan, b.nama_barang,
                 b.berat, g.namagudang AS lokasi, b.kategori, b.status
          FROM barang b
          JOIN \`order\` o ON b.idpengiriman = o.idpengiriman
          JOIN customer c ON o.idpelanggan = c.idpelanggan
          JOIN gudang g ON o.idgudang = g.idgudang;
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
          SELECT p.*, b.nama_barang, g.namagudang
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
