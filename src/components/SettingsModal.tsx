import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { AppDatabase, AppLanguage } from '../types';
import { LANGUAGE_OPTIONS, t } from '../i18n';
import {
  Settings,
  X,
  KeyRound,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Check,
  Languages,
  ShieldCheck,
  Sun,
  Moon,
  CircleDot,
  Palette,
  Landmark,
} from 'lucide-react';

interface SettingsModalProps {
  db: AppDatabase;
  onClose: () => void;
  onUpdateDb: (updatedDb: AppDatabase) => void;
  onResetDb: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  db,
  onClose,
  onUpdateDb,
  onResetDb,
}) => {
  const currentCreds = StorageService.getCredentials();
  const [username, setUsername] = useState(currentCreds.username);
  const [password, setPassword] = useState(currentCreds.password);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deleteScope, setDeleteScope] = useState<'all' | 'round' | 'branch'>('all');
  const [deleteRoundId, setDeleteRoundId] = useState('');
  const [deleteBranchId, setDeleteBranchId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const useKurdish = db.settings?.useKurdishNumerals ?? false;
  const currentTheme = db.settings?.theme || 'government';
  const isGovernmentTheme = currentTheme === 'government';
  const isLightTheme = currentTheme === 'light' || isGovernmentTheme;
  const currentLanguage: AppLanguage = db.settings?.language || 'ckb';

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    StorageService.updateCredentials(username.trim(), password.trim());
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const handleToggleKurdishNumerals = (val: boolean) => {
    onUpdateDb({
      ...db,
      settings: {
        ...db.settings,
        useKurdishNumerals: val,
      },
    });
  };

  const handleSelectTheme = (theme: 'dark' | 'light' | 'gray' | 'government') => {
    onUpdateDb({
      ...db,
      settings: {
        ...db.settings,
        theme,
      },
    });
  };

  const handleSelectLanguage = (language: AppLanguage) => {
    onUpdateDb({
      ...db,
      settings: {
        ...db.settings,
        language,
      },
    });
  };

  const handleExportBackup = () => {
    StorageService.exportDatabaseToJson(db);
  };

  const handleResetConfirmation = () => {
    const verificationPassword = window.prompt('بۆ reset ـی factory پاسوۆردی ئەدمین بنووسە:');
    if (!verificationPassword || !StorageService.login(currentCreds.username, verificationPassword).success) {
      alert('پاسوۆردی ئەدمین هەڵەیە.');
      return;
    }
    if (window.confirm('ئاگاداری: هەموو دەستکارییەکان دەسڕدرێنەوە. دڵنیایت؟')) {
      onResetDb();
      onClose();
    }
  };

  const deleteRounds = db.rounds.filter((round) => round.id !== 'round-lqi4');
  const deleteRound = db.rounds.find((round) => round.id === deleteRoundId);

  const handleDeleteData = () => {
    setDeleteError('');
    if (!adminPassword || !StorageService.login(currentCreds.username, adminPassword).success) {
      setDeleteError('پاسوۆردی ئەدمین هەڵەیە.');
      return;
    }
    const selectedName = deleteScope === 'all'
      ? 'هەموو داتا'
      : deleteScope === 'round'
      ? deleteRound?.title || 'خولی هەڵبژێردراو'
      : deleteRound?.branches?.find((branch) => branch.id === deleteBranchId)?.name || 'لقی هەڵبژێردراو';
    if (!window.confirm(`ئاگاداری: ${selectedName} و هەموو داتاکانی دەسڕدرێنەوە. دڵنیایت؟`)) return;
    const updated = StorageService.deleteScope(deleteScope, deleteRoundId, deleteBranchId);
    onUpdateDb(updated);
    setAdminPassword('');
    alert('داتا بە سەرکەوتوویی سڕایەوە.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto transition-all ${
        isLightTheme
          ? 'bg-white border-slate-200 text-slate-900'
          : currentTheme === 'gray'
          ? 'bg-slate-800 border-slate-700 text-slate-100'
          : 'bg-[#1E293B] border-slate-700 text-white'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-3 ${
          isLightTheme ? 'border-slate-200' : 'border-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                ڕێکخستنەکانی سیستەم و ئاسایش
              </h3>
              <p className={`text-[11px] ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                تیم، پاراستنی نهێنی و شێوازی کارکردنی ئۆفلاین
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isLightTheme
                ? 'text-slate-500 hover:text-slate-900 bg-slate-100'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 🎨 Theme Selector Section */}
        <div className={`border rounded-xl p-3.5 space-y-2.5 ${
          isLightTheme
            ? 'bg-slate-50 border-slate-200'
            : currentTheme === 'gray'
            ? 'bg-slate-900/80 border-slate-700'
            : 'bg-slate-900 border-slate-700/80'
        }`}>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-500" />
            <div>
              <span className={`text-xs font-bold block ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                هەڵبژاردنی تیمی ڕووکار (Theme Mode)
              </span>
              <span className={`text-[11px] ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                دەتوانیت تیمی دڵخوازی خۆت بۆ سیستەمەکە هەڵبژێریت
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Government Theme Option */}
            <button
              onClick={() => handleSelectTheme('government')}
              className={`p-2.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                isGovernmentTheme
                  ? 'bg-amber-200 text-slate-900 border-amber-500 shadow-md ring-2 ring-amber-500/25 font-bold'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
              title="تیمی حکومی (Government Theme)"
            >
              <Landmark className="w-4 h-4" />
              <span className="text-xs">تیمی حکومی (Government)</span>
            </button>

            {/* Light Theme Option */}
            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                currentTheme === 'light'
                  ? 'bg-white text-slate-900 border-blue-500 shadow-md ring-2 ring-blue-500/20 font-bold'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-xs">تیمی لایت (Light)</span>
            </button>

            {/* Gray Theme Option */}
            <button
              type="button"
              onClick={() => handleSelectTheme('gray')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                currentTheme === 'gray'
                  ? 'bg-slate-700 text-white border-blue-500 shadow-md ring-2 ring-blue-500/20 font-bold'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-slate-600 text-slate-100 flex items-center justify-center">
                <CircleDot className="w-4 h-4" />
              </div>
              <span className="text-xs">تیمی گرەی (Gray)</span>
            </button>

            {/* Dark Theme Option */}
            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                currentTheme === 'dark'
                  ? 'bg-slate-950 text-blue-400 border-blue-500 shadow-md ring-2 ring-blue-500/20 font-bold'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-blue-950 text-blue-400 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-xs">تیمی دارک (Dark)</span>
            </button>
          </div>
        </div>

        <div className={`border rounded-xl p-3.5 space-y-2.5 ${
          isLightTheme
            ? 'bg-slate-50 border-slate-200'
            : currentTheme === 'gray'
            ? 'bg-slate-900/80 border-slate-700'
            : 'bg-slate-900 border-slate-700/80'
        }`}>
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-500" />
            <div>
              <span className={`text-xs font-bold block ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                {t('languageTitle')}
              </span>
              <span className={`text-[11px] ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('languageHelp')}
              </span>
            </div>
          </div>
          <select
            value={currentLanguage}
            onChange={(event) => handleSelectLanguage(event.target.value as AppLanguage)}
            className={`w-full rounded-lg px-2.5 py-2 text-xs border focus:outline-none focus:border-blue-500 ${
              isLightTheme
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-950 border-slate-700 text-white'
            }`}
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language.value} value={language.value}>{language.label}</option>
            ))}
          </select>
        </div>

        {/* Change Username & Password Section */}
        <div className={`border rounded-xl p-3.5 space-y-2.5 ${
          isLightTheme
            ? 'bg-slate-50 border-slate-200'
            : currentTheme === 'gray'
            ? 'bg-slate-900/80 border-slate-700'
            : 'bg-slate-900 border-slate-700/80'
        }`}>
          <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLightTheme ? 'text-slate-900' : 'text-slate-200'}`}>
            <KeyRound className="w-3.5 h-3.5 text-blue-500" />
            <span>گۆڕینی ناوی بەکارهێنەر و وشەی نهێنی (Login Security)</span>
          </h4>
          <p className={`text-[11px] ${isLightTheme ? 'text-amber-700' : 'text-amber-300'}`}>
            دروستکردنی: بەهمەن دەروێش علی/یەکەی ئایتی-لقی چوار
          </p>

          <form onSubmit={handleSaveCredentials} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className={`text-[11px] ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>ناوی بەکارهێنەر</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono border ${
                    isLightTheme
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>وشەی نهێنی</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono border ${
                    isLightTheme
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {passwordSaved ? (
                <span className="text-xs text-emerald-500 flex items-center gap-1 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  زانیارییەکان بەسەرکەوتوویی پاشەکەوت کران!
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">زانیاری چوونەژوورەوەی ئۆفلاین نوێ دەکرێتەوە</span>
              )}

              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer shadow-sm"
              >
                پاشەکەوتکردن
              </button>
            </div>
          </form>
        </div>

        {/* Kurdish Numerals Format Toggle */}
        <div className={`border rounded-xl p-3 flex items-center justify-between ${
          isLightTheme
            ? 'bg-slate-50 border-slate-200'
            : currentTheme === 'gray'
            ? 'bg-slate-900/80 border-slate-700'
            : 'bg-slate-900 border-slate-700/80'
        }`}>
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-500" />
            <div>
              <span className={`text-xs font-bold block ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                شێوازی پیشاندانی ژمارەکان
              </span>
              <span className={`text-[11px] ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                {useKurdish ? 'ژمارەی کوردی/ڕۆژهەڵاتی (٠١٢٣٤٥٦٧٨٩)' : 'ژمارەی ستاندارد (0123456789)'}
              </span>
            </div>
          </div>

          <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${
            isLightTheme ? 'bg-slate-200 border-slate-300' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => handleToggleKurdishNumerals(false)}
              className={`px-2.5 py-1 text-xs rounded-md font-mono font-bold transition-all cursor-pointer ${
                !useKurdish ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              123
            </button>
            <button
              onClick={() => handleToggleKurdishNumerals(true)}
              className={`px-2.5 py-1 text-xs rounded-md font-mono font-bold transition-all cursor-pointer ${
                useKurdish ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              ١٢٣
            </button>
          </div>
        </div>

        {/* Flash Drive & Offline Transfer Guide */}
        <div className={`border rounded-xl p-3.5 space-y-2.5 ${
          isLightTheme
            ? 'bg-slate-50 border-slate-200'
            : currentTheme === 'gray'
            ? 'bg-slate-900/80 border-slate-700'
            : 'bg-slate-900 border-slate-700/80'
        }`}>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
            <HardDrive className="w-3.5 h-3.5" />
            <span>ڕێنمایی گواستنەوە بۆ کۆمپیوتەری تر لەسەر فلاش میمۆری (USB)</span>
          </div>

          <p className={`text-xs leading-relaxed ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
            سیستەمەکە هەموو داتاکان بە خێرایی لەناو براوسەر و داتابەیسی ناوخۆیدا هەڵدەگرێت. بۆ ئەوەی بە تەواوی بیبەیتە سەر کۆمپیوتەرێکی تر:
          </p>

          <div className="pt-1.5">
            <button
              onClick={handleExportBackup}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>داگرتنی کۆپی پاشەکەوت بۆ فلاش میمۆری (JSON Backup)</span>
            </button>
          </div>
        </div>

        <div className={`border rounded-xl p-3.5 space-y-3 ${
          isLightTheme ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold">سڕینەوەی داتا بە هەڵبژاردن</span>
          </div>
          <select value={deleteScope} onChange={(event) => {
            setDeleteScope(event.target.value as 'all' | 'round' | 'branch');
            setDeleteRoundId('');
            setDeleteBranchId('');
          }} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white">
            <option value="all">هەموو داتا</option>
            <option value="round">خولێکی هەڵبژێردراو</option>
            <option value="branch">لقێکی هەڵبژێردراو</option>
          </select>
          {deleteScope !== 'all' && <select value={deleteRoundId} onChange={(event) => {
            setDeleteRoundId(event.target.value);
            setDeleteBranchId('');
          }} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white">
            <option value="">خول هەڵبژێرە</option>
            {deleteRounds.map((round) => <option key={round.id} value={round.id}>{round.title}</option>)}
          </select>}
          {deleteScope === 'branch' && deleteRound && <select value={deleteBranchId} onChange={(event) => setDeleteBranchId(event.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white">
            <option value="">لق هەڵبژێرە</option>
            {(deleteRound.branches || []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>}
          <input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="پاسوۆردی ئەدمین بۆ پشتڕاستکردنەوە" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white" dir="ltr" />
          {deleteError && <p className="text-xs text-rose-300">{deleteError}</p>}
          <button type="button" onClick={handleDeleteData} disabled={(deleteScope !== 'all' && !deleteRoundId) || (deleteScope === 'branch' && !deleteBranchId)} className="w-full px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg">سڕینەوەی داتا</button>
        </div>

        {/* Factory Reset */}
        <div className={`pt-2 border-t flex items-center justify-between ${
          isLightTheme ? 'border-slate-200' : 'border-slate-700'
        }`}>
          <div>
            <span className="text-xs font-bold text-rose-500 block">گەڕاندنەوە بۆ باری سەرەتایی</span>
            <span className="text-[10px] text-slate-500">سڕینەوەی دەستکارییەکان و نوێکردنەوەی داتای بنەڕەتی</span>
          </div>

          <button
            onClick={handleResetConfirmation}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>ڕێکخستنەوە</span>
          </button>
        </div>

      </div>
    </div>
  );
};
