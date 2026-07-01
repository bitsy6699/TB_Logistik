const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

const db = require('./db');
const { authenticate, authorize } = require('./middleware/auth');

const app = express();

const corsWhitelist = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:5001'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || corsWhitelist.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Terlalu banyak percobaan login. Coba lagi 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
app.use(express.json());

async function query(sql, params = []) {
  const [rows] = await db.query(sql, params);
  return rows;
}

function sendError(res, message, error) {
  return res.status(500).json({ message, error: error?.message || String(error) });
}

function validateFields(res, fields, body) {
  const missing = fields.filter(f => !String(body?.[f] ?? '').trim());
  if (missing.length) {
    res.status(400).json({ message: `Field ${missing.join(', ')} wajib diisi.` });
    return false;
  }
  return true;
}

async function logAction({ table, recordId, action, oldData, newData, req }) {
  try {
    await query(
      'INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        table,
        recordId,
        action,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        req.user?.id || null,
        req.user?.username || 'unknown',
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  const sort = query.sort || null;
  const order = query.order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const search = query.search?.trim() || null;
  return { page, limit, offset, sort, order, search };
}

function buildSearchClause(search, columns) {
  if (!search) return { clause: '', params: [] };
  const conditions = columns.map(c => `${c} LIKE ?`);
  const params = columns.map(() => `%${search}%`);
  return { clause: `WHERE (${conditions.join(' OR ')})`, params };
}

function buildSortClause(sort, order, allowed) {
  if (!sort || !allowed.includes(sort)) return '';
  return `ORDER BY ${sort} ${order}`;
}

async function paginatedQuery({ baseQuery, countQuery, searchColumns, sortColumns, defaultSort, req }) {
  const { page, limit, offset, sort, order, search } = parsePagination(req.query);
  const searchable = searchColumns || [];

  const { clause: whereClause, params: whereParams } = buildSearchClause(search, searchable);

  const [countRows] = await db.query(countQuery + ' ' + whereClause, whereParams);
  const total = countRows[0]?.total || 0;

  let orderClause = buildSortClause(sort, order, sortColumns || []);
  if (!orderClause && defaultSort) orderClause = `ORDER BY ${defaultSort}`;

  const [rows] = await db.query(
    `${baseQuery} ${whereClause} ${orderClause} LIMIT ${limit} OFFSET ${offset}`,
    whereParams
  );

  return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Public Routes ──

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: 'mysql' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!validateFields(res, ['username', 'password'], req.body)) return;

  try {
    const results = await query('SELECT * FROM login WHERE email = ?', [username?.trim()]);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const user = results[0];
    let passwordMatch = false;

    if (user.password && user.password.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMatch = password === user.password;
      if (passwordMatch) {
        const hashed = await bcrypt.hash(password, 10);
        await query('UPDATE login SET password = ? WHERE id = ?', [hashed, user.id]);
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.email, role: user.role || 'Administrator', idkurir: user.idkurir || null },
      process.env.JWT_SECRET || 'fallback_dev_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role || 'Administrator',
        idkurir: user.idkurir || null,
      },
    });
  } catch (error) {
    return sendError(res, 'Gagal melakukan login.', error);
  }
});

// ── Auth Middleware ──
app.use('/api', authenticate);

// ── Customers ──

app.get('/api/customers', async (req, res) => {
  try {
    if (req.query.page || req.query.limit || req.query.search || req.query.sort) {
      const result = await paginatedQuery({
        baseQuery: 'SELECT * FROM customer',
        countQuery: 'SELECT COUNT(*) as total FROM customer',
        searchColumns: ['nama', 'alamat', 'notelepon'],
        sortColumns: ['idpelanggan', 'nama', 'alamat', 'notelepon'],
        defaultSort: 'idpelanggan',
        req,
      });
      return res.json(result);
    }
    const results = await query('SELECT * FROM customer ORDER BY idpelanggan');
    return res.json(results);
  } catch (error) {
    return sendError(res, 'Gagal memuat data pelanggan.', error);
  }
});

app.get('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM customer WHERE idpelanggan=?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
    return res.json(rows[0]);
  } catch (error) {
    return sendError(res, 'Gagal memuat data pelanggan.', error);
  }
});

app.post('/api/customers', async (req, res) => {
  if (!validateFields(res, ['nama', 'alamat', 'notelepon'], req.body)) return;
  const { nama, alamat, notelepon } = req.body;
  try {
    const result = await query(
      'INSERT INTO customer (nama, alamat, notelepon) VALUES (?, ?, ?)',
      [nama.trim(), alamat.trim(), notelepon.trim()]
    );
    logAction({ table: 'customer', recordId: result.insertId, action: 'CREATE', newData: req.body, req });
    return res.status(201).json({
      idpelanggan: result.insertId,
      nama: nama.trim(),
      alamat: alamat.trim(),
      notelepon: notelepon.trim(),
    });
  } catch (error) {
    return sendError(res, 'Gagal menyimpan data pelanggan.', error);
  }
});

app.put('/api/customers/:id', async (req, res) => {
  if (!validateFields(res, ['nama', 'alamat', 'notelepon'], req.body)) return;
  const { id } = req.params;
  const { nama, alamat, notelepon } = req.body;
  try {
    await query(
      'UPDATE customer SET nama=?, alamat=?, notelepon=? WHERE idpelanggan=?',
      [nama.trim(), alamat.trim(), notelepon.trim(), id]
    );
    logAction({ table: 'customer', recordId: Number(id), action: 'UPDATE', newData: req.body, req });
    return res.json({
      idpelanggan: Number(id),
      nama: nama.trim(),
      alamat: alamat.trim(),
      notelepon: notelepon.trim(),
    });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data pelanggan.', error);
  }
});

app.delete('/api/customers/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM customer WHERE idpelanggan=?', [id]);
    await query('DELETE FROM customer WHERE idpelanggan=?', [id]);
    logAction({ table: 'customer', recordId: Number(id), action: 'DELETE', oldData: rows[0], req });
    return res.json({ message: 'Pelanggan berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data pelanggan.', error);
  }
});

