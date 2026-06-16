const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');
const { authenticate, authorize } = require('./middleware/auth');

const app = express();

app.use(cors());
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
      { id: user.id, username: user.email, role: user.role || 'Administrator' },
      process.env.JWT_SECRET || 'fallback_dev_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.email,
        name: user.email.split('@')[0],
        role: user.role || 'Administrator',
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
    const results = await query('SELECT * FROM customer');
    return res.json(results);
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
    await query('DELETE FROM customer WHERE idpelanggan=?', [id]);
    return res.json({ message: 'Pelanggan berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data pelanggan.', error);
  }
});

// ── Kurirs ──

app.get('/api/kurirs', async (req, res) => {
  try {
    const results = await query('SELECT * FROM kurir');
    return res.json(results);
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
    await query('DELETE FROM kurir WHERE idkurir=?', [id]);
    return res.json({ message: 'Kurir berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data kurir.', error);
  }
});

// ── Gudangs ──

app.get('/api/gudangs', async (req, res) => {
  try {
    const results = await query('SELECT * FROM gudang');
    return res.json(results);
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
    await query('DELETE FROM gudang WHERE idgudang=?', [id]);
    return res.json({ message: 'Gudang berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data gudang.', error);
  }
});

// ── Orders ──

app.get('/api/orders', async (req, res) => {
  try {
    const results = await query('CALL OrderDetail()');
    return res.json(Array.isArray(results) && results.length > 0 ? results[0] : []);
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

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status } = req.body;
  try {
    await query(
      'UPDATE `order` SET idpelanggan=?, idkurir=?, idgudang=?, nama_pengirim=?, no_hp_pengirim=?, alamat_pengirim=?, estimasi_sampai=?, tanggalpengiriman=?, status=? WHERE idpengiriman=?',
      [idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman, status, id]
    );
    return res.json({ idpengiriman: Number(id), ...req.body });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data pengiriman.', error);
  }
});

app.delete('/api/orders/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM `order` WHERE idpengiriman=?', [id]);
    return res.json({ message: 'Pengiriman berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data pengiriman.', error);
  }
});

// ── Barangs ──

app.get('/api/barangs', async (req, res) => {
  try {
    const results = await query('CALL BarangPelanggan()');
    return res.json(Array.isArray(results) && results.length > 0 ? results[0] : []);
  } catch (error) {
    return sendError(res, 'Gagal memuat data barang.', error);
  }
});

app.post('/api/barangs', async (req, res) => {
  if (!validateFields(res, ['idpengiriman', 'nama_barang', 'berat'], req.body)) return;
  const { idpengiriman, nama_barang, berat, kategori, status } = req.body;
  const cleanId = typeof idpengiriman === 'string' && idpengiriman.startsWith('ORD-')
    ? idpengiriman.replace('ORD-', '')
    : idpengiriman;
  try {
    const result = await query(
      'INSERT INTO barang (idpengiriman, nama_barang, berat, kategori, status) VALUES (?, ?, ?, ?, ?)',
      [cleanId, nama_barang.trim(), berat, kategori || null, status || null]
    );
    return res.status(201).json({
      idbarang: result.insertId,
      idpengiriman: cleanId,
      nama_barang: nama_barang.trim(),
      berat: Number(berat),
      kategori: kategori || null,
      status: status || null,
    });
  } catch (error) {
    return sendError(res, 'Gagal menambahkan data barang.', error);
  }
});

app.put('/api/barangs/:id', async (req, res) => {
  const { id } = req.params;
  const { nama_barang, berat, kategori, status } = req.body;
  try {
    await query(
      'UPDATE barang SET nama_barang=?, berat=?, kategori=?, status=? WHERE idbarang=?',
      [nama_barang.trim(), berat, kategori, status, id]
    );
    return res.json({
      idbarang: Number(id),
      nama_barang: nama_barang.trim(),
      berat: Number(berat),
      kategori,
      status,
    });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data barang.', error);
  }
});

app.delete('/api/barangs/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM barang WHERE idbarang=?', [id]);
    return res.json({ message: 'Barang berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data barang.', error);
  }
});

// ── Treks ──

app.get('/api/treks', async (req, res) => {
  try {
    const results = await query('CALL TrekDetail()');
    return res.json(Array.isArray(results) && results.length > 0 ? results[0] : []);
  } catch (error) {
    return sendError(res, 'Gagal memuat data trek.', error);
  }
});

app.post('/api/treks', async (req, res) => {
  if (!validateFields(res, ['idpengiriman', 'lokasiterakhir', 'status'], req.body)) return;
  const { idpengiriman, lokasiterakhir, status } = req.body;
  try {
    const result = await query(
      'INSERT INTO trek (idpengiriman, lokasiterakhir, waktuupdate, status) VALUES (?, ?, NOW(), ?)',
      [idpengiriman, lokasiterakhir.trim(), status.trim()]
    );
    return res.status(201).json({
      idtrek: result.insertId,
      idpengiriman,
      lokasiterakhir: lokasiterakhir.trim(),
      status: status.trim(),
    });
  } catch (error) {
    return sendError(res, 'Gagal menambahkan data trek.', error);
  }
});

app.put('/api/treks/:id', async (req, res) => {
  const { id } = req.params;
  const { lokasiterakhir, status } = req.body;
  try {
    await query(
      'UPDATE trek SET lokasiterakhir=?, status=?, waktuupdate=NOW() WHERE idtrek=?',
      [lokasiterakhir, status, id]
    );
    return res.json({ idtrek: Number(id), ...req.body });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data trek.', error);
  }
});

app.delete('/api/treks/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM trek WHERE idtrek=?', [id]);
    return res.json({ message: 'Trek berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data trek.', error);
  }
});

// ── Penyimpanans ──

app.get('/api/penyimpanans', async (req, res) => {
  try {
    const results = await query('CALL PenyimpananDetail()');
    return res.json(Array.isArray(results) && results.length > 0 ? results[0] : []);
  } catch (error) {
    return sendError(res, 'Gagal memuat data penyimpanan.', error);
  }
});

app.post('/api/penyimpanans', async (req, res) => {
  if (!validateFields(res, ['idbarang', 'idgudang', 'waktu_masuk'], req.body)) return;
  const { idbarang, idgudang, waktu_masuk, waktu_keluar } = req.body;
  try {
    const result = await query(
      'INSERT INTO penyimpanan_barang (idbarang, idgudang, waktu_masuk, waktu_keluar) VALUES (?, ?, ?, ?)',
      [idbarang, idgudang, waktu_masuk, waktu_keluar || null]
    );
    return res.status(201).json({
      idpenyimpanan: result.insertId,
      idbarang,
      idgudang,
      waktu_masuk,
      waktu_keluar: waktu_keluar || null,
    });
  } catch (error) {
    return sendError(res, 'Gagal menambahkan data penyimpanan.', error);
  }
});

app.put('/api/penyimpanans/:id', async (req, res) => {
  const { id } = req.params;
  const fields = ['idbarang', 'idgudang', 'waktu_masuk', 'waktu_keluar'];
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
    return res.json({ idpenyimpanan: Number(id), ...req.body });
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data penyimpanan.', error);
  }
});

app.delete('/api/penyimpanans/:id', authorize('Administrator'), async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM penyimpanan_barang WHERE idpenyimpanan=?', [id]);
    return res.json({ message: 'Penyimpanan berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data penyimpanan.', error);
  }
});

// ── Startup ──

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (mysql mode)`);
  });
}

module.exports = app;
