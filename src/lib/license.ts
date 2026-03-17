/**
 * License Protection System for KasirKu
 * =============================================
 * - Online validation via Supabase
 * - Domain binding
 * - Device fingerprinting
 * - Anti-tampering
 * - Watermarking
 */

import type { LicenseActivation, LicenseTier } from '../types';

const LICENSE_STORAGE_KEY = 'bodo_license_data';
const LICENSE_CHECK_KEY = 'bodo_license_check';
const OWNER_MODE_KEY = 'bodo_owner_mode';

// ============ DEVICE FINGERPRINT ============
export function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('KasirKu', 2, 2);
  }
  const canvasData = canvas.toDataURL();

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    canvasData.slice(-50),
  ];

  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'FP-' + Math.abs(hash).toString(36).toUpperCase();
}

// ============ LICENSE KEY GENERATION ============
export function generateLicenseKey(tier: LicenseTier): string {
  const prefix = tier === 'enterprise' ? 'ENT' : tier === 'professional' ? 'PRO' : 'STR';
  const segments: string[] = [prefix];
  for (let i = 0; i < 3; i++) {
    const seg = Math.random().toString(36).substring(2, 6).toUpperCase();
    segments.push(seg);
  }
  const base = segments.join('-');
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i);
  segments.push((sum % 9999).toString().padStart(4, '0'));
  return segments.join('-');
}

export function validateKeyFormat(key: string): boolean {
  const pattern = /^(STR|PRO|ENT)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-\d{4}$/;
  if (!pattern.test(key)) return false;

  const parts = key.split('-');
  const checksum = parseInt(parts[4]);
  const base = parts.slice(0, 4).join('-');
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i);
  return (sum % 9999) === checksum;
}

// ============ TIER LIMITS ============
export function getTierLimits(tier: LicenseTier): { maxProducts: number; maxUsers: number; name: string; features: string[] } {
  switch (tier) {
    case 'starter':
      return {
        maxProducts: 50,
        maxUsers: 2,
        name: 'Starter',
        features: ['Maks 50 produk', '2 akun pengguna', 'POS Kasir', 'Penjualan & Penyewaan', 'Laporan dasar'],
      };
    case 'professional':
      return {
        maxProducts: 500,
        maxUsers: 10,
        name: 'Professional',
        features: ['Maks 500 produk', '10 akun pengguna', 'POS Kasir', 'Penjualan & Penyewaan', 'Laporan lengkap', 'Export Excel', 'Import Excel', 'Multi diskon'],
      };
    case 'enterprise':
      return {
        maxProducts: 99999,
        maxUsers: 99999,
        name: 'Enterprise',
        features: ['Produk unlimited', 'User unlimited', 'Semua fitur Professional', 'Priority support', 'Custom branding', 'Multi cabang (soon)'],
      };
  }
}

// ============ WATERMARK ============
export function generateWatermarkId(): string {
  return 'WM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ============ LOCAL LICENSE STORAGE ============
export function saveLicenseLocal(activation: LicenseActivation): void {
  const encoded = btoa(JSON.stringify(activation));
  localStorage.setItem(LICENSE_STORAGE_KEY, encoded);
  localStorage.setItem(LICENSE_CHECK_KEY, Date.now().toString());
}

export function getLicenseLocal(): LicenseActivation | null {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!raw) return null;
    const decoded = JSON.parse(atob(raw));
    return decoded as LicenseActivation;
  } catch {
    return null;
  }
}

export function removeLicenseLocal(): void {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
  localStorage.removeItem(LICENSE_CHECK_KEY);
}

export function isLicenseExpired(license: LicenseActivation): boolean {
  if (!license.expires_at) return false;
  return new Date(license.expires_at) < new Date();
}

