# Panduan Deploy - Baju Bodo POS

Panduan lengkap untuk deploy aplikasi ke **Supabase + GitHub + Vercel**.

---

## 1. Setup Supabase (Database)

### 1.1 Buat Akun & Project
1. Buka [https://supabase.com](https://supabase.com) → Sign up dengan GitHub/Google
2. Klik **New project**, isi:
   - **Name**: `baju-bodo-pos`
   - **Database Password**: catat dan simpan!
   - **Region**: `Southeast Asia (Singapore)`
3. Tunggu ~2 menit hingga project siap

### 1.2 Jalankan SQL Schema (HANYA 1 FILE)
1. Buka **SQL Editor** di sidebar → klik **New query**
2. Copy SEMUA isi file `SUPABASE_SCHEMA.sql`
3. Paste ke SQL Editor → klik **Run**
4. Pastikan muncul **"Success"**

> ⚠️ **CATATAN**: File `LICENSE_SCHEMA.sql` sudah TIDAK DIGUNAKAN.
> Cukup jalankan `SUPABASE_SCHEMA.sql` saja — semua tabel sudah ada di dalamnya.

### 1.3 Catat API Keys
1. Klik **Settings** (ikon gear) → **API**
2. Catat:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.4 Verifikasi Tabel
Buka **Table Editor** → pastikan 6 tabel ini ada:
- `users` (kosong — admin dibuat saat Setup Wizard)
- `products` (kosong — produk ditambahkan manual)
- `transactions` (kosong)
- `store_settings` (1 baris)
- `licenses` (kosong — diisi saat ada pembeli)
- `license_logs` (kosong)

---

## 2. Setup GitHub (Repository)

### 2.1 Buat Repository Private
1. Buka [https://github.com](https://github.com) → Login
2. Klik **+** → **New repository**
3. Isi nama: `baju-bodo-pos` → pilih **Private** → **Create repository**

### 2.2 Konfigurasi Kode Sebelum Push

**A. Ganti Owner Password** — buka `src/lib/license.ts`, cari:
```typescript
const OWNER_PASSWORD = 'GANTI_PASSWORD_ANDA_DISINI';
```
Ganti dengan password kuat buatan Anda.

**B. Ganti Nomor WhatsApp** — buka `src/components/LicenseGuard.tsx`, cari semua:
```
NOMOR_WA_ANDA
```
Ganti dengan nomor WhatsApp Anda (ada 2 tempat).

**C. Ganti Kunci Darurat** — buka `src/store/index.ts`, cari semua:
```typescript
const EMERGENCY_KEY = 'GANTI_KUNCI_DARURAT_ANDA_DISINI';
```
Ganti dengan kunci rahasia Anda (ada 2 tempat). Contoh: `TOKO-ANDA-RESET-2025`

### 2.3 Buat file .env
```bash
cp .env.example .env
# Edit .env dan isi dengan Supabase keys
```

### 2.4 Push Code
```bash
cd baju-bodo-pos
git init
git add .
git commit -m "Initial commit - Baju Bodo POS"
git remote add origin https://github.com/USERNAME/baju-bodo-pos.git
git branch -M main
git push -u origin main
```

> ⚠️ File `.env` sudah otomatis diabaikan oleh `.gitignore` — aman!

---

## 3. Setup Vercel (Hosting)

### 3.1 Buat Akun & Import Project
1. Buka [https://vercel.com](https://vercel.com) → Sign Up dengan GitHub
2. Klik **Add New...** → **Project** → pilih `baju-bodo-pos` → **Import**

### 3.2 Konfigurasi Build
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3.3 Tambahkan Environment Variables
| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 3.4 Deploy
1. Klik **Deploy** → tunggu ~2 menit
2. URL aplikasi siap: `https://baju-bodo-pos.vercel.app`

---

## 4. Testing Setelah Deploy

1. Buka URL aplikasi → **Setup Wizard** muncul → isi nama toko & buat akun admin
2. Login → buka **Dashboard** → pastikan status **Supabase Connected**
3. Buka URL `#/license-manager` → masukkan Owner Password → License Manager terbuka
4. Buat 1 lisensi test → aktivasi di tab incognito → pastikan berhasil
5. Test revoke lisensi → pastikan akses langsung ditolak

---

## 5. Troubleshooting

### Build gagal di Vercel
- Pastikan env vars sudah diisi SEBELUM deploy
- Coba Redeploy: Vercel Dashboard → Deployments → ··· → Redeploy

### Tabel tidak muncul di Supabase
- Pastikan hanya `SUPABASE_SCHEMA.sql` yang dijalankan
- Jika ada error "already exists", jalankan SQL ini dulu:
  ```sql
  DROP TABLE IF EXISTS license_logs, licenses, store_settings, transactions, products, users CASCADE;
  ```
  Lalu jalankan ulang `SUPABASE_SCHEMA.sql`

### Supabase tidak terhubung (Mode Lokal)
- Cek apakah env vars sudah benar di Vercel
- Redeploy setelah menambahkan env vars

### Lisensi tidak bisa diaktifkan
- Pastikan Supabase terhubung (bukan Mode Lokal)
- Pastikan kunci lisensi yang dimasukkan benar (perhatikan huruf kapital)

---

*Baju Bodo POS — Sistem Kasir Profesional untuk Baju Tradisional Bugis Makassar*