// ── Kurirs ──

app.get('/api/kurirs', async (req, res) => {
  try {
    const aktif = await query(
      "SELECT DISTINCT idkurir FROM `order` WHERE status NOT IN ('Terkirim', 'Dibatalkan')"
    );
    const aktifIds = new Set(aktif.map(r => Number(r.idkurir)));

    if (req.query.page || req.query.limit || req.query.search || req.query.sort) {
      const result = await paginatedQuery({
        baseQuery: 'SELECT * FROM kurir',
        countQuery: 'SELECT COUNT(*) as total FROM kurir',
        searchColumns: ['nama', 'notelepon', 'kendaraan'],
        sortColumns: ['idkurir', 'nama', 'notelepon', 'kendaraan'],
        defaultSort: 'idkurir',
        req,
      });
      result.data = result.data.map(k => ({ ...k, sedang_bertugas: aktifIds.has(Number(k.idkurir)) }));
      return res.json(result);
    }
    const hasil = await query('SELECT * FROM kurir ORDER BY idkurir');
    const enriched = hasil.map(k => ({ ...k, sedang_bertugas: aktifIds.has(Number(k.idkurir)) }));
    return res.json(enriched);
  } catch (error) {
    return sendError(res, 'Gagal memuat data kurir.', error);
  }
});

app.get('/api/kurirs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM kurir WHERE idkurir=?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Kurir tidak ditemukan.' });
    return res.json(rows[0]);
  } catch (error) {
    return sendError(res, 'Gagal memuat data kurir.', error);
  }
});

app.post('/api/kurirs', async (req, res) => {
  if (!validateFields(res, ['nama', 'notelepon', 'kendaraan'], req.body)) return;
  const { nama, notelepon, kendaraan } = req.body;
  try {
    const result = await query(
      'INSERT INTO kurir (nama, notelepon, kendaraan) VALUES (?, ?, ?)',
      [nama.trim(), notelepon.trim(), kendaraan.trim()]
    );
    logAction({ table: 'kurir', recordId: result.insertId, action: 'CREATE', newData: req.body, req });
    return res.status(201).json({
      idkurir: result.insertId,
      nama: nama.trim(),
      notelepon: notelepon.trim(),
      kendaraan: kendaraan.trim(),
    });
  } catch (error) {
    return sendError(res, 'Gagal menyimpan data kurir.', error);
  }
});

app.put('/api/kurirs/:id', async (req, res) => {
  if (!validateFields(res, ['nama', 'notelepon', 'kendaraan'], req.body)) return;
  const { id } = req.params;
  const { nama, notelepon, kendaraan } = req.body;
  try {
    await query(
      'UPDATE kurir SET nama=?, notelepon=?, kendaraan=? WHERE idkurir=?',
      [nama.trim(), notelepon.trim(), kendaraan.trim(), id]
    );
    logAction({ table: 'kurir', recordId: Number(id), action: 'UPDATE', newData: req.body, req });
    return res.json({
      idkurir: Number(id),
      nama: nama.trim(),
      notelepon: notelepon.trim(),
      kendaraan: kendaraan.trim(),
    });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data kurir.', error);
  }
});

app.delete('/api/kurirs/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    const [orderCount] = await query("SELECT COUNT(*) AS cnt FROM `order` WHERE idkurir=? AND status NOT IN ('Terkirim', 'Dibatalkan')", [id]);
    if (orderCount?.cnt > 0) {
      return res.status(400).json({ message: `Kurir sedang bertugas (${orderCount.cnt} pengiriman aktif). Selesaikan pengiriman terlebih dahulu.` });
    }
    const rows = await query('SELECT * FROM kurir WHERE idkurir=?', [id]);
    await query('DELETE FROM kurir WHERE idkurir=?', [id]);
    logAction({ table: 'kurir', recordId: Number(id), action: 'DELETE', oldData: rows[0], req });
    return res.json({ message: 'Kurir berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data kurir.', error);
  }
});

// ── Gudangs ──

app.get('/api/gudangs', async (req, res) => {
  try {
    if (req.query.page || req.query.limit || req.query.search || req.query.sort) {
      const result = await paginatedQuery({
        baseQuery: 'SELECT * FROM gudang',
        countQuery: 'SELECT COUNT(*) as total FROM gudang',
        searchColumns: ['namagudang', 'alamat', 'kota'],
        sortColumns: ['idgudang', 'namagudang', 'alamat', 'kota'],
        defaultSort: 'idgudang',
        req,
      });
      return res.json(result);
    }
    const results = await query('SELECT * FROM gudang ORDER BY idgudang');
    return res.json(results);
  } catch (error) {
    return sendError(res, 'Gagal memuat data gudang.', error);
  }
});

app.get('/api/gudangs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM gudang WHERE idgudang=?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Gudang tidak ditemukan.' });
    return res.json(rows[0]);
  } catch (error) {
    return sendError(res, 'Gagal memuat data gudang.', error);
  }
});

app.post('/api/gudangs', async (req, res) => {
  if (!validateFields(res, ['namagudang', 'alamat', 'kota'], req.body)) return;
  const { namagudang, alamat, kota } = req.body;
  try {
    const result = await query(
      'INSERT INTO gudang (namagudang, alamat, kota) VALUES (?, ?, ?)',
      [namagudang.trim(), alamat.trim(), kota.trim()]
    );
    logAction({ table: 'gudang', recordId: result.insertId, action: 'CREATE', newData: req.body, req });
    return res.status(201).json({
      idgudang: result.insertId,
      namagudang: namagudang.trim(),
      alamat: alamat.trim(),
      kota: kota.trim(),
    });
  } catch (error) {
    return sendError(res, 'Gagal menyimpan data gudang.', error);
  }
});

