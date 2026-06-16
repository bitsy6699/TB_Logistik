const express = require('express');
const cors = require('cors');
require('dotenv').config();

const store = require('./dummyStore');

const useMysql = process.env.USE_MYSQL === 'true';
let db = null;

if (useMysql) {
  db = require('./db');
}

const app = express();

app.use(cors());
app.use(express.json());

function queryMysql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
}

function sendError(res, message, error) {
  return res.status(500).json({
    message,
    error: error?.message || String(error),
  });
}

function validateFields(res, fields, body) {
  const missingFields = fields.filter((field) => !String(body?.[field] ?? '').trim());

  if (missingFields.length) {
    res.status(400).json({
      message: `Field ${missingFields.join(', ')} wajib diisi.`,
    });
    return false;
  }

  return true;
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mode: useMysql ? 'mysql' : 'dummy',
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (useMysql) {
    try {
      const results = await queryMysql(
        'SELECT * FROM login WHERE email = ? AND password = ?',
        [username?.trim(), password]
      );

      if (results.length > 0) {
        const user = results[0];
        return res.json({
          token: `mysql-${user.email}-${user.id}`,
          user: {
            id: user.id,
            username: user.email,
            name: user.email.split('@')[0],
            role: 'Administrator',
          },
        });
      }
    } catch (error) {
      console.error('MySQL login query failed:', error);
    }
  }

  const session = store.login(req.body || {});

  if (!session) {
    return res.status(401).json({
      message: 'Username atau password salah.',
    });
  }

  return res.json(session);
});

app.get('/api/customers', async (req, res) => {
  try {
    if (useMysql) {
      const results = await queryMysql('SELECT * FROM customer');
      return res.json(results);
    }

    return res.json(store.listCustomers());
  } catch (error) {
    return sendError(res, 'Gagal memuat data pelanggan.', error);
  }
});

app.post('/api/customers', async (req, res) => {
  const { nama, alamat, notelepon } = req.body || {};

  if (!validateFields(res, ['nama', 'alamat', 'notelepon'], req.body)) {
    return;
  }

  try {
    if (useMysql) {
      const result = await queryMysql(
        'INSERT INTO customer (nama, alamat, notelepon) VALUES (?, ?, ?)',
        [nama.trim(), alamat.trim(), notelepon.trim()],
      );

      return res.status(201).json({
        idpelanggan: result.insertId,
        nama: nama.trim(),
        alamat: alamat.trim(),
        notelepon: notelepon.trim(),
      });
    }

    return res.status(201).json(store.createCustomer({ nama, alamat, notelepon }));
  } catch (error) {
    return sendError(res, 'Gagal menyimpan data pelanggan.', error);
  }
});

app.get('/api/kurirs', async (req, res) => {
  try {
    if (useMysql) {
      const results = await queryMysql('SELECT * FROM kurir');
      return res.json(results);
    }

    return res.json(store.listCouriers());
  } catch (error) {
    return sendError(res, 'Gagal memuat data kurir.', error);
  }
});

app.post('/api/kurirs', async (req, res) => {
  const { nama, notelepon, kendaraan } = req.body || {};

  if (!validateFields(res, ['nama', 'notelepon', 'kendaraan'], req.body)) {
    return;
  }

  try {
    if (useMysql) {
      const result = await queryMysql(
        'INSERT INTO kurir (nama, notelepon, kendaraan) VALUES (?, ?, ?)',
        [nama.trim(), notelepon.trim(), kendaraan.trim()],
      );

      return res.status(201).json({
        idkurir: result.insertId,
        nama: nama.trim(),
        notelepon: notelepon.trim(),
        kendaraan: kendaraan.trim(),
      });
    }

    return res.status(201).json(store.createCourier({ nama, notelepon, kendaraan }));
  } catch (error) {
    return sendError(res, 'Gagal menyimpan data kurir.', error);
  }
});

app.get('/api/gudangs', async (req, res) => {
  try {
    if (useMysql) {
      const results = await queryMysql('SELECT * FROM gudang');
      return res.json(results);
    }

    return res.json(store.listWarehouses());
  } catch (error) {
    return sendError(res, 'Gagal memuat data gudang.', error);
  }
});

