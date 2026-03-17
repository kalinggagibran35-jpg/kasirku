import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Eye,
  X,
  ShoppingBag,
  CalendarClock,
  Download,
  Filter,
} from 'lucide-react';
import type { Transaction } from '../types';
import { getTransactions, formatCurrency, formatDate } from '../store';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [detail, setDetail] = useState<Transaction | null>(null);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        t.cashier_name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchDate = !dateFilter || t.created_at.startsWith(dateFilter);
      return matchSearch && matchType && matchDate;
    });
  }, [transactions, search, typeFilter, dateFilter]);

  const totalRevenue = filtered.reduce((sum, t) => t.status !== 'cancelled' ? sum + t.total : sum, 0);
  const totalDiscount = filtered.reduce((sum, t) => t.status !== 'cancelled' ? sum + t.discount_total : sum, 0);

  const exportCSV = () => {
    const headers = ['ID', 'Tipe', 'Pelanggan', 'Total', 'Diskon', 'Pembayaran', 'Kembalian', 'Kasir', 'Status', 'Tanggal'];
    const rows = filtered.map(t => [
      t.id, t.type, t.customer_name, t.total, t.discount_total, t.payment_amount, t.change_amount, t.cashier_name, t.status, t.created_at
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi_baju_bodo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p className="text-gray-500 mt-1">Semua riwayat penjualan dan penyewaan</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card !p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
          <p className="text-sm text-emerald-100">Total Pendapatan</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card !p-4 bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
          <p className="text-sm text-red-100">Total Diskon</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalDiscount)}</p>
        </div>
        <div className="card !p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
          <p className="text-sm text-primary-100">Jumlah Transaksi</p>
          <p className="text-2xl font-bold mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari ID, pelanggan, atau kasir..."
            className="input-field pl-11"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter size={16} className="text-gray-400" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="input-field !w-auto"
          >
            <option value="all">Semua Tipe</option>
            <option value="sale">Penjualan</option>
            <option value="rental">Penyewaan</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="input-field !w-auto"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-4 rounded-tl-2xl">ID</th>
                <th className="px-5 py-4">Tipe</th>
                <th className="px-5 py-4">Pelanggan</th>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4">Diskon</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Kasir</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Tanggal</th>
                <th className="px-5 py-4 rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(trx => (
                <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-sm font-bold text-primary-700">{trx.id}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge flex items-center gap-1 w-fit ${
                      trx.type === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {trx.type === 'sale' ? <><ShoppingBag size={12} /> Jual</> : <><CalendarClock size={12} /> Sewa</>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{trx.customer_name || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{trx.items.length} item</td>
                  <td className="px-5 py-3.5 text-sm">
                    {trx.discount_total > 0 ? (
                      <span className="text-red-500 font-medium">-{formatCurrency(trx.discount_total)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{formatCurrency(trx.total)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{trx.cashier_name}</td>
                  <td className="px-5 py-3.5">
                    <span className={
                      trx.status === 'completed' ? 'badge-success' :
                      trx.status === 'pending' ? 'badge-warning' : 'badge-danger'
                    }>
                      {trx.status === 'completed' ? 'Selesai' : trx.status === 'pending' ? 'Pending' : 'Batal'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(trx.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setDetail(trx)}
                      className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="text-gray-500 font-medium">Tidak ada transaksi ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
          Menampilkan {filtered.length} dari {transactions.length} transaksi
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Detail Transaksi</h2>
              <button onClick={() => setDetail(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">ID Transaksi</p>
                  <p className="font-mono font-bold text-primary-700">{detail.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Tipe</p>
                  <p className="font-semibold capitalize">{detail.type === 'sale' ? 'Penjualan' : 'Penyewaan'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Pelanggan</p>
                  <p className="font-semibold">{detail.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Telepon</p>
                  <p className="font-semibold">{detail.customer_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Kasir</p>
                  <p className="font-semibold">{detail.cashier_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Tanggal</p>
                  <p className="font-semibold">{formatDate(detail.created_at)}</p>
                </div>
              </div>

              {detail.type === 'rental' && (
                <div className="bg-purple-50 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-purple-700 mb-1">Info Penyewaan</p>
                  <p className="text-purple-600">
                    Periode: {detail.rental_start ? new Date(detail.rental_start).toLocaleDateString('id-ID') : '-'}
                    {' → '}{detail.rental_end ? new Date(detail.rental_end).toLocaleDateString('id-ID') : '-'}
                  </p>
                  {detail.deposit ? <p className="text-purple-600">Deposit: {formatCurrency(detail.deposit)}</p> : null}
                  <p className="text-purple-600">Status: <span className="font-bold capitalize">{detail.rental_status}</span></p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Item:</p>
                <div className="space-y-2">
                  {detail.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity}x {formatCurrency(item.price)}
                          {item.type === 'rental' && ` × ${item.rental_days} hari`}
                          {item.discount_percent > 0 && ` (-${item.discount_percent}%)`}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(detail.subtotal)}</span>
                </div>
                {detail.discount_total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-500">Diskon</span>
                    <span className="text-red-500 font-medium">-{formatCurrency(detail.discount_total)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-700">{formatCurrency(detail.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bayar</span>
                  <span className="font-medium">{formatCurrency(detail.payment_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kembali</span>
                  <span className="font-medium">{formatCurrency(detail.change_amount)}</span>
                </div>
              </div>

              {detail.notes && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-xs text-amber-600 font-semibold">Catatan:</p>
                  <p className="text-sm text-amber-800 mt-1">{detail.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