app.put('/api/gudangs/:id', async (req, res) => {
  if (!validateFields(res, ['namagudang', 'alamat', 'kota'], req.body)) return;
  const { id } = req.params;
  const { namagudang, alamat, kota } = req.body;
  try {
    await query(
      'UPDATE gudang SET namagudang=?, alamat=?, kota=? WHERE idgudang=?',
      [namagudang.trim(), alamat.trim(), kota.trim(), id]
    );
    logAction({ table: 'gudang', recordId: Number(id), action: 'UPDATE', newData: req.body, req });
    return res.json({
      idgudang: Number(id),
      namagudang: namagudang.trim(),
      alamat: alamat.trim(),
      kota: kota.trim(),
    });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data gudang.', error);
  }
});

app.delete('/api/gudangs/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM gudang WHERE idgudang=?', [id]);
    await query('DELETE FROM gudang WHERE idgudang=?', [id]);
    logAction({ table: 'gudang', recordId: Number(id), action: 'DELETE', oldData: rows[0], req });
    return res.json({ message: 'Gudang berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data gudang.', error);
  }
});

// ── Orders ──

app.get('/api/orders', async (req, res) => {
  try {
    if (req.query.page || req.query.limit || req.query.search || req.query.sort) {
      const result = await paginatedQuery({
        baseQuery: `SELECT o.idpengiriman, c.nama AS nama_pelanggan, k.nama AS nama_kurir,
                    g.namagudang AS nama_gudang, o.nama_pengirim, o.no_hp_pengirim,
                    o.alamat_pengirim, o.estimasi_sampai, o.tanggalpengiriman,
                    o.status, o.total,
                    (SELECT COUNT(*) FROM order_barang ob WHERE ob.idpengiriman = o.idpengiriman) AS jumlah_barang,
                    (SELECT GROUP_CONCAT(b.nama_barang SEPARATOR ', ')
                     FROM order_barang ob JOIN barang b ON ob.idbarang = b.idbarang
                     WHERE ob.idpengiriman = o.idpengiriman) AS nama_barang
             FROM \`order\` o
             JOIN customer c ON o.idpelanggan = c.idpelanggan
             JOIN kurir k ON o.idkurir = k.idkurir
             JOIN gudang g ON o.idgudang = g.idgudang`,
        countQuery: `SELECT COUNT(*) as total FROM \`order\` o
                     JOIN customer c ON o.idpelanggan = c.idpelanggan
                     JOIN kurir k ON o.idkurir = k.idkurir
                     JOIN gudang g ON o.idgudang = g.idgudang`,
        searchColumns: ['o.nama_pengirim', 'o.no_hp_pengirim', 'o.status', 'c.nama', 'k.nama', 'g.namagudang'],
        sortColumns: ['idpengiriman', 'nama_pelanggan', 'nama_kurir', 'nama_gudang', 'tanggalpengiriman', 'status', 'total'],
        defaultSort: 'o.idpengiriman',
        req,
      });
      return res.json(result);
    }
    const results = await query(`SELECT o.idpengiriman, c.nama AS nama_pelanggan, k.nama AS nama_kurir,
              g.namagudang AS nama_gudang, o.nama_pengirim, o.no_hp_pengirim,
              o.alamat_pengirim, o.estimasi_sampai, o.tanggalpengiriman,
              o.status, o.total,
              (SELECT COUNT(*) FROM order_barang ob WHERE ob.idpengiriman = o.idpengiriman) AS jumlah_barang,
              (SELECT GROUP_CONCAT(b.nama_barang SEPARATOR ', ')
               FROM order_barang ob JOIN barang b ON ob.idbarang = b.idbarang
               WHERE ob.idpengiriman = o.idpengiriman) AS nama_barang
       FROM \`order\` o
       JOIN customer c ON o.idpelanggan = c.idpelanggan
       JOIN kurir k ON o.idkurir = k.idkurir
       JOIN gudang g ON o.idgudang = g.idgudang`);
    return res.json(Array.isArray(results) ? results : []);
  } catch (error) {
    return sendError(res, 'Gagal memuat data pengiriman.', error);
  }
});

app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query(`SELECT o.idpengiriman, c.nama AS nama_pelanggan, k.nama AS nama_kurir,
              g.namagudang AS nama_gudang, o.nama_pengirim, o.no_hp_pengirim,
              o.alamat_pengirim, o.estimasi_sampai, o.tanggalpengiriman,
              o.status, o.total
       FROM \`order\` o
       JOIN customer c ON o.idpelanggan = c.idpelanggan
       JOIN kurir k ON o.idkurir = k.idkurir
       JOIN gudang g ON o.idgudang = g.idgudang
       WHERE o.idpengiriman=?`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Pengiriman tidak ditemukan.' });
    const items = await query(
      `SELECT ob.idbarang, ob.jumlah, b.nama_barang, b.harga
       FROM order_barang ob
       JOIN barang b ON ob.idbarang = b.idbarang
       WHERE ob.idpengiriman = ?`, [id]
    );
    return res.json({ ...rows[0], items });
  } catch (error) {
    return sendError(res, 'Gagal memuat data pengiriman.', error);
  }
});

app.post('/api/orders', async (req, res) => {
  if (!validateFields(res, [
    'idpelanggan',
    'idkurir',
    'idgudang',
    'nama_pengirim',
    'no_hp_pengirim',
    'alamat_pengirim',
    'estimasi_sampai',
    'tanggalpengiriman',
  ], req.body)) return;

  const { idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman } = req.body;

  try {
    const result = await query(
      'INSERT INTO `order` (idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [idpelanggan, idkurir, idgudang, nama_pengirim.trim(), no_hp_pengirim.trim(), alamat_pengirim.trim(), estimasi_sampai, tanggalpengiriman, 'Diproses']
    );
    logAction({ table: 'order', recordId: result.insertId, action: 'CREATE', newData: req.body, req });
    return res.status(201).json({
      idpengiriman: result.insertId,
      idpelanggan,
      idkurir,
      idgudang,
      nama_pengirim: nama_pengirim.trim(),
      no_hp_pengirim: no_hp_pengirim.trim(),
      alamat_pengirim: alamat_pengirim.trim(),
      estimasi_sampai,
      tanggalpengiriman,
      status: 'Diproses',
    });
  } catch (error) {
    return sendError(res, 'Gagal membuat data pengiriman.', error);
  }
});

