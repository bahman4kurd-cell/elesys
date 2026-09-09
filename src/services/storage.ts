import { AppDatabase, AuthState, ElectionRound, SubTab, Party, PartyVote } from '../types';
import { INITIAL_DATABASE } from '../data/seedData';
import { DEFAULT_PARTIES } from '../data/defaultParties';

const DB_STORAGE_KEY = 'kurd_election_system_db_v1';
const AUTH_STORAGE_KEY = 'kurd_election_auth_v1';
const CREDENTIALS_KEY = 'kurd_election_credentials_v1';
const IDB_DATABASE_NAME = 'kurd_election_system_storage';
const IDB_STORE_NAME = 'snapshots';
const IDB_SNAPSHOT_KEY = 'current';

// Default credentials
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

  private static saveIndexedDb(db: AppDatabase): void {
    void this.openIndexedDb().then((database) => {
      if (!database) return;
      const transaction = database.transaction(IDB_STORE_NAME, 'readwrite');
      transaction.objectStore(IDB_STORE_NAME).put(db, IDB_SNAPSHOT_KEY);
      transaction.oncomplete = () => database.close();
    });
  }

  public static loadIndexedDb(): Promise<AppDatabase | null> {
    return this.openIndexedDb().then((database) => new Promise((resolve) => {
      if (!database) return resolve(null);
      const request = database.transaction(IDB_STORE_NAME, 'readonly')
        .objectStore(IDB_STORE_NAME)
        .get(IDB_SNAPSHOT_KEY);
      request.onsuccess = () => {
        database.close();
        const snapshot = request.result as AppDatabase | undefined;
        resolve(snapshot && Array.isArray(snapshot.rounds) ? snapshot : null);
      };
      request.onerror = () => {
        database.close();
        resolve(null);
      };
    }));
  }

  /**
   * Loads database from local storage or returns initial database
   */
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
          // Keep user rounds exactly as stored; do not auto-add synthetic rounds.
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

          // Do not auto-inject any synthetic rounds during load.
          this.cachedDb = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading database from localStorage:', e);
    }

    this.cachedDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    return this.cachedDb!;
  }

  /**
   * Saves database to local storage and notifies subscribers
   */
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
      console.error('Error saving database to localStorage:', e);
    }
    this.notifyListeners(db);
  }

  /**
   * Subscribe to database updates
   */
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
        console.error('Listener notification error:', err);
      }
    });
  }

  /**
   * Reset database to factory initial seed data
   */
  public static resetToDefault(): AppDatabase {
    const fresh = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.saveDatabase(fresh);
    return fresh;
  }

  public static deleteScope(scope: 'all' | 'round' | 'branch', roundId?: string, branchId?: string): AppDatabase {
    const database = this.loadDatabase();
    if (scope === 'all') return this.resetToDefault();
    const rounds = database.rounds.map((round) => {
      if (round.id !== roundId) return round;
      if (scope === 'round') return { ...round, subTabs: [], branches: [] };
      const remainingBranches = (round.branches || []).filter((branch) => branch.id !== branchId);
      return {
        ...round,
        branches: remainingBranches,
        subTabs: remainingBranches.flatMap((branch) => branch.subTabs),
        activeSubTabId: remainingBranches[0]?.activeSubTabId || '',
      };
    });
    const updated = { ...database, rounds };
    this.saveDatabase(updated);
    return updated;
  }

  /**
   * Export the current database (all rounds, sub-tabs, votes, custom parties, settings) as a downloadable JSON file
   * Allowing the user to backup their data easily to their computer or USB flash drive.
   *
   * @param dbOptional - Optional in-memory database to export, otherwise loads current saved database
   * @param customFilename - Optional custom filename for the exported JSON file
   */
  public static exportDatabaseToJson(dbOptional?: AppDatabase, customFilename?: string): boolean {
    try {
      const db = dbOptional || this.loadDatabase();
      
      // Ensure lastUpdated timestamp is set
      const exportPayload: AppDatabase = {
        ...db,
        lastUpdated: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Generate a descriptive, clean filename with date and time
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      
      link.href = url;
      link.download = customFilename || `kurdish_election_database_backup_${dateStr}_${timeStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      console.error('Failed to export database JSON:', err);
      return false;
    }
  }

  /**
   * Import database from a JSON file uploaded by the user
   */
  public static async importDatabaseFromJson(file: File): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content) as AppDatabase;

          if (!parsed || !Array.isArray(parsed.rounds)) {
            resolve({ success: false, message: 'فایلی دیاریکراو پێکهاتەی دروستی داتابەیسی هەڵبژاردنی تێدا نییە.' });
            return;
          }

          this.saveDatabase(parsed);
          resolve({ success: true, message: 'داتابەیس بە سەرکەوتوویی لە فایلەکەوە بارکرا!' });
        } catch (error) {
          console.error('Import error:', error);
          resolve({ success: false, message: 'هەڵە لە خوێندنەوەی فایل. دڵنیابەرەوە فایلەکە JSON دروستە.' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'نەتوانرا فایلەکە بخوێندرێتەوە.' });
      };
      reader.readAsText(file);
    });
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

  public static updateCredentials(username: string, password: string): void {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ username, password }));
  }

  public static resetCredentialsToDefault(): void {
    this.updateCredentials(DEFAULT_CREDENTIALS.username, DEFAULT_CREDENTIALS.password);
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

  public static setAuthState(auth: AuthState): void {
    if (auth.isAuthenticated) sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    else sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }

  public static login(username: string, password: string): { success: boolean; message?: string } {
    // Accept any non-empty username and password
    if (username.trim() && password.trim()) {
      const auth: AuthState = {
        isAuthenticated: true,
        username: username.trim(),
        lastLogin: new Date().toISOString(),
      };
      this.setAuthState(auth);
      return { success: true };
    }
    return { success: false, message: 'ناو و تێپەڕەوە پێویست دەکات' };
  }

  public static logout(): void {
    this.setAuthState({ isAuthenticated: false, username: '' });
  }
}

/**
 * Standalone function to export the current database (all rounds and sub-tabs data) as a JSON file,
 * allowing the user to backup their data easily to their computer or flash drive.
 */
export function exportCurrentDatabaseBackup(db?: AppDatabase, filename?: string): boolean {
  return StorageService.exportDatabaseToJson(db, filename);
}

