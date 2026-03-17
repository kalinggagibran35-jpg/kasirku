import { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  CalendarClock,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import type { DashboardStats, Transaction, Product } from '../types';
import { getDashboardStats, getTransactions, getProducts, formatCurrency, formatDate, getStoreSettings, isSupabaseConfigured, loadFromSupabase } from '../store';
import { getSupabaseStatus } from '../lib/supabase';
import ProductImage from '../components/ProductImage';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadData = () => {
    setStats(getDashboardStats());
    setRecentTransactions(getTransactions().slice(0, 8));
    setLowStockProducts(getProducts().filter(p => p.active && p.stock <= 5));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncFromCloud = async () => {
    if (!isSupabaseConfigured) return;
    setSyncing(true);
    const success = await loadFromSupabase();
    if (success) {
      loadData();
    }
    setSyncing(false);
  };

  if (!stats) return null;

  const storeSettings = getStoreSettings();

  const statCards = [
    {
      label: 'Pendapatan Hari Ini',
      value: formatCurrency(stats.totalRevenueToday),
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Penjualan Hari Ini',
      value: formatCurrency(stats.totalSalesToday),
      icon: ShoppingBag,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Penyewaan Hari Ini',
      value: formatCurrency(stats.totalRentalsToday),
      icon: CalendarClock,
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Transaksi Hari Ini',
      value: stats.totalTransactionsToday.toString(),
      icon: BarChart3,
      color: 'from-primary-500 to-primary-600',
      bgLight: 'bg-primary-50',
      textColor: 'text-primary-600',
    },
    {
      label: 'Total Produk Aktif',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'from-gold-500 to-gold-600',
      bgLight: 'bg-gold-50',
      textColor: 'text-gold-600',
    },
    {
      label: 'Sewa Aktif',
      value: stats.activeRentals.toString(),
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600',
      bgLight: 'bg-cyan-50',
      textColor: 'text-cyan-600',
    },
    {
      label: 'Sewa Terlambat',
      value: stats.overdueRentals.toString(),
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      label: 'Stok Menipis',
      value: stats.lowStockProducts.toString(),
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Ringkasan aktivitas bisnis {storeSettings.store_name || 'toko'} Anda</p>
        </div>
        <div className="flex items-center gap-2">
          {isSupabaseConfigured && (
            <button
              onClick={handleSyncFromCloud}
              disabled={syncing}
              className="btn-secondary text-xs flex items-center gap-1.5"
              title="Sinkronkan data dari database"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sync...' : 'Sync Cloud'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {statCards.map((card) => (
          <div key={card.label} className="card hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.bgLight} p-3 rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                <card.icon size={22} className={card.textColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" /> Stok Menipis
              </h2>
              <p className="text-sm text-gray-500">Produk dengan stok ≤ 5 unit</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowStockProducts.slice(0, 8).map(product => (
              <div key={product.id} className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                <ProductImage
                  src={product.image_url}
                  name={product.name}
                  color={product.color}
                  category={product.category}
                  size="sm"
                  rounded="rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.size} • {product.color}</p>
                  <p className={`text-sm font-bold mt-0.5 ${product.stock <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                    Stok: {product.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Transaksi Terakhir</h2>
            <p className="text-sm text-gray-500">8 transaksi terbaru</p>
          </div>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium">Belum ada transaksi</p>
            <p className="text-sm text-gray-400 mt-1">Transaksi akan muncul di sini setelah kasir memproses penjualan atau penyewaan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 rounded-l-lg">ID</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-lg">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map(trx => (
                  <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-mono font-semibold text-primary-700">{trx.id}</td>
                    <td className="px-4 py-3.5">
                      <span className={trx.type === 'sale' ? 'badge-info' : 'badge-warning'}>
                        {trx.type === 'sale' ? '🛒 Jual' : '📅 Sewa'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{trx.customer_name || '-'}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{formatCurrency(trx.total)}</td>
                    <td className="px-4 py-3.5">
                      <span className={
                        trx.status === 'completed' ? 'badge-success' :
                        trx.status === 'pending' ? 'badge-warning' : 'badge-danger'
                      }>
                        {trx.status === 'completed' ? 'Selesai' :
                         trx.status === 'pending' ? 'Pending' : 'Batal'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(trx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card bg-gradient-to-br from-primary-700 to-primary-900 text-white border-0">
          <div className="flex items-start gap-4">
            {storeSettings.store_logo ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                <img src={storeSettings.store_logo} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div className="text-5xl shrink-0">👗</div>
            )}
            <div>
              <h3 className="text-lg font-bold">{storeSettings.store_name || 'Toko Anda'}</h3>
              <p className="text-primary-200 text-sm mt-1 leading-relaxed">
                {storeSettings.store_subtitle || 'Selamat datang di aplikasi kasir Anda. Kelola produk, transaksi, dan penyewaan dengan mudah.'}
              </p>
              {storeSettings.store_address && (
                <p className="text-primary-300 text-xs mt-3">📍 {storeSettings.store_address}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          {/* Database Status */}
          <div className="mb-5 p-3 rounded-xl border flex items-center gap-3" style={{
            backgroundColor: isSupabaseConfigured ? '#f0fdf4' : '#fffbeb',
            borderColor: isSupabaseConfigured ? '#bbf7d0' : '#fde68a',
          }}>
            <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-green-500' : 'bg-amber-500'}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: isSupabaseConfigured ? '#166534' : '#92400e' }}>
                {isSupabaseConfigured ? '☁️ Database Connected' : '💾 Mode Lokal (localStorage)'}
              </p>
              <p className="text-xs" style={{ color: isSupabaseConfigured ? '#15803d' : '#a16207' }}>
                {isSupabaseConfigured
                  ? `Host: ${getSupabaseStatus().url}`
                  : 'Data tersimpan di browser. Atur Supabase untuk cloud sync.'}
              </p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-4">📌 Panduan Cepat</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">1</div>
              <p className="text-sm text-gray-600">Tambahkan produk di menu <strong>Produk</strong> terlebih dahulu</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">2</div>
              <p className="text-sm text-gray-600">Buka menu <strong>Kasir/POS</strong> untuk memproses penjualan atau penyewaan</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">3</div>
              <p className="text-sm text-gray-600">Pantau status penyewaan di menu <strong>Penyewaan</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">4</div>
              <p className="text-sm text-gray-600">Lihat riwayat lengkap di menu <strong>Transaksi</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
