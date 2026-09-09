import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart as ReBarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { LayoutDashboard, Filter, BarChart3, PieChart, LineChart, Trophy, CircleDot, Activity } from 'lucide-react';
import { AppDatabase, ElectionRound, ElectionBranch } from '../types';
import { DEFAULT_PARTIES } from '../data/defaultParties';
import { formatNumber, formatPercentage, calculateVotePercentage } from '../utils/numberFormat';
import { ChartLegend } from './ChartLegend';

type MetricMode = 'votes' | 'percentage';
type ChartMode = 'bar' | 'pie' | 'donut' | 'line' | 'area';

function detectTheme(): 'dark' | 'gray' | 'light' | 'government' {
  if (typeof document === 'undefined') return 'government';
  const className = document.body.className || '';
  if (className.includes('theme-light')) return 'light';
  if (className.includes('theme-gray')) return 'gray';
  if (className.includes('theme-dark')) return 'dark';
  return 'government';
}

interface GeneralDashboardProps {
  db: AppDatabase;
  useKurdishNumerals: boolean;
  onNavigateToRound: (roundId: string) => void;
}

interface AggregatedItem {
  name: string;
  votes: number;
  percentage: number;
  color: string;
  formattedVotes: string;
  formattedPct: string;
}

const EXCLUDED_BRANCH_NAMES = ['لقی سەرەکی', 'بنچینە'];

const getRealRounds = (rounds: ElectionRound[]): ElectionRound[] => {
  return rounds.filter((round) => round.id !== 'round-lqi4');
};

const getRealBranches = (round: ElectionRound): ElectionBranch[] => {
  return (round.branches || []).filter(
    (branch) => !EXCLUDED_BRANCH_NAMES.includes((branch.name || '').trim())
  );
};

