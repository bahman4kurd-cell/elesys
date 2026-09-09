import React from 'react';
import { Map, MapPin } from 'lucide-react';
import { SubTab } from '../types';

interface BranchMapProps {
  branchName: string;
  subTabs: SubTab[];
  theme?: 'dark' | 'light' | 'gray' | 'government';
  onSelectSubTab: (subTabId: string) => void;
  activeSubTabId: string;
}

export const BranchMap: React.FC<BranchMapProps> = ({
  branchName,
  subTabs,
  theme = 'dark',
  onSelectSubTab,
  activeSubTabId,
}) => (
  <section className={`border rounded-2xl p-5 shadow-lg ${
    theme === 'light' ? 'bg-white border-slate-200' : theme === 'gray' ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800'
  }`}>
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 text-blue-400">
        <Map className="w-5 h-5" />
        <h2 className="text-sm font-bold">نەخشەی خۆکار بۆ {branchName}</h2>
      </div>
      <span className="text-xs text-slate-400">{subTabs.length} لیژنە ناوچە</span>
    </div>

    {subTabs.length === 0 ? (
      <div className="min-h-40 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-center text-xs text-slate-400">
        <span>دوای زیادکردنی لیژنە ناوچەکان، نەخشەکە خۆکارانە پڕ دەبێت.</span>
      </div>
    ) : (
      <div className="relative rounded-xl border border-slate-700/80 bg-slate-950/60 p-5 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(59,130,246,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.25)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {subTabs.map((subTab, index) => (
            <button
              key={subTab.id}
              type="button"
              onClick={() => onSelectSubTab(subTab.id)}
              className={`min-h-24 rounded-xl border p-3 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                activeSubTabId === subTab.id
                  ? 'bg-blue-600/25 border-blue-400 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-blue-950/50 hover:border-blue-500/60'
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-400/40 flex items-center justify-center text-blue-300">
                <MapPin className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold leading-5">{subTab.name}</span>
              <span className="text-[10px] text-slate-500">ناوچەی {index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    )}
  </section>
);
