import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  USERS: 'bodo_users',
  PRODUCTS: 'bodo_products',
  TRANSACTIONS: 'bodo_transactions',
  STORE_SETTINGS: 'bodo_store_settings',
};

/**
 * Load all data from Supabase into localStorage.
 * Returns true if successful, false otherwise.
 */
export async function loadFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const [usersRes, productsRes, transRes, settingsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('products').select('*').order('created_at', { ascending: true }),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('store_settings').select('*').eq('id', 1).maybeSingle(),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (productsRes.error) throw productsRes.error;
    if (transRes.error) throw transRes.error;

    // Only overwrite localStorage if we got data from Supabase
    if (usersRes.data && usersRes.data.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersRes.data));
    }
    if (productsRes.data && productsRes.data.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(productsRes.data));
    }
    if (transRes.data) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transRes.data));
    }
    if (settingsRes.data) {
      localStorage.setItem(STORAGE_KEYS.STORE_SETTINGS, JSON.stringify(settingsRes.data));
    }

    console.log('[Supabase] ✅ Data loaded successfully from cloud');
    return true;
  } catch (err) {
    console.error('[Supabase] ❌ Failed to load data:', err);
    return false;
  }
}

// ==========================================
// SYNC HELPERS (fire-and-forget, background)
// ==========================================

export function syncInsert(table: string, data: Record<string, unknown>) {
  if (!isSupabaseConfigured || !supabase) return;
  supabase
    .from(table)
    .insert(data)
    .then(({ error }) => {
      if (error) console.error(`[Supabase] Insert ${table} error:`, error.message);
      else console.log(`[Supabase] ✅ Inserted into ${table}`);
    });
}

export function syncUpdate(table: string, id: string | number, data: Record<string, unknown>) {
  if (!isSupabaseConfigured || !supabase) return;
  supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.error(`[Supabase] Update ${table} error:`, error.message);
      else console.log(`[Supabase] ✅ Updated ${table} id=${id}`);
    });
}

export function syncDelete(table: string, id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  supabase
    .from(table)
    .delete()
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.error(`[Supabase] Delete ${table} error:`, error.message);
      else console.log(`[Supabase] ✅ Deleted from ${table} id=${id}`);
    });
}

export function syncUpsert(table: string, data: Record<string, unknown>) {
  if (!isSupabaseConfigured || !supabase) return;
  supabase
    .from(table)
    .upsert(data)
    .then(({ error }) => {
      if (error) console.error(`[Supabase] Upsert ${table} error:`, error.message);
      else console.log(`[Supabase] ✅ Upserted ${table}`);
    });
}

/**
 * Sync multiple product stock updates at once.
 */
export function syncProductStocks(updates: { id: string; stock: number }[]) {
  if (!isSupabaseConfigured || !supabase) return;
  for (const { id, stock } of updates) {
    supabase
      .from('products')
      .update({ stock })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error(`[Supabase] Stock update error for ${id}:`, error.message);
      });
  }
}
