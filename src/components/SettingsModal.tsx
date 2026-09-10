import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { AppDatabase, UserRole } from '../types';
import {
  Settings,
  X,
  HardDrive,
  Download,
  Moon,
  Palette,
  Landmark,
} from 'lucide-react';

interface SettingsModalProps {
  db: AppDatabase;
  onClose: () => void;
  onUpdateDb: (updatedDb: AppDatabase) => void;
  onResetDb: () => void;
  currentUserRole?: UserRole | 'super_admin';
  currentUsername?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  db,
  onClose,
  onUpdateDb,
}) => {
  const currentTheme = db.settings?.theme || 'government';
  const isGovernmentTheme = currentTheme === 'government';
  const isLightTheme = currentTheme === 'light' || isGovernmentTheme;

  const handleSelectTheme = (theme: 'dark' | 'light' | 'gray' | 'government') => {
    onUpdateDb({
      ...db,
      settings: {
        ...db.settings,
        theme,
      },
    });
  };

  const handleExportBackup = () => {
    StorageService.exportDatabaseToJson(db);
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
                ڕێکخستنەکانی سیستەم
              </h3>
              <p className={`text-[11px] ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                دروستکردنی: بەهمەن دەروێش علی / لقی چوار
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

        {/* System Settings & Theme */}
        <div className={`border rounded-xl p-3.5 space-y-2.5 ${
          isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-500" />
            <span className={`text-xs font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>ڕووکار و زمانی سیستەم</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSelectTheme('government')}
              className={`p-2 rounded-lg border text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 ${
                isGovernmentTheme ? 'bg-amber-200 text-slate-900 border-amber-500 font-bold' : 'bg-slate-800/40 text-slate-400 border-slate-700'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>تیمی حکومی</span>
            </button>
            <button
              onClick={() => handleSelectTheme('dark')}
              className={`p-2 rounded-lg border text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 ${
                currentTheme === 'dark' ? 'bg-slate-950 text-blue-400 border-blue-500 font-bold' : 'bg-slate-800/40 text-slate-400 border-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>تیمی تاریک</span>
            </button>
          </div>
        </div>

        {/* Database Backup Option */}
        <div className={`border rounded-xl p-3 flex items-center justify-between ${
          isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'
        }`}>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
            <HardDrive className="w-4 h-4" />
            <span>پاشەکەوتکردنی داتاکان بۆ فلاش میمۆری</span>
          </div>
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>داگرتن</span>
          </button>
        </div>

      </div>
    </div>
  );
};