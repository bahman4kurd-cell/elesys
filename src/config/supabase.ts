// Public Supabase project settings (anon key is safe to ship; access is enforced by RLS).
// Values from the build environment win; these constants are the committed fallback.
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Shared row key: every authenticated staff account works on the same dataset.
export const SUPABASE_INSTANCE_SLUG = import.meta.env.VITE_INSTANCE_SLUG || 'main';

// Usernames without "@" are mapped to this domain to form the Supabase Auth email.
export const LOGIN_EMAIL_DOMAIN = 'elesys.local';
