const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'dummy-db.json');

const seedStore = {
  users: [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      name: 'Ayu Permata',
      role: 'Administrator',
    },
    {
      id: 2,
      username: 'operator',
      password: 'operator123',
      name: 'Raka Pratama',
      role: 'Operator',
    },
  ],
  customers: [
    {
      idpelanggan: 1,
      nama: 'Siti Aminah',
      alamat: 'Jl. Cempaka No. 10, Jakarta',
      notelepon: '08123456789',
    },
    {
      idpelanggan: 2,
      nama: 'PT Sinar Jaya',
      alamat: 'Jl. Gatot Subroto No. 88, Jakarta Selatan',
      notelepon: '0215551234',
    },
    {
      idpelanggan: 3,
      nama: 'Toko Maju',
      alamat: 'Jl. Merdeka No. 21, Bandung',
      notelepon: '081299887766',
    },
  ],
  couriers: [
    {
      idkurir: 1,
      nama: 'Budi Santoso',
      notelepon: '081212345678',
      kendaraan: 'Motor Box',
    },
    {
      idkurir: 2,
      nama: 'Rina Wulandari',
      notelepon: '081377788899',
      kendaraan: 'Mobil Van',
    },
    {
      idkurir: 3,
      nama: 'Andi Pratama',
      notelepon: '081355566677',
      kendaraan: 'Motor Besar',
    },
  ],
  warehouses: [
    {
      idgudang: 1,
      namagudang: 'Gudang Utama Jakarta',
      alamat: 'Jl. Raya Industri No. 88',
      kota: 'Jakarta',
    },
    {
      idgudang: 2,
      namagudang: 'Gudang Barat Bandung',
      alamat: 'Jl. Soekarno Hatta No. 15',
      kota: 'Bandung',
    },
    {
      idgudang: 3,
      namagudang: 'Gudang Selatan Surabaya',
      alamat: 'Jl. Ahmad Yani No. 44',
      kota: 'Surabaya',
    },
  ],
  orders: [
    {
      idpengiriman: 'ORD-1001',
      tanggal: '12 Jun 2026',
      pelanggan: 'Siti Aminah',
      kurir: 'Budi Santoso',
      gudang: 'Gudang Utama Jakarta',
      status: 'Selesai',
      total: 'Rp 185.000',
    },
    {
      idpengiriman: 'ORD-1002',
      tanggal: '12 Jun 2026',
      pelanggan: 'PT Sinar Jaya',
      kurir: 'Rina Wulandari',
      gudang: 'Gudang Barat Bandung',
      status: 'Dalam perjalanan',
      total: 'Rp 960.000',
    },
    {
      idpengiriman: 'ORD-1003',
      tanggal: '13 Jun 2026',
      pelanggan: 'Toko Maju',
      kurir: 'Andi Pratama',
      gudang: 'Gudang Selatan Surabaya',
      status: 'Menunggu pickup',
      total: 'Rp 420.000',
    },
    {
      idpengiriman: 'ORD-1004',
      tanggal: '13 Jun 2026',
      pelanggan: 'CV Lestari',
      kurir: 'Budi Santoso',
      gudang: 'Gudang Utama Jakarta',
      status: 'Diproses',
      total: 'Rp 275.000',
    },
  ],
  items: [
    {
      idbarang: 'BRG-2001',
      nama: 'Karton Lipat',
      pelanggan: 'Siti Aminah',
      kategori: 'Kemasan',
      jumlah: 24,
      lokasi: 'Gudang Utama Jakarta',
      status: 'Siap kirim',
    },
    {
      idbarang: 'BRG-2002',
      nama: 'Label Barcode',
      pelanggan: 'PT Sinar Jaya',
      kategori: 'Aksesoris',
      jumlah: 180,
      lokasi: 'Gudang Barat Bandung',
      status: 'Tersedia',
    },
    {
      idbarang: 'BRG-2003',
      nama: 'Bubble Wrap',
      pelanggan: 'Toko Maju',
      kategori: 'Pengaman',
      jumlah: 60,
      lokasi: 'Gudang Selatan Surabaya',
      status: 'Diproses',
    },
    {
      idbarang: 'BRG-2004',
      nama: 'Pita Perekat',
      pelanggan: 'CV Lestari',
      kategori: 'Packing',
      jumlah: 48,
      lokasi: 'Gudang Utama Jakarta',
      status: 'Tersedia',
    },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function nextNumericId(rows, key) {
  return rows.reduce((max, row) => Math.max(max, Number(row[key]) || 0), 0) + 1;
}

function readStoreFile() {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const data = parsed && typeof parsed === 'object' ? parsed : {};

    return {
      ...clone(seedStore),
      ...data,
      users: Array.isArray(data.users) ? data.users : clone(seedStore.users),
      customers: Array.isArray(data.customers) ? data.customers : clone(seedStore.customers),
      couriers: Array.isArray(data.couriers) ? data.couriers : clone(seedStore.couriers),
      warehouses: Array.isArray(data.warehouses) ? data.warehouses : clone(seedStore.warehouses),
      orders: Array.isArray(data.orders) ? data.orders : clone(seedStore.orders),
      items: Array.isArray(data.items) ? data.items : clone(seedStore.items),
    };
  } catch {
    return clone(seedStore);
  }
}

let store = readStoreFile();