export const GeneralDashboard: React.FC<GeneralDashboardProps> = ({
  db,
  useKurdishNumerals,
  onNavigateToRound,
}) => {
  const theme = detectTheme();
  const isLightSurface = theme === 'light' || theme === 'government';
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedSubTabFilter, setSelectedSubTabFilter] = useState<string>('all');
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<string>('all');
  const [metricMode, setMetricMode] = useState<MetricMode>('votes');
  const [chartMode, setChartMode] = useState<ChartMode>('bar');

  const rounds = useMemo(() => getRealRounds(db.rounds), [db.rounds]);

  const summary = useMemo(() => {
    let totalCast = 0;
    let totalBurned = 0;
    let totalValid = 0;
    let totalAreas = 0;
    const partyVotesMap: Record<string, { name: string; votes: number; color: string }> = {};

    rounds.forEach((round) => {
      getRealBranches(round).forEach((branch) => {
        totalAreas += branch.subTabs.length;
        branch.subTabs.forEach((subTab) => {
          totalCast += subTab.totalCastVotes || 0;
          totalBurned += subTab.burnedVotes || 0;
          totalValid += subTab.validVotes || 0;

          subTab.partyVotes.forEach((pv) => {
            if (!partyVotesMap[pv.partyId]) {
              partyVotesMap[pv.partyId] = {
                name: pv.partyName,
                votes: 0,
                color: pv.color,
              };
            }
            partyVotesMap[pv.partyId].votes += pv.votes || 0;
          });
        });
      });
    });

    const sorted = Object.values(partyVotesMap).sort((a, b) => b.votes - a.votes);

    return {
      totalCast,
      totalBurned,
      totalValid,
      totalAreas,
      totalRounds: rounds.length,
      topParty: sorted[0] || null,
      sortedParties: sorted,
    };
  }, [rounds]);

  const availableBranches = useMemo(() => {
    const selectedRounds = selectedRoundFilter === 'all'
      ? rounds
      : rounds.filter((round) => round.id === selectedRoundFilter);

    const result: { id: string; name: string }[] = [];
    const seenPerRound = new Set<string>();
    selectedRounds.forEach((round) => {
      getRealBranches(round).forEach((branch) => {
        const uniqueKey = `${round.id}:${(branch.name || '').trim()}`;
        if (seenPerRound.has(uniqueKey)) {
          return;
        }
        seenPerRound.add(uniqueKey);
        result.push({ id: `${round.id}:${branch.id}`, name: branch.name });
      });
    });

    return result;
  }, [rounds, selectedRoundFilter]);

  const availableSubTabs = useMemo(() => {
    const selectedRounds = selectedRoundFilter === 'all'
      ? rounds
      : rounds.filter((round) => round.id === selectedRoundFilter);

    const result: { id: string; name: string }[] = [];

    selectedRounds.forEach((round) => {
      getRealBranches(round)
        .filter((branch) => selectedBranchFilter === 'all' || `${round.id}:${branch.id}` === selectedBranchFilter)
        .forEach((branch) => {
          branch.subTabs.forEach((subTab) => {
            result.push({ id: `${round.id}:${branch.id}:${subTab.id}`, name: subTab.name });
          });
        });
    });

    return result;
  }, [rounds, selectedRoundFilter, selectedBranchFilter]);

  const aggregatedData = useMemo<AggregatedItem[]>(() => {
    const selectedRounds = selectedRoundFilter === 'all'
      ? rounds
      : rounds.filter((round) => round.id === selectedRoundFilter);

    const byParty: Record<string, { name: string; votes: number; valid: number; color: string }> = {};

    selectedRounds.forEach((round) => {
      getRealBranches(round)
        .filter((branch) => selectedBranchFilter === 'all' || `${round.id}:${branch.id}` === selectedBranchFilter)
        .forEach((branch) => {
          branch.subTabs
            .filter((subTab) => selectedSubTabFilter === 'all' || `${round.id}:${branch.id}:${subTab.id}` === selectedSubTabFilter)
            .forEach((subTab) => {
              subTab.partyVotes.forEach((pv) => {
                if (selectedPartyFilter !== 'all' && pv.partyId !== selectedPartyFilter) {
                  return;
                }
                if (!byParty[pv.partyId]) {
                  byParty[pv.partyId] = {
                    name: pv.partyName,
                    votes: 0,
                    valid: 0,
                    color: pv.color,
                  };
                }
                byParty[pv.partyId].votes += pv.votes || 0;
                byParty[pv.partyId].valid += subTab.validVotes || 0;
              });
            });
        });
    });

    return Object.values(byParty)
      .map((item) => {
        const pct = calculateVotePercentage(item.votes, item.valid);
        return {
          name: item.name,
          votes: item.votes,
          percentage: pct,
          color: item.color,
          formattedVotes: formatNumber(item.votes, useKurdishNumerals),
          formattedPct: formatPercentage(pct, useKurdishNumerals, 2),
        };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [
    rounds,
    selectedRoundFilter,
    selectedBranchFilter,
    selectedSubTabFilter,
    selectedPartyFilter,
    useKurdishNumerals,
  ]);

  const cardClass = isLightSurface
    ? 'rounded-xl border border-slate-200 bg-white p-4'
    : theme === 'gray'
    ? 'rounded-xl border border-slate-700 bg-slate-800/90 p-4'
    : 'rounded-xl border border-slate-700 bg-slate-900/80 p-4';

  const panelClass = isLightSurface
    ? 'rounded-lg border border-slate-200 bg-slate-50 p-2'
    : 'rounded-lg border border-slate-700 bg-slate-950 p-2';

  const primaryTextClass = isLightSurface ? 'text-slate-900' : 'text-white';
  const mutedTextClass = isLightSurface ? 'text-slate-600' : 'text-slate-400';
  const controlClass = isLightSurface
    ? 'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900'
    : 'w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white';
  const axisColor = isLightSurface ? '#334155' : '#CBD5E1';
  const gridColor = isLightSurface ? '#CBD5E1' : '#334155';

  const dataKey = metricMode === 'votes' ? 'votes' : 'percentage';

  const partyOptions = useMemo(() => {
    const merged = [...DEFAULT_PARTIES, ...(db.customParties || [])];
    const unique = new Map<string, { id: string; name: string }>();
    merged.forEach((party) => {
      if (!unique.has(party.id)) {
        unique.set(party.id, { id: party.id, name: party.name });
      }
    });
    return Array.from(unique.values());
  }, [db.customParties]);

  const CustomComparisonTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const item = payload[0]?.payload;
    if (!item) {
      return null;
    }

    return (
      <div className={`rounded-lg border px-3 py-2 text-xs shadow-xl ${
        isLightSurface
          ? 'border-slate-200 bg-white text-slate-800'
          : 'border-slate-700 bg-slate-900/95 text-slate-100'
      }`}>
        <div className="mb-1 font-semibold">{label || item.name}</div>
        <div>{metricMode === 'votes' ? item.formattedVotes : item.formattedPct}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-blue-400" />
            <h2 className={`text-sm font-bold ${primaryTextClass}`}>داشبۆردی گشتی</h2>
          </div>
          {summary.topParty && (
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-amber-300">
              <Trophy className="h-4 w-4" />
              {summary.topParty.name} ({formatNumber(summary.topParty.votes, useKurdishNumerals)} دەنگ)
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className={panelClass}>
            <div className={`text-[11px] ${mutedTextClass}`}>خول</div>
            <div className={`text-sm font-bold ${primaryTextClass}`}>{formatNumber(summary.totalRounds, useKurdishNumerals)}</div>
          </div>
          <div className={panelClass}>
            <div className={`text-[11px] ${mutedTextClass}`}>ناوچە و پارێزگا</div>
            <div className={`text-sm font-bold ${primaryTextClass}`}>{formatNumber(summary.totalAreas, useKurdishNumerals)}</div>
          </div>
          <div className={panelClass}>
            <div className={`text-[11px] ${mutedTextClass}`}>دەنگی دروست</div>
            <div className="text-sm font-bold text-emerald-400">{formatNumber(summary.totalValid, useKurdishNumerals)}</div>
          </div>
          <div className={panelClass}>
            <div className={`text-[11px] ${mutedTextClass}`}>دەنگی سوتاو</div>
            <div className="text-sm font-bold text-rose-400">{formatNumber(summary.totalBurned, useKurdishNumerals)}</div>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-400" />
          <h3 className={`text-sm font-bold ${primaryTextClass}`}>فلتەر و بەراورد</h3>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={selectedRoundFilter}
            onChange={(e) => {
              setSelectedRoundFilter(e.target.value);
              setSelectedBranchFilter('all');
              setSelectedSubTabFilter('all');
            }}
            className={controlClass}
          >
            <option value="all">هەموو خولەکان</option>
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>{round.title}</option>
            ))}
          </select>

          <select
            value={selectedBranchFilter}
            onChange={(e) => {
              setSelectedBranchFilter(e.target.value);
              setSelectedSubTabFilter('all');
            }}
            className={controlClass}
          >
            <option value="all">هەموو لقەکان</option>
            {availableBranches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>

          <select
            value={selectedSubTabFilter}
            onChange={(e) => setSelectedSubTabFilter(e.target.value)}
            className={controlClass}
          >
            <option value="all">هەموو ناوچەکان</option>
            {availableSubTabs.map((subTab) => (
              <option key={subTab.id} value={subTab.id}>{subTab.name}</option>
            ))}
          </select>

          <select
            value={selectedPartyFilter}
            onChange={(e) => setSelectedPartyFilter(e.target.value)}
            className={controlClass}
          >
            <option value="all">هەموو پارتەکان</option>
            {partyOptions.map((party) => (
              <option key={party.id} value={party.id}>{party.name}</option>
            ))}
          </select>

          <select
            value={metricMode}
            onChange={(e) => setMetricMode(e.target.value as MetricMode)}
            className={controlClass}
          >
            <option value="votes">بەپێی دەنگ</option>
            <option value="percentage">بەپێی ڕێژە</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setChartMode('bar')}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
              chartMode === 'bar' ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Bar
          </button>
          <button
            onClick={() => setChartMode('pie')}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
              chartMode === 'pie' ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            <PieChart className="h-4 w-4" /> Pie
          </button>
          <button
            onClick={() => setChartMode('donut')}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
              chartMode === 'donut' ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            <CircleDot className="h-4 w-4" /> Donut
          </button>
          <button
            onClick={() => setChartMode('line')}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
              chartMode === 'line' ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            <LineChart className="h-4 w-4" /> Line
          </button>
          <button
            onClick={() => setChartMode('area')}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
              chartMode === 'area' ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            <Activity className="h-4 w-4" /> Area
          </button>
        </div>

        <div className="mt-4 h-[360px] rounded-lg border border-slate-700 bg-slate-950 p-2">
          {aggregatedData.length === 0 ? (
            <div className={`flex h-full items-center justify-center text-sm ${mutedTextClass}`}>داتای گونجاو نییە بۆ نیشاندانی چارت</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'pie' || chartMode === 'donut' ? (
                <RePieChart margin={{ top: 16, right: 40, left: 40, bottom: 16 }}>
                  <Tooltip content={<CustomComparisonTooltip />} />
                  <Legend content={<ChartLegend />} />
                  <Pie
                    data={aggregatedData}
                    dataKey={dataKey}
                    nameKey="name"
                    innerRadius={chartMode === 'donut' ? 70 : 0}
                    outerRadius={120}
                    label={false}
                    labelLine={false}
                  >
                    {aggregatedData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RePieChart>
              ) : chartMode === 'line' ? (
                <ReLineChart data={aggregatedData} margin={{ top: 16, right: 16, left: 8, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" angle={-18} textAnchor="end" height={78} stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip content={<CustomComparisonTooltip />} />
                  <Line type="monotone" dataKey={dataKey} stroke="#60A5FA" strokeWidth={3} dot={{ r: 4 }} />
                </ReLineChart>
              ) : chartMode === 'area' ? (
                <ReAreaChart data={aggregatedData} margin={{ top: 16, right: 16, left: 8, bottom: 70 }}>
                  <defs>
                    <linearGradient id="dashboardAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" angle={-18} textAnchor="end" height={78} stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip content={<CustomComparisonTooltip />} />
                  <Area type="monotone" dataKey={dataKey} stroke="#3B82F6" fill="url(#dashboardAreaFill)" strokeWidth={2.5} />
                </ReAreaChart>
              ) : (
                <ReBarChart data={aggregatedData} margin={{ top: 16, right: 16, left: 8, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" angle={-18} textAnchor="end" height={78} stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip content={<CustomComparisonTooltip />} />
                  <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
                    {aggregatedData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ReBarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {aggregatedData.length > 0 && (
          <div className={`mt-3 rounded-lg border p-3 ${isLightSurface ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-950'}`}>
            <div className={`mb-2 text-xs font-bold ${primaryTextClass}`}>
              لەیبڵی چارت: ناوی لایەن + ژمارەی دەنگ + ڕێژە
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
              {aggregatedData.map((item) => (
                <div
                  key={`dashboard-chart-label-${item.name}`}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 ${
                    isLightSurface ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-800/70'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full border border-white/30" style={{ backgroundColor: item.color }} />
                    <span className={`truncate text-xs font-bold ${primaryTextClass}`}>{item.name}</span>
                  </div>
                  <div className="shrink-0 text-left" dir="ltr">
                    <div className={`text-[11px] font-mono font-bold ${primaryTextClass}`}>{item.formattedVotes}</div>
                    <div className="text-[10px] font-mono font-semibold text-emerald-500">{item.formattedPct}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <div className={`mb-2 text-sm font-bold ${primaryTextClass}`}>ڕیزبەندی پارتەکان</div>
        <div className="space-y-2">
          {summary.sortedParties.slice(0, 10).map((party) => {
            const pct = calculateVotePercentage(party.votes, summary.totalValid);
            return (
              <div key={party.name} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isLightSurface ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-950'}`}>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: party.color }} />
                  <span className={`text-xs ${primaryTextClass}`}>{party.name}</span>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${isLightSurface ? 'text-slate-700' : 'text-slate-100'}`}>{formatNumber(party.votes, useKurdishNumerals)}</div>
                  <div className={`text-[11px] ${mutedTextClass}`}>{formatPercentage(pct, useKurdishNumerals, 2)}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`mt-3 border-t pt-3 ${isLightSurface ? 'border-slate-200' : 'border-slate-700'}`}>
          <div className={`text-xs ${isLightSurface ? 'text-slate-600' : 'text-slate-300'}`}>گواستنەوە بۆ خول</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {rounds.map((round) => (
              <button
                key={`jump-${round.id}`}
                onClick={() => onNavigateToRound(round.id)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 hover:border-blue-500 hover:text-white"
              >
                {round.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
