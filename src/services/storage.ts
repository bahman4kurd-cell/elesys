import { AppDatabase, AuthState, ElectionRound } from '../types';
import { INITIAL_DATABASE } from '../data/seedData';

const DB_STORAGE_KEY = 'kurd_election_system_db_v1';
const AUTH_STORAGE_KEY = 'kurd_election_auth_v1';
const CREDENTIALS_KEY = 'kurd_election_credentials_v1';
const IDB_DATABASE_NAME = 'kurd_election_system_storage';
const IDB_STORE_NAME = 'snapshots';
const IDB_SNAPSHOT_KEY = 'current';

const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: '123',
};

const LEGACY_TERM = String.fromCharCode(1576, 1575, 1586, 1606, 1749);
const NEW_TERM = 'ناوچە';

function normalizeLegacyWording(text: string): string {
  return text.includes(LEGACY_TERM) ? text.split(LEGACY_TERM).join(NEW_TERM) : text;
}

function sanitizeRoundText(round: ElectionRound): ElectionRound {
  return {
    ...round,
    title: normalizeLegacyWording(round.title || ''),
    notes: normalizeLegacyWording(round.notes || ''),
    subTabs: (round.subTabs || []).map((st) => ({
      ...st,
      name: normalizeLegacyWording(st.name || ''),
      notes: normalizeLegacyWording(st.notes || ''),
    })),
    branches: (round.branches || []).map((branch) => ({
      ...branch,
      name: normalizeLegacyWording(branch.name || ''),
      subTabs: (branch.subTabs || []).map((st) => ({
        ...st,
        name: normalizeLegacyWording(st.name || ''),
        notes: normalizeLegacyWording(st.notes || ''),
      })),
    })),
  };
}

export class StorageService {
  private static cachedDb: AppDatabase | null = null;
  private static listeners: Array<(db: AppDatabase) => void> = [];

