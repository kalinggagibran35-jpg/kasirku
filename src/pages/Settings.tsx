import { useState, useRef, useEffect } from 'react';
import {
  Store,
  Upload,
  Link as LinkIcon,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  ImageIcon,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Palette,
} from 'lucide-react';
import type { StoreSettings } from '../types';
import { getStoreSettings, updateStoreSettings, resetStoreSettings, isSupabaseConfigured } from '../store';
import { getSupabaseStatus } from '../lib/supabase';
import { PWAStatus } from '../components/PWAComponents';
import { usePWA } from '../hooks/usePWA';
import { useLicenseInfo } from '../components/LicenseGuard';
import { isOwnerMode, removeLicenseLocal, getTierLimits } from '../lib/license';

export default function Settings() {
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());
  const [saved, setSaved] = useState(false);
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrl, setLogoUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pwa = usePWA();

  useEffect(() => {
    if (settings.store_logo && settings.store_logo.startsWith('http')) {
      setLogoUrl(settings.store_logo);
      setLogoMode('url');
    }
  }, []);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = (h / w) * maxSize;
            w = maxSize;
          } else {
            w = (w / h) * maxSize;
            h = maxSize;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        setSettings(prev => ({ ...prev, store_logo: dataUrl }));
        setLogoUrl('');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoUpload(file);
  };

  const handleUrlSubmit = () => {
    if (logoUrl.trim()) {
      setSettings(prev => ({ ...prev, store_logo: logoUrl.trim() }));
    }
  };

  const removeLogo = () => {
    setSettings(prev => ({ ...prev, store_logo: '' }));
    setLogoUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = () => {
    updateStoreSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaults = resetStoreSettings();
    setSettings(defaults);
    setLogoUrl('');
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Store size={22} className="text-red-600" />
            </div>
            Pengaturan Toko
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px]">
            Ubah logo, nama toko, dan informasi lainnya
          </p>
        </div>
        <button
          onClick={() => setShowPreview(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Eye size={16} /> Preview
        </button>
      </div>

      {/* Success Banner */}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Pengaturan berhasil disimpan!</p>
            <p className="text-sm text-emerald-600">Perubahan akan langsung diterapkan di seluruh aplikasi.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Logo */}
        <div className="lg:col-span-1 space-y-5">
          {/* Logo Upload Card */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Palette size={18} className="text-red-600" />
              Logo Toko
            </h2>

            {/* Current Logo Preview */}
            <div className="flex justify-center mb-5">
              <div className="relative group">
                {settings.store_logo ? (
                  <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-white flex items-center justify-center shadow-sm">
                    <img
                      src={settings.store_logo}
                      alt="Logo"
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden flex-col items-center text-gray-400">
                      <ImageIcon size={32} />
                      <p className="text-xs mt-1">Gagal memuat</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-3xl shadow-lg">
                      👗
                    </div>
                    <p className="text-xs text-gray-400 font-medium">Logo Default</p>
                  </div>
                )}
                {settings.store_logo && (
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Hapus logo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Upload Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                onClick={() => setLogoMode('upload')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  logoMode === 'upload'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload size={14} /> Upload File
              </button>
              <button
                onClick={() => setLogoMode('url')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  logoMode === 'url'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LinkIcon size={14} /> URL Gambar
              </button>
            </div>

            {logoMode === 'upload' ? (
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-400 hover:bg-red-50/50'
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
                <Upload size={28} className={`mx-auto mb-2 ${dragActive ? 'text-red-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-600 font-medium">
                  {dragActive ? 'Lepas file di sini' : 'Klik atau seret file ke sini'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG • Max 5MB</p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="input-field text-sm"
                  placeholder="https://example.com/logo.png"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!logoUrl.trim()}
                  className="btn-primary w-full text-sm disabled:opacity-50"
                >
                  Terapkan URL
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3 text-center">
              💡 Logo ditampilkan di sidebar, halaman login, dan struk pembayaran
            </p>
          </div>
        </div>

        {/* Right Column - Store Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Store Identity */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
              <Store size={18} className="text-red-600" />
              Identitas Toko
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Toko <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                  className="input-field text-lg font-bold"
                  placeholder="Nama toko Anda"
                  maxLength={50}
                />
                <p className="text-xs text-gray-400 mt-1">{settings.store_name.length}/50 karakter</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tagline / Deskripsi
                </label>
                <input
                  type="text"
                  value={settings.store_subtitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_subtitle: e.target.value }))}
                  className="input-field"
                  placeholder="Deskripsi singkat toko"
                  maxLength={100}
                />
                <p className="text-xs text-gray-400 mt-1">{settings.store_subtitle.length}/100 karakter</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
              <Phone size={18} className="text-red-600" />
              Informasi Kontak
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} /> Alamat
                </label>
                <textarea
                  value={settings.store_address}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_address: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Alamat lengkap toko"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Phone size={14} /> Telepon
                  </label>
                  <input
                    type="tel"
                    value={settings.store_phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, store_phone: e.target.value }))}
                    className="input-field"
                    placeholder="0411-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} /> Email
                  </label>
                  <input
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, store_email: e.target.value }))}
                    className="input-field"
                    placeholder="info@bajubodo.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
              <FileText size={18} className="text-red-600" />
              Pengaturan Struk
            </h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Pesan di Bawah Struk
              </label>
              <textarea
                value={settings.receipt_footer}
                onChange={(e) => setSettings(prev => ({ ...prev, receipt_footer: e.target.value }))}
                className="input-field"
                rows={2}
                placeholder="Pesan di bagian bawah struk pembayaran"
                maxLength={150}
              />
              <p className="text-xs text-gray-400 mt-1">{settings.receipt_footer.length}/150 karakter</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 justify-between">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <RotateCcw size={16} /> Reset ke Default
            </button>
            <button
              onClick={handleSave}
              disabled={!settings.store_name.trim()}
              className="btn-primary flex items-center gap-2 px-8 py-3 text-base disabled:opacity-50"
            >
              <Save size={18} /> Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>

      {/* Database Status Section */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          ☁️ Status Database
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{
            backgroundColor: isSupabaseConfigured ? '#f0fdf4' : '#fffbeb',
            borderColor: isSupabaseConfigured ? '#bbf7d0' : '#fde68a',
          }}>
            <div className={`w-4 h-4 rounded-full ${isSupabaseConfigured ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: isSupabaseConfigured ? '#166534' : '#92400e' }}>
                {isSupabaseConfigured ? 'Supabase Connected' : 'Mode Lokal (localStorage)'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: isSupabaseConfigured ? '#15803d' : '#a16207' }}>
                {isSupabaseConfigured
                  ? `Host: ${getSupabaseStatus().url}`
                  : 'Data hanya tersimpan di browser ini. Atur environment variables Supabase untuk cloud sync.'}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-2">📋 Cara Setup Supabase:</p>
            <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
              <li>Buat project di <strong>supabase.com</strong></li>
              <li>Jalankan <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">SUPABASE_SCHEMA.sql</code> di SQL Editor</li>
              <li>Set <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">VITE_SUPABASE_URL</code> & <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">VITE_SUPABASE_ANON_KEY</code></li>
              <li>Deploy ke <strong>Vercel</strong> — lihat <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">DEPLOY_GUIDE.md</code></li>
            </ol>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-xs text-gray-500">Data Storage</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {isSupabaseConfigured ? '☁️ Cloud + Local' : '💾 Local Only'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-xs text-gray-500">Sync Mode</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {isSupabaseConfigured ? '🔄 Auto Sync' : '❌ No Sync'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* License Status Section */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          🔑 Status Lisensi
        </h2>
        <LicenseStatusSection />
      </div>

      {/* PWA Status Section */}
      <div className="card">
        <PWAStatus
          isInstallable={pwa.isInstallable}
          isInstalled={pwa.isInstalled}
          isOnline={pwa.isOnline}
          isIOSSafari={pwa.isIOSSafari}
          installApp={pwa.installApp}
        />
      </div>

      {/* Live Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">👁️ Preview Tampilan</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Preview Sidebar */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sidebar</p>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 max-w-xs">
                  <div className="flex items-center gap-3">
                    {settings.store_logo ? (
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shadow-lg shrink-0">
                        <img src={settings.store_logo} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-2xl shadow-lg shrink-0">
                        👗
                      </div>
                    )}
                    <div className="min-w-0">
                      <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                        {settings.store_name || 'Nama Toko'}
                      </h1>
                      <p className="text-xs text-red-600 font-medium">POS System</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Login */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Halaman Login</p>
                <div className="bg-gradient-to-br from-red-800 via-red-700 to-red-900 rounded-2xl p-8 text-white max-w-sm">
                  {settings.store_logo ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur flex items-center justify-center mb-4 shadow-xl">
                      <img src={settings.store_logo} alt="Logo" className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="text-7xl mb-4">👗</div>
                  )}
                  <h1 className="text-3xl font-bold mb-2 leading-tight">
                    {settings.store_name || 'Nama Toko'}<br />
                    <span className="text-yellow-400">POS System</span>
                  </h1>
                  <p className="text-sm text-red-200">{settings.store_subtitle || 'Deskripsi toko'}</p>
                </div>
              </div>

              {/* Preview Receipt */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Struk Pembayaran</p>
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center max-w-xs mx-auto">
                  {settings.store_logo ? (
                    <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-2">
                      <img src={settings.store_logo} alt="Logo" className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="text-4xl mb-2">👗</div>
                  )}
                  <h2 className="text-lg font-bold text-gray-900">{settings.store_name || 'Nama Toko'}</h2>
                  <p className="text-xs text-gray-500">{settings.store_subtitle || 'Deskripsi toko'}</p>
                  {settings.store_address && (
                    <p className="text-xs text-gray-400 mt-1">{settings.store_address}</p>
                  )}
                  {settings.store_phone && (
                    <p className="text-xs text-gray-400">Tel: {settings.store_phone}</p>
                  )}
                  <div className="border-t border-dashed border-gray-300 mt-3 pt-3">
                    <p className="text-xs text-gray-400 italic">— contoh item transaksi —</p>
                  </div>
                  <div className="border-t border-dashed border-gray-300 mt-3 pt-3">
                    <p className="text-xs text-gray-400">{settings.receipt_footer}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowPreview(false)} className="btn-secondary">Tutup</button>
              <button
                onClick={() => {
                  handleSave();
                  setShowPreview(false);
                }}
                disabled={!settings.store_name.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="text-5xl mb-4">🔄</div>
            <h3 className="text-lg font-bold text-gray-900">Reset Pengaturan?</h3>
            <p className="text-sm text-gray-500 mt-2">
              Semua pengaturan toko akan dikembalikan ke default, termasuk logo dan nama toko.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary flex-1">
                Batal
              </button>
              <button onClick={handleReset} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === License Status Section ===
function LicenseStatusSection() {
  const licenseInfo = useLicenseInfo();
  const ownerMode = isOwnerMode();

  const tierLimits = getTierLimits(licenseInfo.tier as 'starter' | 'professional' | 'enterprise');

  function handleDeactivate() {
    if (confirm('Yakin ingin menonaktifkan lisensi? Anda perlu mengaktifkan ulang.')) {
      removeLicenseLocal();
      window.location.reload();
    }
  }

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        ownerMode
          ? 'bg-purple-50 border-purple-200'
          : licenseInfo.isLicensed
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
      }`}>
        <div className={`w-4 h-4 rounded-full ${
          ownerMode ? 'bg-purple-500 animate-pulse' : licenseInfo.isLicensed ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        <div className="flex-1">
          <p className={`font-semibold text-sm ${ownerMode ? 'text-purple-800' : licenseInfo.isLicensed ? 'text-green-800' : 'text-red-800'}`}>
            {ownerMode ? '👑 Mode Owner (Bypass)' : licenseInfo.isLicensed ? '✅ Lisensi Aktif' : '❌ Tidak Berlisensi'}
          </p>
          {licenseInfo.license && (
            <p className="text-xs mt-0.5 text-green-600">
              {licenseInfo.license.buyer_name} • {licenseInfo.license.buyer_email}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-500">Tier</p>
          <p className={`text-sm font-bold mt-1 ${
            licenseInfo.tier === 'enterprise' ? 'text-red-600' : licenseInfo.tier === 'professional' ? 'text-yellow-600' : 'text-blue-600'
          }`}>
            {tierLimits.name}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-500">Maks Produk</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{tierLimits.maxProducts >= 99999 ? '∞' : tierLimits.maxProducts}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-500">Maks User</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{tierLimits.maxUsers >= 99999 ? '∞' : tierLimits.maxUsers}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-500">Sisa Hari</p>
          <p className={`text-sm font-bold mt-1 ${licenseInfo.daysRemaining <= 7 ? 'text-red-600' : licenseInfo.daysRemaining <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
            {licenseInfo.daysRemaining >= 999 ? '∞' : licenseInfo.daysRemaining + ' hari'}
          </p>
        </div>
      </div>

      {licenseInfo.license && (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Domain:</span>{' '}
              <span className="text-gray-700 font-mono">{licenseInfo.license.domain}</span>
            </div>
            <div>
              <span className="text-gray-500">Watermark:</span>{' '}
              <span className="text-gray-700 font-mono">{licenseInfo.license.watermark_id}</span>
            </div>
            <div>
              <span className="text-gray-500">Diaktifkan:</span>{' '}
              <span className="text-gray-700">{new Date(licenseInfo.license.activated_at).toLocaleDateString('id-ID')}</span>
            </div>
            <div>
              <span className="text-gray-500">Berakhir:</span>{' '}
              <span className="text-gray-700">{new Date(licenseInfo.license.expires_at).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </div>
      )}

      {!ownerMode && licenseInfo.isLicensed && (
        <button
          onClick={handleDeactivate}
          className="text-red-500 hover:text-red-600 text-xs underline"
        >
          Nonaktifkan lisensi di perangkat ini
        </button>
      )}

      {ownerMode && (
        <a
          href="#/license-manager"
          className="block text-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          🔑 Buka License Manager
        </a>
      )}
    </div>
  );
}
