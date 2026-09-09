import React, { useState, useMemo, useEffect } from 'react';
import { ElectionRound, SubTab, Party, ChartType, PartyVote } from '../types';
import { DEFAULT_PARTIES } from '../data/defaultParties';
import { formatNumber, formatPercentage, calculateVotePercentage } from '../utils/numberFormat';
import { VoteEntryForm } from './VoteEntryForm';
import { SubTabCharts } from './SubTabCharts';
import { BranchFourMap } from './BranchFourMap';
import { BranchMap } from './BranchMap';
import {
  Building2,
  Filter,
  CheckCircle2,
  Flame,
  Vote,
  Layers,
  ChevronDown,
  Plus,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Table as TableIcon,
  Printer,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Award,
  Map as MapIcon,
  Trash2,
} from 'lucide-react';
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
  Legend,
  LineChart as ReLineChart,
  Line,
  AreaChart as ReAreaChart,
  Area,
} from 'recharts';
import { ChartLegend } from './ChartLegend';

interface BranchFourDashboardProps {
  round: ElectionRound;
  customParties: Party[];
  useKurdishNumerals: boolean;
  theme?: 'dark' | 'light' | 'gray' | 'government';
  onUpdateRound: (updatedRound: ElectionRound) => void;
  onAddCustomParty: (name: string, color: string) => void;
  onOpenPrint?: () => void;
  openSubTabCreatorVersion?: number;
  showBranchFourMap?: boolean;
}

