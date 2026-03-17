import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeStore, getCurrentUser, isSupabaseConfigured, getStoreSettings } from './store';
import { isOwnerMode } from './lib/license';
import { loadFromSupabase } from './lib/sync';
import { usePWA } from './hooks/usePWA';
import { OfflineIndicator, UpdatePrompt, InstallBanner } from './components/PWAComponents';
import LicenseGuard from './components/LicenseGuard';

import Layout from './components/Layout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Rentals from './pages/Rentals';
import Transactions from './pages/Transactions';
import UsersPage from './pages/Users';
import SettingsPage from './pages/Settings';
import HelpPage from './pages/Help';
import LicenseManager from './pages/LicenseManager';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function OwnerRoute({ children }: { children: React.ReactNode }) {
  if (!isOwnerMode()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
          <p className="text-gray-400">Halaman ini hanya untuk Owner aplikasi</p>
          <a href="#/" className="mt-4 inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
            ← Kembali
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  const storeSettings = getStoreSettings();
  const displayName = storeSettings.store_name || 'KasirKu';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex items-center justify-center">
      <div className="text-center">
        {storeSettings.store_logo ? (
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-6">
            <img src={storeSettings.store_logo} alt="Logo" className="w-full h-full object-contain p-2" />
          </div>
        ) : (
          <div className="text-7xl mb-6 animate-bounce">👗</div>
        )}
        <h1 className="text-3xl font-bold text-white mb-2">{displayName}</h1>
        <p className="text-red-200 mb-8">Memuat data...</p>
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        {isSupabaseConfigured && (
          <div className="mt-6 flex items-center justify-center gap-2 text-red-300 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Menghubungkan ke database...
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const pwa = usePWA();

  useEffect(() => {
    async function init() {
      try {
        // loadFromSupabase hanya dipanggil jika ada lisensi valid di localStorage
        // Ini mencegah data users dimuat sebelum lisensi divalidasi
        const { getLicenseLocal, isLicenseExpired, isOwnerMode } = await import('./lib/license');
        const stored = getLicenseLocal();
        const hasValidLicense = isOwnerMode() || (stored && !isLicenseExpired(stored));

        if (isSupabaseConfigured && hasValidLicense) {
          console.log('[App] Lisensi valid, memuat data dari cloud...');
          const connected = await loadFromSupabase();
          if (connected) {
            console.log('[App] ✅ Data berhasil dimuat');
          } else {
            console.log('[App] ⚠️ Gagal terhubung, menggunakan data lokal');
          }
        }
      } catch (err) {
        console.error('[App] Init error:', err);
      }
      initializeStore();
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <LicenseGuard>
      <HashRouter>
        <Routes>
          {/* License Manager - Owner Only */}
          <Route path="/license-manager" element={<OwnerRoute><LicenseManager /></OwnerRoute>} />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/help" element={<HelpPage />} />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AdminRoute>
                  <SettingsPage />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>

      {/* PWA Components */}
      <OfflineIndicator isOnline={pwa.isOnline} />
      <UpdatePrompt isUpdateAvailable={pwa.isUpdateAvailable} updateApp={pwa.updateApp} />
      <InstallBanner
        isInstallable={pwa.isInstallable}
        isInstalled={pwa.isInstalled}
        isIOSSafari={pwa.isIOSSafari}
        installApp={pwa.installApp}
        dismissInstall={pwa.dismissInstall}
        installDismissed={pwa.installDismissed}
      />
    </LicenseGuard>
  );
}