app.post('/api/pengiriman-terpadu', async (req, res) => {
  if (!validateFields(res, [
    'idpelanggan', 'idkurir', 'idgudang_pengirim', 'idgudang',
    'nama_pengirim', 'no_hp_pengirim', 'alamat_pengirim',
    'estimasi_sampai', 'tanggalpengiriman', 'barang',
  ], req.body)) return;

  const { idpelanggan, idkurir, idgudang_pengirim, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, barang } = req.body;

  if (!Array.isArray(barang) || barang.length === 0) {
    return res.status(400).json({ message: 'Minimal 1 barang wajib diisi.' });
  }
  for (const b of barang) {
    if (!b.idbarang) {
      return res.status(400).json({ message: 'ID barang wajib diisi.' });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  if (tanggalpengiriman < today) {
    return res.status(400).json({ message: 'Tanggal pengiriman tidak boleh sebelum hari ini.' });
  }
  if (estimasi_sampai < tanggalpengiriman) {
    return res.status(400).json({ message: 'Estimasi sampai tidak boleh sebelum tanggal pengiriman.' });
  }

  const [customerCheck] = await query('SELECT nama FROM customer WHERE idpelanggan=?', [idpelanggan]);
  if (customerCheck.length) {
    const namaPenerima = customerCheck[0].nama.trim().toLowerCase();
    const namaPengirimTrimmed = (nama_pengirim || '').trim().toLowerCase();
    if (namaPenerima === namaPengirimTrimmed) {
      return res.status(400).json({ message: 'Pengirim dan penerima tidak boleh orang yang sama.' });
    }
  }

  if (String(idgudang_pengirim) === String(idgudang)) {
    return res.status(400).json({ message: 'Gudang pengirim dan gudang tujuan tidak boleh sama.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO \`order\` (idpelanggan, idkurir, idgudang, idgudang_pengirim, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [idpelanggan, idkurir, idgudang, idgudang_pengirim, nama_pengirim.trim(), no_hp_pengirim.trim(), alamat_pengirim.trim(), estimasi_sampai, tanggalpengiriman, 'Diproses']
    );
    const orderId = orderResult.insertId;

    let grandTotal = 0;
    const linkedItems = [];
    for (const b of barang) {
      const qty = Number(b.jumlah) || 1;

      const [barangRows] = await conn.query('SELECT nama_barang, harga, jumlah, status FROM barang WHERE idbarang=?', [b.idbarang]);
      if (!barangRows.length) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: `Barang ID ${b.idbarang} tidak ditemukan.` });
      }

      const brg = barangRows[0];
      const namaBarang = brg.nama_barang || `Barang #${b.idbarang}`;

      if (brg.status === 'Rusak') {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: `Barang "${namaBarang}" sedang rusak dan tidak bisa ditambahkan ke pesanan.` });
      }
      if (brg.status === 'Hilang') {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: `Barang "${namaBarang}" hilang dan tidak bisa ditambahkan ke pesanan.` });
      }

      const stok = Number(brg.jumlah) || 0;
      if (stok < qty) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: `Stok "${namaBarang}" tidak mencukupi. Tersedia: ${stok}, diminta: ${qty}.` });
      }

      const harga = Number(brg.harga) || 0;
      const subtotal = harga * qty;
      grandTotal += subtotal;

      await conn.query(
        'INSERT INTO order_barang (idpengiriman, idbarang, jumlah) VALUES (?, ?, ?)',
        [orderId, b.idbarang, qty]
      );

      await conn.query(
        'INSERT INTO penyimpanan_barang (idbarang, idgudang, jumlah_keluar, waktu_keluar, waktu_masuk) VALUES (?, ?, ?, NOW(), NOW())',
        [b.idbarang, idgudang_pengirim, qty]
      );
      await conn.query(
        'INSERT INTO penyimpanan_barang (idbarang, idgudang, jumlah_masuk, waktu_masuk) VALUES (?, ?, ?, NOW())',
        [b.idbarang, idgudang, qty]
      );
      linkedItems.push({ ...b, harga, subtotal });
    }

    await conn.query('UPDATE `order` SET total=? WHERE idpengiriman=?', [grandTotal, orderId]);

    const [gudangRows] = await conn.query('SELECT namagudang FROM gudang WHERE idgudang=?', [idgudang_pengirim]);
    const gudangName = gudangRows[0]?.namagudang || 'Gudang';

    const [trekResult] = await conn.query(
      'INSERT INTO trek (idpengiriman, lokasiterakhir, waktuupdate, status) VALUES (?, ?, NOW(), ?)',
      [orderId, gudangName, 'Diproses']
    );

    await conn.commit();

    logAction({ table: 'order', recordId: orderId, action: 'CREATE', newData: { idpelanggan, idkurir, idgudang, idgudang_pengirim, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, total: grandTotal, jumlah_barang: barang.length }, req });
    for (const item of linkedItems) {
      logAction({ table: 'order_barang', recordId: item.idbarang, action: 'CREATE', newData: { idpengiriman: orderId, idbarang: item.idbarang, jumlah: item.jumlah, harga: item.harga, subtotal: item.subtotal }, req });
    }
    logAction({ table: 'trek', recordId: trekResult.insertId, action: 'CREATE', newData: { idpengiriman: orderId, lokasiterakhir: gudangName, status: 'Diproses' }, req });

    return res.status(201).json({
      idpengiriman: orderId,
      message: 'Pengiriman berhasil dibuat. Barang, penyimpanan, dan lacakan otomatis terbuat.',
      total: grandTotal,
      barang: linkedItems,
      trekId: trekResult.insertId,
    });
  } catch (error) {
    await conn.rollback();
    return sendError(res, 'Gagal membuat pengiriman terpadu.', error);
  } finally {
    conn.release();
  }
});

