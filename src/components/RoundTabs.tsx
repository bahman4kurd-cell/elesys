import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutDashboard, Plus, Trash2, Edit3, X, Check, Layers, Calendar } from 'lucide-react';
import { ElectionRound } from '../types';
import { t } from '../i18n';

interface RoundTabsProps {
  rounds: ElectionRound[];
  activeRoundId: string;
  onSelectRound: (roundId: string) => void;
  onAddRound: (title: string, category: 'kurdistan' | 'iraq' | 'provincial' | 'custom', year: number) => void;
  onEditRound: (roundId: string, newTitle: string) => void;
  onDeleteRound: (roundId: string) => void;
  onReorderRounds: (fromRoundId: string, toRoundId: string) => void;
}

export const RoundTabs: React.FC<RoundTabsProps> = ({
  rounds,
  activeRoundId,
  onSelectRound,
  onAddRound,
  onEditRound,
  onDeleteRound,
  onReorderRounds,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'kurdistan' | 'iraq' | 'provincial' | 'custom'>('kurdistan');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());

  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [draggingRoundId, setDraggingRoundId] = useState<string | null>(null);
  const [dragOverRoundId, setDragOverRoundId] = useState<string | null>(null);

  const sortedRounds = useMemo(() => [...rounds], [rounds]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    onAddRound(title, newCategory, Number(newYear) || new Date().getFullYear());

    setNewTitle('');
    setNewCategory('kurdistan');
    setNewYear(new Date().getFullYear());
    setShowAddModal(false);
  };

  const startEdit = (round: ElectionRound, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoundId(round.id);
    setEditTitleText(round.title);
  };

  const saveEdit = (roundId: string) => {
    const title = editTitleText.trim();
    if (!title) return;
    onEditRound(roundId, title);
    setEditingRoundId(null);
  };

  const handleDelete = (roundId: string, roundTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`دڵنیایت لە سڕینەوەی "${roundTitle}"؟`)) {
      onDeleteRound(roundId);
    }
  };

  const handleDragStart = (roundId: string) => {
    setDraggingRoundId(roundId);
  };

  const handleDragOver = (e: React.DragEvent, roundId: string) => {
    e.preventDefault();
    if (!draggingRoundId || draggingRoundId === roundId) return;
    setDragOverRoundId(roundId);
  };

  const handleDrop = (e: React.DragEvent, roundId: string) => {
    e.preventDefault();
    if (draggingRoundId && draggingRoundId !== roundId) {
      onReorderRounds(draggingRoundId, roundId);
    }
    setDraggingRoundId(null);
    setDragOverRoundId(null);
  };

  const clearDragState = () => {
    setDraggingRoundId(null);
    setDragOverRoundId(null);
  };

  const addRoundModal = showAddModal && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>زیادکردنی خولی نوێی هەڵبژاردن</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">ناوی خولی هەڵبژاردن</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="وەک: پەرلەمانی کوردستان ٢٠٢٤"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">جۆری هەڵبژاردن</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'kurdistan' | 'iraq' | 'provincial' | 'custom')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="kurdistan">پەرلەمانی کوردستان</option>
                    <option value="iraq">پەرلەمانی عێراق</option>
                    <option value="provincial">ئەنجومەنی پارێزگا</option>
                    <option value="custom">هەڵبژاردنی تایبەت</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">ساڵی هەڵبژاردن</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    min="2000"
                    max="2050"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md cursor-pointer"
                >
                  زیادکردنی خول
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="w-full rounded-2xl border border-[#31557d] bg-[#0f2745]/95 shadow-xl">
      <header className="flex items-center justify-between gap-3 border-b border-[#31557d] bg-[#0a376f] px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#e5c26b]/40 bg-[#d5a438] text-[#082b5a]">
            <Layers className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xs font-bold text-white">بەڕێوەبردنی خولەکان</h2>
            <p className="mt-0.5 text-[10px] font-medium text-blue-200">{t('roundLabel')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          title="زیادکردنی خول"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#d5a438] text-[#082b5a] transition-colors hover:bg-[#e5bd52] focus:outline-none focus:ring-2 focus:ring-[#e5c26b]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      <nav className="max-h-[60vh] space-y-1 overflow-y-auto p-2" aria-label={t('roundLabel')}>
        <button
          type="button"
          onClick={() => onSelectRound('dashboard')}
          className={`flex w-full items-center gap-2.5 rounded-md border-r-4 px-3 py-2.5 text-right text-xs font-bold transition-colors ${
            activeRoundId === 'dashboard'
              ? 'border-[#f0cf73] bg-[#d5a438] text-[#082b5a]'
              : 'border-transparent bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span className="truncate">داشبۆردی سەرەکی</span>
        </button>

        {sortedRounds.map((round) => {
          const isActive = activeRoundId === round.id;
          const isEditing = editingRoundId === round.id;

          if (isEditing) {
            return (
              <div
                key={round.id}
                className="rounded-md border border-blue-400/50 bg-slate-800 p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editTitleText}
                  onChange={(e) => setEditTitleText(e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                />
                <div className="mt-2 flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => saveEdit(round.id)}
                    title="پاشەکەوتکردن"
                    className="flex h-7 w-7 items-center justify-center rounded bg-emerald-700 text-white hover:bg-emerald-600"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRoundId(null)}
                    title="پاشگەزبوونەوە"
                    className="flex h-7 w-7 items-center justify-center rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={round.id}
              draggable
              onDragStart={() => handleDragStart(round.id)}
              onDragOver={(e) => handleDragOver(e, round.id)}
              onDrop={(e) => handleDrop(e, round.id)}
              onDragEnd={clearDragState}
              className={`group flex items-center gap-2 rounded-md border-r-4 px-2 py-1.5 transition-colors ${
                isActive
                  ? 'border-[#f0cf73] bg-[#d5a438] text-[#082b5a]'
                  : 'border-transparent text-blue-100 hover:bg-white/10'
              } ${
                dragOverRoundId === round.id
                  ? 'ring-2 ring-[#f0cf73] bg-white/10'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectRound(round.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-right"
                title={round.title}
              >
                <Calendar className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#082b5a]' : 'text-blue-300'}`} />
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{round.title}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-[#244971]' : 'text-blue-300'}`} dir="ltr">
                  {round.year}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={(e) => startEdit(round, e)}
                  title="دەستکاریکردنی ناوی خول"
                  aria-label="دەستکاریکردنی ناوی خول"
                  className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-700 hover:text-blue-300"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>

                {rounds.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(round.id, round.title, e)}
                    title="سڕینەوەی ئەم خولە"
                    aria-label="سڕینەوەی ئەم خولە"
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-rose-950/50 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {addRoundModal}
    </div>
  );
};
