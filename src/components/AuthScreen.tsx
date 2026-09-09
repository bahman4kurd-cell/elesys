import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { OnlineApiService } from '../services/onlineApi';
import { Lock, User, CheckCircle2, HardDrive, KeyRound } from 'lucide-react';
import { t } from '../i18n';
import logoUrl from '../logo.ico.ico';

interface AuthScreenProps {
  onLoginSuccess: (username: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('kurd_election_remembered_username') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    OnlineApiService.wakeUp();
  }, []);
  const rememberUsernameIfNeeded = (value: string) => {
    if (rememberMe) localStorage.setItem('kurd_election_remembered_username', value.trim());
    else localStorage.removeItem('kurd_election_remembered_username');
  };

  const tryLocalLogin = (fallbackMessage?: string) => {
    const result = StorageService.login(username, password);
    if (result.success) {
      rememberUsernameIfNeeded(username);
      onLoginSuccess(username);
      return true;
    }

    setError(fallbackMessage || result.message || 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە.');
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(async () => {
      try {
        if (OnlineApiService.isEnabled()) {
          try {
            const response = await OnlineApiService.login(username.trim(), password);
            rememberUsernameIfNeeded(response.user.username);
            onLoginSuccess(response.user.username);
            setIsLoading(false);
            return;
          } catch (onlineError) {
            // Keep the app usable: whenever online auth fails, attempt local fallback.
            const onlineMessage = onlineError instanceof Error ? onlineError.message : 'Online login failed';
            const loggedIn = tryLocalLogin(`Online login هەڵەی هەبوو (${onlineMessage})؛ local login ـیش سەرکەوتوو نەبوو.`);
            if (loggedIn) {
              setIsLoading(false);
              return;
            }
            setIsLoading(false);
            return;
          }
        }

        tryLocalLogin();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'چوونەژوورەوە سەرکەوتوو نەبوو.');
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5">
        
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-inner">
            <img src={logoUrl} alt="System Logo" className="w-9 h-9 object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {t('loginTitle')}
          </h1>
          <p className="text-xs text-slate-400">
            پەرلەمانی کوردستان و ئەنجومەنی نوێنەرانی عێراق (کارکردنی ١٠٠٪ ئۆفلاین)
          </p>
          <p className="text-[11px] text-amber-300">
            دروستکردنی: بەهمەن دەروێش علی/یەکەی ئایتی-لقی چوار
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              {t('username')} (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              {t('password')} (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] text-xs sm:text-sm"
          >
            {isLoading ? (
              <span className="text-xs">چاوەڕوانبە...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>چوونەژوورەوە بۆ سیستەم</span>
              </>
            )}
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="accent-blue-600" />
            <span>بیرت بهێنەوەی ناوی بەکارهێنەر</span>
          </label>
          <button type="button" onClick={() => setShowRecovery((value) => !value)} className="w-full text-xs text-blue-400 hover:text-blue-300">
            وشەی نهێنی لەبیرچووە؟
          </button>
          {showRecovery && (
            <div className="text-xs text-amber-300 text-center border border-amber-500/20 rounded-lg p-2 space-y-2">
              <p>لە کاری ئۆفلاین، ئەگەر credentials ـەکانت لەبیرچوون، دەتوانیت بە reset ـی بنەڕەتی بگەڕێیتەوە.</p>
              <button type="button" onClick={() => {
                if (window.confirm('ئایا دڵنیایت؟ ناوی بەکارهێنەر و وشەی نهێنی دەگەڕێنرێنەوە بۆ باری بنەڕەتی.')) {
                  StorageService.resetCredentialsToDefault();
                  setUsername('');
                  setPassword('');
                  setShowRecovery(false);
                  alert('credentials گەڕێنرانەوە. دەتوانیت بە زانیارییە نوێیەکانەوە داخڵ بیت.');
                }
              }} className="text-amber-200 underline">گەڕاندنەوەی credentials ـی بنەڕەتی</button>
            </div>
          )}
        </form>

        {/* Portable Flash Memory Notice */}
        <div className="pt-3 border-t border-slate-700 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
            <HardDrive className="w-3.5 h-3.5 shrink-0" />
            <span>سیستەمەکە بەتەواوی ئۆفلاین کاردەکات و دەتوانرێت بخرێتە سەر فلاش میمۆری.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