app.put('/api/orders/:id', async (req, res) => {
  if (!validateFields(res, ['idpelanggan', 'idkurir', 'idgudang', 'nama_pengirim', 'no_hp_pengirim', 'alamat_pengirim', 'estimasi_sampai', 'tanggalpengiriman'], req.body)) return;
  const { id } = req.params;
  const { idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status } = req.body;
  try {
    await query(
      'UPDATE `order` SET idpelanggan=?, idkurir=?, idgudang=?, nama_pengirim=?, no_hp_pengirim=?, alamat_pengirim=?, estimasi_sampai=?, tanggalpengiriman=?, status=? WHERE idpengiriman=?',
      [idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status, id]
    );
    logAction({ table: 'order', recordId: Number(id), action: 'UPDATE', newData: req.body, req });
    return res.json({ idpengiriman: Number(id), ...req.body });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data pengiriman.', error);
  }
});

const ORDER_STATUSES = ['Diproses', 'Dalam perjalanan', 'Sampai tujuan', 'Terkirim', 'Dibatalkan'];
const BARANG_STATUSES = ['Tersedia', 'Dalam transit', 'Terkirim', 'Rusak', 'Hilang'];

app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, lokasi } = req.body;
  if (!status) return res.status(400).json({ message: 'Status harus diisi.' });
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status tidak valid. Pilihan: ${ORDER_STATUSES.join(', ')}` });
  }
  try {
    await query('UPDATE `order` SET status=? WHERE idpengiriman=?', [status, id]);
    const [rows] = await query(
      `SELECT COALESCE(g.namagudang, 'Tidak diketahui') AS lokasi_default
       FROM \`order\` o
       LEFT JOIN gudang g ON o.idgudang = g.idgudang
       WHERE o.idpengiriman=?`, [id]
    );
    await query(
      'INSERT INTO trek (idpengiriman, lokasiterakhir, waktuupdate, status) VALUES (?, ?, NOW(), ?)',
      [id, lokasi || rows[0]?.lokasi_default || 'Tidak diketahui', status]
    );
    logAction({ table: 'order', recordId: Number(id), action: 'UPDATE', newData: { status, lokasi: lokasi || rows[0]?.lokasi_default }, req });
    return res.json({ idpengiriman: Number(id), status, message: 'Status berhasil diperbarui. Tracking event tercatat.' });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui status.', error);
  }
});

app.get('/api/kurir/orders', async (req, res) => {
  const idkurir = req.user?.idkurir;
  if (!idkurir) return res.status(400).json({ message: 'Akun kurir tidak valid.' });
  try {
    const orders = await query(`
      SELECT o.idpengiriman, c.nama AS nama_pelanggan, o.status, o.tanggalpengiriman,
             o.total,
             (SELECT GROUP_CONCAT(b.nama_barang SEPARATOR ', ')
              FROM order_barang ob JOIN barang b ON ob.idbarang = b.idbarang
              WHERE ob.idpengiriman = o.idpengiriman) AS nama_barang
      FROM \`order\` o
      JOIN customer c ON o.idpelanggan = c.idpelanggan
      WHERE o.idkurir = ?
      ORDER BY o.tanggalpengiriman DESC
    `, [idkurir]);
    return res.json(orders);
  } catch (error) {
    return sendError(res, 'Gagal memuat pesanan kurir.', error);
  }
});

app.delete('/api/orders/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM `order` WHERE idpengiriman=?', [id]);
    await query('DELETE FROM `order` WHERE idpengiriman=?', [id]);
    logAction({ table: 'order', recordId: Number(id), action: 'DELETE', oldData: rows[0], req });
    return res.json({ message: 'Pengiriman berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data pengiriman.', error);
  }
});

// ── Barangs ──

app.get('/api/barangs', async (req, res) => {
  try {
    if (req.query.page || req.query.limit || req.query.search || req.query.sort) {
      const result = await paginatedQuery({
        baseQuery: `SELECT b.* FROM barang b`,
        countQuery: `SELECT COUNT(*) as total FROM barang b`,
        searchColumns: ['b.nama_barang', 'b.kategori', 'b.status'],
        sortColumns: ['idbarang', 'nama_barang', 'jumlah', 'berat', 'kategori', 'status'],
        defaultSort: 'b.idbarang',
        req,
      });
      return res.json(result);
    }
    const results = await query('SELECT * FROM barang ORDER BY idbarang');
    return res.json(Array.isArray(results) ? results : []);
  } catch (error) {
    return sendError(res, 'Gagal memuat data barang.', error);
  }
});

app.get('/api/barangs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM barang WHERE idbarang=?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    return res.json(rows[0]);
  } catch (error) {
    return sendError(res, 'Gagal memuat data barang.', error);
  }
});

app.post('/api/barangs', async (req, res) => {
  if (!validateFields(res, ['nama_barang', 'berat'], req.body)) return;
  const { nama_barang, berat, jumlah, harga, kategori, status } = req.body;
  const numBerat = Number(berat);
  const numJumlah = Number(jumlah) || 1;
  const numHarga = Number(harga) || 0;
  if (numBerat <= 0) return res.status(400).json({ message: 'Berat barang harus lebih dari 0 kg.' });
  if (numJumlah < 1) return res.status(400).json({ message: 'Jumlah barang minimal 1.' });
  if (numHarga < 0) return res.status(400).json({ message: 'Harga tidak boleh negatif.' });
  try {
    const result = await query(
      'INSERT INTO barang (nama_barang, jumlah, berat, harga, kategori, status) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_barang.trim(), numJumlah, numBerat, numHarga, kategori || null, status || null]
    );
    logAction({ table: 'barang', recordId: result.insertId, action: 'CREATE', newData: req.body, req });
    return res.status(201).json({
      idbarang: result.insertId,
      nama_barang: nama_barang.trim(),
      jumlah: numJumlah,
      berat: numBerat,
      harga: numHarga,
      kategori: kategori || null,
      status: status || null,
    });
  } catch (error) {
    return sendError(res, 'Gagal menambahkan data barang.', error);
  }
});

