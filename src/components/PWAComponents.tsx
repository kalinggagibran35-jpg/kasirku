import { useState } from 'react';
import {
  Download,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Monitor,
  Share,
  Plus,
  CheckCircle2,
  Zap,
  Shield,
  HardDrive,
} from 'lucide-react';

interface PWAProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isIOSSafari: boolean;
  installApp: () => Promise<void>;
  updateApp: () => void;
  dismissInstall: () => void;
  installDismissed: boolean;
}

// ===== OFFLINE INDICATOR =====
export function OfflineIndicator({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-slide-up no-print">
      <WifiOff size={16} className="animate-pulse" />
      <span>Anda sedang offline — Data tersimpan lokal & akan tersinkron saat online</span>
      <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse" />
    </div>
  );
}

// ===== UPDATE PROMPT =====
export function UpdatePrompt({
  isUpdateAvailable,
  updateApp,
}: {
  isUpdateAvailable: boolean;
  updateApp: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!isUpdateAvailable || dismissed) return null;

  return (
    <div className="fixed top-4 right-4 z-[9998] bg-white rounded-2xl shadow-2xl border border-blue-200 p-5 max-w-sm animate-slide-down no-print">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <RefreshCw size={20} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm">Update Tersedia! 🎉</h4>
          <p className="text-xs text-gray-500 mt-1">
            Versi terbaru aplikasi sudah siap. Perbarui untuk mendapatkan fitur dan perbaikan terbaru.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={updateApp}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              Perbarui Sekarang
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2"
            >
              Nanti
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-300 hover:text-gray-500 p-0.5"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ===== INSTALL BANNER (Bottom bar) =====
export function InstallBanner({
  isInstallable,
  isInstalled,
  isIOSSafari,
  installApp,
  dismissInstall,
  installDismissed,
}: Omit<PWAProps, 'isOnline' | 'isUpdateAvailable' | 'updateApp'>) {
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || installDismissed) return null;
  if (!isInstallable && !isIOSSafari) return null;

  // iOS Safari Guide Modal
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/50 flex items-end justify-center no-print">
        <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Install di iPhone/iPad</h3>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Tap tombol <Share size={16} className="inline text-blue-500" /> Share
                </p>
                <p className="text-xs text-gray-500">Di bagian bawah Safari</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Pilih <Plus size={14} className="inline" /> "Add to Home Screen"
                </p>
                <p className="text-xs text-gray-500">Scroll ke bawah jika tidak terlihat</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Tap "Add" di kanan atas</p>
                <p className="text-xs text-gray-500">Aplikasi akan muncul di home screen</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShowIOSGuide(false);
              dismissInstall();
            }}
            className="w-full mt-6 bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Mengerti!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9997] no-print">
      <div className="bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 text-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* Icon */}
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
            <Smartphone size={24} className="text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Install KasirKu</p>
            <p className="text-xs text-white/70 mt-0.5">
              Akses lebih cepat & bisa digunakan offline
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isIOSSafari ? (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="bg-white text-primary-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors flex items-center gap-1.5"
              >
                <Download size={14} />
                Install
              </button>
            ) : (
              <button
                onClick={installApp}
                className="bg-white text-primary-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors flex items-center gap-1.5"
              >
                <Download size={14} />
                Install
              </button>
            )}
            <button
              onClick={dismissInstall}
              className="text-white/50 hover:text-white p-1.5"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== PWA STATUS (for Settings page) =====
export function PWAStatus({
  isInstallable,
  isInstalled,
  isOnline,
  isIOSSafari,
  installApp,
}: Pick<PWAProps, 'isInstallable' | 'isInstalled' | 'isOnline' | 'isIOSSafari' | 'installApp'>) {
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const hasSW = 'serviceWorker' in navigator;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Smartphone size={20} className="text-primary-600" />
        Status PWA
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Connection Status */}
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            isOnline
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          {isOnline ? (
            <Wifi size={20} className="text-emerald-600" />
          ) : (
            <WifiOff size={20} className="text-amber-600" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-gray-500">
              {isOnline ? 'Terhubung ke internet' : 'Mode offline aktif'}
            </p>
          </div>
        </div>

        {/* Install Status */}
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            isInstalled
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          {isInstalled ? (
            <CheckCircle2 size={20} className="text-emerald-600" />
          ) : (
            <Download size={20} className="text-blue-600" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {isInstalled ? 'Terinstall' : 'Belum Terinstall'}
            </p>
            <p className="text-xs text-gray-500">
              {isInstalled ? 'Berjalan sebagai aplikasi' : 'Berjalan di browser'}
            </p>
          </div>
        </div>

        {/* Service Worker */}
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            hasSW
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <Shield size={20} className={hasSW ? 'text-emerald-600' : 'text-gray-400'} />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Service Worker
            </p>
            <p className="text-xs text-gray-500">
              {hasSW ? 'Aktif - Caching & Offline' : 'Tidak didukung'}
            </p>
          </div>
        </div>

        {/* Offline Data */}
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200">
          <HardDrive size={20} className="text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Penyimpanan Lokal</p>
            <p className="text-xs text-gray-500">Data tersimpan di localStorage</p>
          </div>
        </div>
      </div>

      {/* Install Button */}
      {!isInstalled && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-5 border border-primary-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
              <Smartphone size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">Install Aplikasi</h4>
              <p className="text-sm text-gray-600 mt-1">
                Install KasirKu di perangkat Anda untuk akses cepat dari home screen, 
                performa lebih baik, dan bisa digunakan offline.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Zap size={12} className="text-amber-500" /> Akses Cepat
                </span>
                <span className="flex items-center gap-1">
                  <WifiOff size={12} className="text-blue-500" /> Mode Offline
                </span>
                <span className="flex items-center gap-1">
                  <Monitor size={12} className="text-purple-500" /> Fullscreen
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {isInstallable ? (
                  <button
                    onClick={installApp}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Install Sekarang
                  </button>
                ) : isIOSSafari ? (
                  <button
                    onClick={() => setShowIOSGuide(!showIOSGuide)}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Cara Install di iOS
                  </button>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    💡 Buka di Chrome/Edge untuk menginstall, atau gunakan menu browser &gt; "Install App"
                  </p>
                )}
              </div>

              {showIOSGuide && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                  <p className="text-sm font-medium text-gray-900">Langkah Install di Safari iOS:</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">1</span>
                    Tap <Share size={14} className="text-blue-500 mx-1" /> di bawah Safari
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">2</span>
                    Pilih <Plus size={14} className="mx-1" /> "Add to Home Screen"
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">3</span>
                    Tap "Add" di pojok kanan atas
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
