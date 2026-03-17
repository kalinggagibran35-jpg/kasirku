import type { User, Product, Transaction, DashboardStats, StoreSettings } from '../types';
import { syncInsert, syncUpdate, syncDelete, syncUpsert, syncProductStocks } from '../lib/sync';
import { hashPassword, verifyPassword, isHashed } from '../lib/auth';
import { getLicenseLocal, isLicenseExpired, isOwnerMode } from '../lib/license';

// Re-export Supabase utilities for use by pages
export { isSupabaseConfigured, getSupabaseStatus } from '../lib/supabase';
export { loadFromSupabase } from '../lib/sync';

const STORAGE_KEYS = {
  USERS: 'bodo_users',
  PRODUCTS: 'bodo_products',
  TRANSACTIONS: 'bodo_transactions',
  CURRENT_USER: 'bodo_current_user',
  STORE_SETTINGS: 'bodo_store_settings',
  SETUP_COMPLETE: 'bodo_setup_complete',
};

const defaultStoreSettings: StoreSettings = {
  store_name: '',
  store_subtitle: '',
  store_logo: '',
  store_address: '',
  store_phone: '',
  store_email: '',
  receipt_footer: 'Terima kasih atas kunjungan Anda! 🙏',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// === SETUP ===

/**
 * Check if the initial setup has been completed (at least 1 admin exists)
 */
export function isSetupComplete(): boolean {
  // Check flag first
  if (localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE) === 'true') return true;
  // Also check if users exist
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
  if (users.length > 0) {
    localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');
    return true;
  }
  return false;
}

/**
 * Setup the first admin account (only works when no users exist)
 */
export async function setupFirstAdmin(name: string, username: string, password: string): Promise<User> {
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
  if (users.length > 0) {
    throw new Error('Setup sudah selesai. Tidak dapat membuat admin lagi dari wizard.');
  }

  const hashedPw = await hashPassword(password);
  const admin: User = {
    id: generateId(),
    username,
    password: hashedPw,
    name,
    role: 'admin',
    active: true,
    created_at: new Date().toISOString(),
  };

  saveToStorage(STORAGE_KEYS.USERS, [admin]);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, []);
  saveToStorage(STORAGE_KEYS.PRODUCTS, []);
  localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');

  // Sync to Supabase
  syncInsert('users', admin as unknown as Record<string, unknown>);

  return admin;
}

// Initialize store (no seed data — only initialize empty arrays if not present)
export function initializeStore(): void {
  // Hanya inisialisasi jika ada lisensi valid atau owner mode
  const storedLicense = getLicenseLocal();
  const hasValidLicense = isOwnerMode() || (storedLicense && !isLicenseExpired(storedLicense));
  if (!hasValidLicense) return; // Jangan inisialisasi tanpa lisensi

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveToStorage(STORAGE_KEYS.USERS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    saveToStorage(STORAGE_KEYS.PRODUCTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, []);
  }
}

// === AUTH ===
export async function loginAsync(username: string, password: string): Promise<User | null> {
  // SECURITY: Cek lisensi valid sebelum izinkan login
  // Mencegah login jika lisensi expired, revoked, atau tidak ada
  const storedLicense = getLicenseLocal();
  const hasValidLicense = isOwnerMode() || (storedLicense && !isLicenseExpired(storedLicense));
  if (!hasValidLicense) {
    // Bersihkan sesi lama dan tolak login
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return null;
  }

  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);

  for (const user of users) {
    if (user.username !== username || !user.active) continue;

    // Support both hashed and plain passwords (migration)
    if (isHashed(user.password)) {
      const valid = await verifyPassword(password, user.password);
      if (valid) {
        const safeUser = { ...user, password: '***' };
        saveToStorage(STORAGE_KEYS.CURRENT_USER, safeUser);
        return safeUser;
      }
    } else {
      // Legacy plain-text password — auto-migrate to hash
      if (user.password === password) {
        const hashedPw = await hashPassword(password);
        user.password = hashedPw;
        saveToStorage(STORAGE_KEYS.USERS, users);
        syncUpdate('users', user.id, { password: hashedPw });

        const safeUser = { ...user, password: '***' };
        saveToStorage(STORAGE_KEYS.CURRENT_USER, safeUser);
        return safeUser;
      }
    }
  }

  return null;
}

