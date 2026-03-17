import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
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

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Detect iOS Safari
  const isIOSSafari = /iP(hone|od|ad)/.test(navigator.userAgent) && 
    /WebKit/.test(navigator.userAgent) && 
    !/(CriOS|FxiOS|OPiOS|mercury)/.test(navigator.userAgent);

  // Check if already installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkInstalled();
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);
    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setRegistration(reg);
          console.log('[PWA] Service Worker registered');

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.log('[PWA] SW registration failed:', err);
        });

      // Listen for controller change (after update)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  // Check dismissed state from localStorage  
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Reset after 24 hours
      if (Date.now() - dismissedTime > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('pwa_install_dismissed');
      } else {
        setInstallDismissed(true);
      }
    }
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } catch (err) {
      console.error('[PWA] Install error:', err);
    }
  }, [installPrompt]);

  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  const dismissInstall = useCallback(() => {
    setInstallDismissed(true);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  }, []);

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    isIOSSafari,
    installApp,
    updateApp,
    dismissInstall,
    installDismissed,
  };
}
