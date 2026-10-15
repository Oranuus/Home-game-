/**
 * Persistent Audio Storage using browser IndexedDB
 * Allows user's exact uploaded audio files to be stored permanently
 * without compression or modification.
 */

const DB_NAME = 'haunted_house_music_db';
const STORE_NAME = 'user_audio_tracks';
const DB_VERSION = 1;

export interface StoredAudioTrack {
  id: string;
  name: string;
  blob: Blob;
  type: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioToStorage(id: string, name: string, file: File | Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: StoredAudioTrack = {
      id,
      name,
      blob: file,
      type: file.type || 'audio/mpeg',
      timestamp: Date.now(),
    };

    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadAllSavedAudios(): Promise<{ id: string; name: string; url: string }[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: StoredAudioTrack[] = request.result || [];
        const results = records.map((rec) => ({
          id: rec.id,
          name: rec.name,
          url: URL.createObjectURL(rec.blob),
        }));
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function removeAudioFromStorage(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // ignore
  }
}