function persistStore() {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

function createCustomer(payload) {
  const customer = {
    idpelanggan: nextNumericId(store.customers, 'idpelanggan'),
    nama: normalizeText(payload.nama),
    alamat: normalizeText(payload.alamat),
    notelepon: normalizeText(payload.notelepon),
  };

  store.customers = [customer, ...store.customers];
  persistStore();
  return clone(customer);
}

function createCourier(payload) {
  const courier = {
    idkurir: nextNumericId(store.couriers, 'idkurir'),
    nama: normalizeText(payload.nama),
    notelepon: normalizeText(payload.notelepon),
    kendaraan: normalizeText(payload.kendaraan),
  };

  store.couriers = [courier, ...store.couriers];
  persistStore();
  return clone(courier);
}

function createWarehouse(payload) {
  const warehouse = {
    idgudang: nextNumericId(store.warehouses, 'idgudang'),
    namagudang: normalizeText(payload.namagudang),
    alamat: normalizeText(payload.alamat),
    kota: normalizeText(payload.kota),
  };

  store.warehouses = [warehouse, ...store.warehouses];
  persistStore();
  return clone(warehouse);
}

function login(payload) {
  const username = normalizeText(payload.username).toLowerCase();
  const password = normalizeText(payload.password);

  const user = store.users.find(
    (item) => item.username.toLowerCase() === username && item.password === password,
  );

  if (!user) {
    return null;
  }

  return {
    token: `demo-${user.username}-${user.id}`,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  };
}

function listCustomers() {
  return clone(store.customers);
}

function listCouriers() {
  return clone(store.couriers);
}

function listWarehouses() {
  return clone(store.warehouses);
}

function listOrders() {
  return clone(store.orders);
}

function listItems() {
  return clone(store.items);
}

function createOrder(payload) {
  const maxNum = store.orders.reduce((max, row) => {
    const match = String(row.idpengiriman).match(/^ORD-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1000);
  const nextId = `ORD-${maxNum + 1}`;

  const order = {
    idpengiriman: nextId,
    tanggal: payload.tanggal || new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()),
    pelanggan: normalizeText(payload.pelanggan),
    kurir: normalizeText(payload.kurir),
    gudang: normalizeText(payload.gudang),
    status: normalizeText(payload.status || 'Diproses'),
    total: normalizeText(payload.total || 'Rp 0'),
  };

  store.orders = [order, ...store.orders];
  persistStore();
  return clone(order);
}

function createItem(payload) {
  const maxNum = store.items.reduce((max, row) => {
    const match = String(row.idbarang).match(/^BRG-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 2000);
  const nextId = `BRG-${maxNum + 1}`;

  const item = {
    idbarang: nextId,
    nama: normalizeText(payload.nama),
    pelanggan: normalizeText(payload.pelanggan),
    kategori: normalizeText(payload.kategori || 'Umum'),
    jumlah: Number(payload.jumlah) || 1,
    lokasi: normalizeText(payload.lokasi),
    status: normalizeText(payload.status || 'Tersedia'),
  };

  store.items = [item, ...store.items];
  persistStore();
  return clone(item);
}

function updateCustomer(id, payload) {
  const idx = store.customers.findIndex((c) => c.idpelanggan === Number(id));
  if (idx === -1) return null;
  store.customers[idx] = { ...store.customers[idx], nama: normalizeText(payload.nama), alamat: normalizeText(payload.alamat), notelepon: normalizeText(payload.notelepon) };
  persistStore();
  return clone(store.customers[idx]);
}

function deleteCustomer(id) {
  const idx = store.customers.findIndex((c) => c.idpelanggan === Number(id));
  if (idx === -1) return false;
  store.customers.splice(idx, 1);
  persistStore();
  return true;
}

function updateCourier(id, payload) {
  const idx = store.couriers.findIndex((k) => k.idkurir === Number(id));
  if (idx === -1) return null;
  store.couriers[idx] = { ...store.couriers[idx], nama: normalizeText(payload.nama), notelepon: normalizeText(payload.notelepon), kendaraan: normalizeText(payload.kendaraan) };
  persistStore();
  return clone(store.couriers[idx]);
}

function deleteCourier(id) {
  const idx = store.couriers.findIndex((k) => k.idkurir === Number(id));
  if (idx === -1) return false;
  store.couriers.splice(idx, 1);
  persistStore();
  return true;
}

function updateWarehouse(id, payload) {
  const idx = store.warehouses.findIndex((g) => g.idgudang === Number(id));
  if (idx === -1) return null;
  store.warehouses[idx] = { ...store.warehouses[idx], namagudang: normalizeText(payload.namagudang), alamat: normalizeText(payload.alamat), kota: normalizeText(payload.kota) };
  persistStore();
  return clone(store.warehouses[idx]);
}

function deleteWarehouse(id) {
  const idx = store.warehouses.findIndex((g) => g.idgudang === Number(id));
  if (idx === -1) return false;
  store.warehouses.splice(idx, 1);
  persistStore();
  return true;
}

function updateItem(id, payload) {
  const idx = store.items.findIndex((b) => b.idbarang === id || b.idbarang === `BRG-${id}`);
  if (idx === -1) return null;
  store.items[idx] = { ...store.items[idx], nama: normalizeText(payload.nama_barang || payload.nama), pelanggan: normalizeText(payload.pelanggan || store.items[idx].pelanggan), kategori: normalizeText(payload.kategori || store.items[idx].kategori) };
  if (payload.berat !== undefined) store.items[idx].berat = Number(payload.berat);
  persistStore();
  return clone(store.items[idx]);
}

function deleteItem(id) {
  const idx = store.items.findIndex((b) => b.idbarang === id || b.idbarang === `BRG-${id}`);
  if (idx === -1) return false;
  store.items.splice(idx, 1);
  persistStore();
  return true;
}

module.exports = {
  createCustomer,
  createCourier,
  createWarehouse,
  listCustomers,
  listCouriers,
  listWarehouses,
  listOrders,
  listItems,
  createOrder,
  createItem,
  updateCustomer,
  deleteCustomer,
  updateCourier,
  deleteCourier,
  updateWarehouse,
  deleteWarehouse,
  updateItem,
  deleteItem,
  login,
};
