import React, { useRef } from 'react';
import { StorageService } from '../services/storage';
import { AppDatabase, UserAccount } from '../types';
import { formatNumber } from '../utils/numberFormat';
import { t } from '../i18n';
import {
  Download,
  Upload,
  Printer,
  Settings,
  LogOut,
  Moon,
  Sun,
  CircleDot,
  Landmark,
} from 'lucide-react';

interface NavbarProps {
  db: AppDatabase;
  onOpenSettings: () => void;
  onOpenPrint: () => void;
  onLogout: () => void;
  onDatabaseImported: () => void;
  onUpdateTheme: (theme: 'dark' | 'light' | 'gray' | 'government') => void;
  onUpdateDatabase: (updated: AppDatabase) => void;
  currentUser?: UserAccount;
}

export const Navbar: React.FC<NavbarProps> = ({
  db,
  onOpenSettings,
  onOpenPrint,
  onLogout,
  onDatabaseImported,
  onUpdateTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const useKurdish = db.settings?.useKurdishNumerals ?? false;
  const currentTheme = db.settings?.theme || 'government';
  const isGovernmentTheme = currentTheme === 'government';
  const isLightTheme = currentTheme === 'light' || isGovernmentTheme;

  const totalRounds = db.rounds.length;
  let totalSubTabs = 0;
  let totalVotesCounted = 0;

  db.rounds.forEach((round) => {
    const effectiveBranches = (round.branches || []).filter(
      (branch) => !['لقی سەرەکی', 'بنچینە'].includes((branch.name || '').trim())
    );

    effectiveBranches.forEach((branch) => {
      totalSubTabs += branch.subTabs.length;
      branch.subTabs.forEach((st) => {
        st.partyVotes.forEach((pv) => {
          totalVotesCounted += pv.votes || 0;
        });
      });
    });
  });

  const handleExport = () => {
    StorageService.exportToJson();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void StorageService.importFromJson(file)
      .then(() => onDatabaseImported())
      .catch((error) => console.error('Import failed:', error));
    event.target.value = '';
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b no-print ${
        isLightTheme
          ? 'government-header border-slate-200 bg-white text-slate-900 shadow-sm'
          : currentTheme === 'gray'
          ? 'border-slate-700 bg-slate-800 text-slate-100 shadow-xl'
          : 'border-slate-800 bg-[#0F172A] text-slate-100 shadow-xl'
      }`}
    >
      <div className="max-w-[1800px] mx-auto px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 shadow-md text-white">
            <Landmark className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <h1
              className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 ${
                isLightTheme ? 'text-slate-900' : 'text-white'
              }`}
            >
              {db.settings?.appName || t('app_name')}
            </h1>
            <p className={`text-[11px] hidden sm:block ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
              {t('election_results_system')}
            </p>
          </div>
        </div>

        <div
          className={`hidden md:flex items-center gap-4 px-4 py-2 rounded-xl border ${
            isLightTheme
              ? 'bg-slate-100 border-slate-200 text-slate-700'
              : currentTheme === 'gray'
              ? 'bg-slate-900/60 border-slate-700 text-slate-300'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <div className="text-xs">
            <span className="opacity-70">{t('total_rounds')}:</span>{' '}
            <span className={`font-bold font-mono ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
              {formatNumber(totalRounds, useKurdish)}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-600/30" />

          <div className="text-xs">
            <span className="opacity-70">{t('total_subtabs')}:</span>{' '}
            <span className={`font-bold font-mono ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
              {formatNumber(totalSubTabs, useKurdish)}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-600/30" />

          <div className="text-xs">
            <span className="opacity-70">{t('counted_votes')}:</span>{' '}
            <span className={`font-bold font-mono ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
              {formatNumber(totalVotesCounted, useKurdish)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isLightTheme
                ? 'bg-slate-100 border-slate-300'
                : currentTheme === 'gray'
                ? 'bg-slate-900 border-slate-700'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={() => onUpdateTheme('government')}
              title="تیمی حکومی"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isGovernmentTheme
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden md:inline">حکومی</span>
            </button>

            <button
              onClick={() => onUpdateTheme('light')}
              title="تیمی لایت"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currentTheme === 'light'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden md:inline">لایت</span>
            </button>

            <button
              onClick={() => onUpdateTheme('gray')}
              title="تیمی گرەی"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currentTheme === 'gray'
                  ? 'bg-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden md:inline">گرەی</span>
            </button>

            <button
              onClick={() => onUpdateTheme('dark')}
              title="تیمی دارک"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currentTheme === 'dark'
                  ? 'bg-slate-800 text-blue-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden md:inline">دارک</span>
            </button>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLightTheme
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40'
            }`}
            title={t('import_data')}
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLightTheme
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
            }`}
            title={t('export_data')}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenPrint}
            className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
              isLightTheme
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-sm'
                : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'
            }`}
            title={t('print_report')}
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">ڕاپۆرت و چاپکردن</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={t('settings')}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLightTheme
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40'
            }`}
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>
    </header>
  );
};