export const BranchFourDashboard: React.FC<BranchFourDashboardProps> = ({
  round,
  customParties,
  useKurdishNumerals,
  theme = 'dark',
  onUpdateRound,
  onAddCustomParty,
  onOpenPrint,
  openSubTabCreatorVersion = 0,
  showBranchFourMap = false,
}) => {
  // Selected committee view: 'all' or subTab ID
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('all');
  const [summaryChartType, setSummaryChartType] = useState<ChartType>('pie');
  const [showAddCommitteeModal, setShowAddCommitteeModal] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState('');

  useEffect(() => {
    if (openSubTabCreatorVersion > 0) {
      setShowAddCommitteeModal(true);
      setNewCommitteeName('');
    }
  }, [openSubTabCreatorVersion]);

  const allAvailableParties = useMemo(() => {
    return [...DEFAULT_PARTIES, ...customParties];
  }, [customParties]);

  // Aggregate stats across all 8 sub-areas / committees of Branch 4
  const aggregateData = useMemo(() => {
    let totalCast = 0;
    let totalBurned = 0;
    let totalValid = 0;

    // Map partyId -> { partyId, partyName, votes, color, textColor }
    const partyMap = new Map<string, { partyId: string; partyName: string; votes: number; color: string; textColor?: string }>();

    // Initialize map with all default and custom parties
    allAvailableParties.forEach((p) => {
      partyMap.set(p.id, {
        partyId: p.id,
        partyName: p.name,
        votes: 0,
        color: p.color,
        textColor: p.textColor,
      });
    });

    round.subTabs.forEach((subTab) => {
      totalCast += Number(subTab.totalCastVotes) || 0;
      totalBurned += Number(subTab.burnedVotes) || 0;
      
      const subTabVotesSum = subTab.partyVotes.reduce((sum, p) => sum + (Number(p.votes) || 0), 0);
      const subTabValid = subTab.autoCalcValidVotes ? subTabVotesSum : (Number(subTab.validVotes) || subTabVotesSum);
      totalValid += subTabValid;

      subTab.partyVotes.forEach((pv) => {
        const existing = partyMap.get(pv.partyId);
        if (existing) {
          existing.votes += Number(pv.votes) || 0;
        } else {
          partyMap.set(pv.partyId, {
            partyId: pv.partyId,
            partyName: pv.partyName,
            votes: Number(pv.votes) || 0,
            color: pv.color,
            textColor: pv.textColor,
          });
        }
      });
    });

    const partyTotals = Array.from(partyMap.values())
      .filter((p) => p.votes > 0 || allAvailableParties.some(ap => ap.id === p.partyId))
      .sort((a, b) => b.votes - a.votes);

    // Leader party in Branch 4
    const leadingParty = partyTotals.length > 0 && partyTotals[0].votes > 0 ? partyTotals[0] : null;

    return {
      totalCast,
      totalBurned,
      totalValid: totalValid > 0 ? totalValid : partyTotals.reduce((s, p) => s + p.votes, 0),
      partyTotals,
      leadingParty,
    };
  }, [round.subTabs, allAvailableParties]);

  // Handle updating a single subTab in round
  const handleUpdateSubTab = (updatedSubTab: SubTab) => {
    const updatedSubTabs = round.subTabs.map((st) =>
      st.id === updatedSubTab.id ? updatedSubTab : st
    );
    onUpdateRound({
      ...round,
      subTabs: updatedSubTabs,
    });
  };

  const handleDeleteCommittee = (subTabId: string, name: string) => {
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی ناوچەی "${name}"؟`)) return;
    const remainingSubTabs = round.subTabs.filter((subTab) => subTab.id !== subTabId);
    onUpdateRound({
      ...round,
      subTabs: remainingSubTabs,
      activeSubTabId: remainingSubTabs[0]?.id || '',
    });
    setSelectedCommitteeId('all');
  };

  // Add new committee
  const handleAddCommitteeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitteeName.trim()) return;

    const newSubTabId = `lqi4-${Date.now()}`;
    const defaultPartyVotes: PartyVote[] = DEFAULT_PARTIES.map((p) => ({
      partyId: p.id,
      partyName: p.name,
      votes: 0,
      color: p.color,
      textColor: p.textColor,
    }));

    const newSubTab: SubTab = {
      id: newSubTabId,
      name: newCommitteeName.trim(),
      totalCastVotes: 0,
      burnedVotes: 0,
      validVotes: 0,
      autoCalcValidVotes: true,
      partyVotes: defaultPartyVotes,
      selectedChartType: 'pie',
    };

    onUpdateRound({
      ...round,
      subTabs: [...round.subTabs, newSubTab],
    });

    setSelectedCommitteeId(newSubTabId);
    setNewCommitteeName('');
    setShowAddCommitteeModal(false);
  };

  // Currently active subTab if specific committee is selected
  const activeSubTab = round.subTabs.find((st) => st.id === selectedCommitteeId);

  // Prepared chart data for overall Branch 4
  const summaryChartData = useMemo(() => {
    const totalValid = aggregateData.totalValid;
    return aggregateData.partyTotals
      .filter((p) => p.votes > 0)
      .map((p) => {
        const pct = calculateVotePercentage(p.votes, totalValid);
        return {
          name: p.partyName,
          votes: p.votes,
          percentage: pct,
          formattedPct: formatPercentage(pct, useKurdishNumerals),
          formattedVotes: formatNumber(p.votes, useKurdishNumerals),
          color: p.color,
          textColor: p.textColor,
        };
      });
  }, [aggregateData, useKurdishNumerals]);

  // Custom Pie Label for aggregated Branch 4 Chart
  const renderAggregatedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name, formattedPct } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 24;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const isRightSide = x > cx;

    if (percent < 0.015) return null;

    const cleanName = name.length > 20 ? `${name.slice(0, 18)}...` : name;

    return (
      <g>
        <text
          x={x}
          y={y}
          textAnchor={isRightSide ? 'start' : 'end'}
          dominantBaseline="central"
          className="text-[11px] sm:text-xs select-none"
        >
          <tspan
            x={x}
            dy="-0.55em"
            fill={theme === 'light' ? '#0F172A' : '#F1F5F9'}
            fontWeight="700"
            style={{ filter: theme === 'light' ? 'none' : 'drop-shadow(0px 1px 3px rgba(0,0,0,0.9))' }}
          >
            {cleanName}
          </tspan>
          <tspan
            x={x}
            dy="1.25em"
            fill="#38BDF8"
            fontWeight="800"
            style={{ filter: theme === 'light' ? 'none' : 'drop-shadow(0px 1px 3px rgba(0,0,0,0.9))' }}
          >
            {formattedPct}
          </tspan>
        </text>
      </g>
    );
  };

  const CustomAggregateTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl backdrop-blur-sm text-right text-xs">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="font-bold text-slate-100">{data.name}</span>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
          </div>
          <p className="text-slate-300">
            دەنگەکانی لقی چوار: <strong className="text-white font-mono">{data.formattedVotes}</strong> دەنگ
          </p>
          <p className="text-blue-400 font-bold">
            ڕێژەی دەنگ: <strong className="font-mono">{data.formattedPct}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      
      {/* Header Banner for Branch 4 */}
      <div className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all ${
        theme === 'light'
          ? 'bg-gradient-to-r from-blue-50 via-white to-indigo-50 border-blue-200 text-slate-900'
          : theme === 'gray'
          ? 'bg-gradient-to-r from-slate-800 via-slate-800/80 to-slate-800 border-slate-700 text-white'
          : 'bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-blue-500/30 text-white'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {round.title} — شیکاری ناوچەکان و دەنگدانی گشتی
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 text-[11px] font-bold">
                  تایبەت
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                پێکهاتووە لە {round.subTabs.length} ناوچە
              </p>
            </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-center">
            {onOpenPrint && (
              <button
                onClick={onOpenPrint}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>چاپکردنی ڕاپۆرت</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Statistical Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Valid Votes (دەنگی دروستی تەواو) */}
        <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : theme === 'gray'
            ? 'bg-slate-800/90 border-slate-700'
            : 'bg-slate-900/90 border-slate-800/90'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold">کۆی دەنگی دروستی لقی چوار</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-500 font-mono">
            {formatNumber(aggregateData.totalValid, useKurdishNumerals)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">کۆی پوختەی سەرجەم ٨ ناوچەکە</p>
        </div>

        {/* Total Voters / Cast (کۆی گشتی دەنگدەر) */}
        <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : theme === 'gray'
            ? 'bg-slate-800/90 border-slate-700'
            : 'bg-slate-900/90 border-slate-800/90'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold">کۆی گشتی دەنگدەر</span>
            <Vote className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-500 font-mono">
            {formatNumber(aggregateData.totalCast || aggregateData.totalValid + aggregateData.totalBurned, useKurdishNumerals)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">سەرجەم بەشداربووان لە لقی چوار</p>
        </div>

        {/* Burned Votes (دەنگی سوتاو) */}
        <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : theme === 'gray'
            ? 'bg-slate-800/90 border-slate-700'
            : 'bg-slate-900/90 border-slate-800/90'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold">کۆی دەنگی سوتاو</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-500 font-mono">
            {formatNumber(aggregateData.totalBurned, useKurdishNumerals)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">دەنگە پوچەڵ و سوتاوەکان</p>
        </div>

        {/* Top Leading Party in Branch 4 */}
        <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : theme === 'gray'
            ? 'bg-slate-800/90 border-slate-700'
            : 'bg-slate-900/90 border-slate-800/90'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-bold">پارتی پێشەنگ لە لقی چوار</span>
            <Award className="w-4 h-4 text-yellow-500" />
          </div>
          {aggregateData.leadingParty ? (
            <div>
              <div className={`text-base sm:text-lg font-black truncate flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: aggregateData.leadingParty.color }} />
                <span className="truncate">{aggregateData.leadingParty.partyName}</span>
              </div>
              <div className="text-xs font-bold text-blue-500 font-mono mt-0.5">
                {formatNumber(aggregateData.leadingParty.votes, useKurdishNumerals)} دەنگ (
                {formatPercentage(calculateVotePercentage(aggregateData.leadingParty.votes, aggregateData.totalValid), useKurdishNumerals)})
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic mt-1">هیچ دەنگێک داغڵ نەکراوە</div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🗺️ INTERACTIVE VECTOR MAP OF BRANCH 4 (8 AREAS)                          */}
      {/* ========================================================================= */}
      {showBranchFourMap ? (
        <BranchFourMap
          round={round}
          selectedCommitteeId={selectedCommitteeId}
          onSelectCommittee={(id) => setSelectedCommitteeId(id)}
          useKurdishNumerals={useKurdishNumerals}
          theme={theme}
        />
      ) : (
        <BranchMap
          branchName={round.title}
          subTabs={round.subTabs}
          theme={theme}
          activeSubTabId={selectedCommitteeId}
          onSelectSubTab={setSelectedCommitteeId}
        />
      )}

      {/* ========================================================================= */}
      {/* COMBOBOX FILTER & COMMITTEE SELECTOR BAR                                 */}
      {/* ========================================================================= */}
      <div className={`border rounded-xl p-4 shadow-md transition-all ${
        theme === 'light'
          ? 'bg-white border-slate-200'
          : theme === 'gray'
          ? 'bg-slate-800 border-slate-700'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Combobox label & Dropdown */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className={`flex items-center gap-2 text-xs font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              <Filter className="w-4 h-4 text-blue-500" />
              <span>فلتەری لیژنە ناوچەکان (کۆمبۆ بۆکس):</span>
            </div>

            {/* The Main Combobox */}
            <div className="relative min-w-[280px] sm:min-w-[340px]">
              <select
                value={selectedCommitteeId}
                onChange={(e) => setSelectedCommitteeId(e.target.value)}
                className={`w-full appearance-none text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border focus:outline-none transition-all cursor-pointer shadow-inner pr-10 ${
                  theme === 'light'
                    ? 'bg-slate-50 hover:bg-white text-slate-900 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-slate-950 hover:bg-slate-900 text-white border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              >
                <option value="all" className="bg-slate-900 text-amber-400 font-black py-1">
                  🌐 کۆی گشتی سنووری لقی چوار (سەرجەم ٨ ناوچەکە)
                </option>
                <optgroup label="٨ لیژنە ناوچەکەی سنووری لقی چوار" className="bg-slate-900 text-slate-300 font-semibold">
                  {round.subTabs.map((st) => (
                    <option key={st.id} value={st.id} className="bg-slate-900 text-slate-100 py-1">
                      📍 {st.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Buttons List for instant click & Add Committee */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCommitteeId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCommitteeId === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : theme === 'light'
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              کۆی گشتی
            </button>
            {round.subTabs.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedCommitteeId(st.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCommitteeId === st.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : theme === 'light'
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {st.name}
              </button>
            ))}
            <button
              onClick={() => setShowAddCommitteeModal(true)}
              className="p-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="زیادکردنی ناوچەی نوێ بۆ لقی چوار"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: WHEN A SPECIFIC COMMITTEE IS SELECTED IN COMBOBOX                 */}
      {/* ========================================================================= */}
      {selectedCommitteeId !== 'all' && activeSubTab && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className={`flex items-center justify-between border rounded-xl px-4 py-2.5 ${
            theme === 'light'
              ? 'bg-blue-50 border-blue-200 text-slate-900'
              : 'bg-blue-950/30 border-blue-900/50 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span className="text-sm font-bold">
                داغڵکردنی داتای دەنگەکان بۆ: <strong className="text-blue-500">{activeSubTab.name}</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedCommitteeId('all')}
              className="text-xs text-slate-400 hover:text-amber-500 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              <span>گەڕانەوە بۆ کۆی گشتی لقی چوار</span>
              <ArrowLeft className="w-3 h-3" />
            </button>
            {activeSubTab.id.startsWith('lqi4-') && !activeSubTab.id.includes('nawcha-') && (
              <button
                type="button"
                onClick={() => handleDeleteCommittee(activeSubTab.id, activeSubTab.name)}
                className="p-1.5 text-rose-300 hover:bg-rose-500/15 rounded-lg transition-colors"
                title="سڕینەوەی لق"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Vote Entry Form */}
            <div className="lg:col-span-6 space-y-4">
              <VoteEntryForm
                subTab={activeSubTab}
                customParties={customParties}
                useKurdishNumerals={useKurdishNumerals}
                onUpdateSubTab={handleUpdateSubTab}
                onAddCustomParty={onAddCustomParty}
              />
            </div>

            {/* Right Column: SubTab Charts */}
            <div className="lg:col-span-6 space-y-4 sticky top-20">
              <SubTabCharts
                subTab={activeSubTab}
                useKurdishNumerals={useKurdishNumerals}
                onSelectChartType={(type: ChartType) =>
                  handleUpdateSubTab({ ...activeSubTab, selectedChartType: type })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: WHEN "ALL COMMITTEES" (OVERALL BRANCH 4) IS SELECTED             */}
      {/* ========================================================================= */}
      {selectedCommitteeId === 'all' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Main Chart Section for Overall Branch 4 */}
          <div className={`border rounded-2xl p-5 shadow-lg space-y-4 ${
            theme === 'light'
              ? 'bg-white border-slate-200'
              : theme === 'gray'
              ? 'bg-slate-800 border-slate-700'
              : 'bg-slate-900 border-slate-800'
          }`}>
            
            {/* Chart Type Selector Header */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div>
                <h3 className={`text-base font-black flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <PieChartIcon className="w-4 h-4 text-blue-500" />
                  <span>پای چارت و هێڵکاری ئەنجامی دەنگەکانی سەرجەم ٨ ناوچەکەی لقی چوار</span>
                </h3>
                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  کۆی دەنگەکانی هەموو لیژنە ناوچەکان بە شێوەی خۆکارانە کۆکراوەتەوە
                </p>
              </div>

              {/* Chart Type Buttons */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <button
                  onClick={() => setSummaryChartType('pie')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    summaryChartType === 'pie'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  پای چارت
                </button>
                <button
                  onClick={() => setSummaryChartType('donut')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    summaryChartType === 'donut'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  دۆنەت
                </button>
                <button
                  onClick={() => setSummaryChartType('bar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    summaryChartType === 'bar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ستوونی
                </button>
                <button
                  onClick={() => setSummaryChartType('line')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    summaryChartType === 'line'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  هێڵی
                </button>
                <button
                  onClick={() => setSummaryChartType('area')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    summaryChartType === 'area'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ڕووبەر
                </button>
              </div>
            </div>

            {/* Dynamic Master Chart Container */}
            <div className="w-full h-[460px] sm:h-[520px] relative pt-2">
              {summaryChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm space-y-2">
                  <PieChartIcon className="w-12 h-12 stroke-[1.5] text-slate-600" />
                  <p>هیچ دەنگێک بۆ لقی چوار تۆمار نەکراوە.</p>
                  <p className="text-xs text-slate-400">
                    لەسەر نەخشەکە یان لە کۆمبۆ بۆکسەکەی سەرەوە ناوچەیەک هەڵبژێرە بۆ داغڵکردنی دەنگەکان.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    if (summaryChartType === 'pie' || summaryChartType === 'donut') {
                      return (
                        <RePieChart margin={{ top: 20, right: 80, left: 80, bottom: 40 }}>
                          <Tooltip content={<CustomAggregateTooltip />} />
                          <Pie
                            data={summaryChartData}
                            dataKey="votes"
                            nameKey="name"
                            cx="50%"
                            cy="46%"
                            innerRadius={summaryChartType === 'donut' ? 70 : 0}
                            outerRadius={135}
                            paddingAngle={summaryChartType === 'donut' ? 3 : 2}
                            label={renderAggregatedLabel}
                            labelLine={{ stroke: '#64748B', strokeWidth: 1.5 }}
                          >
                            {summaryChartData.map((entry, index) => (
                              <Cell
                                key={`branch-cell-${index}`}
                                fill={entry.color}
                                stroke="#0F172A"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Legend
                            verticalAlign="bottom"
                            height={100}
                            content={<ChartLegend />}
                            formatter={(value) => {
                              const item = summaryChartData.find((p) => p.name === value);
                              return (
                                <span className={`text-[11px] sm:text-xs px-1 font-medium inline-flex items-center gap-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                                  <span>{value}</span>
                                  {item && (
                                    <span className="text-blue-500 font-mono font-bold text-[10px]">
                                      ({item.formattedPct})
                                    </span>
                                  )}
                                </span>
                              );
                            }}
                          />
                        </RePieChart>
                      );
                    }

                    if (summaryChartType === 'bar') {
                      return (
                        <ReBarChart data={summaryChartData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#E2E8F0' : '#334155'} />
                          <XAxis
                            dataKey="name"
                            stroke="#94A3B8"
                            tick={({ x, y, payload }: any) => {
                              const labelText = payload.value.length > 20 ? `${payload.value.slice(0, 18)}...` : payload.value;
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text
                                    x={0}
                                    y={0}
                                    dy={14}
                                    textAnchor="end"
                                    fill={theme === 'light' ? '#334155' : '#CBD5E1'}
                                    fontSize={11}
                                    fontWeight={600}
                                    transform="rotate(-35)"
                                  >
                                    {labelText}
                                  </text>
                                </g>
                              );
                            }}
                            interval={0}
                          />
                          <YAxis stroke="#94A3B8" tick={{ fill: theme === 'light' ? '#334155' : '#CBD5E1', fontSize: 11 }} />
                          <Tooltip content={<CustomAggregateTooltip />} />
                          <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                            {summaryChartData.map((entry, index) => (
                              <Cell key={`bar-cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      );
                    }

                    if (summaryChartType === 'line') {
                      return (
                        <ReLineChart data={summaryChartData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#E2E8F0' : '#334155'} />
                          <XAxis
                            dataKey="name"
                            stroke="#94A3B8"
                            tick={({ x, y, payload }: any) => {
                              const labelText = payload.value.length > 20 ? `${payload.value.slice(0, 18)}...` : payload.value;
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text
                                    x={0}
                                    y={0}
                                    dy={14}
                                    textAnchor="end"
                                    fill={theme === 'light' ? '#334155' : '#CBD5E1'}
                                    fontSize={11}
                                    fontWeight={600}
                                    transform="rotate(-35)"
                                  >
                                    {labelText}
                                  </text>
                                </g>
                              );
                            }}
                            interval={0}
                          />
                          <YAxis stroke="#94A3B8" tick={{ fill: theme === 'light' ? '#334155' : '#CBD5E1', fontSize: 11 }} />
                          <Tooltip content={<CustomAggregateTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="votes"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: '#60A5FA', r: 5 }}
                            activeDot={{ r: 8 }}
                          />
                        </ReLineChart>
                      );
                    }

                    // Area Chart
                    return (
                      <ReAreaChart data={summaryChartData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
                        <defs>
                          <linearGradient id="lqi4AreaColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#E2E8F0' : '#334155'} />
                        <XAxis
                          dataKey="name"
                          stroke="#94A3B8"
                          tick={({ x, y, payload }: any) => {
                            const labelText = payload.value.length > 20 ? `${payload.value.slice(0, 18)}...` : payload.value;
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <text
                                  x={0}
                                  y={0}
                                  dy={14}
                                  textAnchor="end"
                                  fill={theme === 'light' ? '#334155' : '#CBD5E1'}
                                  fontSize={11}
                                  fontWeight={600}
                                  transform="rotate(-35)"
                                >
                                  {labelText}
                                </text>
                              </g>
                            );
                          }}
                          interval={0}
                        />
                        <YAxis stroke="#94A3B8" tick={{ fill: theme === 'light' ? '#334155' : '#CBD5E1', fontSize: 11 }} />
                        <Tooltip content={<CustomAggregateTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="votes"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#lqi4AreaColor)"
                        />
                      </ReAreaChart>
                    );
                  })()}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COMPARISON MATRIX TABLE OF ALL 8 COMMITTEES                              */}
          {/* ========================================================================= */}
          <div className={`border rounded-2xl p-5 shadow-lg space-y-4 ${
            theme === 'light'
              ? 'bg-white border-slate-200'
              : theme === 'gray'
              ? 'bg-slate-800 border-slate-700'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className={`text-base font-black flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <TableIcon className="w-4 h-4 text-emerald-500" />
                  <span>خشتەی دەنگەکانی سەرجەم لایەنەکان بەپێی ٨ ناوچەکەی لقی چوار</span>
                </h3>
                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  بەراوردی دەنگی هەموو لایەنەکان لە نێوان ناوچەی ١، ٢، ٣، ٤، سەرچنار، شارباژێر، بەکرەجۆ، و ماوەت
                </p>
              </div>
            </div>

            <div className={`overflow-x-auto rounded-xl border scrollbar-thin ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className={`font-bold border-b ${
                    theme === 'light'
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3">ناوی لایەن</th>
                    {round.subTabs.map((st) => (
                      <th key={st.id} className="py-3 px-2 text-center min-w-[90px]">
                        <div className="font-bold">{st.name}</div>
                        <button
                          onClick={() => setSelectedCommitteeId(st.id)}
                          className="text-[10px] text-blue-500 hover:underline mt-0.5 font-normal block mx-auto cursor-pointer"
                        >
                          (داغڵکردن ✏️)
                        </button>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center bg-blue-950/40 text-blue-400 font-black min-w-[100px]">
                      کۆی دەنگی لقی چوار
                    </th>
                    <th className="py-3 px-3 text-center bg-blue-950/40 text-blue-400 font-black min-w-[80px]">
                      ڕێژەی سەدی
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-sans ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                  {aggregateData.partyTotals.map((party, idx) => {
                    const percentage = calculateVotePercentage(party.votes, aggregateData.totalValid);
                    return (
                      <tr
                        key={party.partyId}
                        className={`transition-colors ${
                          theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {formatNumber(idx + 1, useKurdishNumerals)}
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: party.color }}
                            />
                            <span>{party.partyName}</span>
                          </div>
                        </td>
                        {round.subTabs.map((st) => {
                          const pv = st.partyVotes.find((p) => p.partyId === party.partyId);
                          const votesInCommittee = pv?.votes || 0;
                          return (
                            <td key={st.id} className="py-2.5 px-2 text-center font-mono">
                              {votesInCommittee > 0 ? (
                                formatNumber(votesInCommittee, useKurdishNumerals)
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-500 bg-blue-950/20">
                          {formatNumber(party.votes, useKurdishNumerals)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-500 bg-blue-950/20">
                          {formatPercentage(percentage, useKurdishNumerals)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`font-black border-t-2 ${
                    theme === 'light'
                      ? 'bg-slate-100 text-slate-900 border-slate-300'
                      : 'bg-slate-950 text-slate-200 border-slate-700'
                  }`}>
                    <td colSpan={2} className="py-3 px-3 text-amber-500 font-black">
                      کۆی دەنگی دروست (Valid Votes)
                    </td>
                    {round.subTabs.map((st) => {
                      const committeeSum = st.partyVotes.reduce((sum, p) => sum + (Number(p.votes) || 0), 0);
                      return (
                        <td key={st.id} className="py-3 px-2 text-center font-mono">
                          {formatNumber(committeeSum, useKurdishNumerals)}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center font-mono text-emerald-500 bg-blue-950/60 font-black">
                      {formatNumber(aggregateData.totalValid, useKurdishNumerals)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-blue-400 bg-blue-950/60 font-black">
                      %١٠٠
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Modal to Add New Committee to Branch 4 */}
      {showAddCommitteeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>زیادکردنی ناوچەی نوێ بۆ {round.title}</span>
            </h3>
            <form onSubmit={handleAddCommitteeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ناوی ناوچە:
                </label>
                <input
                  type="text"
                  placeholder="نموونە: ناوچەی تاسڵوجە"
                  value={newCommitteeName}
                  onChange={(e) => setNewCommitteeName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCommitteeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={!newCommitteeName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
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