app.put('/api/barangs/:id', async (req, res) => {
  if (!validateFields(res, ['nama_barang', 'berat'], req.body)) return;
  const { id } = req.params;
  const { nama_barang, jumlah, berat, harga, kategori, status } = req.body;
  const numBerat = Number(berat);
  const numJumlah = Number(jumlah) || 1;
  const numHarga = Number(harga) || 0;
  if (numBerat <= 0) return res.status(400).json({ message: 'Berat barang harus lebih dari 0 kg.' });
  if (numJumlah < 1) return res.status(400).json({ message: 'Jumlah barang minimal 1.' });
  if (numHarga < 0) return res.status(400).json({ message: 'Harga tidak boleh negatif.' });
  try {
    await query(
      'UPDATE barang SET nama_barang=?, jumlah=?, berat=?, harga=?, kategori=?, status=? WHERE idbarang=?',
      [nama_barang.trim(), numJumlah, numBerat, numHarga, kategori, status, id]
    );
    logAction({ table: 'barang', recordId: Number(id), action: 'UPDATE', newData: req.body, req });
    return res.json({
      idbarang: Number(id),
      nama_barang: nama_barang.trim(),
      jumlah: numJumlah,
      berat: numBerat,
      harga: numHarga,
      kategori,
      status,
    });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data barang.', error);
  }
});

app.patch('/api/barangs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Status harus diisi.' });
  if (!BARANG_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status tidak valid. Pilihan: ${BARANG_STATUSES.join(', ')}` });
  }
  try {
    await query('UPDATE barang SET status=? WHERE idbarang=?', [status, id]);
    logAction({ table: 'barang', recordId: Number(id), action: 'UPDATE', newData: { status }, req });
    return res.json({ idbarang: Number(id), status, message: 'Status berhasil diperbarui.' });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui status.', error);
  }
});

app.delete('/api/barangs/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM barang WHERE idbarang=?', [id]);
    await query('DELETE FROM barang WHERE idbarang=?', [id]);
    logAction({ table: 'barang', recordId: Number(id), action: 'DELETE', oldData: rows[0], req });
    return res.json({ message: 'Barang berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data barang.', error);
  }
});

// ── Treks ──

app.get('/api/treks', async (req, res) => {
  try {
    if (req.query.idpengiriman) {
      const rows = await query(
        `SELECT t.*, o.idpelanggan, c.nama AS nama_pelanggan
         FROM trek t
         JOIN \`order\` o ON t.idpengiriman = o.idpengiriman
         JOIN customer c ON o.idpelanggan = c.idpelanggan
         WHERE t.idpengiriman = ?
         ORDER BY t.waktuupdate ASC`, [req.query.idpengiriman]
      );
      return res.json(rows);
    }
    if (req.query.page || req.query.limit || req.query.search || req.query.sort) {
      const result = await paginatedQuery({
        baseQuery: `SELECT t.*, o.idpelanggan, c.nama AS nama_pelanggan
             FROM trek t
             JOIN \`order\` o ON t.idpengiriman = o.idpengiriman
             JOIN customer c ON o.idpelanggan = c.idpelanggan`,
        countQuery: `SELECT COUNT(*) as total FROM trek t
                     JOIN \`order\` o ON t.idpengiriman = o.idpengiriman
                     JOIN customer c ON o.idpelanggan = c.idpelanggan`,
        searchColumns: ['t.lokasiterakhir', 't.status', 'c.nama'],
        sortColumns: ['idtrek', 'idpengiriman', 'lokasiterakhir', 'waktuupdate', 'status', 'nama_pelanggan'],
        defaultSort: 't.waktuupdate DESC',
        req,
      });
      return res.json(result);
    }
    const results = await query('CALL TrekDetail()');
    return res.json(Array.isArray(results) && results.length > 0 ? results[0] : []);
  } catch (error) {
    return sendError(res, 'Gagal memuat data trek.', error);
  }
});

app.get('/api/treks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query(`SELECT t.*, o.idpelanggan, c.nama AS nama_pelanggan
       FROM trek t
       JOIN \`order\` o ON t.idpengiriman = o.idpengiriman
       JOIN customer c ON o.idpelanggan = c.idpelanggan
       WHERE t.idtrek=?`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Trek tidak ditemukan.' });
    return res.json(rows[0]);
  } catch (error) {
    return sendError(res, 'Gagal memuat data trek.', error);
  }
});

app.post('/api/treks', async (req, res) => {
  if (!validateFields(res, ['idpengiriman', 'lokasiterakhir'], req.body)) return;
  const { idpengiriman, lokasiterakhir } = req.body;
  try {
    const result = await query(
      'INSERT INTO trek (idpengiriman, lokasiterakhir, waktuupdate, status) VALUES (?, ?, NOW(), NULL)',
      [idpengiriman, lokasiterakhir.trim()]
    );
    logAction({ table: 'trek', recordId: result.insertId, action: 'CREATE', newData: req.body, req });
    return res.status(201).json({
      idtrek: result.insertId,
      idpengiriman,
      lokasiterakhir: lokasiterakhir.trim(),
    });
  } catch (error) {
    return sendError(res, 'Gagal menambahkan data trek.', error);
  }
});

app.put('/api/treks/:id', async (req, res) => {
  if (!validateFields(res, ['lokasiterakhir', 'status'], req.body)) return;
  const { id } = req.params;
  const { lokasiterakhir, status } = req.body;
  try {
    await query(
      'UPDATE trek SET lokasiterakhir=?, status=?, waktuupdate=NOW() WHERE idtrek=?',
      [lokasiterakhir, status, id]
    );
    logAction({ table: 'trek', recordId: Number(id), action: 'UPDATE', newData: req.body, req });
    return res.json({ idtrek: Number(id), ...req.body });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data trek.', error);
  }
});

app.delete('/api/treks/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM trek WHERE idtrek=?', [id]);
    await query('DELETE FROM trek WHERE idtrek=?', [id]);
    logAction({ table: 'trek', recordId: Number(id), action: 'DELETE', oldData: rows[0], req });
    return res.json({ message: 'Trek berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data trek.', error);
  }
});

// ── Penyimpanans ──

