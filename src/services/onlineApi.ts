import { AppDatabase } from '../types';
import {
  LOGIN_EMAIL_DOMAIN,
  SUPABASE_ANON_KEY,
  SUPABASE_INSTANCE_SLUG,
  SUPABASE_URL,
} from '../config/supabase';

const SESSION_STORAGE_KEY = 'kurd_election_online_session';
const REQUEST_TIMEOUT_MS = 20000;

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  username: string;
}

interface AuthTokenPayload {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string };
}

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function toEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : `${trimmed}@${LOGIN_EMAIL_DOMAIN}`;
}

function toUsername(email: string | undefined, fallback: string): string {
  if (!email) return fallback;
  return email.endsWith(`@${LOGIN_EMAIL_DOMAIN}`) ? email.split('@')[0] : email;
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function sessionFromPayload(payload: AuthTokenPayload, fallbackUsername: string): StoredSession {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    // Refresh a minute early to avoid racing the expiry.
    expiresAt: Date.now() + Math.max(payload.expires_in - 60, 30) * 1000,
    username: toUsername(payload.user?.email, fallbackUsername),
  };
}

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
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  public static wakeUp(): void {
    // Supabase does not cold-start; kept for call-site compatibility.
  }

  public static getToken(): string {
    return readSession()?.accessToken || '';
  }

  public static clearToken(): void {
    writeSession(null);
  }

  public static async login(username: string, password: string, _slug = SUPABASE_INSTANCE_SLUG): Promise<LoginResponse> {
    if (!this.isEnabled()) {
      throw new Error('Online API is not configured');
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: toEmail(username), password }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch';
      throw new Error(`Failed to fetch (${SUPABASE_URL}/auth/v1/token): ${message}`);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const reason = body.error_description || body.msg || body.error || 'Login failed';
      throw new Error(reason === 'Invalid login credentials' ? 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە.' : reason);
    }

    const payload = (await response.json()) as AuthTokenPayload;
    const session = sessionFromPayload(payload, username.trim());
    writeSession(session);

    return {
      token: session.accessToken,
      user: {
        id: payload.user.id,
        username: session.username,
        role: 'admin',
        instanceId: SUPABASE_INSTANCE_SLUG,
      },
    };
  }

  private static async getValidAccessToken(): Promise<string | null> {
    const session = readSession();
    if (!session) return null;
    if (Date.now() < session.expiresAt) return session.accessToken;

    try {
      const response = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });

      if (!response.ok) {
        writeSession(null);
        return null;
      }

      const payload = (await response.json()) as AuthTokenPayload;
      const refreshed = sessionFromPayload(payload, session.username);
      writeSession(refreshed);
      return refreshed.accessToken;
    } catch {
      // Network hiccup: keep the session and let the caller fall back to local data.
      return null;
    }
  }

  private static restHeaders(accessToken: string): Record<string, string> {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  public static async loadState(): Promise<AppDatabase | null> {
    if (!this.isEnabled()) return null;

    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return null;

    const url =
      `${SUPABASE_URL}/rest/v1/app_state` +
      `?instance_slug=eq.${encodeURIComponent(SUPABASE_INSTANCE_SLUG)}&select=db_data&limit=1`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: this.restHeaders(accessToken),
    });

    if (!response.ok) {
      if (response.status === 401) this.clearToken();
      return null;
    }

    const rows = (await response.json()) as Array<{ db_data: AppDatabase }>;
    return rows[0]?.db_data || null;
  }

  public static async saveState(db: AppDatabase): Promise<void> {
    if (!this.isEnabled()) return;

    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return;

    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_state`, {
      method: 'POST',
      headers: {
        ...this.restHeaders(accessToken),
        // Upsert on the primary key (instance_slug).
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([
        {
          instance_slug: SUPABASE_INSTANCE_SLUG,
          db_data: db,
          updated_at: new Date().toISOString(),
        },
      ]),
    });

    if (!response.ok && response.status === 401) {
      this.clearToken();
    }
  }
}

