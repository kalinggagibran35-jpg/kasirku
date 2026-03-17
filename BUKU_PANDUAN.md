# 📖 BUKU PANDUAN INSTALASI & PENGGUNAAN
## Aplikasi Kasir Baju Bodo POS System

**Versi:** 2.0  
**Tanggal:** 2024  

---

## 📑 DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Persyaratan Sistem](#2-persyaratan-sistem)
3. [Instalasi Langkah Demi Langkah](#3-instalasi-langkah-demi-langkah)
4. [Setup Pertama Kali](#4-setup-pertama-kali)
5. [Login & Manajemen Akun](#5-login--manajemen-akun)
6. [Panduan Penggunaan Fitur](#6-panduan-penggunaan-fitur)
7. [Pengelolaan Database (Supabase)](#7-pengelolaan-database-supabase)
8. [Deploy ke Vercel + GitHub](#8-deploy-ke-vercel--github)
9. [Troubleshooting](#9-troubleshooting)
10. [Keamanan](#10-keamanan)
11. [FAQ](#11-faq)
12. [Kontak & Dukungan](#12-kontak--dukungan)

---

## 1. PENDAHULUAN

### 1.1 Apa itu Baju Bodo POS?

Baju Bodo POS adalah aplikasi kasir (Point of Sale) profesional yang dirancang khusus untuk bisnis jual beli dan penyewaan Baju Bodo serta pakaian tradisional Bugis Makassar. Aplikasi ini berbasis web dan bisa diakses dari browser manapun.

### 1.2 Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🛒 **Kasir / POS** | Transaksi penjualan dan penyewaan |
| 📦 **Manajemen Produk** | CRUD produk dengan gambar, diskon, kategori |
| 📅 **Penyewaan** | Tracking sewa, pengembalian, denda |
| 📋 **Riwayat Transaksi** | Semua transaksi dengan filter & export |
| 👥 **Multi User** | Akun Admin dan Kasir dengan hak akses berbeda |
| 🏷️ **Diskon** | Diskon per item yang bisa diatur |
| 📱 **PWA** | Install di HP seperti aplikasi native |
| ☁️ **Cloud Sync** | Sinkronisasi data ke Supabase |
| 📊 **Import/Export Excel** | Import produk massal dari spreadsheet |
| 🧾 **Cetak Struk** | Struk pembayaran yang bisa dicetak |
| 🔐 **Keamanan** | Password terenkripsi SHA-256 |

### 1.3 Teknologi

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Database:** Supabase (PostgreSQL) + localStorage
- **Hosting:** Vercel (gratis)
- **PWA:** Service Worker + Web Manifest

---

## 2. PERSYARATAN SISTEM

### 2.1 Untuk Pengguna (Mengakses Aplikasi)

| Persyaratan | Keterangan |
|-------------|------------|
| **Browser** | Chrome 80+, Safari 14+, Firefox 80+, Edge 80+ |
| **Internet** | Diperlukan untuk pertama kali & sync cloud |
| **Layar** | Minimal 360px (HP), optimal 1024px+ (desktop) |

### 2.2 Untuk Pengembang/Instalasi

| Persyaratan | Keterangan |
|-------------|------------|
| **Node.js** | Versi 18 atau lebih baru |
| **npm** | Versi 8 atau lebih baru |
| **Git** | Untuk push ke GitHub |
| **Akun GitHub** | Gratis — github.com |
| **Akun Supabase** | Gratis — supabase.com |
| **Akun Vercel** | Gratis — vercel.com |

---

## 3. INSTALASI LANGKAH DEMI LANGKAH

### 3.1 Download & Setup Project

```bash
# 1. Clone atau download project
git clone https://github.com/USERNAME/baju-bodo-pos.git
cd baju-bodo-pos

# 2. Install dependencies
npm install

# 3. Jalankan di mode development
npm run dev
```

Buka browser dan akses `http://localhost:5173`

### 3.2 Setup Supabase (Database Cloud)

#### Langkah 1: Buat Akun Supabase
1. Buka https://supabase.com
2. Klik **"Start your project"**
3. Login dengan akun GitHub
4. Klik **"New Project"**
5. Isi:
   - **Name:** `baju-bodo-pos`
   - **Database Password:** (CATAT! Ini password database)
   - **Region:** Southeast Asia (Singapore)
6. Klik **"Create new project"**
7. Tunggu hingga project selesai dibuat (1-2 menit)

#### Langkah 2: Buat Tabel Database
1. Di Supabase Dashboard, klik **"SQL Editor"** di sidebar kiri
2. Klik **"New query"**
3. Copy-paste SELURUH isi file `SUPABASE_SCHEMA.sql` dari project
4. Klik **"Run"**
5. Pastikan semua query berhasil (tidak ada error merah)

#### Langkah 3: Catat API Keys
1. Di Supabase Dashboard, klik **"Settings"** (⚙️) di sidebar kiri
2. Klik **"API"** di sub-menu
3. Catat 2 informasi ini:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOi...` (string panjang)
4. Simpan kedua info ini — akan digunakan di langkah berikutnya

#### Langkah 4: Buat File Environment
1. Di folder project, buat file baru bernama `.env`
2. Isi dengan:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```
3. Ganti `xxxxx` dengan URL project Anda
4. Ganti `eyJhbGciOi...` dengan anon key Anda

### 3.3 Build untuk Production

```bash
# Build
npm run build

# Preview hasil build
npm run preview
```

---

## 4. SETUP PERTAMA KALI

### 4.1 Setup Wizard

Saat **pertama kali** membuka aplikasi (belum ada akun apapun), Anda akan melihat **Setup Wizard** yang terdiri dari 3 langkah:

#### Langkah 1: Informasi Toko
Isi data toko Anda:
- **Nama Toko** ✅ (WAJIB) — contoh: "Bundo Baju Bodo"
- **Tagline** — contoh: "Jual Beli & Penyewaan Baju Tradisional"
- **Alamat** — contoh: "Jl. Somba Opu No. 123, Makassar"
- **Telepon** — contoh: "0811-2345-6789"
- **Email** — contoh: "info@bundobajubodo.com"

> 💡 Semua informasi ini bisa diubah nanti di menu **Pengaturan Toko**

#### Langkah 2: Buat Akun Admin
Buat akun Administrator pertama:
- **Nama Lengkap** ✅ — contoh: "Andi Baso"
- **Username** ✅ — minimal 3 karakter, contoh: "admin"
- **Password** ✅ — minimal 6 karakter

> ⚠️ **PENTING:** Catat dan simpan username & password ini di tempat yang aman!

#### Langkah 3: Selesai
Wizard menampilkan ringkasan. Klik **"Mulai Menggunakan Aplikasi"** untuk lanjut ke halaman Login.

### 4.2 Login Pertama Kali

1. Masukkan **Username** yang dibuat di Setup Wizard
2. Masukkan **Password** yang dibuat di Setup Wizard
3. Klik **"Masuk"**
4. Anda akan masuk ke **Dashboard**

### 4.3 Langkah Selanjutnya Setelah Login

| Urutan | Langkah | Menu |
|--------|---------|------|
| 1 | Atur logo & info toko | Pengaturan Toko |
| 2 | Tambah produk | Produk |
| 3 | Buat akun kasir (jika perlu) | Pengguna |
| 4 | Mulai transaksi! | Kasir / POS |

---

## 5. LOGIN & MANAJEMEN AKUN

### 5.1 Cara Login

1. Buka aplikasi di browser
2. Di halaman Login:
   - Masukkan **Username**
   - Masukkan **Password**
   - Klik **"Masuk"**
3. Jika berhasil → masuk ke Dashboard
4. Jika gagal → muncul pesan error

### 5.2 Lupa Password

Jika Anda lupa password:

1. Di halaman Login, klik **"Lupa Password?"**
2. Pilih opsi:

#### Opsi A: Reset Password (Data Tetap Aman)
- Masukkan **Kunci Darurat**
- Pilih **username** yang ingin direset
- Buat **password baru**
- Klik **"Reset Password"**
- Login dengan password baru

#### Opsi B: Factory Reset (Hapus Semua Data)
- ⚠️ **PERINGATAN:** Ini menghapus SEMUA data lokal!
- Masukkan **Kunci Darurat**
- Buat **akun admin baru**
- Klik **"Factory Reset & Buat Akun Baru"**
- Semua data lokal dihapus, mulai dari awal

### 5.3 Kunci Darurat (Emergency Key)

```
Kunci Default: GANTI_KUNCI_DARURAT_ANDA_DISINI
```

> ⚠️ **SANGAT PENTING:**
> - Catat kunci ini dan simpan di tempat yang AMAN
> - Jangan berikan ke sembarang orang
> - Kunci ini adalah "master key" untuk recovery
> - Hubungi pengembang untuk mengganti kunci ini

### 5.4 Membuat Akun Baru (Admin Only)

1. Login sebagai **Admin**
2. Buka menu **Pengguna** di sidebar
3. Klik **"+ Tambah Pengguna"**
4. Isi:
   - **Nama Lengkap**
   - **Username** (minimal 3 karakter, harus unik)
   - **Password** (minimal 6 karakter)
   - **Role:** Admin atau Kasir
5. Klik **"Simpan"**
6. Beritahu username & password ke pengguna baru

### 5.5 Perbedaan Hak Akses

| Fitur | Admin | Kasir |
|-------|-------|-------|
| Dashboard | ✅ | ✅ |
| Kasir / POS | ✅ | ✅ |
| Lihat Produk | ✅ | ✅ |
| Tambah/Edit/Hapus Produk | ✅ | ❌ |
| Import/Export Excel | ✅ | ❌ |
| Penyewaan (pengembalian) | ✅ | ✅ |
| Riwayat Transaksi | ✅ | ✅ |
| Kelola Pengguna | ✅ | ❌ |
| Pengaturan Toko | ✅ | ❌ |
| Bantuan | ✅ | ✅ |

---

## 6. PANDUAN PENGGUNAAN FITUR

### 6.1 Dashboard

Dashboard menampilkan ringkasan bisnis Anda:
- **Pendapatan Hari Ini** — total penjualan + penyewaan hari ini
- **Penjualan Hari Ini** — pendapatan dari penjualan
- **Penyewaan Hari Ini** — pendapatan dari penyewaan
- **Transaksi Hari Ini** — jumlah transaksi
- **Total Produk Aktif** — produk yang tersedia
- **Sewa Aktif** — produk yang sedang disewakan
- **Sewa Terlambat** — sewaan yang melewati tanggal pengembalian
- **Stok Menipis** — produk dengan stok ≤ 3

### 6.2 Kasir / POS

#### Mode Penjualan (JUAL)
1. Pastikan mode **"Jual"** aktif (toggle biru)
2. **Cari produk** menggunakan kolom pencarian
3. **Filter kategori** untuk mempersempit pilihan
4. **Klik kartu produk** untuk menambahkan ke keranjang
5. Di keranjang:
   - Atur **jumlah** dengan tombol +/-
   - Ubah **diskon** per item jika perlu
6. Klik **"Proses Pembayaran"**
7. Masukkan **jumlah uang** yang dibayar pelanggan
   - Gunakan tombol quick-amount (Rp 50rb, 100rb, dll) untuk mempercepat
8. Klik **"Bayar Sekarang"**
9. **Struk** muncul → klik **"Cetak Struk"** untuk mencetak

#### Mode Penyewaan (SEWA)
1. Toggle ke mode **"Sewa"** (warna ungu)
2. Harga otomatis berubah ke **harga sewa**
3. Tambah produk ke keranjang
4. Atur **durasi sewa** per item (dalam hari)
5. Isi **data penyewa**:
   - Nama penyewa
   - Nomor telepon penyewa
6. Proses pembayaran sama seperti penjualan

### 6.3 Produk

#### Menambah Produk Manual
1. Menu **Produk** → klik **"+ Tambah Produk"**
2. Isi form:
   - **Nama Produk** ✅ (wajib)
   - **Kategori** ✅ (Baju Bodo / Sarung Sutera / Aksesori / Paket Lengkap / Lainnya)
   - **Harga Jual** ✅
   - **Harga Sewa** (per hari)
   - **Stok** ✅
   - **Ukuran** (S / M / L / XL / XXL / All Size)
   - **Warna**
   - **Diskon** (0-100%)
   - **Gambar** (upload file atau URL)
   - **Status** (Aktif / Nonaktif)
3. Klik **"Simpan"**

#### Import dari Excel
1. Klik ikon **Download Template** (⬇) untuk dapatkan template
2. Buka template di Excel / Google Sheets
3. Isi data produk sesuai kolom:
   | Kolom | Contoh |
   |-------|--------|
   | Nama Produk | Baju Bodo Merah |
   | Kategori | Baju Bodo |
   | Harga Jual | 500000 |
   | Harga Sewa | 150000 |
   | Stok | 10 |
   | Ukuran | M |
   | Warna | Merah |
   | Deskripsi | Baju bodo tradisional |
   | Diskon (%) | 10 |
   | URL Gambar | https://... |
   | Status | Aktif |
4. Simpan file Excel
5. Kembali ke aplikasi → klik ikon **Upload** (⬆)
6. Pilih file → preview muncul
7. Periksa data, perbaiki jika ada error
8. Klik **"Import"**

#### Export ke Excel
- Klik ikon **Spreadsheet** (📊) untuk export semua produk ke file Excel

### 6.4 Penyewaan

#### Melihat Daftar Sewa
- Menu **Penyewaan** menampilkan semua transaksi sewa
- Filter berdasarkan status: Aktif / Terlambat / Dikembalikan

#### Mengembalikan Sewaan
1. Cari transaksi sewa yang statusnya **"Aktif"** atau **"Terlambat"**
2. Klik tombol **"Kembalikan"**
3. Konfirmasi pengembalian
4. Stok produk otomatis **bertambah kembali**
5. Status berubah menjadi **"Dikembalikan"**

### 6.5 Riwayat Transaksi

- **Filter:** Tampilkan berdasarkan tipe (Jual/Sewa/Semua) dan tanggal
- **Pencarian:** Cari berdasarkan ID transaksi atau nama pelanggan
- **Detail:** Klik transaksi untuk melihat detail item
- **Export:** Download riwayat ke file CSV

### 6.6 Pengaturan Toko (Admin Only)

#### Mengganti Logo
1. Menu **Pengaturan Toko**
2. Di bagian "Logo Toko":
   - **Upload file:** Klik area upload atau drag & drop (max 5MB)
   - **URL:** Masukkan link gambar
3. Klik **"Simpan Pengaturan"**
4. Logo akan muncul di: Sidebar, Login, Struk

#### Mengganti Nama Toko
1. Menu **Pengaturan Toko**
2. Di bagian "Identitas Toko":
   - Ubah **Nama Toko**
   - Ubah **Tagline**
3. Klik **"Simpan Pengaturan"**

#### Informasi Kontak
- **Alamat** — tampil di struk
- **Telepon** — tampil di struk
- **Email** — referensi kontak
- **Pesan Footer Struk** — pesan di bagian bawah struk

### 6.7 Halaman Bantuan

- Tersedia untuk **semua pengguna** (Admin & Kasir)
- Berisi panduan lengkap setiap fitur
- FAQ (Pertanyaan yang Sering Ditanyakan)
- Informasi keamanan dan kunci darurat

---

## 7. PENGELOLAAN DATABASE (SUPABASE)

### 7.1 Tanpa Supabase (Mode Lokal)

Jika Anda **tidak** mengonfigurasi Supabase:
- ✅ Semua fitur tetap berfungsi 100%
- ⚠️ Data hanya tersimpan di **browser** (localStorage)
- ⚠️ Data hilang jika browser di-clear atau ganti perangkat
- ✅ Cocok untuk: testing, demo, penggunaan 1 perangkat

### 7.2 Dengan Supabase (Mode Cloud)

Jika Anda mengonfigurasi Supabase:
- ✅ Data tersimpan di **cloud** (PostgreSQL)
- ✅ Bisa diakses dari **perangkat manapun**
- ✅ Data aman meskipun browser di-clear
- ✅ Auto-sync setiap kali ada perubahan data
- ✅ Cocok untuk: production, multi-perangkat

### 7.3 Cara Kerja Sinkronisasi

```
┌─────────────┐      ┌──────────────┐
│  Browser    │      │  Supabase    │
│  localStorage│ ←──→ │  PostgreSQL  │
└─────────────┘      └──────────────┘
     ↑ BACA              ↑ SYNC
     ↓ TULIS             ↓ BACKUP
```

1. **App dibuka** → data diambil dari Supabase → disimpan ke localStorage
2. **Baca data** → dari localStorage (cepat, offline-capable)
3. **Tulis data** → simpan ke localStorage + kirim ke Supabase (background)

### 7.4 Status Database

Cek status koneksi di:
- **Dashboard** — badge "Supabase Connected" atau "Mode Lokal"
- **Pengaturan** → bagian "Status Database"

---

## 8. DEPLOY KE VERCEL + GITHUB

### 8.1 Push ke GitHub

```bash
# 1. Inisialisasi Git (jika belum)
git init

# 2. Tambahkan semua file
git add .

# 3. Commit
git commit -m "Initial commit - Baju Bodo POS"

# 4. Buat repository di GitHub (github.com/new)
#    Nama: baju-bodo-pos
#    Visibility: Private (PENTING!)

# 5. Hubungkan & push
git remote add origin https://github.com/USERNAME/baju-bodo-pos.git
git branch -M main
git push -u origin main
```

> ⚠️ **PENTING:** Pastikan repository di-set **Private** agar kode tidak bisa dilihat publik!

### 8.2 Deploy ke Vercel

1. Buka https://vercel.com
2. Login dengan akun GitHub
3. Klik **"Add New Project"**
4. Pilih repository **baju-bodo-pos** dari daftar
5. Di bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` = URL Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` = Anon Key Supabase Anda
6. Klik **"Deploy"**
7. Tunggu hingga deploy selesai (1-3 menit)
8. Vercel akan memberikan URL seperti: `https://baju-bodo-pos.vercel.app`

### 8.3 Custom Domain (Opsional)

1. Di Vercel Dashboard → project → **Settings** → **Domains**
2. Tambahkan domain Anda (contoh: `pos.bundobajubodo.com`)
3. Ikuti instruksi DNS yang diberikan Vercel
4. Domain akan aktif dalam 24-48 jam

### 8.4 Auto-Deploy

Setiap kali Anda push ke branch `main` di GitHub, Vercel otomatis akan:
1. Mendeteksi perubahan
2. Build ulang
3. Deploy versi baru
4. URL tetap sama

---

## 9. TROUBLESHOOTING

### 9.1 Tidak Bisa Login

| Masalah | Solusi |
|---------|--------|
| "Username atau password salah" | Periksa caps lock, ketik ulang dengan hati-hati |
| Lupa password | Klik "Lupa Password?" → gunakan Kunci Darurat |
| Lupa username DAN password | Gunakan "Factory Reset" dengan Kunci Darurat |
| Tidak ada akun sama sekali | Buka aplikasi di browser baru → Setup Wizard muncul |

### 9.2 Data Tidak Muncul

| Masalah | Solusi |
|---------|--------|
| Produk/transaksi kosong | Belum ada data — tambahkan produk dulu |
| Data hilang | Kemungkinan localStorage di-clear → sync dari Supabase via Dashboard |
| Data tidak sync | Periksa koneksi internet → klik "Sync Cloud" di Dashboard |
| Supabase error | Periksa URL & Key di .env, jalankan ulang SQL Schema |

### 9.3 Aplikasi Tidak Bisa Diakses

| Masalah | Solusi |
|---------|--------|
| Halaman putih/blank | Clear cache browser, hard refresh (Ctrl+Shift+R) |
| Error 404 | Pastikan URL benar, periksa deploy di Vercel |
| Vercel build gagal | Periksa log build di Vercel Dashboard |
| "npm run build" gagal | Jalankan `npm install` ulang, periksa error |

### 9.4 Masalah Printer / Struk

| Masalah | Solusi |
|---------|--------|
| Struk tidak tercetak | Periksa koneksi printer, pastikan printer default sudah diset |
| Format struk berantakan | Gunakan printer thermal 58mm/80mm, atur margin di print dialog |
| Tombol cetak tidak muncul | Pastikan transaksi sudah selesai (sudah bayar) |

### 9.5 Reset Total (Jika Semua Gagal)

Jika semua cara di atas gagal, lakukan reset total:

1. Buka browser → buka Developer Tools (F12)
2. Klik tab **Application** → **Local Storage**
3. Klik kanan pada domain aplikasi → **Clear**
4. Refresh halaman
5. Setup Wizard akan muncul → buat akun baru

> ⚠️ Cara ini menghapus SEMUA data lokal. Data di Supabase tidak terpengaruh.

---

## 10. KEAMANAN

### 10.1 Password

- Semua password dienkripsi dengan **SHA-256** sebelum disimpan
- Password asli **tidak pernah** tersimpan
- Gunakan password yang kuat: minimal 8 karakter, kombinasi huruf besar, huruf kecil, angka, dan simbol

### 10.2 Kunci Darurat

```
Kunci Default: GANTI_KUNCI_DARURAT_ANDA_DISINI
```

**Rekomendasi keamanan:**
1. ✅ CATAT kunci ini dan simpan di tempat yang aman
2. ✅ Simpan terpisah dari perangkat aplikasi
3. ✅ Minta pengembang mengganti kunci default
4. ❌ JANGAN berikan ke orang yang tidak berwenang
5. ❌ JANGAN simpan di catatan HP yang bisa diakses orang lain

### 10.3 GitHub Repository

- ✅ Selalu set repository **Private**
- ✅ File `.env` sudah di-exclude oleh `.gitignore`
- ❌ JANGAN commit file `.env` ke GitHub
- ❌ JANGAN share URL & Key Supabase secara publik

### 10.4 Tips Keamanan Tambahan

1. Ganti password secara berkala (setiap 3 bulan)
2. Jangan gunakan password yang sama untuk akun lain
3. Logout setelah selesai menggunakan aplikasi
4. Jangan tinggalkan aplikasi terbuka tanpa pengawasan
5. Gunakan jaringan WiFi yang aman (bukan WiFi publik)

---

## 11. FAQ

### Q: Apakah aplikasi ini bisa diakses dari HP?
**A:** Ya! Aplikasi ini responsive dan bisa diakses dari browser HP manapun. Anda juga bisa "install" aplikasi ke home screen HP (fitur PWA).

### Q: Berapa banyak produk yang bisa ditambahkan?
**A:** Tidak ada batas jumlah produk. Anda bisa menambahkan sebanyak mungkin produk yang diperlukan.

### Q: Apakah data aman jika HP rusak/hilang?
**A:** Jika Anda menggunakan Supabase (mode cloud), data aman karena tersimpan di server. Jika hanya mode lokal, data akan hilang.

### Q: Bisa digunakan oleh beberapa kasir bersamaan?
**A:** Ya, jika menggunakan Supabase. Setiap kasir bisa login dari perangkat masing-masing dan data otomatis tersinkronisasi.

### Q: Apakah ada biaya bulanan?
**A:** Tidak ada biaya untuk aplikasinya. Supabase dan Vercel memiliki tier gratis yang cukup untuk bisnis kecil-menengah. Biaya mungkin muncul jika penggunaan melebihi batas gratis.

### Q: Bisa cetak struk dari HP?
**A:** Ya, tetapi memerlukan printer yang support Bluetooth atau WiFi printing. Cara cetak: Gunakan fitur Print browser (Ctrl+P atau menu Print).

### Q: Bagaimana jika internet mati saat sedang transaksi?
**A:** Transaksi tetap berjalan karena data disimpan ke localStorage terlebih dahulu. Saat internet kembali, data akan otomatis sync ke cloud.

### Q: Bisa tambah kategori produk baru?
**A:** Saat ini kategori sudah ditentukan: Baju Bodo, Sarung Sutera, Aksesori, Paket Lengkap, dan Lainnya. Kategori "Lainnya" bisa digunakan untuk produk di luar kategori utama.

---

## 12. KONTAK & DUKUNGAN

Jika Anda mengalami masalah atau membutuhkan bantuan:

1. **Baca Buku Panduan ini** terlebih dahulu
2. **Buka halaman Bantuan** di dalam aplikasi (menu Bantuan di sidebar)
3. **Periksa FAQ** di atas dan di halaman Bantuan
4. Jika masih belum terselesaikan, hubungi **penyedia/pengembang aplikasi**

---

## CATATAN PENTING

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  📝 CATAT INFORMASI BERIKUT DI TEMPAT YANG AMAN:    ║
║                                                       ║
║  1. Username Admin: _____________________             ║
║  2. Password Admin: _____________________             ║
║  3. Kunci Darurat:  GANTI_KUNCI_DARURAT_ANDA_DISINI        ║
║  4. Supabase URL:   _____________________             ║
║  5. Supabase Key:   _____________________             ║
║  6. URL Aplikasi:   _____________________             ║
║  7. GitHub Repo:    _____________________             ║
║                                                       ║
║  ⚠️ Jangan bagikan informasi ini ke orang lain!      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

**© 2024 Baju Bodo POS System — Semua Hak Dilindungi**
