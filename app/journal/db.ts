import type { JournalTag, SavedSession } from "../types";
import { JOURNAL_DB_NAME } from "~/lib/storageKeys";

const DB_VERSION = 1;
const SESSIONS_STORE = "sessions";
const TAGS_STORE = "tags";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(JOURNAL_DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const store = db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(TAGS_STORE)) {
        const store = db.createObjectStore(TAGS_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

export async function listSessions(): Promise<SavedSession[]> {
  if (!isBrowser()) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readonly");
    const store = tx.objectStore(SESSIONS_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const items = (request.result as (DbSession | SavedSession)[]).map(dbToSession);
      items.sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getSession(id: string): Promise<SavedSession | null> {
  if (!isBrowser()) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readonly");
    const request = tx.objectStore(SESSIONS_STORE).get(id);
    request.onsuccess = () =>
      resolve(request.result ? dbToSession(request.result as DbSession | SavedSession) : null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function putSession(session: SavedSession): Promise<void> {
  if (!isBrowser()) return;
  const db = await openDb();
  const dbSession = await sessionToDb(session);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    tx.objectStore(SESSIONS_STORE).put(dbSession);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function deleteSession(id: string): Promise<void> {
  if (!isBrowser()) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    tx.objectStore(SESSIONS_STORE).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function clearSessions(): Promise<void> {
  if (!isBrowser()) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    tx.objectStore(SESSIONS_STORE).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function bulkPut(sessions: SavedSession[]): Promise<void> {
  if (!isBrowser() || sessions.length === 0) return;
  const db = await openDb();
  const dbSessions = await Promise.all(sessions.map(sessionToDb));
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    const store = tx.objectStore(SESSIONS_STORE);
    for (const session of dbSessions) {
      store.put(session);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listTags(): Promise<JournalTag[]> {
  if (!isBrowser()) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TAGS_STORE, "readonly");
    const request = tx.objectStore(TAGS_STORE).getAll();
    request.onsuccess = () => {
      const items = (request.result as JournalTag[]).slice();
      items.sort((a, b) => a.createdAt - b.createdAt);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function putTag(tag: JournalTag): Promise<void> {
  if (!isBrowser()) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TAGS_STORE, "readwrite");
    tx.objectStore(TAGS_STORE).put(tag);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function bulkPutTags(tags: JournalTag[]): Promise<void> {
  if (!isBrowser() || tags.length === 0) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TAGS_STORE, "readwrite");
    const store = tx.objectStore(TAGS_STORE);
    for (const tag of tags) {
      store.put(tag);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function deleteTag(id: string): Promise<void> {
  if (!isBrowser()) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TAGS_STORE, SESSIONS_STORE], "readwrite");
    tx.objectStore(TAGS_STORE).delete(id);
    const sessionsStore = tx.objectStore(SESSIONS_STORE);
    const request = sessionsStore.getAll();
    request.onsuccess = () => {
      for (const session of request.result as SavedSession[]) {
        const normalized = normalizeSession(session);
        if (normalized.tagIds.includes(id)) {
          sessionsStore.put({
            ...normalized,
            tagIds: normalized.tagIds.filter((tagId) => tagId !== id),
          });
        }
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Safari cannot serialize Blob into IndexedDB — store as ArrayBuffer instead.
type DbSession = Omit<SavedSession, "audioBlob"> & { audioData: ArrayBuffer };

async function sessionToDb(session: SavedSession): Promise<DbSession> {
  const { audioBlob, ...rest } = session;
  const audioData = await audioBlob.arrayBuffer();
  return {
    ...rest,
    tagIds: Array.isArray(rest.tagIds) ? rest.tagIds : [],
    audioData,
  };
}

function dbToSession(raw: DbSession | SavedSession): SavedSession {
  // Handle both new ArrayBuffer format and legacy Blob format (Chrome/Firefox).
  if ("audioData" in raw && raw.audioData instanceof ArrayBuffer) {
    const { audioData, ...rest } = raw as DbSession;
    return {
      ...rest,
      tagIds: Array.isArray(rest.tagIds) ? rest.tagIds : [],
      audioBlob: new Blob([audioData], { type: rest.audioMimeType || "audio/webm" }),
    };
  }
  const s = raw as SavedSession;
  return { ...s, tagIds: Array.isArray(s.tagIds) ? s.tagIds : [] };
}

function normalizeSession(session: SavedSession): SavedSession {
  return {
    ...session,
    tagIds: Array.isArray(session.tagIds) ? session.tagIds : [],
  };
}
