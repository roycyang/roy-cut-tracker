/**
 * Offline sync queue using IndexedDB.
 * Stores pending Supabase writes and replays them when network is restored.
 */

const DB_NAME = 'cut_sync';
const DB_VERSION = 1;
const STORE_NAME = 'pending_writes';

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queue a write operation for later sync.
 * @param {string} table - Supabase table name
 * @param {string} method - 'upsert' | 'insert' | 'delete'
 * @param {object} data - The row data
 * @param {object} [filter] - For delete: { column, value }
 */
export async function queueWrite(table, method, data, filter = null) {
  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({
      table,
      method,
      data,
      filter,
      created_at: new Date().toISOString(),
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.warn('Failed to queue write:', err);
  }
}

/**
 * Get all pending writes.
 */
export async function getPendingWrites() {
  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Remove a write from the queue after successful sync.
 */
export async function removePendingWrite(id) {
  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    console.warn('Failed to remove pending write:', err);
  }
}

/**
 * Replay all pending writes through Supabase.
 * Returns { synced: number, failed: number }
 */
export async function replayPendingWrites(supabase) {
  const pending = await getPendingWrites();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const write of pending) {
    try {
      let result;
      if (write.method === 'upsert') {
        result = await supabase.from(write.table).upsert(write.data);
      } else if (write.method === 'insert') {
        result = await supabase.from(write.table).insert(write.data);
      } else if (write.method === 'delete' && write.filter) {
        result = await supabase.from(write.table).delete().eq(write.filter.column, write.filter.value);
      }

      if (result?.error) {
        console.warn(`Sync failed for ${write.table}:`, result.error);
        failed++;
      } else {
        await removePendingWrite(write.id);
        synced++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Get count of pending writes.
 */
export async function getPendingCount() {
  const pending = await getPendingWrites();
  return pending.length;
}
