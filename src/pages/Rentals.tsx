import { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  RotateCcw,
} from 'lucide-react';
import type { Transaction } from '../types';
import { getTransactions, returnRental, formatCurrency, formatDate } from '../store';

export default function Rentals() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [returnConfirm, setReturnConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const all = getTransactions().filter(t => t.type === 'rental');
    setTransactions(all);
  };

  // Check overdue
  useEffect(() => {
    const now = new Date();
    transactions.forEach(t => {
      if (t.rental_status === 'active' && t.rental_end && new Date(t.rental_end) < now) {
        // Mark as overdue visually
      }
    });
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
      const isOverdue = t.rental_status === 'active' && t.rental_end && new Date(t.rental_end) < new Date();
      const effectiveStatus = isOverdue ? 'overdue' : t.rental_status;
      const matchStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transactions, search, statusFilter]);

  const handleReturn = (id: string) => {
    returnRental(id);
    loadData();
    setReturnConfirm(null);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const active = transactions.filter(t => t.rental_status === 'active');
    const overdue = active.filter(t => t.rental_end && new Date(t.rental_end) < now);
    const returned = transactions.filter(t => t.rental_status === 'returned');
    return { active: active.length, overdue: overdue.length, returned: returned.length, total: transactions.length };
  }, [transactions]);

  const getStatusDisplay = (t: Transaction) => {
    if (t.rental_status === 'returned') return { label: 'Dikembalikan', class: 'badge-success', icon: CheckCircle2 };
    if (t.rental_end && new Date(t.rental_end) < new Date()) return { label: 'Terlambat', class: 'badge-danger', icon: AlertTriangle };
    return { label: 'Aktif', class: 'badge-warning', icon: Clock };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Penyewaan</h1>
        <p className="text-gray-500 mt-1">Kelola penyewaan dan pengembalian baju bodo</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card !p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl"><CalendarClock size={20} className="text-blue-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Sewa</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl"><Clock size={20} className="text-amber-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-xs text-gray-500">Aktif</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-xl"><AlertTriangle size={20} className="text-red-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
            <p className="text-xs text-gray-500">Terlambat</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl"><CheckCircle2 size={20} className="text-emerald-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.returned}</p>
            <p className="text-xs text-gray-500">Dikembalikan</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari ID, pelanggan, atau produk..."
            className="input-field pl-11"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'active', label: 'Aktif' },
            { key: 'overdue', label: 'Terlambat' },
            { key: 'returned', label: 'Dikembalikan' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === f.key ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rentals List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium">Tidak ada data penyewaan</p>
            <p className="text-sm text-gray-400 mt-1">Data penyewaan akan muncul setelah transaksi sewa dilakukan</p>
          </div>
        ) : (
          filtered.map(trx => {
            const statusInfo = getStatusDisplay(trx);
            const StatusIcon = statusInfo.icon;
            return (
              <div key={trx.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold text-primary-700">{trx.id}</span>
                      <span className={`${statusInfo.class} flex items-center gap-1`}>
                        <StatusIcon size={12} /> {statusInfo.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Pelanggan</p>
                        <p className="font-semibold text-gray-900">{trx.customer_name || '-'}</p>
                        {trx.customer_phone && <p className="text-gray-500 text-xs">{trx.customer_phone}</p>}
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Periode Sewa</p>
                        <p className="font-medium text-gray-700">
                          {trx.rental_start ? new Date(trx.rental_start).toLocaleDateString('id-ID') : '-'}
                          {' → '}
                          {trx.rental_end ? new Date(trx.rental_end).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Total / Deposit</p>
                        <p className="font-bold text-gray-900">
                          {formatCurrency(trx.total)}
                          {trx.deposit ? <span className="text-xs text-gray-400 font-normal ml-1">(Dp: {formatCurrency(trx.deposit)})</span> : null}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-gray-400 text-xs mb-1">Item:</p>
                      <div className="flex flex-wrap gap-2">
                        {trx.items.map((item, i) => (
                          <span key={i} className="badge bg-gray-100 text-gray-700">
                            {item.product_name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Dibuat: {formatDate(trx.created_at)} • Kasir: {trx.cashier_name}</p>
                  </div>
                  {trx.rental_status === 'active' && (
                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => setReturnConfirm(trx.id)}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <RotateCcw size={16} /> Kembalikan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Return Confirmation */}
      {returnConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-gray-900">Konfirmasi Pengembalian</h3>
            <p className="text-sm text-gray-500 mt-2">
              Apakah semua item sudah dikembalikan dengan baik?
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setReturnConfirm(null)} className="btn-secondary flex-1">
                Batal
              </button>
              <button onClick={() => handleReturn(returnConfirm)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Ya, Kembalikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
