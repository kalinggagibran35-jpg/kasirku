import { useState } from 'react';
import { Eye, EyeOff, Store, UserPlus, CheckCircle2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { setupFirstAdmin, updateStoreSettings } from '../store';
import type { StoreSettings } from '../types';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Store Info
  const [storeName, setStoreName] = useState('');
  const [storeSubtitle, setStoreSubtitle] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');

  // Step 2: Admin Account
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleStoreSetup = () => {
    if (!storeName.trim()) {
      setError('Nama toko wajib diisi');
      return;
    }
    setError('');
    // Save store settings
    const settings: Partial<StoreSettings> = {
      store_name: storeName.trim(),
      store_subtitle: storeSubtitle.trim() || 'Jual Beli & Penyewaan Baju Tradisional',
      store_address: storeAddress.trim(),
      store_phone: storePhone.trim(),
      store_email: storeEmail.trim(),
    };
    updateStoreSettings(settings);
    setStep(2);
  };

  const handleAdminSetup = async () => {
    setError('');

    if (!adminName.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!adminUsername.trim()) {
      setError('Username wajib diisi');
      return;
    }
    if (adminUsername.trim().length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }
    if (adminPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await setupFirstAdmin(adminName.trim(), adminUsername.trim(), adminPassword);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat akun admin');
    }
    setLoading(false);
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full" />
        <div className="absolute bottom-20 right-20 w-96 h-96 border-2 border-white rounded-full" />
        <div className="absolute top-10 right-10 text-white text-9xl rotate-12">ᨔ</div>
        <div className="absolute bottom-40 left-10 text-white text-8xl -rotate-12">ᨅ</div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-5xl mb-4">
            👗
          </div>
          <h1 className="text-3xl font-bold text-white">Setup Awal</h1>
          <p className="text-red-200 mt-2">Konfigurasi aplikasi kasir Anda</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                s < step ? 'bg-green-500 text-white' :
                s === step ? 'bg-yellow-400 text-yellow-900 scale-110' :
                'bg-white/20 text-white/50'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 rounded ${s < step ? 'bg-green-400' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">

          {/* === STEP 1: Store Info === */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Store size={24} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Informasi Toko</h2>
                  <p className="text-sm text-gray-500">Atur identitas toko Anda</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Toko <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    className="input-field"
                    placeholder="Contoh: Baju Bodo Makassar"
                    maxLength={50}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tagline / Deskripsi</label>
                  <input
                    type="text"
                    value={storeSubtitle}
                    onChange={e => setStoreSubtitle(e.target.value)}
                    className="input-field"
                    placeholder="Contoh: Jual Beli & Penyewaan Baju Tradisional"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={e => setStoreAddress(e.target.value)}
                    className="input-field"
                    placeholder="Alamat lengkap toko"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telepon</label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={e => setStorePhone(e.target.value)}
                      className="input-field"
                      placeholder="0411-123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={storeEmail}
                      onChange={e => setStoreEmail(e.target.value)}
                      className="input-field"
                      placeholder="toko@email.com"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleStoreSetup}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-3"
              >
                Lanjut <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* === STEP 2: Admin Account === */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <UserPlus size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Buat Akun Admin</h2>
                  <p className="text-sm text-gray-500">Akun utama untuk mengelola aplikasi</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="input-field"
                    placeholder="Nama lengkap admin"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="input-field"
                    placeholder="Username untuk login (huruf kecil)"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-400 mt-1">Huruf kecil, angka, underscore saja</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {adminPassword.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            adminPassword.length < 6 ? 'w-1/4 bg-red-500' :
                            adminPassword.length < 8 ? 'w-2/4 bg-yellow-500' :
                            adminPassword.length < 12 ? 'w-3/4 bg-blue-500' :
                            'w-full bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        adminPassword.length < 6 ? 'text-red-500' :
                        adminPassword.length < 8 ? 'text-yellow-600' :
                        adminPassword.length < 12 ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {adminPassword.length < 6 ? 'Lemah' :
                         adminPassword.length < 8 ? 'Cukup' :
                         adminPassword.length < 12 ? 'Kuat' :
                         'Sangat Kuat'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminConfirmPassword}
                    onChange={e => setAdminConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Ketik ulang password"
                  />
                  {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
                    <p className="text-xs text-red-500 mt-1">❌ Password tidak cocok</p>
                  )}
                  {adminConfirmPassword && adminPassword === adminConfirmPassword && (
                    <p className="text-xs text-green-600 mt-1">✅ Password cocok</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setStep(1); setError(''); }}
                  className="btn-secondary flex items-center justify-center gap-2 py-3"
                >
                  <ChevronLeft size={18} /> Kembali
                </button>
                <button
                  onClick={handleAdminSetup}
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  {loading ? 'Membuat Akun...' : 'Buat Akun Admin'}
                </button>
              </div>
            </div>
          )}

          {/* === STEP 3: Complete === */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Selesai! 🎉</h2>
              <p className="text-gray-500 mb-6">
                Aplikasi kasir <strong>{storeName}</strong> siap digunakan.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Ringkasan Setup</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nama Toko</span>
                    <span className="font-medium text-gray-900">{storeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Username Admin</span>
                    <span className="font-mono font-medium text-gray-900">{adminUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Password</span>
                    <span className="font-medium text-gray-900">{'•'.repeat(adminPassword.length)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Penting:</strong> Catat username dan password Anda. Ini adalah satu-satunya akun admin yang bisa mengelola aplikasi.
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
              >
                <Sparkles size={20} /> Mulai Gunakan Aplikasi
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-red-300/60 text-xs mt-6">
          KasirKu &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