app.post('/api/gudangs', async (req, res) => {
  const { namagudang, alamat, kota } = req.body || {};

  if (!validateFields(res, ['namagudang', 'alamat', 'kota'], req.body)) {
    return;
  }

  try {
    if (useMysql) {
      const result = await queryMysql(
        'INSERT INTO gudang (namagudang, alamat, kota) VALUES (?, ?, ?)',
        [namagudang.trim(), alamat.trim(), kota.trim()],
      );

      return res.status(201).json({
        idgudang: result.insertId,
        namagudang: namagudang.trim(),
        alamat: alamat.trim(),
        kota: kota.trim(),
      });
    }

    return res.status(201).json(store.createWarehouse({ namagudang, alamat, kota }));
  } catch (error) {
    return sendError(res, 'Gagal menyimpan data gudang.', error);
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    if (useMysql) {
      const results = await queryMysql('CALL OrderDetail()');
      return res.json(results[0]);
    }

    return res.json(store.listOrders());
  } catch (error) {
    return sendError(res, 'Gagal memuat data pengiriman.', error);
  }
});

app.post('/api/orders', async (req, res) => {
  const {
    idpelanggan,
    idkurir,
    idgudang,
    nama_pengirim,
    no_hp_pengirim,
    alamat_pengirim,
    estimasi_sampai,
    tanggalpengiriman
  } = req.body || {};

  if (!validateFields(res, [
    'idpelanggan',
    'idkurir',
    'idgudang',
    'nama_pengirim',
    'no_hp_pengirim',
    'alamat_pengirim',
    'estimasi_sampai',
    'tanggalpengiriman'
  ], req.body)) {
    return;
  }

  try {
    if (useMysql) {
      const result = await queryMysql(
        'INSERT INTO `order` (idpelanggan, idkurir, idgudang, nama_pengirim, no_hp_pengirim, alamat_pengirim, estimasi_sampai, tanggalpengiriman) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          idpelanggan,
          idkurir,
          idgudang,
          nama_pengirim.trim(),
          no_hp_pengirim.trim(),
          alamat_pengirim.trim(),
          estimasi_sampai,
          tanggalpengiriman
        ]
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
        tanggalpengiriman
      });
    }

    const customer = store.listCustomers().find((c) => c.idpelanggan === Number(idpelanggan));
    const courier = store.listCouriers().find((k) => k.idkurir === Number(idkurir));
    const warehouse = store.listWarehouses().find((g) => g.idgudang === Number(idgudang));

    const newOrder = store.createOrder({
      pelanggan: customer ? customer.nama : `Pelanggan #${idpelanggan}`,
      kurir: courier ? courier.nama : `Kurir #${idkurir}`,
      gudang: warehouse ? warehouse.namagudang : `Gudang #${idgudang}`,
      status: 'Diproses',
      total: `Rp ${(Math.floor(Math.random() * 8) + 2) * 50000 + 35000}`,
      tanggal: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(tanggalpengiriman))
    });

    return res.status(201).json(newOrder);
  } catch (error) {
    return sendError(res, 'Gagal membuat data pengiriman.', error);
  }
});

app.get('/api/barangs', async (req, res) => {
  try {
    if (useMysql) {
      const results = await queryMysql('CALL BarangPelanggan()');
      return res.json(results[0]);
    }

    return res.json(store.listItems());
  } catch (error) {
    return sendError(res, 'Gagal memuat data barang.', error);
  }
});

app.post('/api/barangs', async (req, res) => {
  const { idpengiriman, nama_barang, berat } = req.body || {};

  if (!validateFields(res, ['idpengiriman', 'nama_barang', 'berat'], req.body)) {
    return;
  }

  try {
    if (useMysql) {
      const cleanId = typeof idpengiriman === 'string' && idpengiriman.startsWith('ORD-')
        ? idpengiriman.replace('ORD-', '')
        : idpengiriman;

      const result = await queryMysql(
        'INSERT INTO barang (idpengiriman, nama_barang, berat) VALUES (?, ?, ?)',
        [cleanId, nama_barang.trim(), berat]
      );

      return res.status(201).json({
        idbarang: result.insertId,
        idpengiriman: cleanId,
        nama_barang: nama_barang.trim(),
        berat: Number(berat)
      });
    }

    const order = store.listOrders().find((o) => o.idpengiriman === idpengiriman);

    const newItem = store.createItem({
      nama: nama_barang.trim(),
      pelanggan: order ? order.pelanggan : 'Umum',
      kategori: 'Logistik',
      jumlah: 1,
      lokasi: order ? order.gudang : 'Gudang Utama Jakarta',
      status: 'Tersedia'
    });

    return res.status(201).json(newItem);
  } catch (error) {
    return sendError(res, 'Gagal menambahkan data barang.', error);
  }
});

