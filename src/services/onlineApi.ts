import { AppDatabase } from '../types';

const TOKEN_STORAGE_KEY = 'kurd_election_online_token';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    instanceId: string;
  };
}

export class OnlineApiService {
  public static isEnabled(): boolean {
    return Boolean(API_BASE);
  }

  public static getToken(): string {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  }

  public static setToken(token: string): void {
    if (!token) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  public static clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  public static async login(username: string, password: string, slug = 'main'): Promise<LoginResponse> {
    if (!this.isEnabled()) {
      throw new Error('Online API is not configured');
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, slug }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch';
      throw new Error(`Failed to fetch (${API_BASE}/api/auth/login): ${message}`);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(body.error || 'Login failed');
    }

    const data = (await response.json()) as LoginResponse;
    this.setToken(data.token);
    return data;
  }

  public static async loadState(): Promise<AppDatabase | null> {
    if (!this.isEnabled()) return null;

    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE}/api/state`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
      }
      return null;
    }

    const payload = (await response.json()) as { db: AppDatabase | null };
    return payload.db || null;
  }

  public static async saveState(db: AppDatabase): Promise<void> {
    if (!this.isEnabled()) return;

    const token = this.getToken();
    if (!token) return;

    const response = await fetch(`${API_BASE}/api/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ db }),
    });

    if (!response.ok && response.status === 401) {
      this.clearToken();
    }
  }
}
