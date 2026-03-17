import { useState, useEffect } from 'react';
import type { LicenseActivation } from '../types';
import {
  getLicenseLocal,
  isLicenseExpired,
  getDaysRemaining,
  validateKeyFormat,
  activateLicenseOnline,
  isOwnerMode,
  verifyOwnerPassword,
  setOwnerMode,
  initProtection,
  getCurrentDomain,
  generateFingerprint,
  getTierLimits,
  removeLicenseLocal,
} from '../lib/license';
import { isSupabaseConfigured } from '../lib/supabase';
import { loadFromSupabase } from '../lib/sync';
import { initializeStore } from '../store';

import SetupWizard from './SetupWizard';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export default function LicenseGuard({ children }: LicenseGuardProps) {
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'expired' | 'activate'>('checking');
  const [license, setLicense] = useState<LicenseActivation | null>(null);
  const [showExpireWarning, setShowExpireWarning] = useState(false);
  // Setup wizard hanya muncul jika browser belum pernah setup sama sekali
  // Jika sudah ada data users di localStorage, skip wizard
  const getSetupDoneForLicense = (_licenseKey: string) => {
    const users = localStorage.getItem('bodo_users');
    const setupFlag = localStorage.getItem('bodo_setup_complete');
    return setupFlag === 'true' || (!!users && users !== '[]');
  };
  const [setupDone, setSetupDone] = useState(true); // default true, update saat lisensi valid
  const [currentLicenseKey, setCurrentLicenseKey] = useState('');

  useEffect(() => {
    checkLicenseOnline();

    // Validasi ulang setiap 5 menit
    const interval = setInterval(() => { checkLicenseOnline(); }, 5 * 60 * 1000);

    // Validasi saat tab browser aktif kembali (user pindah tab lalu balik)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLicenseOnline();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Validasi saat browser online kembali setelah offline
    const handleOnline = () => { checkLicenseOnline(); };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (status === 'valid') initProtection();
  }, [status]);

  async function checkLicenseOnline(): Promise<void> {
    // Selalu set checking dulu - jangan tampilkan konten sampai server konfirmasi
    setStatus('checking');

    // Owner bypass
    if (isOwnerMode()) { setStatus('valid'); return; }

    // Tanpa Supabase - wajib aktivasi
    if (!isSupabaseConfigured) { setStatus('activate'); return; }

    const stored = getLicenseLocal();

    // Tidak ada lisensi tersimpan - bersihkan sesi login lama
    if (!stored) {
      localStorage.removeItem('bodo_current_user');
      setStatus('activate');
      return;
    }

    // Cek expired lokal dulu (tanpa network)
    if (isLicenseExpired(stored)) {
      removeLicenseLocal();
      localStorage.removeItem('bodo_current_user'); // Bersihkan sesi login
      setLicense(stored);
      setStatus('expired');
      return;
    }

    // Validasi ke Supabase - WAJIB konfirmasi server sebelum set valid
    try {
      const { validateLicenseOnline } = await import('../lib/license');
      const result = await validateLicenseOnline(stored.license_key);

      if (!result.valid) {
        // Hapus cache lisensi DAN sesi login
        removeLicenseLocal();
        localStorage.removeItem('bodo_current_user');
        setLicense(stored);
        if (result.error?.includes('kadaluarsa')) {
          setStatus('expired');
        } else {
          setStatus('activate');
        }
        return;
      }

      // Cek domain
      const currentDomain = getCurrentDomain();
      if (stored.domain && stored.domain !== currentDomain && stored.domain !== 'localhost') {
        removeLicenseLocal();
        setStatus('invalid');
        return;
      }

      // VALID - konfirmasi dari Supabase sudah dapat
      setOwnerMode(false);
      setLicense(stored);
      setCurrentLicenseKey(stored.license_key);

      const needsSetup = !getSetupDoneForLicense(stored.license_key);
      setSetupDone(!needsSetup);

      const daysLeft = getDaysRemaining(stored);
      if (daysLeft <= 7 && daysLeft > 0) setShowExpireWarning(true);

      // Load data dari Supabase HANYA jika setup sudah selesai
      // Jika belum setup (wizard perlu muncul), jangan load data dulu
      // agar bodo_users tetap kosong dan setupFirstAdmin bisa berjalan
      if (!needsSetup) {
        try {
          await loadFromSupabase();
          initializeStore();
        } catch {
          initializeStore();
        }
      } else {
        // Wizard perlu muncul - bersihkan data users agar setupFirstAdmin bisa jalan
        localStorage.removeItem('bodo_users');
        localStorage.removeItem('bodo_products');
        localStorage.removeItem('bodo_transactions');
        localStorage.removeItem('bodo_current_user');
        localStorage.removeItem('bodo_setup_complete');
      }

      setStatus('valid'); // Set valid TERAKHIR setelah semua selesai

    } catch (err) {
      console.warn('[License] Server tidak bisa dihubungi, cek lokal:', err);
      // Offline fallback - hanya izinkan jika ada lisensi lokal yang belum expired
      const freshStored = getLicenseLocal();
      if (!freshStored || isLicenseExpired(freshStored)) {
        if (freshStored) { removeLicenseLocal(); setLicense(freshStored); }
        setStatus(freshStored ? 'expired' : 'activate');
        return;
      }
      // Ada lisensi lokal valid - izinkan akses offline sementara
      setOwnerMode(false);
      setLicense(freshStored);
      setCurrentLicenseKey(freshStored.license_key);
      setSetupDone(getSetupDoneForLicense(freshStored.license_key));
      initializeStore();
      setStatus('valid');
    }
  }

  if (status === 'checking') {
    return <LicenseCheckingScreen />;
  }

  if (status === 'activate' || status === 'invalid') {
    return <LicenseActivationPage onActivated={() => { checkLicenseOnline(); }} />;
  }

  if (status === 'expired') {
    return <LicenseExpiredPage license={license} onReactivated={() => { checkLicenseOnline(); }} />;
  }

  if (!setupDone) {
    return <SetupWizard onComplete={async () => {
      // Tandai setup selesai
      localStorage.setItem('bodo_setup_complete', 'true');
      if (currentLicenseKey) {
        localStorage.setItem('bodo_setup_' + currentLicenseKey, 'true');
      }
      // Setelah wizard selesai, baru load data dari Supabase
      try {
        await loadFromSupabase();
        initializeStore();
      } catch {
        initializeStore();
      }
      setSetupDone(true);
    }} />;
  }

  return (
    <>
      {children}
      {showExpireWarning && license && (
        <LicenseExpiryWarning
          daysLeft={getDaysRemaining(license)}
          onDismiss={() => setShowExpireWarning(false)}
        />
      )}
    </>
  );
}