app.get('/api/penyimpanans', async (req, res) => {
  try {
    if (req.query.page || req.query.limit) {
      const result = await paginatedQuery({
        baseQuery: `SELECT p.*, b.nama_barang, g.namagudang
             FROM penyimpanan_barang p
             JOIN barang b ON p.idbarang = b.idbarang
             JOIN gudang g ON p.idgudang = g.idgudang`,
        countQuery: `SELECT COUNT(*) as total FROM penyimpanan_barang p
                     JOIN barang b ON p.idbarang = b.idbarang
                     JOIN gudang g ON p.idgudang = g.idgudang`,
        searchColumns: ['b.nama_barang', 'g.namagudang'],
        sortColumns: ['idpenyimpanan', 'nama_barang', 'namagudang', 'waktu_masuk', 'waktu_keluar'],
        defaultSort: 'p.waktu_masuk DESC',
        req,
      });
      return res.json(result);
    }
    const results = await query('CALL PenyimpananDetail()');
    return res.json(Array.isArray(results) && results.length > 0 ? results[0] : []);
  } catch (error) {
    return sendError(res, 'Gagal memuat data penyimpanan.', error);
  }
});

app.get('/api/penyimpanans/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query(`SELECT p.*, b.nama_barang, g.namagudang
       FROM penyimpanan_barang p
       JOIN barang b ON p.idbarang = b.idbarang
       JOIN gudang g ON p.idgudang = g.idgudang
       WHERE p.idpenyimpanan=?`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Penyimpanan tidak ditemukan.' });
    return res.json(rows[0]);
  } catch (error) {
    return sendError(res, 'Gagal memuat data penyimpanan.', error);
  }
});

app.post('/api/penyimpanans', async (req, res) => {
  if (!validateFields(res, ['idbarang', 'idgudang', 'waktu_masuk'], req.body)) return;
  const { idbarang, idgudang, jumlah_masuk, jumlah_keluar, waktu_masuk, waktu_keluar } = req.body;
  try {
    const result = await query(
      'INSERT INTO penyimpanan_barang (idbarang, idgudang, jumlah_masuk, jumlah_keluar, waktu_masuk, waktu_keluar) VALUES (?, ?, ?, ?, ?, ?)',
      [idbarang, idgudang, jumlah_masuk || 1, jumlah_keluar || null, waktu_masuk, waktu_keluar || null]
    );
    logAction({ table: 'penyimpanan_barang', recordId: result.insertId, action: 'CREATE', newData: req.body, req });
    return res.status(201).json({
      idpenyimpanan: result.insertId,
      idbarang,
      idgudang,
      jumlah_masuk: Number(jumlah_masuk || 1),
      jumlah_keluar: jumlah_keluar || null,
      waktu_masuk,
      waktu_keluar: waktu_keluar || null,
    });
  } catch (error) {
    return sendError(res, 'Gagal menambahkan data penyimpanan.', error);
  }
});

app.put('/api/penyimpanans/:id', async (req, res) => {
  const { id } = req.params;
  const fields = ['idbarang', 'idgudang', 'jumlah_masuk', 'jumlah_keluar', 'waktu_masuk', 'waktu_keluar'];
  const setClauses = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      setClauses.push(`${f}=?`);
      values.push(req.body[f]);
    }
  }
  if (setClauses.length === 0) {
    return res.status(400).json({ message: 'Tidak ada field yang diupdate.' });
  }
  values.push(id);
  try {
    await query(`UPDATE penyimpanan_barang SET ${setClauses.join(', ')} WHERE idpenyimpanan=?`, values);
    logAction({ table: 'penyimpanan_barang', recordId: Number(id), action: 'UPDATE', newData: req.body, req });
    return res.json({ idpenyimpanan: Number(id), ...req.body });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data penyimpanan.', error);
  }
});

app.patch('/api/penyimpanans/:id/keluar', async (req, res) => {
  const { id } = req.params;
  const { jumlah_keluar, waktu_keluar } = req.body;
  if (!jumlah_keluar) return res.status(400).json({ message: 'jumlah_keluar harus diisi.' });
  try {
    await query('UPDATE penyimpanan_barang SET jumlah_keluar=?, waktu_keluar=COALESCE(?, NOW()) WHERE idpenyimpanan=?', [jumlah_keluar, waktu_keluar || null, id]);
    logAction({ table: 'penyimpanan_barang', recordId: Number(id), action: 'UPDATE', newData: { jumlah_keluar, waktu_keluar }, req });
    return res.json({ idpenyimpanan: Number(id), jumlah_keluar, message: 'Barang keluar berhasil dicatat.' });
  } catch (error) {
    return sendError(res, 'Gagal mencatat barang keluar.', error);
  }
});

app.delete('/api/penyimpanans/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM penyimpanan_barang WHERE idpenyimpanan=?', [id]);
    await query('DELETE FROM penyimpanan_barang WHERE idpenyimpanan=?', [id]);
    logAction({ table: 'penyimpanan_barang', recordId: Number(id), action: 'DELETE', oldData: rows[0], req });
    return res.json({ message: 'Penyimpanan berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data penyimpanan.', error);
  }
});

// ── Stats / Charts ──

app.get('/api/stats', async (req, res) => {
  try {
    const counts = await Promise.all([
      query('SELECT COUNT(*) as total FROM customer'),
      query('SELECT COUNT(*) as total FROM kurir'),
      query('SELECT COUNT(*) as total FROM gudang'),
      query('SELECT COUNT(*) as total FROM `order`'),
      query('SELECT status, COUNT(*) as count FROM `order` GROUP BY status'),
      query("SELECT DATE_FORMAT(tanggalpengiriman, '%Y-%m') as month, COUNT(*) as count FROM `order` GROUP BY month ORDER BY month"),
      query("SELECT c.nama, COUNT(*) as count FROM `order` o JOIN customer c ON o.idpelanggan = c.idpelanggan GROUP BY o.idpelanggan ORDER BY count DESC LIMIT 5"),
    ]);

    const getTotal = (r) => r[0]?.total || 0;

    return res.json({
      totals: {
        customers: getTotal(counts[0]),
        kurirs: getTotal(counts[1]),
        gudangs: getTotal(counts[2]),
        orders: getTotal(counts[3]),
      },
      orderStatuses: counts[4],
      monthlyOrders: counts[5],
      topCustomers: counts[6],
    });
  } catch (error) {
    return sendError(res, 'Gagal memuat statistik.', error);
  }
});

// ── Audit Logs ──

app.get('/api/audit-logs', async (req, res) => {
  try {
    const result = await paginatedQuery({
      baseQuery: 'SELECT * FROM audit_log',
      countQuery: 'SELECT COUNT(*) as total FROM audit_log',
      searchColumns: ['table_name', 'action', 'user_name'],
      sortColumns: ['id', 'table_name', 'action', 'user_name', 'created_at'],
      defaultSort: 'id DESC',
      req,
    });
    return res.json(result);
  } catch (error) {
    return sendError(res, 'Gagal memuat audit log.', error);
  }
});

// ── Backup & Restore ──

const BACKUP_DIR = path.resolve(__dirname, process.env.BACKUP_DIR || './backups');
let isBackupRunning = false;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function checkMysqldump(res) {
  try {
    const result = spawn('mysqldump', ['--version'], { stdio: 'pipe' });
    return new Promise((resolve) => {
      result.on('error', () => resolve(false));
      result.on('close', (code) => resolve(code === 0));
    });
  } catch { return false; }
}

function sanitizeFilename(name) {
  const base = path.basename(name);
  if (base !== name || !/^[\w.-]+\.sql$/.test(name)) return null;
  return base;
}

function getBackupPath(filename) {
  const safe = sanitizeFilename(filename);
  if (!safe) return null;
  return path.join(BACKUP_DIR, safe);
}

app.post('/api/backup', authorize('Administrator'), async (req, res) => {
  if (isBackupRunning) {
    return res.status(409).json({ message: 'Proses backup sedang berjalan. Tunggu hingga selesai.' });
  }

  const available = await checkMysqldump();
  if (!available) {
    return res.status(500).json({ message: 'mysqldump tidak ditemukan. Install MySQL client tools terlebih dahulu.' });
  }

  isBackupRunning = true;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `logistik_db_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);
  const writeStream = fs.createWriteStream(filepath);

  const mysqldump = spawn('mysqldump', [
    `--host=${process.env.DB_HOST || '127.0.0.1'}`,
    `--user=${process.env.DB_USER || 'root'}`,
    `--password=${process.env.DB_PASSWORD || ''}`,
    '--routines',
    '--events',
    '--single-transaction',
    process.env.DB_NAME || 'logistik_db',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let stderr = '';
  mysqldump.stderr.on('data', (data) => { stderr += data.toString(); });
  mysqldump.stdout.pipe(writeStream);

  mysqldump.on('close', async (code) => {
    writeStream.end();
    isBackupRunning = false;
    if (code !== 0) {
      fs.unlink(filepath, () => {});
      return res.status(500).json({ message: 'Backup gagal.', error: stderr || `mysqldump exit code ${code}` });
    }
    const stats = fs.statSync(filepath);
    logAction({ table: 'backup', recordId: null, action: 'CREATE', newData: { filename, size: stats.size }, req });
    return res.json({ filename, size: stats.size, createdAt: new Date().toISOString(), message: 'Backup berhasil.' });
  });

  mysqldump.on('error', (err) => {
    writeStream.end();
    isBackupRunning = false;
    fs.unlink(filepath, () => {});
    return sendError(res, 'Gagal menjalankan mysqldump.', err);
  });
});