export function getDaysRemaining(license: LicenseActivation): number {
  if (!license.expires_at) return 999;
  const diff = new Date(license.expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getCurrentDomain(): string {
  return window.location.hostname || 'localhost';
}

// ============ OWNER MODE ============
export function isOwnerMode(): boolean {
  return localStorage.getItem(OWNER_MODE_KEY) === 'true';
}

export function setOwnerMode(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem(OWNER_MODE_KEY, 'true');
  } else {
    localStorage.removeItem(OWNER_MODE_KEY);
  }
}

// PENTING: Ganti password ini sebelum dijual!
// Buka file ini → ubah nilai di bawah → simpan → push ke GitHub
const OWNER_PASSWORD = 'Allahuakbar1@';

export function verifyOwnerPassword(password: string): boolean {
  return password === OWNER_PASSWORD;
}
// ============ LICENSE LOGGING ============
export async function logLicenseEvent(
  licenseId: string,
  action: 'activated' | 'validated' | 'expired' | 'revoked' | 'domain_reset' | 'reactivated' | 'validation_failed',
  details: string = ''
): Promise<void> {
  try {
    const { supabase, isSupabaseConfigured } = await import('./supabase');
    if (!isSupabaseConfigured || !supabase) return;

    await supabase.from('license_logs').insert({
      license_id: licenseId,
      action,
      domain: getCurrentDomain(),
      user_agent: navigator.userAgent.slice(0, 200),
      ip_address: '',
      details,
    });
  } catch (err) {
    // Logging tidak boleh ganggu aplikasi utama
    console.warn('[License] Failed to log event:', err);
  }
}



// ============ SUPABASE LICENSE VALIDATION ============
export async function validateLicenseOnline(licenseKey: string): Promise<{
  valid: boolean;
  error?: string;
  license?: {
    id: string;
    buyer_name: string;
    buyer_email: string;
    tier: LicenseTier;
    status: string;
    domain_bound: string;
    expires_at: string;
    max_products: number;
    max_users: number;
    watermark_id: string;
  };
}> {
  try {
    const { supabase, isSupabaseConfigured } = await import('./supabase');
    if (!isSupabaseConfigured || !supabase) {
      return { valid: false, error: 'Server lisensi tidak tersedia. Hubungi penyedia aplikasi.' };
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Kunci lisensi tidak ditemukan. Pastikan kunci yang Anda masukkan benar.' };
    }

    if (data.status === 'revoked') {
      await logLicenseEvent(data.id, 'revoked', `Akses ditolak - status revoked dari domain: ${getCurrentDomain()}`);
      return { valid: false, error: 'Lisensi ini telah dicabut. Hubungi penyedia aplikasi.' };
    }

    if (data.status === 'suspended') {
      return { valid: false, error: 'Lisensi ini sedang ditangguhkan. Hubungi penyedia aplikasi.' };
    }

    if (data.status === 'expired' || (data.expires_at && new Date(data.expires_at) < new Date())) {
      await logLicenseEvent(data.id, 'expired', `Lisensi kadaluarsa diakses dari domain: ${getCurrentDomain()}`);
      return { valid: false, error: 'Lisensi ini sudah kadaluarsa. Perpanjang lisensi Anda.' };
    }

    const currentDomain = getCurrentDomain();
    if (data.domain_bound && data.domain_bound !== '' && data.domain_bound !== currentDomain) {
      return { valid: false, error: `Lisensi ini terikat ke domain "${data.domain_bound}". Domain Anda saat ini: "${currentDomain}".` };
    }

    // Log validasi berhasil
    await logLicenseEvent(data.id, 'validated', `Validasi dari domain: ${getCurrentDomain()}`);

    return {
      valid: true,
      license: {
        id: data.id,
        buyer_name: data.buyer_name,
        buyer_email: data.buyer_email,
        tier: data.tier,
        status: data.status,
        domain_bound: data.domain_bound,
        expires_at: data.expires_at,
        max_products: data.max_products,
        max_users: data.max_users,
        watermark_id: data.watermark_id,
      },
    };
  } catch (err) {
    console.error('[License] Online validation error:', err);
    return { valid: false, error: 'Gagal menghubungi server lisensi. Periksa koneksi internet Anda.' };
  }
}

export async function activateLicenseOnline(licenseKey: string): Promise<{
  success: boolean;
  error?: string;
  activation?: LicenseActivation;
}> {
  const result = await validateLicenseOnline(licenseKey);
  if (!result.valid || !result.license) {
    return { success: false, error: result.error };
  }

  const license = result.license;
  const domain = getCurrentDomain();
  const fingerprint = generateFingerprint();

  try {
    const { supabase } = await import('./supabase');
    if (supabase) {
      await supabase
        .from('licenses')
        .update({
          domain_bound: domain,
          device_fingerprint: fingerprint,
          activated_at: new Date().toISOString(),
        })
        .eq('id', license.id);
    }
  } catch (err) {
    console.error('[License] Failed to update activation:', err);
  }

  const activation: LicenseActivation = {
    license_key: licenseKey,
    buyer_name: license.buyer_name,
    buyer_email: license.buyer_email,
    domain,
    fingerprint,
    tier: license.tier,
    expires_at: license.expires_at,
    activated_at: new Date().toISOString(),
    watermark_id: license.watermark_id,
    max_products: license.max_products,
    max_users: license.max_users,
  };

  saveLicenseLocal(activation);

  // Log aktivasi ke database
  await logLicenseEvent(license.id, 'activated', `Aktivasi dari domain: ${domain}`);

  return { success: true, activation };
}

// ============ ANTI-TAMPERING ============
export function initProtection(): void {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') { e.preventDefault(); return false; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') { e.preventDefault(); return false; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') { e.preventDefault(); return false; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') { e.preventDefault(); return false; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); return false; }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); return false; }
    return true;
  });

  const style = document.createElement('style');
  style.textContent = `
    body { -webkit-user-select: none; user-select: none; }
    input, textarea, [contenteditable] { -webkit-user-select: text; user-select: text; }
  `;
  document.head.appendChild(style);

  const license = getLicenseLocal();
  if (license?.watermark_id) {
    const wm = document.createElement('div');
    wm.style.cssText = 'position:fixed;bottom:-9999px;left:-9999px;opacity:0;pointer-events:none;font-size:1px;';
    wm.setAttribute('data-wm', license.watermark_id);
    wm.textContent = `Licensed to: ${license.buyer_name} (${license.buyer_email}) | WM: ${license.watermark_id}`;
    document.body.appendChild(wm);
  }

  const warningStyle = 'color:red;font-size:24px;font-weight:bold;';
  const textStyle = 'color:#333;font-size:14px;';
  console.log('%c⚠️ PERINGATAN!', warningStyle);
  console.log('%cAplikasi ini dilindungi oleh sistem lisensi. Segala upaya reverse-engineering, penyalinan, atau redistribusi tanpa izin adalah pelanggaran hukum dan akan ditindak sesuai ketentuan yang berlaku.', textStyle);
}
