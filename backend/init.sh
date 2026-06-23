#!/usr/bin/env bash
set -euo pipefail

echo "=== LogistikApp — Database Setup ==="

if ! command -v mysql &>/dev/null; then
  echo "ERROR: MySQL CLI tidak ditemukan. Install MySQL dulu."
  exit 1
fi

echo "1. Membuat database + tabel + prosedur + seed data..."
mysql -u root -p < "$(dirname "$0")/logistik_db.sql"

echo "2. Instalasi dependensi backend..."
npm install

echo ""
echo "=== Selesai! ==="
echo ""
echo "Jalankan backend:"
echo "  cd backend && npm start"
echo ""
echo "Login: admin@admin.com / admin123"