app.get('/api/backups', authorize('Administrator'), async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(files);
  } catch (error) {
    return sendError(res, 'Gagal membaca daftar backup.', error);
  }
});

app.get('/api/backups/download/:filename', authorize('Administrator'), async (req, res) => {
  const filepath = getBackupPath(req.params.filename);
  if (!filepath || !fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'File backup tidak ditemukan.' });
  }
  return res.download(filepath);
});

app.post('/api/backups/restore/:filename', authorize('Administrator'), async (req, res) => {
  if (isBackupRunning) {
    return res.status(409).json({ message: 'Proses backup sedang berjalan. Coba lagi nanti.' });
  }

  if (!req.body?.confirm) {
    return res.status(400).json({ message: 'Konfirmasi diperlukan. Kirim { confirm: true } untuk melanjutkan.' });
  }

  const filepath = getBackupPath(req.params.filename);
  if (!filepath || !fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'File backup tidak ditemukan.' });
  }

  isBackupRunning = true;
  const mysql = spawn('mysql', [
    `--host=${process.env.DB_HOST || '127.0.0.1'}`,
    `--user=${process.env.DB_USER || 'root'}`,
    `--password=${process.env.DB_PASSWORD || ''}`,
    process.env.DB_NAME || 'logistik_db',
  ], { stdio: ['pipe', 'ignore', 'pipe'] });

  let stderr = '';
  mysql.stderr.on('data', (data) => { stderr += data.toString(); });

  fs.createReadStream(filepath).pipe(mysql.stdin);

  mysql.on('close', async (code) => {
    isBackupRunning = false;
    if (code !== 0) {
      return res.status(500).json({ message: 'Restore gagal.', error: stderr || `mysql exit code ${code}` });
    }
    logAction({ table: 'backup', recordId: null, action: 'RESTORE', newData: { filename: req.params.filename }, req });
    return res.json({ message: 'Restore berhasil. Database telah dikembalikan.' });
  });

  mysql.on('error', (err) => {
    isBackupRunning = false;
    return sendError(res, 'Gagal menjalankan mysql client.', err);
  });
});

app.delete('/api/backups/:filename', authorize('Administrator'), async (req, res) => {
  const filepath = getBackupPath(req.params.filename);
  if (!filepath || !fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'File backup tidak ditemukan.' });
  }
  try {
    fs.unlinkSync(filepath);
    logAction({ table: 'backup', recordId: null, action: 'DELETE', oldData: { filename: req.params.filename }, req });
    return res.json({ message: 'File backup berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus file backup.', error);
  }
});

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (mysql mode)`);
  });
}

module.exports = app;