// ── PUT & DELETE: Pelanggan ──

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, alamat, notelepon } = req.body || {};
  if (!validateFields(res, ['nama', 'alamat', 'notelepon'], req.body)) return;

  try {
    if (useMysql) {
      await queryMysql('UPDATE customer SET nama=?, alamat=?, notelepon=? WHERE idpelanggan=?', [nama.trim(), alamat.trim(), notelepon.trim(), id]);
      return res.json({ idpelanggan: Number(id), nama: nama.trim(), alamat: alamat.trim(), notelepon: notelepon.trim() });
    }
    const updated = store.updateCustomer(id, { nama, alamat, notelepon });
    if (!updated) return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
    return res.json(updated);
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data pelanggan.', error);
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (useMysql) {
      await queryMysql('DELETE FROM customer WHERE idpelanggan=?', [id]);
      return res.json({ message: 'Pelanggan berhasil dihapus.' });
    }
    const deleted = store.deleteCustomer(id);
    if (!deleted) return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
    return res.json({ message: 'Pelanggan berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data pelanggan.', error);
  }
});

// ── PUT & DELETE: Kurir ──

app.put('/api/kurirs/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, notelepon, kendaraan } = req.body || {};
  if (!validateFields(res, ['nama', 'notelepon', 'kendaraan'], req.body)) return;

  try {
    if (useMysql) {
      await queryMysql('UPDATE kurir SET nama=?, notelepon=?, kendaraan=? WHERE idkurir=?', [nama.trim(), notelepon.trim(), kendaraan.trim(), id]);
      return res.json({ idkurir: Number(id), nama: nama.trim(), notelepon: notelepon.trim(), kendaraan: kendaraan.trim() });
    }
    const updated = store.updateCourier(id, { nama, notelepon, kendaraan });
    if (!updated) return res.status(404).json({ message: 'Kurir tidak ditemukan.' });
    return res.json(updated);
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data kurir.', error);
  }
});

app.delete('/api/kurirs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (useMysql) {
      await queryMysql('DELETE FROM kurir WHERE idkurir=?', [id]);
      return res.json({ message: 'Kurir berhasil dihapus.' });
    }
    const deleted = store.deleteCourier(id);
    if (!deleted) return res.status(404).json({ message: 'Kurir tidak ditemukan.' });
    return res.json({ message: 'Kurir berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data kurir.', error);
  }
});

// ── PUT & DELETE: Gudang ──

app.put('/api/gudangs/:id', async (req, res) => {
  const { id } = req.params;
  const { namagudang, alamat, kota } = req.body || {};
  if (!validateFields(res, ['namagudang', 'alamat', 'kota'], req.body)) return;

  try {
    if (useMysql) {
      await queryMysql('UPDATE gudang SET namagudang=?, alamat=?, kota=? WHERE idgudang=?', [namagudang.trim(), alamat.trim(), kota.trim(), id]);
      return res.json({ idgudang: Number(id), namagudang: namagudang.trim(), alamat: alamat.trim(), kota: kota.trim() });
    }
    const updated = store.updateWarehouse(id, { namagudang, alamat, kota });
    if (!updated) return res.status(404).json({ message: 'Gudang tidak ditemukan.' });
    return res.json(updated);
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data gudang.', error);
  }
});

app.delete('/api/gudangs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (useMysql) {
      await queryMysql('DELETE FROM gudang WHERE idgudang=?', [id]);
      return res.json({ message: 'Gudang berhasil dihapus.' });
    }
    const deleted = store.deleteWarehouse(id);
    if (!deleted) return res.status(404).json({ message: 'Gudang tidak ditemukan.' });
    return res.json({ message: 'Gudang berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data gudang.', error);
  }
});

// ── PUT & DELETE: Barang ──

app.put('/api/barangs/:id', async (req, res) => {
  const { id } = req.params;
  const { nama_barang, berat } = req.body || {};
  if (!validateFields(res, ['nama_barang', 'berat'], req.body)) return;

  try {
    if (useMysql) {
      await queryMysql('UPDATE barang SET nama_barang=?, berat=? WHERE idbarang=?', [nama_barang.trim(), berat, id]);
      return res.json({ idbarang: Number(id), nama_barang: nama_barang.trim(), berat: Number(berat) });
    }
    const updated = store.updateItem(id, { nama_barang, berat });
    if (!updated) return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    return res.json(updated);
  } catch (error) {
    return sendError(res, 'Gagal memperbarui data barang.', error);
  }
});

app.delete('/api/barangs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (useMysql) {
      await queryMysql('DELETE FROM barang WHERE idbarang=?', [id]);
      return res.json({ message: 'Barang berhasil dihapus.' });
    }
    const deleted = store.deleteItem(id);
    if (!deleted) return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    return res.json({ message: 'Barang berhasil dihapus.' });
  } catch (error) {
    return sendError(res, 'Gagal menghapus data barang.', error);
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (${useMysql ? 'mysql' : 'dummy'} mode)`);
});
