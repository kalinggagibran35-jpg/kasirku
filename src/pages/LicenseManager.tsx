import { useState, useEffect, useCallback } from 'react';
import type { LicenseTier, LicenseStatus } from '../types';
import {
  generateLicenseKey,
  getTierLimits,
  generateWatermarkId,
  isOwnerMode,
} from '../lib/license';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logLicenseEvent } from '../lib/license';

interface LicenseRecord {
  id: string;
  license_key: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  tier: LicenseTier;
  status: LicenseStatus;
  domain_bound: string;
  device_fingerprint: string;
  max_products: number;
  max_users: number;
  activated_at: string | null;
  expires_at: string;
  created_at: string;
  notes: string;
  watermark_id: string;
}

export default function LicenseManager() {
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [form, setForm] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    tier: 'professional' as LicenseTier,
    duration_months: 12,
    notes: '',
  });

  const loadLicenses = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error: err } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setLicenses(data || []);
    } catch (err) {
      console.error('Failed to load licenses:', err);
      setError('Gagal memuat data lisensi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  if (!isOwnerMode()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
          <p className="text-gray-400">Halaman ini hanya untuk Owner</p>
        </div>
      </div>
    );
  }

  async function handleCreateLicense() {
    if (!supabase) return;
    setError('');

    if (!form.buyer_name.trim() || !form.buyer_email.trim()) {
      setError('Nama dan email pembeli wajib diisi');
      return;
    }

    const tierLimits = getTierLimits(form.tier);
    const licenseKey = generateLicenseKey(form.tier);
    const watermarkId = generateWatermarkId();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + form.duration_months);

    // Generate unique id untuk primary key TEXT
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

    const newLicense = {
      id: newId,
      license_key: licenseKey,
      buyer_name: form.buyer_name.trim(),
      buyer_email: form.buyer_email.trim(),
      buyer_phone: form.buyer_phone.trim(),
      tier: form.tier,
      status: 'active' as LicenseStatus,
      domain_bound: '',
      device_fingerprint: '',
      max_products: tierLimits.maxProducts,
      max_users: tierLimits.maxUsers,
      activated_at: null,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      notes: form.notes.trim(),
      watermark_id: watermarkId,
    };

    try {
      const { error: err } = await supabase.from('licenses').insert(newLicense);
      if (err) throw err;

      await loadLicenses();
      setShowForm(false);
      setForm({ buyer_name: '', buyer_email: '', buyer_phone: '', tier: 'professional', duration_months: 12, notes: '' });

      // Auto copy key
      navigator.clipboard.writeText(licenseKey);
      setCopied(licenseKey);
      setTimeout(() => setCopied(''), 5000);
    } catch (err) {
      console.error('Failed to create license:', err);
      setError('Gagal membuat lisensi');
    }
  }

  async function handleUpdateStatus(id: string, status: LicenseStatus) {
    if (!supabase) return;
    try {
      const { error: err } = await supabase.from('licenses').update({ status }).eq('id', id);
      if (err) throw err;
      await logLicenseEvent(id, status === 'revoked' ? 'revoked' : 'validated', `Status diubah ke: ${status} oleh Owner`);
      await loadLicenses();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  }

  async function handleResetDomain(id: string) {
    if (!supabase) return;
    if (!confirm('Reset domain binding? Pembeli perlu mengaktifkan ulang lisensi.')) return;
    try {
      const { error: err } = await supabase
        .from('licenses')
        .update({ domain_bound: '', device_fingerprint: '', activated_at: null })
        .eq('id', id);
      if (err) throw err;
      await logLicenseEvent(id, 'domain_reset', 'Domain reset oleh Owner');
      await loadLicenses();
    } catch (err) {
      console.error('Failed to reset domain:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    if (!confirm('Hapus lisensi ini? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      const { error: err } = await supabase.from('licenses').delete().eq('id', id);
      if (err) throw err;
      await loadLicenses();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  async function handleExtend(id: string, months: number) {
    if (!supabase) return;
    const license = licenses.find((l) => l.id === id);
    if (!license) return;

    const currentExpiry = new Date(license.expires_at);
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()));
    newExpiry.setMonth(newExpiry.getMonth() + months);

    try {
      const { error: err } = await supabase
        .from('licenses')
        .update({ expires_at: newExpiry.toISOString(), status: 'active' })
        .eq('id', id);
      if (err) throw err;
      await loadLicenses();
    } catch (err) {
      console.error('Failed to extend:', err);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(''), 3000);
  }

  const filteredLicenses = licenses.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.buyer_name.toLowerCase().includes(q) ||
        l.buyer_email.toLowerCase().includes(q) ||
        l.license_key.toLowerCase().includes(q) ||
        l.domain_bound.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === 'active').length,
    expired: licenses.filter((l) => l.status === 'expired' || (l.expires_at && new Date(l.expires_at) < new Date())).length,
    revoked: licenses.filter((l) => l.status === 'revoked').length,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔑</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">License Manager</h1>
              <p className="text-gray-400 text-sm">Kelola lisensi KasirKu</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-bold rounded-full border border-red-600/30">
              OWNER MODE
            </span>
            <a href="#/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
              ← Kembali ke App
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300">
            <h3 className="font-bold mb-1">⚠️ Supabase Belum Dikonfigurasi</h3>
            <p className="text-sm text-yellow-200/70">
              Sistem lisensi membutuhkan Supabase. Set <code className="bg-yellow-500/20 px-1 rounded">VITE_SUPABASE_URL</code> dan{' '}
              <code className="bg-yellow-500/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> di environment variables.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>
        )}

        {copied && (
          <div className="fixed top-4 right-4 z-50 p-4 bg-green-600 text-white rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Kunci lisensi disalin: <code className="font-mono text-sm bg-green-700 px-2 py-0.5 rounded">{copied}</code>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Lisensi', value: stats.total, icon: '🔑', color: 'blue' },
            { label: 'Aktif', value: stats.active, icon: '✅', color: 'green' },
            { label: 'Kadaluarsa', value: stats.expired, icon: '⏰', color: 'yellow' },
            { label: 'Dicabut', value: stats.revoked, icon: '🚫', color: 'red' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span>{s.icon}</span>
                <span className="text-gray-400 text-sm">{s.label}</span>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => { setShowForm(true); setEditId(null); }}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Lisensi Baru
          </button>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, kunci lisensi..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="expired">Kadaluarsa</option>
            <option value="suspended">Ditangguhkan</option>
            <option value="revoked">Dicabut</option>
          </select>
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-bold">{editId ? 'Edit' : 'Buat'} Lisensi</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nama Pembeli *</label>
                  <input
                    type="text"
                    value={form.buyer_name}
                    onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Nama lengkap pembeli"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Pembeli *</label>
                    <input
                      type="email"
                      value={form.buyer_email}
                      onChange={(e) => setForm({ ...form, buyer_email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="email@contoh.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">No. HP</label>
                    <input
                      type="text"
                      value={form.buyer_phone}
                      onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tier Lisensi</label>
                    <select
                      value={form.tier}
                      onChange={(e) => setForm({ ...form, tier: e.target.value as LicenseTier })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="starter">Starter (50 produk, 2 user)</option>
                      <option value="professional">Professional (500 produk, 10 user)</option>
                      <option value="enterprise">Enterprise (Unlimited)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Durasi</label>
                    <select
                      value={form.duration_months}
                      onChange={(e) => setForm({ ...form, duration_months: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value={1}>1 Bulan</option>
                      <option value={3}>3 Bulan</option>
                      <option value={6}>6 Bulan</option>
                      <option value={12}>1 Tahun</option>
                      <option value={24}>2 Tahun</option>
                      <option value={36}>3 Tahun</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Catatan</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20 resize-none"
                    placeholder="Catatan tambahan..."
                  />
                </div>

                {/* Tier Preview */}
                <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                  <p className="text-xs font-medium text-gray-400 mb-2">Preview Fitur:</p>
                  <div className="flex flex-wrap gap-1">
                    {getTierLimits(form.tier).features.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex gap-3 justify-end">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateLicense}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-colors"
                >
                  Buat & Salin Kunci
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Licenses Table */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Memuat data lisensi...</p>
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700">
            <div className="text-5xl mb-4">🔑</div>
            <h3 className="text-lg font-bold text-gray-300 mb-2">Belum Ada Lisensi</h3>
            <p className="text-gray-500 mb-4">Buat lisensi pertama untuk mulai menjual aplikasi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLicenses.map((lic) => {
              const isExpired = lic.expires_at && new Date(lic.expires_at) < new Date();
              const daysLeft = lic.expires_at ? Math.ceil((new Date(lic.expires_at).getTime() - Date.now()) / 86400000) : 999;
              const isEditing = editId === lic.id;

              return (
                <div
                  key={lic.id}
                  className={`bg-gray-800 rounded-xl border transition-all ${
                    isExpired ? 'border-red-500/30' : lic.status === 'revoked' ? 'border-gray-600' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Key & Buyer */}
                      <div className="flex-1 min-w-[250px]">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => copyKey(lic.license_key)}
                            className="font-mono text-sm text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                            title="Klik untuk menyalin"
                          >
                            {lic.license_key}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                            lic.tier === 'enterprise' ? 'bg-red-500/20 text-red-400' :
                            lic.tier === 'professional' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {lic.tier}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            lic.status === 'active' && !isExpired ? 'bg-green-500/20 text-green-400' :
                            lic.status === 'revoked' ? 'bg-red-500/20 text-red-400' :
                            lic.status === 'suspended' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {isExpired ? 'Kadaluarsa' : lic.status === 'active' ? 'Aktif' : lic.status === 'revoked' ? 'Dicabut' : 'Ditangguhkan'}
                          </span>
                        </div>
                        <p className="text-white font-medium">{lic.buyer_name}</p>
                        <p className="text-gray-400 text-sm">{lic.buyer_email} {lic.buyer_phone && `• ${lic.buyer_phone}`}</p>
                      </div>

                      {/* Domain & Dates */}
                      <div className="min-w-[200px]">
                        <div className="text-sm">
                          <span className="text-gray-500">Domain:</span>{' '}
                          <span className={lic.domain_bound ? 'text-green-400' : 'text-gray-600'}>
                            {lic.domain_bound || 'Belum terikat'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Berakhir:</span>{' '}
                          <span className={isExpired ? 'text-red-400' : daysLeft <= 30 ? 'text-yellow-400' : 'text-gray-300'}>
                            {new Date(lic.expires_at).toLocaleDateString('id-ID')}
                            {!isExpired && ` (${daysLeft} hari)`}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Dibuat:</span>{' '}
                          <span className="text-gray-400">{new Date(lic.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">WM:</span>{' '}
                          <span className="text-gray-500 font-mono text-xs">{lic.watermark_id}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditId(isEditing ? null : lic.id)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300"
                          title="Actions"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {lic.notes && (
                      <p className="mt-2 text-gray-500 text-xs italic">📝 {lic.notes}</p>
                    )}
                  </div>

                  {/* Expanded Actions */}
                  {isEditing && (
                    <div className="px-4 pb-4 border-t border-gray-700 pt-3 flex flex-wrap gap-2">
                      {lic.status === 'active' && (
                        <button onClick={() => handleUpdateStatus(lic.id, 'suspended')} className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-medium rounded-lg transition-colors">
                          ⏸️ Tangguhkan
                        </button>
                      )}
                      {(lic.status === 'suspended' || lic.status === 'expired') && (
                        <button onClick={() => handleUpdateStatus(lic.id, 'active')} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium rounded-lg transition-colors">
                          ✅ Aktifkan
                        </button>
                      )}
                      {lic.status !== 'revoked' && (
                        <button onClick={() => handleUpdateStatus(lic.id, 'revoked')} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">
                          🚫 Cabut Lisensi
                        </button>
                      )}
                      {lic.domain_bound && (
                        <button onClick={() => handleResetDomain(lic.id)} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-colors">
                          🔄 Reset Domain
                        </button>
                      )}
                      <button onClick={() => handleExtend(lic.id, 1)} className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-medium rounded-lg transition-colors">
                        +1 Bulan
                      </button>
                      <button onClick={() => handleExtend(lic.id, 6)} className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-medium rounded-lg transition-colors">
                        +6 Bulan
                      </button>
                      <button onClick={() => handleExtend(lic.id, 12)} className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-medium rounded-lg transition-colors">
                        +1 Tahun
                      </button>
                      <div className="flex-1" />
                      <button onClick={() => handleDelete(lic.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded-lg transition-colors">
                        🗑️ Hapus
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
