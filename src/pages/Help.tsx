import { useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, Monitor, ShoppingCart, Package, CalendarClock,
  Receipt, Users, Settings, Shield, Smartphone,
  Database, HelpCircle, AlertTriangle, CheckCircle2, Wifi, Globe, FileSpreadsheet
} from 'lucide-react';
import { getCurrentUser, getStoreSettings } from '../store';

interface FAQItem {
  q: string;
  a: string;
}

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  content: React.ReactNode;
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const user = getCurrentUser();
  const settings = getStoreSettings();

  const faqs: FAQItem[] = [
    {
      q: 'Bagaimana cara login pertama kali?',
      a: 'Saat pertama kali membuka aplikasi, Anda akan melihat "Setup Wizard" yang memandu Anda untuk: (1) Mengisi informasi toko, (2) Membuat akun Admin pertama. Setelah selesai, gunakan username dan password yang telah dibuat untuk login.'
    },
    {
      q: 'Saya lupa password, bagaimana cara reset?',
      a: 'Di halaman Login, klik tombol "Lupa Password?" di bawah tombol Masuk. Anda memerlukan "Kunci Darurat" (Emergency Key) yang diberikan saat instalasi. Ada 2 opsi: (1) Reset Password — mengubah password tanpa menghapus data, (2) Factory Reset — menghapus semua data dan membuat akun baru dari awal.'
    },
    {
      q: 'Apa itu Kunci Darurat (Emergency Key)?',
      a: 'Kunci Darurat adalah kode rahasia yang digunakan untuk pemulihan akun jika Anda lupa password. Kunci ini diberikan oleh penyedia/pengembang aplikasi saat instalasi. Simpan kunci ini di tempat yang aman! Kunci ini bersifat rahasia dan hanya diketahui oleh penyedia aplikasi. Hubungi penyedia jika Anda membutuhkan reset darurat.'
    },
    {
      q: 'Apa perbedaan Admin dan Kasir?',
      a: 'Admin memiliki akses penuh: kelola produk, pengguna, pengaturan toko, import/export Excel, dan semua fitur. Kasir hanya bisa: melakukan transaksi di POS, melihat produk (tidak bisa edit), dan melihat riwayat transaksi. Admin bisa membuat akun Kasir dari menu Pengguna.'
    },
    {
      q: 'Bagaimana cara menambah produk?',
      a: 'Ada 2 cara: (1) Manual — buka menu Produk > klik "Tambah Produk" > isi form > Simpan. (2) Import Excel — buka menu Produk > klik ikon Upload > download template Excel > isi data > upload file. Opsi import hanya tersedia untuk Admin.'
    },
    {
      q: 'Bagaimana cara mengatur diskon?',
      a: 'Diskon bisa diatur per produk: buka menu Produk > edit produk > isi persentase diskon (0-100%). Di POS/Kasir, diskon otomatis terhitung saat produk ditambahkan ke keranjang. Anda juga bisa mengubah diskon langsung di keranjang saat transaksi.'
    },
    {
      q: 'Apa perbedaan Jual dan Sewa?',
      a: 'Mode JUAL: Produk dijual permanen, stok berkurang, tidak perlu dikembalikan. Mode SEWA: Produk dipinjamkan sementara, perlu menentukan tanggal mulai & selesai sewa, stok berkurang saat disewakan dan kembali saat dikembalikan. Toggle mode di halaman POS/Kasir.'
    },
    {
      q: 'Bagaimana cara mengembalikan sewaan?',
      a: 'Buka menu Penyewaan > cari transaksi sewa yang masih aktif > klik tombol "Kembalikan". Stok produk akan otomatis bertambah kembali dan status berubah menjadi "Dikembalikan".'
    },
    {
      q: 'Apakah data tersimpan di cloud?',
      a: 'Jika Supabase sudah dikonfigurasi (ada URL dan Key di environment variables), data otomatis tersimpan di cloud dan tersinkronisasi. Jika belum, data hanya tersimpan di browser (localStorage). Lihat status koneksi di Dashboard atau Pengaturan > Status Database.'
    },
    {
      q: 'Apakah aplikasi bisa diakses offline?',
      a: 'Ya! Aplikasi ini adalah PWA (Progressive Web App). Setelah pertama kali dibuka, aplikasi bisa diakses offline. Data yang diubah saat offline akan disimpan di localStorage dan otomatis sync ke cloud saat online kembali. Anda juga bisa "Install" aplikasi ke home screen HP atau desktop.'
    },
    {
      q: 'Bagaimana cara mencetak struk?',
      a: 'Setelah transaksi selesai di POS, akan muncul struk/receipt. Klik tombol "Cetak Struk" untuk mencetak. Pastikan printer sudah terhubung. Struk akan dicetak dengan nama toko, detail item, total, dan info pembayaran.'
    },
    {
      q: 'Bagaimana cara export data ke Excel?',
      a: 'Buka menu Produk > klik ikon Spreadsheet (📊) di toolbar. Semua data produk akan diexport ke file Excel (.xlsx). Di menu Transaksi, Anda juga bisa export riwayat transaksi ke CSV.'
    },
    {
      q: 'Bagaimana cara mengganti logo dan nama toko?',
      a: 'Login sebagai Admin > buka menu Pengaturan Toko > di bagian "Logo Toko" upload gambar baru, dan di bagian "Identitas Toko" ubah nama & tagline. Logo akan otomatis tampil di sidebar, halaman login, dan struk pembayaran.'
    },
    {
      q: 'Apa itu Factory Reset?',
      a: 'Factory Reset menghapus SEMUA data lokal (akun, produk, transaksi, pengaturan) dan memulai dari awal dengan Setup Wizard. Data di Supabase (cloud) TIDAK terpengaruh. Fitur ini memerlukan Kunci Darurat dan tersedia di halaman Login > Lupa Password > Factory Reset.'
    },
  ];

  const guideSections: GuideSection[] = [
    {
      id: 'first-time',
      icon: <Monitor size={24} />,
      title: '🚀 Pertama Kali Menggunakan Aplikasi',
      description: 'Panduan setup awal dan membuat akun pertama',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-blue-800 mb-2">Selamat datang! Berikut langkah-langkah memulai:</p>
          </div>
          <div className="space-y-3">
            <StepItem number={1} title="Buka Aplikasi">
              Buka URL aplikasi di browser (Chrome/Safari/Firefox). Saat pertama kali, Anda akan melihat <strong>Setup Wizard</strong>.
            </StepItem>
            <StepItem number={2} title="Isi Informasi Toko">
              Masukkan nama toko, tagline, alamat, nomor telepon, dan email. Hanya <strong>nama toko</strong> yang wajib diisi. Informasi ini bisa diubah nanti di menu Pengaturan.
            </StepItem>
            <StepItem number={3} title="Buat Akun Admin">
              Buat akun Admin pertama dengan mengisi nama lengkap, username (minimal 3 karakter), dan password (minimal 6 karakter). <strong>CATAT dan SIMPAN</strong> username & password ini!
            </StepItem>
            <StepItem number={4} title="Login">
              Setelah Setup Wizard selesai, Anda akan diarahkan ke halaman Login. Masukkan username dan password yang baru dibuat.
            </StepItem>
            <StepItem number={5} title="Mulai Menggunakan">
              Setelah login, Anda bisa mulai menambahkan produk, membuat akun kasir, dan melakukan transaksi!
            </StepItem>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm"><strong>💡 Tips:</strong> Simpan <strong>Kunci Darurat</strong> di tempat yang aman. Kunci ini diperlukan jika Anda lupa password dan perlu melakukan reset.</p>
          </div>
        </div>
      )
    },
    {
      id: 'pos',
      icon: <ShoppingCart size={24} />,
      title: '🛒 Menggunakan Kasir / POS',
      description: 'Cara melakukan transaksi penjualan dan penyewaan',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <h4 className="font-bold text-gray-900">Mode Penjualan (Jual)</h4>
          <div className="space-y-3">
            <StepItem number={1} title="Pilih Mode JUAL">Pastikan toggle di atas menunjukkan mode <strong>"Jual"</strong> (warna biru).</StepItem>
            <StepItem number={2} title="Cari & Tambah Produk">Gunakan kolom pencarian atau filter kategori. Klik kartu produk untuk menambahkan ke keranjang.</StepItem>
            <StepItem number={3} title="Atur Kuantitas & Diskon">Di keranjang, atur jumlah dengan tombol +/- . Diskon per item bisa diubah langsung.</StepItem>
            <StepItem number={4} title="Proses Pembayaran">Klik &quot;Proses Pembayaran&quot; → isi jumlah uang yang dibayar → klik &quot;Bayar Sekarang&quot;.</StepItem>
            <StepItem number={5} title="Cetak Struk">Setelah pembayaran berhasil, struk akan muncul. Klik "Cetak Struk" untuk mencetak.</StepItem>
          </div>
          <hr className="border-gray-200" />
          <h4 className="font-bold text-gray-900">Mode Penyewaan (Sewa)</h4>
          <div className="space-y-3">
            <StepItem number={1} title="Pilih Mode SEWA">Toggle ke mode <strong>"Sewa"</strong> (warna ungu). Harga otomatis berubah ke harga sewa.</StepItem>
            <StepItem number={2} title="Tambah Produk & Atur Durasi">Setiap item yang ditambahkan memiliki field durasi sewa (dalam hari).</StepItem>
            <StepItem number={3} title="Isi Data Penyewa">Masukkan nama dan kontak penyewa di bagian bawah keranjang.</StepItem>
            <StepItem number={4} title="Proses Pembayaran">Sama seperti mode Jual. Tanggal sewa otomatis dihitung.</StepItem>
          </div>
        </div>
      )
    },
    {
      id: 'products',
      icon: <Package size={24} />,
      title: '📦 Mengelola Produk',
      description: 'Tambah, edit, hapus, dan import/export produk',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <h4 className="font-bold text-gray-900">Menambah Produk Manual</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Buka menu <strong>Produk</strong> dari sidebar</li>
            <li>Klik tombol <strong>"+ Tambah Produk"</strong></li>
            <li>Isi form: nama, kategori, harga jual, harga sewa, stok, ukuran, warna, diskon</li>
            <li>Upload gambar produk (opsional) — bisa file atau URL</li>
            <li>Klik <strong>"Simpan"</strong></li>
          </ol>
          <hr className="border-gray-200" />
          <h4 className="font-bold text-gray-900">Import dari Excel</h4>
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <FileSpreadsheet size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Klik ikon <strong>Download Template</strong> (⬇) untuk mendapatkan file template Excel</li>
                <li>Buka template di Excel/Google Sheets, isi data produk sesuai format</li>
                <li>Klik ikon <strong>Upload</strong> (⬆) → pilih file Excel yang sudah diisi</li>
                <li>Periksa preview data → perbaiki jika ada error</li>
                <li>Klik <strong>"Import"</strong> untuk menyimpan</li>
              </ol>
            </div>
          </div>
          <hr className="border-gray-200" />
          <h4 className="font-bold text-gray-900">Kategori Produk</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Baju Bodo</strong> — Baju tradisional utama</li>
            <li><strong>Sarung Sutera</strong> — Sarung tenun sutera</li>
            <li><strong>Aksesori</strong> — Perhiasan, bros, ikat kepala, dll</li>
            <li><strong>Paket Lengkap</strong> — Set baju bodo + sarung + aksesori</li>
            <li><strong>Lainnya</strong> — Produk lain</li>
          </ul>
        </div>
      )
    },
    {
      id: 'rentals',
      icon: <CalendarClock size={24} />,
      title: '📅 Mengelola Penyewaan',
      description: 'Tracking status sewa dan pengembalian',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <h4 className="font-bold text-gray-900">Status Penyewaan</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <span className="text-2xl">🔵</span>
              <p className="font-semibold text-blue-800 mt-1">Aktif</p>
              <p className="text-xs text-blue-600">Sedang disewa</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <span className="text-2xl">🔴</span>
              <p className="font-semibold text-red-800 mt-1">Terlambat</p>
              <p className="text-xs text-red-600">Melewati tanggal pengembalian</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <span className="text-2xl">🟢</span>
              <p className="font-semibold text-emerald-800 mt-1">Dikembalikan</p>
              <p className="text-xs text-emerald-600">Sudah dikembalikan</p>
            </div>
          </div>
          <h4 className="font-bold text-gray-900 mt-4">Mengembalikan Sewaan</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Buka menu <strong>Penyewaan</strong></li>
            <li>Cari transaksi sewa berstatus <strong>Aktif</strong> atau <strong>Terlambat</strong></li>
            <li>Klik tombol <strong>"Kembalikan"</strong></li>
            <li>Konfirmasi pengembalian</li>
            <li>Stok produk otomatis <strong>bertambah kembali</strong></li>
          </ol>
        </div>
      )
    },
    {
      id: 'transactions',
      icon: <Receipt size={24} />,
      title: '📋 Riwayat Transaksi',
      description: 'Melihat dan mengexport data transaksi',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Filter Tipe:</strong> Tampilkan hanya Penjualan, Penyewaan, atau Semua</li>
            <li><strong>Filter Tanggal:</strong> Pilih rentang tanggal untuk melihat transaksi tertentu</li>
            <li><strong>Pencarian:</strong> Cari berdasarkan ID transaksi, nama pelanggan, atau item</li>
            <li><strong>Detail:</strong> Klik transaksi untuk melihat detail lengkap termasuk daftar item</li>
            <li><strong>Export CSV:</strong> Klik tombol export untuk mendownload data dalam format CSV</li>
          </ul>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm"><strong>💡 Tips:</strong> Ringkasan di bagian atas menampilkan total pendapatan, total diskon, dan jumlah transaksi untuk filter yang sedang aktif.</p>
          </div>
        </div>
      )
    },
    {
      id: 'users',
      icon: <Users size={24} />,
      title: '👥 Mengelola Pengguna',
      description: 'Membuat dan mengatur akun Admin & Kasir',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm"><strong>⚠️ Hanya Admin</strong> yang bisa mengakses menu Pengguna.</p>
          </div>
          <h4 className="font-bold text-gray-900">Membuat Akun Baru</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Buka menu <strong>Pengguna</strong></li>
            <li>Klik <strong>"+ Tambah Pengguna"</strong></li>
            <li>Isi nama, username, password, dan pilih role (Admin/Kasir)</li>
            <li>Klik <strong>"Simpan"</strong></li>
          </ol>
          <h4 className="font-bold text-gray-900 mt-4">Perbedaan Hak Akses</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 border-b">Fitur</th>
                  <th className="text-center p-2 border-b">Admin</th>
                  <th className="text-center p-2 border-b">Kasir</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Dashboard', '✅', '✅'],
                  ['Kasir / POS', '✅', '✅'],
                  ['Lihat Produk', '✅', '✅'],
                  ['Tambah/Edit/Hapus Produk', '✅', '❌'],
                  ['Import/Export Excel', '✅', '❌'],
                  ['Penyewaan (pengembalian)', '✅', '✅'],
                  ['Riwayat Transaksi', '✅', '✅'],
                  ['Kelola Pengguna', '✅', '❌'],
                  ['Pengaturan Toko', '✅', '❌'],
                ].map(([fitur, admin, kasir], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 border-b">{fitur}</td>
                    <td className="p-2 border-b text-center">{admin}</td>
                    <td className="p-2 border-b text-center">{kasir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      icon: <Settings size={24} />,
      title: '⚙️ Pengaturan Toko',
      description: 'Logo, nama toko, kontak, dan pengaturan struk',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Logo Toko:</strong> Upload gambar logo (PNG, JPG, SVG, max 5MB). Logo tampil di sidebar, halaman login, dan struk pembayaran.</li>
            <li><strong>Nama Toko & Tagline:</strong> Identitas toko yang ditampilkan di seluruh aplikasi.</li>
            <li><strong>Alamat, Telepon, Email:</strong> Informasi kontak yang tampil di struk pembayaran.</li>
            <li><strong>Pesan Footer Struk:</strong> Pesan yang dicetak di bagian bawah struk (contoh: "Terima kasih!").</li>
            <li><strong>Preview:</strong> Tombol preview untuk melihat tampilan perubahan sebelum menyimpan.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'pwa',
      icon: <Smartphone size={24} />,
      title: '📱 Install di HP / Desktop',
      description: 'Cara menginstall aplikasi seperti app native',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <h4 className="font-bold text-gray-900">Install di Android (Chrome)</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Buka aplikasi di Chrome</li>
            <li>Tap menu <strong>⋮</strong> (titik tiga) di kanan atas</li>
            <li>Pilih <strong>"Install app"</strong> atau <strong>"Add to Home screen"</strong></li>
            <li>Tap <strong>"Install"</strong></li>
            <li>Aplikasi akan muncul di home screen seperti app biasa!</li>
          </ol>
          <h4 className="font-bold text-gray-900 mt-4">Install di iPhone (Safari)</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Buka aplikasi di <strong>Safari</strong> (wajib Safari, bukan Chrome)</li>
            <li>Tap ikon <strong>Share</strong> (kotak dengan panah ke atas) di bawah</li>
            <li>Scroll ke bawah, pilih <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong></li>
          </ol>
          <h4 className="font-bold text-gray-900 mt-4">Install di Desktop (Chrome/Edge)</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Buka aplikasi di Chrome atau Edge</li>
            <li>Klik ikon <strong>install</strong> (⊕) di address bar</li>
            <li>Atau klik banner <strong>"Install Aplikasi"</strong> yang muncul di bawah layar</li>
          </ol>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-emerald-800 text-sm"><strong>✅ Keuntungan Install:</strong> Buka lebih cepat, bisa diakses offline, tidak ada address bar browser, dan notifikasi push (jika diaktifkan).</p>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      icon: <Shield size={24} />,
      title: '🔐 Keamanan & Password',
      description: 'Enkripsi password dan pemulihan akun',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <h4 className="font-bold text-gray-900">Keamanan Password</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li>Semua password dienkripsi dengan <strong>SHA-256</strong> sebelum disimpan</li>
            <li>Password asli <strong>tidak pernah</strong> disimpan di manapun</li>
            <li>Minimal 6 karakter, disarankan kombinasi huruf, angka, dan simbol</li>
          </ul>
          <h4 className="font-bold text-gray-900 mt-4">Lupa Password</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <ol className="list-decimal ml-4 space-y-1 text-blue-800">
              <li>Di halaman Login, klik <strong>"Lupa Password?"</strong></li>
              <li>Pilih <strong>"Reset Password"</strong> (tidak menghapus data)</li>
              <li>Masukkan <strong>Kunci Darurat</strong></li>
              <li>Pilih akun yang ingin direset</li>
              <li>Buat password baru</li>
            </ol>
          </div>
          <h4 className="font-bold text-gray-900 mt-4">Kunci Darurat</h4>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm"><strong>⚠️ PENTING:</strong> Simpan Kunci Darurat di tempat yang aman dan terpisah dari perangkat yang menjalankan aplikasi. Jika Anda kehilangan kunci darurat DAN lupa password, hubungi penyedia aplikasi untuk bantuan.</p>
          </div>
        </div>
      )
    },
    {
      id: 'database',
      icon: <Database size={24} />,
      title: '☁️ Database & Sinkronisasi',
      description: 'Cara kerja penyimpanan data lokal dan cloud',
      content: (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <h4 className="font-bold text-gray-900">Mode Penyimpanan</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wifi size={18} className="text-gray-600" />
                <span className="font-semibold">Mode Lokal</span>
              </div>
              <p className="text-xs text-gray-600">Data tersimpan di browser (localStorage). Cepat, tapi hanya di perangkat ini saja.</p>
            </div>
            <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={18} className="text-emerald-600" />
                <span className="font-semibold text-emerald-800">Mode Cloud</span>
              </div>
              <p className="text-xs text-emerald-700">Data tersimpan di Supabase (PostgreSQL). Bisa diakses dari perangkat manapun.</p>
            </div>
          </div>
          <h4 className="font-bold text-gray-900 mt-4">Cara Kerja Sinkronisasi</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Membaca:</strong> Data dibaca dari localStorage (cepat)</li>
            <li><strong>Menyimpan:</strong> Data disimpan ke localStorage + dikirim ke Supabase (background)</li>
            <li><strong>App dibuka:</strong> Data terbaru diambil dari Supabase → disimpan ke localStorage</li>
            <li><strong>Manual sync:</strong> Tombol "Sync Cloud" di Dashboard untuk refresh data dari server</li>
          </ul>
        </div>
      )
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Pusat Bantuan</h1>
            <p className="text-gray-500">Panduan lengkap menggunakan {settings.store_name || 'KasirKu'}</p>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <HelpCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Selamat datang, {user?.name}!</h3>
            <p className="text-primary-100 text-sm leading-relaxed">
              Halaman ini berisi panduan lengkap cara menggunakan aplikasi kasir. Klik topik di bawah untuk membaca panduan, 
              atau scroll ke bagian FAQ untuk pertanyaan yang sering ditanyakan.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">Role: {user?.role === 'admin' ? 'Admin' : 'Kasir'}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">Versi: 2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Sections */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📖 Panduan Penggunaan</h2>
        <div className="space-y-3">
          {guideSections.map(section => (
            <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                className="w-full flex items-center gap-4 p-4 lg:p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeSection === section.id 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm lg:text-base">{section.title}</h3>
                  <p className="text-xs lg:text-sm text-gray-500 mt-0.5">{section.description}</p>
                </div>
                <div className={`transition-transform duration-200 text-gray-400 ${
                  activeSection === section.id ? 'rotate-180' : ''
                }`}>
                  <ChevronDown size={20} />
                </div>
              </button>
              {activeSection === section.id && (
                <div className="p-4 lg:p-6 pt-0 lg:pt-0 border-t border-gray-100">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">❓ Pertanyaan yang Sering Ditanyakan (FAQ)</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  activeFAQ === index 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {activeFAQ === index ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <span className="font-semibold text-gray-900 text-sm flex-1">{faq.q}</span>
              </button>
              {activeFAQ === index && (
                <div className="px-4 pb-4 pl-14">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Info */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-amber-900 text-lg mb-2">🔑 Informasi Penting: Kunci Darurat</h3>
            <div className="text-sm text-amber-800 space-y-2 leading-relaxed">
              <p>Kunci Darurat diperlukan untuk:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Reset password jika lupa</li>
                <li>Factory reset (menghapus semua data dan mulai ulang)</li>
              </ul>
              <p className="font-semibold mt-3">Cara mendapatkan Kunci Darurat:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Kunci diberikan oleh <strong>penyedia/pengembang aplikasi</strong> saat instalasi</li>
                <li>Jika Anda belum pernah menerima kunci, hubungi penyedia aplikasi</li>
                <li>Simpan kunci di tempat yang <strong>aman dan terpisah</strong> dari perangkat aplikasi</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-2xl text-primary-700 mb-4">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Butuh Bantuan Lebih Lanjut?</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Jika Anda memiliki pertanyaan yang belum terjawab di panduan ini, silakan hubungi penyedia aplikasi atau tim support.
        </p>
        {settings.store_phone && (
          <p className="mt-3 text-sm font-semibold text-primary-700">📞 {settings.store_phone}</p>
        )}
        {settings.store_email && (
          <p className="mt-1 text-sm font-semibold text-primary-700">📧 {settings.store_email}</p>
        )}
      </div>
    </div>
  );
}

function StepItem({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h5 className="font-semibold text-gray-900">{title}</h5>
        <p className="text-gray-600 mt-0.5">{children}</p>
      </div>
    </div>
  );
}
