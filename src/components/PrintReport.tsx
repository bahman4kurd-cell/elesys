import React from 'react';
import { AppDatabase, ElectionRound, SubTab } from '../types';
import { formatNumber, formatPercentage, calculateVotePercentage } from '../utils/numberFormat';
import { Printer, X, Vote, CheckCircle, Flame } from 'lucide-react';

interface PrintReportProps {
  db: AppDatabase;
  activeRoundId: string;
  onClose: () => void;
}

export const PrintReport: React.FC<PrintReportProps> = ({ db, activeRoundId, onClose }) => {
  const currentRound =
    activeRoundId === 'dashboard'
      ? db.rounds[0]
      : db.rounds.find((r) => r.id === activeRoundId) || db.rounds[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto">
      
      {/* Control bar (hidden during print) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex items-center justify-between no-print shadow-2xl">
        <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-bold text-white">
            پێشبینینی کۆنووسی چاپکردنی فەرمی ئەنجامەکان
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>چاپکردن (Print / PDF)</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Sheet (white background for official printing) */}
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-6 text-right" dir="rtl">
        
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Vote className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">
            کۆنووسی فەرمی ئەنجامەکانی هەڵبژاردن
          </h1>
          <h2 className="text-lg font-bold text-slate-700">
            {currentRound?.title}
          </h2>
          <div className="flex justify-center items-center gap-6 text-xs text-slate-500 pt-1">
            <span>بەرواری دەرچوون: {new Date().toLocaleDateString('ar-IQ')}</span>
            <span>سیستەمی تۆمارکردنی ئەنجامەکان</span>
          </div>
        </div>

        {/* Loop through each subtab */}
        {currentRound?.subTabs.map((subTab, stIdx) => {
          const validVotes = subTab.validVotes || 0;
          const sortedPartyVotes = [...subTab.partyVotes].sort((a, b) => (b.votes || 0) - (a.votes || 0));

          return (
            <div key={subTab.id} className="space-y-4 pt-4 border-b border-slate-200 pb-6">
              <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl">
                <h3 className="text-base font-bold text-slate-900">
                  ناوچەی #{stIdx + 1}: {subTab.name}
                </h3>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-emerald-700">
                    دەنگی دروست: {formatNumber(validVotes)}
                  </span>
                  <span className="text-slate-600">
                    کۆی گشتی دەنگدەر: {formatNumber(subTab.totalCastVotes)}
                  </span>
                  <span className="text-rose-700">
                    دەنگی سوتاو: {formatNumber(subTab.burnedVotes)}
                  </span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-2 px-3 border-l border-slate-300 text-center w-12">#</th>
                    <th className="py-2 px-3 border-l border-slate-300">ناوی لایەن / لیست</th>
                    <th className="py-2 px-3 border-l border-slate-300 text-center">دەنگی بەدەستهاتوو</th>
                    <th className="py-2 px-3 text-center">ڕێژەی سەدی (٪ لە دەنگی دروست)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedPartyVotes.map((pv, idx) => {
                    const pct = calculateVotePercentage(pv.votes, validVotes);
                    return (
                      <tr key={pv.partyId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-2 px-3 border-l border-slate-300 text-center font-bold font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-l border-slate-300 font-semibold flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0 inline-block"
                            style={{ backgroundColor: pv.color }}
                          />
                          <span>{pv.partyName}</span>
                        </td>
                        <td className="py-2 px-3 border-l border-slate-300 text-center font-bold font-mono" dir="ltr">
                          {formatNumber(pv.votes)}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-800 font-mono" dir="ltr">
                          {formatPercentage(pct, false, 2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Footer Signature Box */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
          <div className="space-y-8">
            <span>بەرپرسی ناوچە</span>
            <div className="border-t border-slate-400 w-32 mx-auto">واژوو</div>
          </div>
          <div className="space-y-8">
            <span>چاودێری هەڵبژاردن</span>
            <div className="border-t border-slate-400 w-32 mx-auto">واژوو</div>
          </div>
          <div className="space-y-8">
            <span>سەرۆکی لیژنە</span>
            <div className="border-t border-slate-400 w-32 mx-auto">واژوو و مۆر</div>
          </div>
        </div>

      </div>
    </div>
  );
};
