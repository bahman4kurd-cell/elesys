import React from 'react';
import { Building2, GitBranch, Plus, Pencil, Trash2 } from 'lucide-react';
import { ElectionBranch, ElectionRound } from '../types';

interface BranchTabsProps {
  round: ElectionRound | undefined;
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onAddBranch: (name: string) => void;
  onEditBranch: (branchId: string, name: string) => void;
  onDeleteBranch: (branchId: string) => void;
}

export const BranchTabs: React.FC<BranchTabsProps> = ({ round, activeBranchId, onSelectBranch, onAddBranch, onEditBranch, onDeleteBranch }) => {
  if (!round) return null;

  const branches: ElectionBranch[] = (round.branches ?? []).filter(
    (branch) => !['لقی سەرەکی', 'بنچینە'].includes((branch.name || '').trim())
  );

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm no-print">
      <div className="flex w-full items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
        <span className="flex shrink-0 items-center gap-1.5 border-l border-slate-200 pl-3 text-xs font-bold text-[#0a376f]">
          <GitBranch className="h-4 w-4" />
          <span>لقەکان:</span>
        </span>
        {branches.map((branch) => (
          <div
            key={branch.id}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              activeBranchId === branch.id
                ? 'bg-[#0a376f] text-white border-[#0a376f] shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <button type="button" onClick={() => onSelectBranch(branch.id)} className="flex items-center gap-1.5">
              {branch.id === 'branch-lqi4' ? <Building2 className="w-3.5 h-3.5" /> : <GitBranch className="w-3.5 h-3.5" />}
              <span>{branch.name}</span>
            </button>
            <button type="button" title="دەستکاری ناوی لق" onClick={() => {
              const name = window.prompt('ناوی نوێی لق:', branch.name)?.trim();
              if (name) onEditBranch(branch.id, name);
            }} className="text-slate-400 hover:text-[#0a376f]"><Pencil className="w-3 h-3" /></button>
            {branches.length > 0 && <button type="button" title="سڕینەوەی لق" onClick={() => {
              if (window.confirm(`ئایا دڵنیایت لە سڕینەوەی لقەی "${branch.name}"؟`)) onDeleteBranch(branch.id);
            }} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>}
          </div>
        ))}
        <button type="button" onClick={() => {
          const name = window.prompt('ناوی لق:', 'لقی نوێ')?.trim();
          if (name) onAddBranch(name);
        }} title="زیادکردنی لق" aria-label="زیادکردنی لق" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#0a376f] text-white transition-colors hover:bg-[#124a8d] focus:outline-none focus:ring-2 focus:ring-[#d5a438]">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};