// Keep synchronous login for backward compat (delegates to async internally)
export function login(username: string, password: string): User | null {
  // This is a sync wrapper — pages should migrate to loginAsync
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
  const user = users.find(u => u.username === username && u.active);
  if (!user) return null;

  // For non-hashed passwords only (legacy)
  if (!isHashed(user.password) && user.password === password) {
    const safeUser = { ...user, password: '***' };
    saveToStorage(STORAGE_KEYS.CURRENT_USER, safeUser);
    // Async migrate in background
    hashPassword(password).then(hashed => {
      const freshUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
      const idx = freshUsers.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        freshUsers[idx].password = hashed;
        saveToStorage(STORAGE_KEYS.USERS, freshUsers);
        syncUpdate('users', user.id, { password: hashed });
      }
    });
    return safeUser;
  }

  return null;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export function getCurrentUser(): User | null {
  return getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

// === USERS ===
export function getUsers(): User[] {
  return getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
}

export async function addUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const users = getUsers();

  // Check duplicate username
  if (users.some(u => u.username === user.username)) {
    throw new Error('Username sudah digunakan');
  }

  const hashedPw = await hashPassword(user.password);
  const newUser: User = {
    ...user,
    password: hashedPw,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  saveToStorage(STORAGE_KEYS.USERS, users);

  syncInsert('users', newUser as unknown as Record<string, unknown>);

  return newUser;
}

export function updateUser(id: string, data: Partial<User>): User | null {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  // If changing username, check for duplicates
  if (data.username && data.username !== users[index].username) {
    if (users.some(u => u.username === data.username && u.id !== id)) {
      throw new Error('Username sudah digunakan');
    }
  }

  users[index] = { ...users[index], ...data };
  saveToStorage(STORAGE_KEYS.USERS, users);

  syncUpdate('users', id, data as unknown as Record<string, unknown>);

  return users[index];
}

export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;

  const hashedPw = await hashPassword(newPassword);
  users[index].password = hashedPw;
  saveToStorage(STORAGE_KEYS.USERS, users);

  syncUpdate('users', id, { password: hashedPw });

  return true;
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  saveToStorage(STORAGE_KEYS.USERS, filtered);

  syncDelete('users', id);

  return filtered.length < users.length;
}

// === PRODUCTS ===
export function getProducts(): Product[] {
  return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
}

export function getActiveProducts(): Product[] {
  return getProducts().filter(p => p.active);
}

export function addProduct(product: Omit<Product, 'id' | 'created_at'>): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  products.push(newProduct);
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);

  syncInsert('products', newProduct as unknown as Record<string, unknown>);

  return newProduct;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...data };
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);

  syncUpdate('products', id, data as unknown as Record<string, unknown>);

  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  saveToStorage(STORAGE_KEYS.PRODUCTS, filtered);

  syncDelete('products', id);

  return filtered.length < products.length;
}

// === TRANSACTIONS ===
export function getTransactions(): Transaction[] {
  return getFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Transaction {
  const transactions = getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: 'TRX-' + Date.now().toString().slice(-8),
    created_at: new Date().toISOString(),
  };
  transactions.unshift(newTransaction);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

  // Update stock
  const products = getProducts();
  const stockUpdates: { id: string; stock: number }[] = [];
  for (const item of transaction.items) {
    const pIndex = products.findIndex(p => p.id === item.product_id);
    if (pIndex !== -1) {
      products[pIndex].stock = Math.max(0, products[pIndex].stock - item.quantity);
      stockUpdates.push({ id: item.product_id, stock: products[pIndex].stock });
    }
  }
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);

  syncInsert('transactions', newTransaction as unknown as Record<string, unknown>);
  syncProductStocks(stockUpdates);

  return newTransaction;
}

export function updateTransaction(id: string, data: Partial<Transaction>): Transaction | null {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index === -1) return null;
  transactions[index] = { ...transactions[index], ...data };
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

  syncUpdate('transactions', id, data as unknown as Record<string, unknown>);

  return transactions[index];
}

export function returnRental(transactionId: string): boolean {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);
  if (index === -1) return false;

  transactions[index].rental_status = 'returned';
  transactions[index].status = 'completed';

  const products = getProducts();
  const stockUpdates: { id: string; stock: number }[] = [];
  for (const item of transactions[index].items) {
    if (item.type === 'rental') {
      const pIndex = products.findIndex(p => p.id === item.product_id);
      if (pIndex !== -1) {
        products[pIndex].stock += item.quantity;
        stockUpdates.push({ id: item.product_id, stock: products[pIndex].stock });
      }
    }
  }
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

  syncUpdate('transactions', transactionId, {
    rental_status: 'returned',
    status: 'completed',
  });
  syncProductStocks(stockUpdates);

  return true;
}

