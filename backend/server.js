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

app.post('/api/auth/login', (req, res) => {
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

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (${useMysql ? 'mysql' : 'dummy'} mode)`);
});
