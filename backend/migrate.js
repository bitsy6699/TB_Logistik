const pool = require('./db');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataPath = path.join(__dirname, 'dummy-db.json');
const raw = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(raw);

const hashPassword = (value) => crypto.createHash('sha256').update(value).digest('hex');

function normalizeText(value) {
  return String(value ?? '').trim();
}

function toDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

function mapOrderItemToOrderId(item, orders, customers) {
  const customerName = item.pelanggan;
  const matchingOrder = orders.find((o) => {
    const cust = customers.find((c) => c.idpelanggan === o.idpelanggan);
    return cust && cust.nama === customerName;
  });
  return matchingOrder ? Number(String(matchingOrder.idpengiriman).replace('ORD-', '')) : null;
}

async function migrate() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    await connection.query('TRUNCATE TABLE barang');
    await connection.query('TRUNCATE TABLE `order`');
    await connection.query('TRUNCATE TABLE login');
    await connection.query('TRUNCATE TABLE gudang');
    await connection.query('TRUNCATE TABLE kurir');
    await connection.query('TRUNCATE TABLE customer');
    await connection.query('TRUNCATE TABLE penyimpanan_barang');
    await connection.query('TRUNCATE TABLE trek');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 1. customer
    const custSql = 'INSERT INTO customer (idpelanggan, nama, alamat, notelepon) VALUES (?, ?, ?, ?)';
    for (const c of data.customers) {
      await connection.query(custSql, [c.idpelanggan, normalizeText(c.nama), normalizeText(c.alamat), normalizeText(c.notelepon)]);
    }
    console.log(`[migrate] customer: inserted ${data.customers.length} rows`);

    // 2. kurir
    const kurirSql = 'INSERT INTO kurir (idkurir, nama, notelepon, kendaraan) VALUES (?, ?, ?, ?)';
    for (const k of data.couriers) {
      await connection.query(kurirSql, [k.idkurir, normalizeText(k.nama), normalizeText(k.notelepon), normalizeText(k.kendaraan)]);
    }
    console.log(`[migrate] kurir: inserted ${data.couriers.length} rows`);

    // 3. gudang
    const gudangSql = 'INSERT INTO gudang (idgudang, namagudang, alamat, kota) VALUES (?, ?, ?, ?)';
    for (const g of data.warehouses) {
      await connection.query(gudangSql, [g.idgudang, normalizeText(g.namagudang), normalizeText(g.alamat), normalizeText(g.kota)]);
    }
    console.log(`[migrate] gudang: inserted ${data.warehouses.length} rows`);

    // 4. login (plaintext - will be upgraded to bcrypt on first login)
    const loginSql = 'INSERT INTO login (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)';
    for (const u of data.users) {
      await connection.query(loginSql, [u.id, normalizeText(u.username), normalizeText(u.password), u.role || 'Administrator', u.name || '']);
    }
    console.log(`[migrate] login: inserted ${data.users.length} rows`);

    // 5. order
    const nameToCustomerId = new Map(data.customers.map((c) => [c.nama, c.idpelanggan]));
    const nameToKurirId = new Map(data.couriers.map((k) => [k.nama, k.idkurir]));
    const nameToGudangId = new Map(data.warehouses.map((g) => [g.namagudang, g.idgudang]));

    const orderSql = 'INSERT INTO `order` (idpengiriman, idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    for (const o of data.orders) {
      const orderId = Number(String(o.idpengiriman).replace('ORD-', ''));
      let idpelanggan = nameToCustomerId.get(o.pelanggan);
      let idkurir = nameToKurirId.get(o.kurir);
      let idgudang = nameToGudangId.get(o.gudang);

      // If customer not found, create them
      if (!idpelanggan) {
        console.log(`  [warn] Customer "${o.pelanggan}" not found, creating...`);
        const [custResult] = await connection.query('INSERT INTO customer (nama, alamat, notelepon) VALUES (?, ?, ?)', [o.pelanggan, 'Alamat tidak diketahui', '00000000000']);
        idpelanggan = custResult.insertId;
      }
      if (!idkurir) {
        console.log(`  [warn] Kurir "${o.kurir}" not found, skipping order...`);
        continue;
      }
      if (!idgudang) {
        console.log(`  [warn] Gudang "${o.gudang}" not found, skipping order...`);
        continue;
      }

      const tanggal = toDate(o.tanggal);
      const estimasi = new Date(tanggal.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Derive sender info from courier (since dummy orders don't store sender details)
      const courier = data.couriers.find((k) => k.idkurir === idkurir);
      const gudang = data.warehouses.find((g) => g.idgudang === idgudang);

      const total = parseFloat(String(o.total || '0').replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
      await connection.query(orderSql, [
        orderId,
        idpelanggan,
        idkurir,
        idgudang,
        courier ? courier.nama : normalizeText(o.kurir),
        courier ? courier.notelepon : '08123456789',
        gudang ? gudang.alamat : normalizeText(o.gudang),
        estimasi.toISOString().split('T')[0],
        tanggal.toISOString().split('T')[0],
        o.status || 'Diproses',
        total,
      ]);
    }
    console.log(`[migrate] order: inserted ${data.orders.length} rows`);

    // 6. barang
    const itemBeratMap = {
      'Karton Lipat': 5.0,
      'Label Barcode': 0.5,
      'Bubble Wrap': 2.0,
      'Pita Perekat': 0.3,
    };

    const barangSql = 'INSERT INTO barang (idbarang, idpengiriman, nama_barang, berat, kategori, status) VALUES (?, ?, ?, ?, ?, ?)';
    for (const it of data.items) {
      const barangId = Number(String(it.idbarang).replace('BRG-', ''));
      const idpengiriman = mapOrderItemToOrderId(it, data.orders, data.customers) || 1001;
      const berat = itemBeratMap[it.nama] || 1.0;
      await connection.query(barangSql, [barangId, idpengiriman, normalizeText(it.nama), berat, it.kategori || 'Umum', it.status || 'Tersedia']);
    }
    console.log(`[migrate] barang: inserted ${data.items.length} rows`);

    await connection.commit();
    console.log('[migrate] Migration completed successfully.');
    process.exitCode = 0;
  } catch (err) {
    await connection.rollback();
    console.error('[migrate] Failed:', err);
    process.exitCode = 1;
  } finally {
    connection.release();
  }
}

migrate();
