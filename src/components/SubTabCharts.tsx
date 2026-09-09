import React from 'react';
import { SubTab, ChartType } from '../types';
import { formatNumber, formatPercentage, calculateVotePercentage } from '../utils/numberFormat';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as ReLineChart,
  Line,
  AreaChart as ReAreaChart,
  Area,
  Legend,
} from 'recharts';
import { ChartLegend } from './ChartLegend';
import { PieChart, BarChart3, Trophy } from 'lucide-react';

interface SubTabChartsProps {
  subTab: SubTab;
  useKurdishNumerals: boolean;
  onSelectChartType: (type: ChartType) => void;
}

function detectTheme(): 'dark' | 'gray' | 'light' | 'government' {
  if (typeof document === 'undefined') return 'government';
  const className = document.body.className || '';
  if (className.includes('theme-light')) return 'light';
  if (className.includes('theme-gray')) return 'gray';
  if (className.includes('theme-dark')) return 'dark';
  return 'government';
}

export const SubTabCharts: React.FC<SubTabChartsProps> = ({
  subTab,
  useKurdishNumerals,
  onSelectChartType,
}) => {
  const theme = detectTheme();
  const isLightSurface = theme === 'light' || theme === 'government';
  const validVotes = subTab.validVotes || 0;
  const chartData = subTab.partyVotes
    .filter((p) => (p.votes || 0) > 0)
    .sort((a, b) => b.votes - a.votes)
    .map((p) => {
      const pct = calculateVotePercentage(p.votes, validVotes);
      return {
        name: p.partyName,
        votes: p.votes,
        percentage: pct,
        color: p.color,
        formattedPct: formatPercentage(pct, useKurdishNumerals, 2),
        formattedVotes: formatNumber(p.votes, useKurdishNumerals),
      };
    });

  const topParty = chartData[0] || null;
  const currentType = subTab.selectedChartType || 'pie';

  const containerClass = isLightSurface
    ? 'bg-white border-slate-200 text-slate-900'
    : theme === 'gray'
    ? 'bg-slate-800 border-slate-700 text-slate-100'
    : 'bg-[#1E293B] border-slate-700 text-white';

  const panelClass = isLightSurface
    ? 'bg-slate-50 border-slate-200'
    : theme === 'gray'
    ? 'bg-slate-900/70 border-slate-700'
    : 'bg-slate-900/90 border-slate-700';

  const mutedTextClass = isLightSurface ? 'text-slate-600' : 'text-slate-200';
  const primaryTextClass = isLightSurface ? 'text-slate-900' : 'text-white';
  const axisColor = isLightSurface ? '#334155' : '#CBD5E1';
  const gridColor = isLightSurface ? '#CBD5E1' : '#334155';

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className={`rounded-xl border p-3 text-xs shadow-2xl ${panelClass}`}>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: data.color }} />
          <span className={`font-bold ${primaryTextClass}`}>{data.name}</span>
        </div>
        <div className={`flex items-center justify-between gap-4 ${mutedTextClass}`}>
          <span>دەنگ:</span>
          <span className="font-mono font-bold" dir="ltr">{data.formattedVotes}</span>
        </div>
        <div className={`flex items-center justify-between gap-4 ${mutedTextClass}`}>
          <span>ڕێژە:</span>
          <span className="font-mono font-bold" dir="ltr">{data.formattedPct}</span>
        </div>
      </div>
    );
  };

  const truncateTick = (value: string) => {
    if (!value) return '';
    return value.length > 14 ? `${value.slice(0, 14)}...` : value;
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-xl space-y-4 ${containerClass}`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${isLightSurface ? 'border-slate-200' : 'border-slate-700'}`}>
        <div>
          <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${primaryTextClass}`}>
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span>چارتی شیکاری ئەنجامەکان ({subTab.name})</span>
          </h3>
          <p className={`text-[11px] ${mutedTextClass}`}>
            ڕێژەکان لەسەر بنەمای دەنگی دروستی تەواو ({formatNumber(validVotes, useKurdishNumerals)}) حیساب کراون
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className={`hidden sm:inline text-xs ${mutedTextClass}`}>جۆری چارت:</label>
          <select
            value={currentType}
            onChange={(e) => onSelectChartType(e.target.value as ChartType)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold focus:outline-none ${
              isLightSurface
                ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500'
            }`}
          >
            <option value="pie">Pie</option>
            <option value="donut">Donut</option>
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>
        </div>
      </div>

      {topParty && (
        <div className={`rounded-xl border p-3 flex items-center justify-between ${panelClass}`}>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-600 p-1.5 text-white">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs text-blue-500">لایەنی یەکەم لەم ناوچەیە</span>
              <span className={`text-sm font-bold ${primaryTextClass}`}>{topParty.name}</span>
            </div>
          </div>
          <div className="text-left" dir="ltr">
            <span className="block font-mono text-sm font-bold text-blue-500">{topParty.formattedVotes} دەنگ</span>
            <span className="font-mono text-xs font-semibold text-emerald-500">({topParty.formattedPct})</span>
          </div>
        </div>
      )}

      <div className="relative h-[360px] w-full pt-2 sm:h-[430px] xl:h-[520px]">
        {chartData.length === 0 ? (
          <div className={`flex h-full flex-col items-center justify-center text-sm ${mutedTextClass}`}>
            <PieChart className="mb-2 h-12 w-12 stroke-[1.5]" />
            <span>هیچ دەنگێک بۆ لایەنەکان تۆمار نەکراوە تا چارت پیشانبدرێت.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {currentType === 'pie' || currentType === 'donut' ? (
              <RePieChart margin={{ top: 18, right: 28, left: 28, bottom: 10 }}>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  dataKey="votes"
                  nameKey="name"
                  innerRadius={currentType === 'donut' ? 70 : 0}
                  outerRadius={125}
                  paddingAngle={2}
                  minAngle={3}
                  label={false}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`chart-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  content={<ChartLegend />}
                  formatter={(value) => {
                    const item = chartData.find((p) => p.name === value);
                    if (!item) return value;
                    return (
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold ${
                        isLightSurface
                          ? 'bg-slate-200 text-slate-900'
                          : 'bg-slate-700/70 text-slate-100'
                      }`}>
                        {item.name} ({item.formattedVotes} | {item.formattedPct})
                      </span>
                    );
                  }}
                />
              </RePieChart>
            ) : currentType === 'line' ? (
              <ReLineChart data={chartData} margin={{ top: 16, right: 12, left: 8, bottom: 72 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  angle={-18}
                  textAnchor="end"
                  height={78}
                  interval={0}
                  tickFormatter={truncateTick}
                  stroke={axisColor}
                  tick={{ fill: axisColor, fontSize: 11 }}
                />
                <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="votes" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
              </ReLineChart>
            ) : currentType === 'area' ? (
              <ReAreaChart data={chartData} margin={{ top: 16, right: 12, left: 8, bottom: 72 }}>
                <defs>
                  <linearGradient id="areaVotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  angle={-18}
                  textAnchor="end"
                  height={78}
                  interval={0}
                  tickFormatter={truncateTick}
                  stroke={axisColor}
                  tick={{ fill: axisColor, fontSize: 11 }}
                />
                <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="votes" stroke="#2563EB" fill="url(#areaVotes)" strokeWidth={2.5} />
              </ReAreaChart>
            ) : (
              <ReBarChart data={chartData} margin={{ top: 16, right: 12, left: 8, bottom: 72 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  angle={-18}
                  textAnchor="end"
                  height={78}
                  interval={0}
                  tickFormatter={truncateTick}
                  stroke={axisColor}
                  tick={{ fill: axisColor, fontSize: 11 }}
                />
                <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </ReBarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {chartData.length > 0 && (
        <div className={`rounded-xl border p-3 ${panelClass}`}>
          <div className={`mb-2 text-xs font-bold ${primaryTextClass}`}>
            لەیبڵی چارت: ناوی لایەن + ژمارەی دەنگ + ڕێژە
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {chartData.map((item) => (
              <div
                key={`chart-label-${item.name}`}
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
  );
};