// === DASHBOARD ===
export function getDashboardStats(): DashboardStats {
  const transactions = getTransactions();
  const products = getProducts();
  const today = new Date().toDateString();

  const todayTransactions = transactions.filter(t =>
    new Date(t.created_at).toDateString() === today && t.status !== 'cancelled'
  );

  const totalSalesToday = todayTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.total, 0);

  const totalRentalsToday = todayTransactions
    .filter(t => t.type === 'rental')
    .reduce((sum, t) => sum + t.total, 0);

  const activeRentals = transactions.filter(
    t => t.type === 'rental' && t.rental_status === 'active'
  ).length;

  const overdueRentals = transactions.filter(
    t => t.type === 'rental' && t.rental_status === 'active' && t.rental_end && new Date(t.rental_end) < new Date()
  ).length;

  const lowStockProducts = products.filter(p => p.active && p.stock <= 3).length;

  return {
    totalSalesToday,
    totalRentalsToday,
    totalRevenueToday: totalSalesToday + totalRentalsToday,
    totalProducts: products.filter(p => p.active).length,
    activeRentals,
    overdueRentals,
    lowStockProducts,
    totalTransactionsToday: todayTransactions.length,
  };
}

// === STORE SETTINGS ===
export function getStoreSettings(): StoreSettings {
  return getFromStorage<StoreSettings>(STORAGE_KEYS.STORE_SETTINGS, defaultStoreSettings);
}

export function updateStoreSettings(data: Partial<StoreSettings>): StoreSettings {
  const settings = getStoreSettings();
  const updated = { ...settings, ...data };
  saveToStorage(STORAGE_KEYS.STORE_SETTINGS, updated);

  syncUpsert('store_settings', { id: 1, ...updated } as unknown as Record<string, unknown>);

  return updated;
}

export function resetStoreSettings(): StoreSettings {
  saveToStorage(STORAGE_KEYS.STORE_SETTINGS, defaultStoreSettings);

  syncUpsert('store_settings', { id: 1, ...defaultStoreSettings } as unknown as Record<string, unknown>);

  return defaultStoreSettings;
}

// === EMERGENCY RESET ===
/**
 * Emergency password reset — requires the owner secret key
 * This resets ALL data and creates a new admin account
 */
export async function emergencyFactoryReset(secretKey: string, newAdminName: string, newAdminUsername: string, newAdminPassword: string): Promise<boolean> {
  const EMERGENCY_KEY = 'GANTI_KUNCI_DARURAT_ANDA_DISINI';
  if (secretKey !== EMERGENCY_KEY) return false;

  // Clear all data
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.SETUP_COMPLETE);

  // Create new admin
  const hashedPw = await hashPassword(newAdminPassword);
  const admin: User = {
    id: generateId(),
    username: newAdminUsername,
    password: hashedPw,
    name: newAdminName,
    role: 'admin',
    active: true,
    created_at: new Date().toISOString(),
  };

  saveToStorage(STORAGE_KEYS.USERS, [admin]);
  saveToStorage(STORAGE_KEYS.PRODUCTS, []);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, []);
  localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');

  syncInsert('users', admin as unknown as Record<string, unknown>);

  return true;
}

/**
 * Reset password for a specific user by admin/owner using the emergency key
 */
export async function emergencyResetPassword(secretKey: string, username: string, newPassword: string): Promise<boolean> {
  const EMERGENCY_KEY = 'GANTI_KUNCI_DARURAT_ANDA_DISINI';
  if (secretKey !== EMERGENCY_KEY) return false;

  const users = getUsers();
  const userIndex = users.findIndex(u => u.username === username);
  if (userIndex === -1) return false;

  const hashedPw = await hashPassword(newPassword);
  users[userIndex].password = hashedPw;
  saveToStorage(STORAGE_KEYS.USERS, users);
  syncUpdate('users', users[userIndex].id, { password: hashedPw });

  return true;
}

/**
 * Get list of usernames (for emergency reset selection)
 */
export function getUsernames(): string[] {
  const users = getUsers();
  return users.map(u => u.username);
}

// === UTILITIES ===
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