  private static openIndexedDb(): Promise<IDBDatabase | null> {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    return new Promise((resolve) => {
      const request = indexedDB.open(IDB_DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(IDB_STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  public static loadIndexedDb(): Promise<AppDatabase | null> {
    return new Promise((resolve) => {
      this.openIndexedDb().then((database) => {
        if (!database) {
          resolve(null);
          return;
        }
        try {
          const transaction = database.transaction(IDB_STORE_NAME, 'readonly');
          const store = transaction.objectStore(IDB_STORE_NAME);
          const request = store.get(IDB_SNAPSHOT_KEY);
          request.onsuccess = () => {
            database.close();
            resolve(request.result || null);
          };
          request.onerror = () => {
            database.close();
            resolve(null);
          };
        } catch (e) {
          database.close();
          resolve(null);
        }
      });
    });
  }

  private static saveIndexedDb(db: AppDatabase): void {
    void this.openIndexedDb().then((database) => {
      if (!database) return;
      const transaction = database.transaction(IDB_STORE_NAME, 'readwrite');
      transaction.objectStore(IDB_STORE_NAME).put(db, IDB_SNAPSHOT_KEY);
      transaction.oncomplete = () => database.close();
    });
  }

  public static loadDatabase(): AppDatabase {
    if (this.cachedDb) {
      return this.cachedDb;
    }

    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppDatabase;
        if (
          parsed &&
          Array.isArray(parsed.rounds) &&
          parsed.rounds.length > 0 &&
          parsed.rounds.every((round) => round && Array.isArray(round.subTabs))
        ) {
          const beforeCount = parsed.rounds.length;
          parsed.rounds = parsed.rounds.filter(
            (round) =>
              round.id !== 'round-lqi4' &&
              (round.title || '').trim() !== 'سنووری لقی چوار'
          );
          if (parsed.rounds.length === 0) {
            parsed.rounds = JSON.parse(JSON.stringify(INITIAL_DATABASE.rounds));
          }
          parsed.rounds = parsed.rounds.map(sanitizeRoundText);

          if (parsed.activeRoundId !== 'dashboard' && !parsed.rounds.some((round) => round.id === parsed.activeRoundId)) {
            parsed.activeRoundId = parsed.rounds[0]?.id || 'dashboard';
          }
          if (parsed.rounds.length !== beforeCount) {
            this.saveDatabase(parsed);
          }

          this.cachedDb = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading database from localStorage: - storage.ts:135', e);
    }

    const initial = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.cachedDb = initial;
    return this.cachedDb!;
  }

  public static saveDatabase(db: AppDatabase): void {
    db.rounds = (db.rounds || []).filter(
      (round) =>
        round.id !== 'round-lqi4' &&
        (round.title || '').trim() !== 'سنووری لقی چوار'
    );
    if (db.rounds.length === 0) {
      db.rounds = JSON.parse(JSON.stringify(INITIAL_DATABASE.rounds));
    }
    if (db.activeRoundId !== 'dashboard' && !db.rounds.some((round) => round.id === db.activeRoundId)) {
      db.activeRoundId = db.rounds[0]?.id || 'dashboard';
    }
    db.rounds = db.rounds.map(sanitizeRoundText);

    db.lastUpdated = new Date().toISOString();
    this.cachedDb = db;
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
      this.saveIndexedDb(db);
    } catch (e) {
      console.error('Error saving database to localStorage: - storage.ts:163', e);
    }
    this.notifyListeners(db);
  }

  public static subscribe(listener: (db: AppDatabase) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(db: AppDatabase): void {
    this.listeners.forEach((listener) => {
      try {
        listener(db);
      } catch (err) {
        console.error('Listener notification error: - storage.ts:180', err);
      }
    });
  }

  public static resetToDefault(): AppDatabase {
    const fresh = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.saveDatabase(fresh);
    return fresh;
  }

  // --- Authentication Helpers ---

  public static getCredentials(): { username: string; password: string } {
    try {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return DEFAULT_CREDENTIALS;
  }

  public static updateCredentials(u: string, p: string): void {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ username: u, password: p }));
  }

  public static login(username: string, password: string): { success: boolean; message?: string; role?: string; allowedBranchId?: string } {
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, message: 'ناو و تێپەڕەوە پێویست دەکات' };
    }

    const currentCreds = this.getCredentials();
    if (trimmedUser === currentCreds.username && trimmedPass === currentCreds.password) {
      const auth: AuthState = {
        isAuthenticated: true,
        username: trimmedUser,
        role: 'super_admin',
        lastLogin: new Date().toISOString(),
      };
      this.setAuthState(auth);
      return { success: true, role: 'super_admin' };
    }

    return { success: false, message: 'ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە.' };
  }

  public static setAuthState(auth: AuthState): void {
    if (auth.isAuthenticated) sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    else sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }

  public static getAuthState(): AuthState {
    const auth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (auth) {
      try {
        return JSON.parse(auth);
      } catch {
        return { isAuthenticated: false, username: '' };
      }
    }
    return { isAuthenticated: false, username: '' };
  }

  public static logout(): void {
    this.setAuthState({ isAuthenticated: false, username: '' });
  }

  public static exportDatabaseToJson(db: AppDatabase): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `election_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public static deleteScope(scope: 'all' | 'round' | 'branch', roundId?: string, branchId?: string): AppDatabase {
    const db = this.loadDatabase();
    if (scope === 'all') {
      return this.resetToDefault();
    }
    if (scope === 'round' && roundId) {
      db.rounds = db.rounds.filter(r => r.id !== roundId);
    }
    if (scope === 'branch' && roundId && branchId) {
      db.rows = db.rounds.map(r => {
        if (r.id === roundId) {
          return {
            ...r,
            branches: (r.branches || []).filter(b => b.id !== branchId)
          };
        }
        return r;
      });
    }
    this.saveDatabase(db);
    return db;
  }
}