import React, { useState } from 'react';
import { SubTab, Party, PartyVote } from '../types';
import { DEFAULT_PARTIES } from '../data/defaultParties';
import { formatNumber, formatPercentage, calculateVotePercentage } from '../utils/numberFormat';
import {
  Vote,
  CheckCircle,
  Flame,
  Plus,
  Trash2,
  Calculator,
  Layers,
  Info,
  Lock,
} from 'lucide-react';

interface VoteEntryFormProps {
  subTab: SubTab;
  customParties: Party[];
  useKurdishNumerals: boolean;
  currentUserRole?: string; // ڕۆڵی بەکارهێنەر (بۆ نموونە 'viewer' یان 'admin')
  selectedCycle?: string;   // خولی هەڵبژاردن
  selectedBranch?: string;  // لقی هەڵبژاردن
  onUpdateSubTab: (updatedSubTab: SubTab) => void;
  onAddCustomParty: (name: string, color: string) => void;
}

export const VoteEntryForm: React.FC<VoteEntryFormProps> = ({
  subTab,
  customParties,
  useKurdishNumerals,
  currentUserRole,
  selectedCycle,
  selectedBranch,
  onUpdateSubTab,
  onAddCustomParty,
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [showCustomPartyModal, setShowCustomPartyModal] = useState(false);
  const [customPartyName, setCustomPartyName] = useState('');
  const [customPartyColor, setCustomPartyColor] = useState('#6366F1');

  // پشکنینی توندی ڕۆڵی بینەر
  const isViewer = currentUserRole === 'viewer' || currentUserRole === 'VIEWER';

  const allAvailableParties = [...DEFAULT_PARTIES, ...customParties];
  const totalPartyVotesSum = subTab.partyVotes.reduce((sum, p) => sum + (Number(p.votes) || 0), 0);

  const handleCastVotesChange = (val: number) => {
    if (isViewer) return;
    onUpdateSubTab({ ...subTab, totalCastVotes: Math.max(0, val) });
  };

  const handleBurnedVotesChange = (val: number) => {
    if (isViewer) return;
    onUpdateSubTab({ ...subTab, burnedVotes: Math.max(0, val) });
  };

  const handleValidVotesChange = (val: number) => {
    if (isViewer) return;
    onUpdateSubTab({ ...subTab, validVotes: Math.max(0, val), autoCalcValidVotes: false });
  };

  const handleToggleAutoValidVotes = () => {
    if (isViewer) return;
    const nextAuto = !subTab.autoCalcValidVotes;
    onUpdateSubTab({
      ...subTab,
      autoCalcValidVotes: nextAuto,
      validVotes: nextAuto ? totalPartyVotesSum : subTab.validVotes,
    });
  };

  const handleSyncValidVotesWithSum = () => {
    if (isViewer) return;
    onUpdateSubTab({ ...subTab, validVotes: totalPartyVotesSum });
  };

  const handleAddPartyToSubTab = () => {
    if (isViewer || !selectedPartyId) return;

    const existingIndex = subTab.partyVotes.findIndex((p) => p.partyId === selectedPartyId);
    if (existingIndex >= 0) {
      alert('ئەم لایەنە پێشتر لەم ناوچەیەدا زیادکراوە!');
      return;
    }

    const partyInfo = allAvailableParties.find((p) => p.id === selectedPartyId);
    if (!partyInfo) return;

    const newPartyVote: PartyVote = {
      partyId: partyInfo.id,
      partyName: partyInfo.name,
      votes: 0,
      color: partyInfo.color,
      textColor: partyInfo.textColor,
    };

    const newPartyVotes = [...subTab.partyVotes, newPartyVote];
    const newSum = newPartyVotes.reduce((sum, p) => sum + (p.votes || 0), 0);

    onUpdateSubTab({
      ...subTab,
      partyVotes: newPartyVotes,
      validVotes: subTab.autoCalcValidVotes ? newSum : subTab.validVotes || newSum,
    });

    setSelectedPartyId('');
  };

  const handleAddAllDefaultParties = () => {
    if (isViewer) return;
    const existingIds = new Set(subTab.partyVotes.map((p) => p.partyId));
    const toAdd: PartyVote[] = DEFAULT_PARTIES.filter((p) => !existingIds.has(p.id)).map((p) => ({
      partyId: p.id,
      partyName: p.name,
      votes: 0,
      color: p.color,
      textColor: p.textColor,
    }));

    if (toAdd.length === 0) {
      alert('هەموو ١١ لایەنە سەرەکییەکە لەم ناوچەیەدا هەن.');
      return;
    }

    onUpdateSubTab({
      ...subTab,
      partyVotes: [...subTab.partyVotes, ...toAdd],
    });
  };

  const handlePartyVotesChange = (partyId: string, votesStr: string) => {
    if (isViewer) return;
    const votes = votesStr === '' ? 0 : parseInt(votesStr, 10);
    const safeVotes = isNaN(votes) ? 0 : Math.max(0, votes);

    const updatedPartyVotes = subTab.partyVotes.map((p) =>
      p.partyId === partyId ? { ...p, votes: safeVotes } : p
    );

    const newSum = updatedPartyVotes.reduce((sum, p) => sum + (p.votes || 0), 0);

    onUpdateSubTab({
      ...subTab,
      partyVotes: updatedPartyVotes,
      validVotes: subTab.autoCalcValidVotes ? newSum : subTab.validVotes,
    });
  };

  const handleRemoveParty = (partyId: string) => {
    if (isViewer) return;
    const updatedPartyVotes = subTab.partyVotes.filter((p) => p.partyId !== partyId);
    const newSum = updatedPartyVotes.reduce((sum, p) => sum + (p.votes || 0), 0);

    onUpdateSubTab({
      ...subTab,
      partyVotes: updatedPartyVotes,
      validVotes: subTab.autoCalcValidVotes ? newSum : subTab.validVotes,
    });
  };

  const handleCreateCustomParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !customPartyName.trim()) return;

    onAddCustomParty(customPartyName.trim(), customPartyColor);
    setCustomPartyName('');
    setShowCustomPartyModal(false);
  };

  const currentValidVotes = subTab.validVotes || 0;

  return (
    <div className="space-y-4">
      {/* ئاگادارکردنەوەی توندی ڕۆڵی بینەر */}
      {isViewer && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-center gap-2 text-amber-300 text-xs shadow-md">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>تێبینی: ئێستا تۆ بە ڕۆڵی <b>بینەر (Viewer)</b> چوونەتە ژوورەوە؛ تەنها مافی سەیرکردنت هەیە و سەرجەم خانەکان قفڵکراون.</span>
        </div>
      )}

      {/* 3 Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#1E293B] border border-emerald-500/40 rounded-xl p-3 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>دەنگی دروستی تەواو (بۆ ڕێژەی ٪)</span>
            </span>
            {!isViewer && (
              <button
                onClick={handleToggleAutoValidVotes}
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-all ${
                  subTab.autoCalcValidVotes
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {subTab.autoCalcValidVotes ? 'خۆکار' : 'دەستی'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={subTab.validVotes || ''}
              onChange={(e) => handleValidVotesChange(parseInt(e.target.value) || 0)}
              disabled={subTab.autoCalcValidVotes || isViewer}
              min="0"
              className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-sm font-bold text-emerald-300 focus:outline-none disabled:opacity-90 font-mono"
              placeholder="0"
            />
            {!subTab.autoCalcValidVotes && !isViewer && (
              <button
                onClick={handleSyncValidVotesWithSum}
                title="یەکسانکردن"
                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 text-xs shrink-0 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Vote className="w-3.5 h-3.5 text-blue-400" />
              <span>کۆی گشتی دەنگدەر</span>
            </span>
          </div>
          <input
            type="number"
            value={subTab.totalCastVotes || ''}
            onChange={(e) => handleCastVotesChange(parseInt(e.target.value) || 0)}
            disabled={isViewer}
            min="0"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-200 font-mono disabled:opacity-90"
            placeholder="0"
          />
        </div>

        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>دەنگی سوتاو / پوچەڵ</span>
            </span>
          </div>
          <input
            type="number"
            value={subTab.burnedVotes || ''}
            onChange={(e) => handleBurnedVotesChange(parseInt(e.target.value) || 0)}
            disabled={isViewer}
            min="0"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-rose-300 font-mono disabled:opacity-90"
            placeholder="0"
          />
        </div>
      </div>

      {/* Party Combobox Selector & Quick Actions - Hidden for Viewer */}
      {!isViewer && (
        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 shadow-sm space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-bold text-white">فۆڕمی زیادکردنی لایەنەکان</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddAllDefaultParties}
                className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg cursor-pointer"
              >
                + زیادکردنی هەموو ١١ لایەنەکە
              </button>
              <button
                onClick={() => setShowCustomPartyModal(true)}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer"
              >
                + لایەنی نوێ
              </button>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="">-- لایەنێک هەڵبژێرە بۆ زیادکردن --</option>
              {allAvailableParties.map((party) => {
                const isAlreadyAdded = subTab.partyVotes.some((p) => p.partyId === party.id);
                return (
                  <option key={party.id} value={party.id} disabled={isAlreadyAdded}>
                    {party.name} {isAlreadyAdded ? '(پێشتر زیادکراوە)' : ''}
                  </option>
                );
              })}
            </select>
            <button
              onClick={handleAddPartyToSubTab}
              disabled={!selectedPartyId}
              className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>زیادکردن</span>
            </button>
          </div>
        </div>
      )}

      {/* List of Parties */}
      <div className="space-y-1.5">
        {subTab.partyVotes.length === 0 ? (
          <div className="bg-[#1E293B]/60 border border-dashed border-slate-700 rounded-xl p-6 text-center space-y-2">
            <Info className="w-6 h-6 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">هیچ لایەنێک لەم ناوچەیەدا نییە.</p>
          </div>
        ) : (
          subTab.partyVotes.map((pv) => {
            const percentage = calculateVotePercentage(pv.votes, currentValidVotes);

            return (
              <div
                key={pv.partyId}
                className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                style={{ borderRight: `4px solid ${pv.color}` }}
              >
                <div className="flex items-center gap-2.5 sm:w-1/3">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: pv.color }} />
                  <span className="text-xs font-bold text-white truncate">{pv.partyName}</span>
                </div>

                <div className="flex items-center gap-2 sm:w-1/3">
                  <input
                    type="number"
                    value={pv.votes === 0 ? '' : pv.votes}
                    onChange={(e) => handlePartyVotesChange(pv.partyId, e.target.value)}
                    disabled={isViewer}
                    placeholder="٠"
                    min="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white text-left font-mono disabled:opacity-90"
                    dir="ltr"
                  />
                  <span className="text-[11px] text-slate-400">دەنگ</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-1/3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-400 font-mono">
                      {formatPercentage(percentage, useKurdishNumerals, 2)}
                    </span>
                  </div>

                  {!isViewer && (
                    <button
                      onClick={() => handleRemoveParty(pv.partyId)}
                      title="سڕینەوە"
                      className="p-1 text-slate-500 hover:text-rose-400 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Party Modal */}
      {showCustomPartyModal && !isViewer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">زیادکردنی لایەنی نوێ</h3>
            <form onSubmit={handleCreateCustomParty} className="space-y-3">
              <input
                type="text"
                value={customPartyName}
                onChange={(e) => setCustomPartyName(e.target.value)}
                placeholder="ناوی لایەن..."
                required
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customPartyColor}
                  onChange={(e) => setCustomPartyColor(e.target.value)}
                  className="w-9 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-mono">{customPartyColor}</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomPartyModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
                >
                  زیادکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};