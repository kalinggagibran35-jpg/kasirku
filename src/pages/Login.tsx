import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck, KeyRound, AlertTriangle, X, CheckCircle2, ArrowLeft, RotateCcw } from 'lucide-react';
import { loginAsync, getStoreSettings, emergencyResetPassword, emergencyFactoryReset, getUsernames } from '../store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const storeSettings = getStoreSettings();

  // Emergency Reset States
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState<'menu' | 'reset-pw' | 'factory'>('menu');
  const [emergencyKey, setEmergencyKey] = useState('');
  const [emergencyUsername, setEmergencyUsername] = useState('');
  const [emergencyNewPassword, setEmergencyNewPassword] = useState('');
  const [emergencyConfirmPassword, setEmergencyConfirmPassword] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyNewUsername, setEmergencyNewUsername] = useState('');
  const [showEmergencyPassword, setShowEmergencyPassword] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyError, setEmergencyError] = useState('');
  const [emergencySuccess, setEmergencySuccess] = useState('');
  const [usernames] = useState(getUsernames());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const user = await loginAsync(username.trim(), password);
      if (user) {
        navigate('/');
      } else {
        setError('Username atau password salah!');
      }
    } catch {
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setEmergencyError('');
    setEmergencySuccess('');

    if (!emergencyKey.trim()) {
      setEmergencyError('Kunci darurat wajib diisi');
      return;
    }
    if (!emergencyUsername.trim()) {
      setEmergencyError('Pilih username yang ingin direset');
      return;
    }
    if (emergencyNewPassword.length < 6) {
      setEmergencyError('Password baru minimal 6 karakter');
      return;
    }
    if (emergencyNewPassword !== emergencyConfirmPassword) {
      setEmergencyError('Konfirmasi password tidak cocok');
      return;
    }

    setEmergencyLoading(true);
    try {
      const success = await emergencyResetPassword(emergencyKey.trim(), emergencyUsername, emergencyNewPassword);
      if (success) {
        setEmergencySuccess(`Password untuk "${emergencyUsername}" berhasil direset! Silakan login dengan password baru.`);
        setEmergencyKey('');
        setEmergencyNewPassword('');
        setEmergencyConfirmPassword('');
      } else {
        setEmergencyError('Kunci darurat salah atau username tidak ditemukan!');
      }
    } catch {
      setEmergencyError('Terjadi kesalahan');
    }
    setEmergencyLoading(false);
  };

  const handleFactoryReset = async () => {
    setEmergencyError('');
    setEmergencySuccess('');

    if (!emergencyKey.trim()) {
      setEmergencyError('Kunci darurat wajib diisi');
      return;
    }
    if (!emergencyName.trim()) {
      setEmergencyError('Nama admin baru wajib diisi');
      return;
    }
    if (!emergencyNewUsername.trim() || emergencyNewUsername.trim().length < 3) {
      setEmergencyError('Username admin baru wajib diisi (minimal 3 karakter)');
      return;
    }
    if (emergencyNewPassword.length < 6) {
      setEmergencyError('Password minimal 6 karakter');
      return;
    }
    if (emergencyNewPassword !== emergencyConfirmPassword) {
      setEmergencyError('Konfirmasi password tidak cocok');
      return;
    }

    setEmergencyLoading(true);
    try {
      const success = await emergencyFactoryReset(emergencyKey.trim(), emergencyName.trim(), emergencyNewUsername.trim(), emergencyNewPassword);
      if (success) {
        setEmergencySuccess('Factory Reset berhasil! Semua data telah dihapus dan akun admin baru telah dibuat. Silakan login.');
        setEmergencyKey('');
        setEmergencyNewPassword('');
        setEmergencyConfirmPassword('');
        setEmergencyName('');
        setEmergencyNewUsername('');
        setTimeout(() => {
          setShowEmergency(false);
          window.location.reload();
        }, 3000);
      } else {
        setEmergencyError('Kunci darurat salah!');
      }
    } catch {
      setEmergencyError('Terjadi kesalahan');
    }
    setEmergencyLoading(false);
  };

  const resetEmergencyForm = () => {
    setEmergencyMode('menu');
    setEmergencyKey('');
    setEmergencyUsername('');
    setEmergencyNewPassword('');
    setEmergencyConfirmPassword('');
    setEmergencyName('');
    setEmergencyNewUsername('');
    setEmergencyError('');
    setEmergencySuccess('');
  };

  const displayName = storeSettings.store_name || 'KasirKu';

  return (
    <div className="min-h-screen flex">
      {/* Left: Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border-2 border-white rounded-full" />
          <div className="absolute top-10 right-10 text-white text-9xl opacity-20 rotate-12">ᨔ</div>
          <div className="absolute bottom-40 left-10 text-white text-8xl opacity-15 -rotate-12">ᨅ</div>
          <div className="absolute top-1/3 right-1/4 text-white text-7xl opacity-10 rotate-45">ᨉ</div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {storeSettings.store_logo ? (
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-8 shadow-xl">
              <img src={storeSettings.store_logo} alt="Logo" className="w-full h-full object-contain p-2" />
            </div>
          ) : (
            <div className="text-7xl mb-8">👗</div>
          )}
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            {displayName}<br />
            <span className="text-gold-400">POS System</span>
          </h1>
          <p className="text-lg text-primary-200 max-w-md leading-relaxed">
            {storeSettings.store_subtitle || 'Sistem Kasir Profesional untuk Jual Beli & Penyewaan'}
          </p>
          {storeSettings.store_address && (
            <p className="text-sm text-primary-300 mt-4 flex items-center gap-2">
              📍 {storeSettings.store_address}
            </p>
          )}
          {storeSettings.store_phone && (
            <p className="text-sm text-primary-300 mt-1 flex items-center gap-2">
              📞 {storeSettings.store_phone}
            </p>
          )}
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            {storeSettings.store_logo ? (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white border-2 border-gray-100 rounded-2xl shadow-xl mb-4 overflow-hidden">
                <img src={storeSettings.store_logo} alt="Logo" className="w-full h-full object-contain p-2" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl text-4xl shadow-xl mb-4">
                👗
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-500 mt-1">{storeSettings.store_subtitle || 'Sistem Kasir Profesional'}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Masuk ke Akun</h2>
              <p className="text-gray-500 mt-2">Silakan login untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Masukkan username"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="Masukkan password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn size={20} />
                )}
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            {/* Lupa Password */}
            <div className="mt-5 text-center">
              <button
                onClick={() => { setShowEmergency(true); resetEmergencyForm(); }}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium hover:underline inline-flex items-center gap-1.5 transition-colors"
              >
                <KeyRound size={14} />
                Lupa Password?
              </button>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                <ShieldCheck size={14} />
                <span>Password terenkripsi SHA-256</span>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            &copy; {new Date().getFullYear()} {displayName}. Dikembangkan oleh Murdani
          </p>
        </div>
      </div>

      {/* Emergency Reset Modal */}
      {showEmergency && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEmergency(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {emergencyMode !== 'menu' && (
                  <button onClick={() => { setEmergencyMode('menu'); setEmergencyError(''); setEmergencySuccess(''); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {emergencyMode === 'menu' && '🔑 Pemulihan Akun'}
                    {emergencyMode === 'reset-pw' && '🔓 Reset Password'}
                    {emergencyMode === 'factory' && '🏭 Factory Reset'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {emergencyMode === 'menu' && 'Pilih opsi pemulihan'}
                    {emergencyMode === 'reset-pw' && 'Reset password akun tanpa menghapus data'}
                    {emergencyMode === 'factory' && 'Hapus semua data & buat akun baru'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEmergency(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Success Message */}
              {emergencySuccess && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{emergencySuccess}</p>
                </div>
              )}

              {/* Error Message */}
              {emergencyError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{emergencyError}</p>
                </div>
              )}

              {/* Menu */}
              {emergencyMode === 'menu' && !emergencySuccess && (
                <div className="space-y-4">
                  {/* Info Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold mb-1">Diperlukan Kunci Darurat</p>
                        <p>Untuk keamanan, fitur pemulihan memerlukan <strong>Kunci Darurat (Emergency Key)</strong> yang diberikan saat instalasi pertama. Hubungi penyedia aplikasi jika Anda tidak memilikinya.</p>
                      </div>
                    </div>
                  </div>

                  {/* Option 1: Reset Password */}
                  <button
                    onClick={() => setEmergencyMode('reset-pw')}
                    className="w-full text-left p-5 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                        <KeyRound size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Reset Password</h4>
                        <p className="text-sm text-gray-500 mt-0.5">Ubah password akun yang sudah ada tanpa menghapus data apapun</p>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Factory Reset */}
                  <button
                    onClick={() => setEmergencyMode('factory')}
                    className="w-full text-left p-5 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
                        <RotateCcw size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Factory Reset</h4>
                        <p className="text-sm text-gray-500 mt-0.5">Hapus <strong>semua data</strong> (produk, transaksi, akun) dan mulai dari awal</p>
                        <p className="text-xs text-red-500 mt-1 font-medium">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
                      </div>
                    </div>
                  </button>

                  {/* Help */}
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-600">
                      Butuh bantuan? Hubungi penyedia aplikasi atau baca <strong>Buku Panduan</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Reset Password Form */}
              {emergencyMode === 'reset-pw' && !emergencySuccess && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🔑 Kunci Darurat</label>
                    <input
                      type="password"
                      value={emergencyKey}
                      onChange={e => setEmergencyKey(e.target.value)}
                      className="input-field"
                      placeholder="Masukkan kunci darurat"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Pilih Akun</label>
                    {usernames.length > 0 ? (
                      <select
                        value={emergencyUsername}
                        onChange={e => setEmergencyUsername(e.target.value)}
                        className="input-field"
                      >
                        <option value="">-- Pilih username --</option>
                        {usernames.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">Tidak ada akun terdaftar. Gunakan Factory Reset.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Password Baru</label>
                    <div className="relative">
                      <input
                        type={showEmergencyPassword ? 'text' : 'password'}
                        value={emergencyNewPassword}
                        onChange={e => setEmergencyNewPassword(e.target.value)}
                        className="input-field pr-12"
                        placeholder="Minimal 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmergencyPassword(!showEmergencyPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showEmergencyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Konfirmasi Password Baru</label>
                    <input
                      type={showEmergencyPassword ? 'text' : 'password'}
                      value={emergencyConfirmPassword}
                      onChange={e => setEmergencyConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="Ketik ulang password baru"
                    />
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={emergencyLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-70"
                  >
                    {emergencyLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <KeyRound size={18} />
                    )}
                    {emergencyLoading ? 'Memproses...' : 'Reset Password'}
                  </button>
                </div>
              )}

              {/* Factory Reset Form */}
              {emergencyMode === 'factory' && !emergencySuccess && (
                <div className="space-y-4">
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-bold mb-1">⚠️ PERINGATAN!</p>
                        <p>Factory Reset akan menghapus <strong>SEMUA DATA</strong> termasuk:</p>
                        <ul className="list-disc ml-4 mt-1 space-y-0.5">
                          <li>Semua akun pengguna</li>
                          <li>Semua produk & gambar</li>
                          <li>Semua transaksi & riwayat</li>
                          <li>Semua pengaturan</li>
                        </ul>
                        <p className="mt-2 font-semibold">Data di Supabase (cloud) TIDAK akan terpengaruh.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🔑 Kunci Darurat</label>
                    <input
                      type="password"
                      value={emergencyKey}
                      onChange={e => setEmergencyKey(e.target.value)}
                      className="input-field"
                      placeholder="Masukkan kunci darurat"
                    />
                  </div>

                  <hr className="border-gray-200" />
                  <p className="text-sm font-semibold text-gray-700">Buat Akun Admin Baru:</p>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={e => setEmergencyName(e.target.value)}
                      className="input-field"
                      placeholder="Nama admin baru"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={emergencyNewUsername}
                      onChange={e => setEmergencyNewUsername(e.target.value)}
                      className="input-field"
                      placeholder="Username admin baru (min 3 karakter)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showEmergencyPassword ? 'text' : 'password'}
                        value={emergencyNewPassword}
                        onChange={e => setEmergencyNewPassword(e.target.value)}
                        className="input-field pr-12"
                        placeholder="Minimal 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmergencyPassword(!showEmergencyPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showEmergencyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Konfirmasi Password</label>
                    <input
                      type={showEmergencyPassword ? 'text' : 'password'}
                      value={emergencyConfirmPassword}
                      onChange={e => setEmergencyConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="Ketik ulang password"
                    />
                  </div>

                  <button
                    onClick={handleFactoryReset}
                    disabled={emergencyLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70"
                  >
                    {emergencyLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <RotateCcw size={18} />
                    )}
                    {emergencyLoading ? 'Memproses...' : 'Factory Reset & Buat Akun Baru'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