// === CHECKING SCREEN ===
function LicenseCheckingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">Memeriksa Lisensi...</h2>
        <p className="text-gray-400 text-sm">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}

// === ACTIVATION PAGE ===
function LicenseActivationPage({ onActivated }: { onActivated: () => void }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOwner, setShowOwner] = useState(false);
  const [ownerPass, setOwnerPass] = useState('');
  const [ownerError, setOwnerError] = useState('');

  async function handleActivate() {
    setError('');

    if (!licenseKey.trim()) {
      setError('Masukkan kunci lisensi');
      return;
    }

    if (!validateKeyFormat(licenseKey.trim().toUpperCase())) {
      setError('Format kunci lisensi tidak valid. Contoh: PRO-XXXX-XXXX-XXXX-0000');
      return;
    }

    setLoading(true);

    try {
      // Pastikan owner mode DIMATIKAN saat pembeli aktivasi lisensi
      setOwnerMode(false);
      const result = await activateLicenseOnline(licenseKey.trim().toUpperCase());
      if (result.success) {
        onActivated();
      } else {
        setError(result.error || 'Aktivasi gagal');
      }
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  }

  function handleOwnerLogin() {
    if (verifyOwnerPassword(ownerPass)) {
      setOwnerMode(true);
      onActivated();
    } else {
      setOwnerError('Password owner salah');
    }
  }

  const tiers = [
    { tier: 'starter' as const, price: 'Rp 299.000', color: 'from-blue-500 to-blue-700' },
    { tier: 'professional' as const, price: 'Rp 599.000', color: 'from-yellow-500 to-yellow-700' },
    { tier: 'enterprise' as const, price: 'Rp 1.499.000', color: 'from-red-500 to-red-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👗</div>
          <h1 className="text-3xl font-bold text-white mb-2">KasirKu</h1>
          <p className="text-gray-400">Aplikasi Kasir Profesional</p>
        </div>

        {/* Activation Card */}
        <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-8 border border-gray-700 shadow-2xl mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Aktivasi Lisensi</h2>
            <p className="text-gray-400 mt-1">Masukkan kunci lisensi untuk mengaktifkan aplikasi</p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Kunci Lisensi</label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="PRO-XXXX-XXXX-XXXX-0000"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-center text-lg tracking-widest font-mono"
                maxLength={24}
                onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={loading || !licenseKey.trim()}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  Memvalidasi...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Aktivasi Sekarang
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <p className="text-gray-500 text-sm">
                Info domain: <span className="text-gray-400 font-mono">{getCurrentDomain()}</span>
              </p>
              <p className="text-gray-500 text-sm">
                Fingerprint: <span className="text-gray-400 font-mono text-xs">{generateFingerprint()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {tiers.map(({ tier, price, color }) => {
            const info = getTierLimits(tier);
            return (
              <div key={tier} className="bg-gray-800/60 rounded-xl p-5 border border-gray-700 hover:border-gray-500 transition-all">
                <div className={`inline-block px-3 py-1 bg-gradient-to-r ${color} text-white text-xs font-bold rounded-full mb-3 uppercase`}>
                  {info.name}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{price}</div>
                <div className="text-gray-500 text-xs mb-4">Lisensi 1 tahun</div>
                <ul className="space-y-2">
                  {info.features.map((f, i) => (
                    <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Contact & Owner Mode */}
        <div className="text-center space-y-3">
          <p className="text-gray-500 text-sm">
            Belum punya lisensi? Hubungi kami di WhatsApp: <a href="https://wa.me/6285298328159" target="_blank" className="text-yellow-400 hover:underline">085298328159</a>
          </p>
          <button
            onClick={() => setShowOwner(!showOwner)}
            className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
          >
            Owner Access
          </button>

          {showOwner && (
            <div className="max-w-xs mx-auto mt-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <input
                type="password"
                value={ownerPass}
                onChange={(e) => setOwnerPass(e.target.value)}
                placeholder="Owner Password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
                onKeyDown={(e) => e.key === 'Enter' && handleOwnerLogin()}
              />
              {ownerError && <p className="text-red-400 text-xs mb-2">{ownerError}</p>}
              <button
                onClick={handleOwnerLogin}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Login sebagai Owner
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// === EXPIRED PAGE ===
function LicenseExpiredPage({ license, onReactivated }: { license: LicenseActivation | null; onReactivated: () => void }) {
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRenew() {
    setError('');
    if (!validateKeyFormat(newKey.trim().toUpperCase())) {
      setError('Format kunci lisensi tidak valid');
      return;
    }
    setLoading(true);
    try {
      removeLicenseLocal();
      const result = await activateLicenseOnline(newKey.trim().toUpperCase());
      if (result.success) {
        onReactivated();
      } else {
        setError(result.error || 'Aktivasi gagal');
      }
    } catch {
      setError('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-8 border border-red-500/30 shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Lisensi Kadaluarsa</h2>
          <p className="text-gray-400 mb-2">Lisensi Anda telah berakhir pada:</p>
          {license && (
            <p className="text-red-400 font-mono font-bold mb-6">
              {new Date(license.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          <div className="text-left mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Kunci Lisensi Baru</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase())}
              placeholder="PRO-XXXX-XXXX-XXXX-0000"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center font-mono tracking-wider"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleRenew}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                Memvalidasi...
              </>
            ) : (
              'Perpanjang Lisensi'
            )}
          </button>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
            <p className="text-gray-400 text-sm mb-3">Hubungi kami untuk perpanjangan lisensi:</p>
            <a
              href={`https://wa.me/6285298328159?text=Halo, saya ingin memperpanjang lisensi KasirKu. Nama: ${license?.buyer_name || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.528 5.845L.057 23.885l6.19-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.869 9.869 0 01-5.031-1.378l-.361-.214-3.735.979.997-3.645-.235-.374A9.859 9.859 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
              </svg>
              Chat WhatsApp Sekarang
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// === EXPIRY WARNING BANNER ===
function LicenseExpiryWarning({ daysLeft, onDismiss }: { daysLeft: number; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] bg-yellow-900/95 backdrop-blur border border-yellow-600/50 rounded-xl p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-yellow-300 font-bold text-sm">Lisensi Segera Berakhir</h4>
          <p className="text-yellow-200/70 text-xs mt-1">
            Lisensi Anda akan berakhir dalam <span className="font-bold text-yellow-300">{daysLeft} hari</span>.
            Perpanjang segera untuk menghindari gangguan.
          </p>
        </div>
        <button onClick={onDismiss} className="text-yellow-400 hover:text-yellow-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// === EXPORT LICENSE INFO HOOK ===
export function useLicenseInfo(): {
  isLicensed: boolean;
  license: LicenseActivation | null;
  isOwner: boolean;
  tier: string;
  daysRemaining: number;
} {
  const ownerMode = isOwnerMode();
  const license = getLicenseLocal();

  return {
    isLicensed: ownerMode || !!license,
    license,
    isOwner: ownerMode,
    tier: ownerMode ? 'enterprise' : (license?.tier || 'starter'),
    daysRemaining: license ? getDaysRemaining(license) : 999,
  };
}
