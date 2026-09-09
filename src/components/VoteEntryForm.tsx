import React, { useState } from 'react';
import { SubTab, Party, PartyVote } from '../types';
import { DEFAULT_PARTIES } from '../data/defaultParties';
import { formatNumber, formatPercentage, calculateVotePercentage } from '../utils/numberFormat';
import {
  Vote,
  CheckCircle,
  Flame,
  Hash,
  Plus,
  Trash2,
  Calculator,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface VoteEntryFormProps {
  subTab: SubTab;
  customParties: Party[];
  useKurdishNumerals: boolean;
  onUpdateSubTab: (updatedSubTab: SubTab) => void;
  onAddCustomParty: (name: string, color: string) => void;
}

export const VoteEntryForm: React.FC<VoteEntryFormProps> = ({
  subTab,
  customParties,
  useKurdishNumerals,
  onUpdateSubTab,
  onAddCustomParty,
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [showCustomPartyModal, setShowCustomPartyModal] = useState(false);
  const [customPartyName, setCustomPartyName] = useState('');
  const [customPartyColor, setCustomPartyColor] = useState('#6366F1');

  const allAvailableParties = [...DEFAULT_PARTIES, ...customParties];

  // Calculate sum of all party votes entered
  const totalPartyVotesSum = subTab.partyVotes.reduce((sum, p) => sum + (Number(p.votes) || 0), 0);

  // Handle updating totalCastVotes (دەنگی گشتی دراو - reference only)
  const handleCastVotesChange = (val: number) => {
    onUpdateSubTab({
      ...subTab,
      totalCastVotes: Math.max(0, val),
    });
  };

  // Handle updating burnedVotes (دەنگی سوتاو - reference only)
  const handleBurnedVotesChange = (val: number) => {
    onUpdateSubTab({
      ...subTab,
      burnedVotes: Math.max(0, val),
    });
  };

  // Handle updating validVotes (دەنگی دروستی تەواو - strictly used for % calculations)
  const handleValidVotesChange = (val: number) => {
    onUpdateSubTab({
      ...subTab,
      validVotes: Math.max(0, val),
      autoCalcValidVotes: false,
    });
  };

  // Toggle auto calculation of valid votes
  const handleToggleAutoValidVotes = () => {
    const nextAuto = !subTab.autoCalcValidVotes;
    onUpdateSubTab({
      ...subTab,
      autoCalcValidVotes: nextAuto,
      validVotes: nextAuto ? totalPartyVotesSum : subTab.validVotes,
    });
  };

  // Set Valid votes = sum of party votes
  const handleSyncValidVotesWithSum = () => {
    onUpdateSubTab({
      ...subTab,
      validVotes: totalPartyVotesSum,
    });
  };

  // Add party to current sub-tab
  const handleAddPartyToSubTab = () => {
    if (!selectedPartyId) return;

    // Check if already in partyVotes
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

  // Add all 11 default parties to this subTab with 1 click
  const handleAddAllDefaultParties = () => {
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

    const updatedPartyVotes = [...subTab.partyVotes, ...toAdd];
    onUpdateSubTab({
      ...subTab,
      partyVotes: updatedPartyVotes,
    });
  };

  // Update specific party votes
  const handlePartyVotesChange = (partyId: string, votesStr: string) => {
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

  // Remove party from sub-tab
  const handleRemoveParty = (partyId: string) => {
    const updatedPartyVotes = subTab.partyVotes.filter((p) => p.partyId !== partyId);
    const newSum = updatedPartyVotes.reduce((sum, p) => sum + (p.votes || 0), 0);

    onUpdateSubTab({
      ...subTab,
      partyVotes: updatedPartyVotes,
      validVotes: subTab.autoCalcValidVotes ? newSum : subTab.validVotes,
    });
  };

  // Handle adding custom party
  const handleCreateCustomParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPartyName.trim()) return;

    onAddCustomParty(customPartyName.trim(), customPartyColor);
    setCustomPartyName('');
    setShowCustomPartyModal(false);
  };

  const currentValidVotes = subTab.validVotes || 0;

  return (
    <div className="space-y-4">
      
      {/* 3 Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Valid Votes (دەنگی دروستی تەواو) */}
        <div className="bg-[#1E293B] border border-emerald-500/40 rounded-xl p-3 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>دەنگی دروستی تەواو (بۆ ڕێژەی ٪)</span>
            </span>
            <button
              onClick={handleToggleAutoValidVotes}
              title={subTab.autoCalcValidVotes ? 'دەستکاری دەستی دەنگی دروست' : 'خۆکار کۆکردنەوە لە لایەنەکان'}
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-all ${
                subTab.autoCalcValidVotes
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {subTab.autoCalcValidVotes ? 'خۆکار' : 'دەستی'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={subTab.validVotes || ''}
              onChange={(e) => handleValidVotesChange(parseInt(e.target.value) || 0)}
              disabled={subTab.autoCalcValidVotes}
              min="0"
              className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-sm font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 disabled:opacity-90 font-mono"
              placeholder="0"
            />
            {!subTab.autoCalcValidVotes && (
              <button
                onClick={handleSyncValidVotesWithSum}
                title="یەکسانکردن بە کۆی دەنگی لایەنەکان"
                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 text-xs shrink-0 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            * بنەمای حیسابکردنی ٪ دەنگی سەرجەم لایەنەکانە
          </p>
        </div>

        {/* Total Cast / Voters (کۆی گشتی دەنگدەر) */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Vote className="w-3.5 h-3.5 text-blue-400" />
              <span>کۆی گشتی دەنگدەر (تەنها ژمارە)</span>
            </span>
          </div>
          <input
            type="number"
            value={subTab.totalCastVotes || ''}
            onChange={(e) => handleCastVotesChange(parseInt(e.target.value) || 0)}
            min="0"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-200 focus:outline-none focus:border-blue-400 font-mono"
            placeholder="0"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            تەنها وەک ژمارەی گشتییە و کاریگەری لەسەر حسابات نییە.
          </p>
        </div>

        {/* Burned Votes (دەنگی سوتاو) */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>دەنگی سوتاو / پوچەڵ (تەنها ژمارە)</span>
            </span>
          </div>
          <input
            type="number"
            value={subTab.burnedVotes || ''}
            onChange={(e) => handleBurnedVotesChange(parseInt(e.target.value) || 0)}
            min="0"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-rose-300 focus:outline-none focus:border-rose-400 font-mono"
            placeholder="0"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            تەنها وەک ژمارەی سوتاو تۆمار دەکرێت.
          </p>
        </div>

      </div>

      {/* Party Combobox Selector & Quick Actions */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-white">
              فۆڕمی هەڵبژاردنی لایەنەکان و ژمارەی دەنگەکان
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddAllDefaultParties}
              className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg transition-all cursor-pointer"
            >
              + زیادکردنی هەموو ١١ لایەنەکە
            </button>
            <button
              onClick={() => setShowCustomPartyModal(true)}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all cursor-pointer"
            >
              + لایەنی نوێ
            </button>
          </div>
        </div>

        {/* Combo Box Selection Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="w-full relative">
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">-- لایەنێک یان کاندیدێک هەڵبژێرە بۆ زیادکردن --</option>
              {allAvailableParties.map((party) => {
                const isAlreadyAdded = subTab.partyVotes.some((p) => p.partyId === party.id);
                return (
                  <option key={party.id} value={party.id} disabled={isAlreadyAdded}>
                    {party.name} {isAlreadyAdded ? '(پێشتر زیادکراوە)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={handleAddPartyToSubTab}
            disabled={!selectedPartyId}
            className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>زیادکردنی لایەن</span>
          </button>
        </div>
      </div>

      {/* List of Parties with Live Vote Input & % Calculation */}
      <div className="space-y-1.5">
        {subTab.partyVotes.length === 0 ? (
          <div className="bg-[#1E293B]/60 border border-dashed border-slate-700 rounded-xl p-6 text-center space-y-2">
            <Info className="w-6 h-6 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">
              هیچ لایەنێک بۆ ئەم ناوچەیە زیاد نەکراوە.
            </p>
            <button
              onClick={handleAddAllDefaultParties}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-500 shadow-sm"
            >
              + زیادکردنی هەموو لایەنەکان بە ڕەنگەکانیانەوە
            </button>
          </div>
        ) : (
          subTab.partyVotes.map((pv, index) => {
            const percentage = calculateVotePercentage(pv.votes, currentValidVotes);

            return (
              <div
                key={pv.partyId}
                className="bg-[#1E293B] hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                style={{ borderRight: `4px solid ${pv.color}` }}
              >
                {/* Party Name and Color Swatch */}
                <div className="flex items-center gap-2.5 sm:w-1/3 min-w-[180px]">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/20"
                    style={{ backgroundColor: pv.color }}
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">
                      {pv.partyName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pv.color}
                    </span>
                  </div>
                </div>

                {/* Vote Count Input */}
                <div className="flex items-center gap-2 sm:w-1/3">
                  <div className="relative w-full">
                    <input
                      type="number"
                      value={pv.votes === 0 ? '' : pv.votes}
                      onChange={(e) => handlePartyVotesChange(pv.partyId, e.target.value)}
                      placeholder="٠"
                      min="0"
                      className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">دەنگ</span>
                </div>

                {/* Percentage & Progress Bar */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-1/3">
                  <div className="text-right flex flex-col items-end min-w-[80px]">
                    <span className="text-xs font-bold text-blue-400 font-mono">
                      {formatPercentage(percentage, useKurdishNumerals, 2)}
                    </span>
                    {/* Visual mini progress bar */}
                    <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, percentage)}%`,
                          backgroundColor: pv.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Remove Party Button */}
                  <button
                    onClick={() => handleRemoveParty(pv.partyId)}
                    title="سڕینەوەی ئەم لایەنە لەم ناوچەیە"
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Creating Custom Party */}
      {showCustomPartyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">زیادکردنی لایەن یان کاندیدی نوێ</h3>
            
            <form onSubmit={handleCreateCustomParty} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ناوی لایەن / لیست / کاندید</label>
                <input
                  type="text"
                  value={customPartyName}
                  onChange={(e) => setCustomPartyName(e.target.value)}
                  placeholder="ناوی لایەن بنووسە..."
                  required
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ڕەنگی لایەن لەسەر چارتەکان</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customPartyColor}
                    onChange={(e) => setCustomPartyColor(e.target.value)}
                    className="w-9 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 font-mono">{customPartyColor}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomPartyModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer shadow-md"
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
