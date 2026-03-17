# 🛒 Panduan Menjual Baju Bodo POS di Lynk.id

## 📋 Daftar Isi
1. [Persiapan Sebelum Jual](#1-persiapan-sebelum-jual)
2. [Setup Sistem Lisensi](#2-setup-sistem-lisensi)
3. [Model Penjualan](#3-model-penjualan-yang-disarankan)
4. [Cara Upload ke Lynk](#4-cara-upload-ke-lynk)
5. [Proses Penjualan](#5-proses-penjualan-setiap-ada-pembeli)
6. [Proteksi yang Sudah Diterapkan](#6-proteksi-yang-sudah-diterapkan)
7. [FAQ & Tips](#7-faq--tips)

---

## 1. Persiapan Sebelum Jual

### A. Setup Supabase (Wajib untuk Lisensi)

1. Buka [supabase.com](https://supabase.com) → Buat project baru
2. Buka **SQL Editor** → Jalankan HANYA `SUPABASE_SCHEMA.sql` (sudah mencakup semua tabel)
4. Catat:
   - `Project URL` → Ini jadi `VITE_SUPABASE_URL`
   - `Anon/public key` → Ini jadi `VITE_SUPABASE_ANON_KEY`

### B. Setup Vercel

1. Push kode ke GitHub (private repo!)
2. Buka [vercel.com](https://vercel.com) → Import repo
3. Set Environment Variables:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUz.....
   ```
4. Deploy

### C. Ganti Password Owner

Buka file `src/lib/license.ts`, cari baris:
```typescript
const OWNER_PASSWORD = 'GANTI_PASSWORD_ANDA_DISINI'; // Ganti ini!
```
Ganti dengan password Anda sendiri yang kuat.

### D. Ganti Info Kontak

Di file `src/components/LicenseGuard.tsx`, ganti:
- Nomor WhatsApp: `NOMOR_WA_ANDA` → nomor Anda
- Harga di pricing cards sesuai yang Anda tentukan

---

## 2. Setup Sistem Lisensi

### Cara Membuat Lisensi untuk Pembeli

1. Buka aplikasi → Masuk ke halaman aktivasi
2. Klik **"Owner Access"** di bagian bawah
3. Masukkan **Owner Password**
4. Anda akan masuk ke aplikasi dalam **Owner Mode**
5. Buka menu **Settings** → klik **"Buka License Manager"**
   Atau langsung akses: `https://domain-anda.vercel.app/#/license-manager`

### Di License Manager, Anda Bisa:
- ✅ **Buat Lisensi Baru** (auto-generate key + copy ke clipboard)
- 📋 **Lihat Semua Lisensi** (aktif, expired, revoked)
- ⏸️ **Tangguhkan Lisensi** (suspend sementara)
- 🚫 **Cabut Lisensi** (revoke permanen)
- 🔄 **Reset Domain** (jika pembeli ganti server)
- ⏰ **Perpanjang Masa Aktif** (+1, +6, +12 bulan)
- 🗑️ **Hapus Lisensi**

### Tier Lisensi

| Tier | Produk | User | Harga Saran |
|------|--------|------|-------------|
| **Starter** | 50 | 2 | Rp 299.000/tahun |
| **Professional** | 500 | 10 | Rp 599.000/tahun |
| **Enterprise** | Unlimited | Unlimited | Rp 1.499.000/tahun |

---

## 3. Model Penjualan yang Disarankan

### ✅ Model SaaS (PALING AMAN - Sangat Disarankan)

**Anda TIDAK menjual kode**, Anda menjual **akses/layanan**.

**Cara:**
1. Anda deploy SATU aplikasi di Vercel
2. Setiap pembeli mendapat **kunci lisensi** untuk aktivasi
3. Pembeli akses aplikasi via browser (URL yang sama)
4. Data setiap pembeli disimpan terpisah di Supabase
5. Pembeli bayar per tahun untuk perpanjangan

**Keuntungan:**
- ❌ Pembeli tidak pernah pegang kode
- ❌ Pembeli tidak bisa redistribute
- ✅ Anda punya kontrol penuh
- ✅ Passive income dari perpanjangan

### ⚠️ Model Download (Kurang Aman)

Jika terpaksa harus memberikan file build:
1. Build aplikasi dengan `npm run build`
2. Berikan HANYA folder `dist/` (file HTML yang sudah di-minify)
3. JANGAN berikan:
   - Source code (`src/`)
   - `package.json`
   - `node_modules/`
   - `.env`
   - File `.ts` / `.tsx`

---

## 4. Cara Upload ke Lynk

### Produk Digital di Lynk.id

1. Buka [lynk.id](https://lynk.id) → Buat akun / Login
2. Klik **"Tambah Produk"** → Pilih **"Produk Digital"**
3. Isi detail:

**Judul:**
```
Aplikasi Kasir / POS Baju Tradisional - Baju Bodo POS System
```

**Deskripsi:**
```
🏪 Aplikasi Kasir (POS) Profesional untuk Toko Baju Tradisional Bugis Makassar

Fitur Lengkap:
✅ Penjualan & Penyewaan Baju Bodo
✅ Multi-user (Admin & Kasir)
✅ Manajemen Produk dengan Gambar
✅ Diskon per Item
✅ Cetak Struk / Receipt
✅ Dashboard & Laporan
✅ Import/Export Excel
✅ PWA (Install di HP)
✅ Cloud Database (Supabase)
✅ Custom Logo & Branding

Paket Tersedia:
⭐ Starter - Rp 299.000/tahun (50 produk, 2 user)
💎 Professional - Rp 599.000/tahun (500 produk, 10 user)  
👑 Enterprise - Rp 1.499.000/tahun (Unlimited)

Setelah pembelian, Anda akan mendapat:
📧 Kunci lisensi via email
🔗 Link akses aplikasi
📖 Panduan penggunaan
💬 Support via WhatsApp
```

4. **File yang diupload**: Buat PDF panduan penggunaan (BUKAN source code)
5. Set harga sesuai tier
6. Publish!

---

## 5. Proses Penjualan (Setiap Ada Pembeli)

### Alur Kerja:

```
Pembeli order di Lynk
       ↓
Anda terima notifikasi
       ↓
Buka License Manager (#/license-manager)
       ↓
Klik "Buat Lisensi Baru"
       ↓
Isi nama, email, tier pembeli
       ↓
Kunci lisensi otomatis di-copy
       ↓
Kirim kunci lisensi ke pembeli via WhatsApp/Email
       ↓
Pembeli buka link aplikasi → Masukkan kunci → Aktif!
```

### Template Pesan ke Pembeli:

```
Halo [Nama]! 👋

Terima kasih sudah membeli Baju Bodo POS System 🎉

Berikut informasi akses Anda:

🔗 Link Aplikasi: https://[domain].vercel.app
🔑 Kunci Lisensi: PRO-XXXX-XXXX-XXXX-0000

📖 Cara Aktivasi:
1. Buka link di atas
2. Masukkan kunci lisensi
3. Klik "Aktivasi Sekarang"
4. Login dengan:
   - Username: admin
   - Password: admin123
5. Segera ganti password di menu Users!

📌 Tier: Professional
📅 Berlaku sampai: [tanggal]

Jika ada pertanyaan, silakan hubungi saya.
Semoga lancar usahanya! 🙏
```

---

## 6. Proteksi yang Sudah Diterapkan

### 🔑 Sistem Lisensi
- Setiap pembeli harus aktivasi online dengan kunci unik
- Lisensi terikat ke domain & fingerprint perangkat
- Validasi ulang berkala ke server Supabase
- Anda bisa cabut (revoke) lisensi kapan saja
- Expiry date otomatis

### 🛡️ Anti-Tampering
- ❌ Klik kanan disabled
- ❌ F12 / DevTools shortcut disabled
- ❌ Ctrl+U (View Source) disabled
- ❌ Ctrl+S (Save Page) disabled
- ❌ Text selection disabled (kecuali di input)

### 🏷️ Watermarking
- Setiap lisensi punya Watermark ID unik
- Watermark tersembunyi di DOM (invisible)
- Jika ada yang leak, Anda bisa trace ke pembeli mana

### 📦 Code Obfuscation
- Source code di-minify saat build (Vite production build)
- Variable names di-mangle
- Dead code eliminated
- File di-bundle menjadi satu (vite-plugin-singlefile)

### 🔒 Domain Binding
- Lisensi terikat ke domain saat pertama kali diaktifkan
- Jika dipindahkan ke domain lain → Lisensi tidak valid
- Owner bisa reset domain jika pembeli memang butuh pindah

---

## 7. FAQ & Tips

### Q: Bagaimana jika pembeli minta refund?
A: Cabut (revoke) lisensinya di License Manager. Aplikasi akan langsung tidak bisa diakses.

### Q: Bagaimana jika pembeli ganti server/domain?
A: Reset Domain di License Manager → Pembeli aktivasi ulang di domain baru.

### Q: Apakah 100% tidak bisa dicuri kodenya?
A: Tidak ada proteksi yang 100% di sisi client. Tapi dengan model SaaS:
- Pembeli hanya akses via browser
- Source code tidak pernah diberikan  
- Bahkan jika save HTML, tetap butuh Supabase backend
- Build code sudah di-minify dan sulit dibaca
- Tanpa lisensi valid, aplikasi tidak bisa digunakan

### Q: Tips tambahan untuk keamanan?
1. **Gunakan model SaaS** - jangan jual source code
2. **Satu Supabase project untuk semua pembeli** - Anda kontrol semuanya
3. **Perpanjangan tahunan** - passive income + kontrol berkelanjutan
4. **Monitor License Manager** - cek aktivitas mencurigakan
5. **Backup database** rutin
6. **Private GitHub repo** - jangan public!

### Q: Bagaimana jika mau multi-tenant (setiap pembeli data terpisah)?
A: Untuk tahap ini, setiap pembeli mendapat instalasi terpisah. 
Untuk multi-tenant, pertimbangkan:
- Tambah kolom `tenant_id` di setiap tabel Supabase
- Filter data berdasarkan `tenant_id` dari lisensi
- Ini membutuhkan modifikasi tambahan pada store/sync

---

## 📞 Support

Jika butuh bantuan teknis untuk setup atau modifikasi:
- Buat issue di GitHub repo (private)
- Atau hubungi developer

---

*Dokumen ini adalah rahasia. Jangan disertakan dalam file yang diberikan ke pembeli.*
