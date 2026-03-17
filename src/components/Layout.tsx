import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  CalendarClock,
  Receipt,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  Wifi,
  WifiOff,
  HelpCircle,
} from 'lucide-react';
import { getCurrentUser, logout, getStoreSettings } from '../store';
import type { StoreSettings } from '../types';
import { isOwnerMode } from '../lib/license';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(getStoreSettings());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Reload settings when navigating away from settings page
  useEffect(() => {
    setStoreSettings(getStoreSettings());
  }, [location.pathname]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pos', icon: ShoppingCart, label: 'Kasir / POS' },
    { to: '/products', icon: Package, label: 'Produk' },
    { to: '/rentals', icon: CalendarClock, label: 'Penyewaan' },
    { to: '/transactions', icon: Receipt, label: 'Transaksi' },
    ...(user?.role === 'admin'
      ? [
          { to: '/users', icon: Users, label: 'Pengguna' },
          { to: '/settings', icon: Settings, label: 'Pengaturan Toko' },
        ]
      : []),
    { to: '/help', icon: HelpCircle, label: 'Bantuan' },
    ...(isOwnerMode()
      ? [{ to: '/license-manager', icon: Settings, label: '🔑 License Manager' }]
      : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {storeSettings.store_logo ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center shadow-lg shrink-0">
                  <img src={storeSettings.store_logo} alt="Logo" className="w-full h-full object-contain p-0.5" />
                </div>
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-2xl shadow-lg shrink-0">
                  👗
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                  {storeSettings.store_name || 'Baju Bodo'}
                </h1>
                <p className="text-xs text-primary-600 font-medium">POS System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu Utama
          </p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              <ChevronRight size={16} className="ml-auto opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center gap-4 no-print">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <p className="text-sm text-gray-500">
              Selamat datang kembali, <span className="font-semibold text-gray-700">{user?.name}</span>
            </p>
            {/* Online/Offline Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-amber-50 text-amber-700'
            }`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
