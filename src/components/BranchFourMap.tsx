import React, { useState, useMemo } from 'react';
import { SubTab, ElectionRound } from '../types';
import { formatNumber, formatPercentage, calculateVotePercentage } from '../utils/numberFormat';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Map as MapIcon,
  Award,
  Vote,
  Palette,
  Maximize2,
  Minimize2,
  Sliders,
  Compass,
} from 'lucide-react';

interface BranchFourMapProps {
  round: ElectionRound;
  selectedCommitteeId: string;
  onSelectCommittee: (id: string) => void;
  useKurdishNumerals: boolean;
  theme?: 'dark' | 'light' | 'gray' | 'government';
}

interface AreaMapConfig {
  id: string;
  name: string;
  shortName: string;
  centerName: string;
  category: 'city' | 'district' | 'subdistrict';
  // Precise SVG polygon paths matching Sulaymaniyah administrative geography
  path: string;
  labelX: number;
  labelY: number;
  pinX: number;
  pinY: number;
  areaKmApprox: string;
  description: string;
  colorScheme: {
    name: string;
    primary: string;
    stroke: string;
    atlasColor: string;
    badgeBg: string;
    badgeText: string;
  };
}

// 8 Administrative areas of Sulaymaniyah Branch 4 (لقی چوار) with geographical alignment
const BRANCH_FOUR_AREAS: AreaMapConfig[] = [
  {
    id: 'lqi4-mawat',
    name: 'ناوچەی ماوەت',
    shortName: 'ناوچەی ماوەت',
    centerName: 'سەنتەری ماوەت',
    category: 'district',
    // Northern mountainous district (Mawat, Qala Chwalan basin, Galala)
    path: 'M 290,140 C 340,120 410,105 490,110 C 530,130 555,160 550,195 C 520,225 470,235 410,230 C 350,225 310,210 270,185 C 265,160 275,145 290,140 Z',
    labelX: 420,
    labelY: 170,
    pinX: 430,
    pinY: 165,
    areaKmApprox: 'ناوچەی ماوەت و باکوور',
    description: 'ناوچەی ماوەت: دۆڵی قەڵاچوالان، چیای گەمۆ و گوندە شاخاوییەکانی باکوور',
    colorScheme: {
      name: 'مۆر / مەجێنتا',
      primary: '#C026D3',
      stroke: '#A21CAF',
      atlasColor: '#88C0D0',
      badgeBg: 'bg-fuchsia-500/15 border-fuchsia-400/30',
      badgeText: 'text-fuchsia-500 dark:text-fuchsia-300',
    },
  },
  {
    id: 'lqi4-sharbažer',
    name: 'ناوچەی شارباژێر',
    shortName: 'ناوچەی شارباژێر',
    centerName: 'چوارتا',
    category: 'district',
    // North-East & East (Chwarta, Sitak, Zalan, Gapilon, Siwayl, Basne)
    path: 'M 490,110 C 570,115 640,130 700,165 C 725,220 715,275 680,325 C 625,345 570,340 530,320 C 500,285 490,245 470,205 C 510,185 520,170 490,110 Z',
    labelX: 605,
    labelY: 220,
    pinX: 580,
    pinY: 215,
    areaKmApprox: 'ناوچەی شارباژێر و ڕۆژهەڵات',
    description: 'ناوچەی شارباژێر: چوارتا، سیتەک، زەلان، گاپیلۆن، باسنێ و بناری چیای ئەزمەڕ',
    colorScheme: {
      name: 'نیلی / ئیندیگۆ',
      primary: '#4F46E5',
      stroke: '#3730A3',
      atlasColor: '#81A1C1',
      badgeBg: 'bg-indigo-500/15 border-indigo-400/30',
      badgeText: 'text-indigo-500 dark:text-indigo-300',
    },
  },
  {
    id: 'lqi4-bakrajo',
    name: 'ناوچەی بەکرەجۆ',
    shortName: 'ناوچەی بەکرەجۆ',
    centerName: 'بەکرەجۆ',
    category: 'subdistrict',
    // West & South-West (Bakrajo, Tasluja, Aziz Awa, Khalifawa, Awal)
    path: 'M 140,260 C 190,200 245,175 290,175 C 330,200 360,225 375,260 C 335,280 310,310 290,360 C 265,425 215,480 180,485 C 145,450 130,355 140,260 Z',
    labelX: 235,
    labelY: 315,
    pinX: 275,
    pinY: 295,
    areaKmApprox: 'ناوچەی بەکرەجۆ: عەزیز ئاوا، خەلیفاوا، عەواڵ',
    description: 'ناوچەی بەکرەجۆ: عەزیز ئاوا، خەلیفاوا، کۆستەی چەم، عەواڵ، تاسڵوجە و دەشتی بەکرەجۆ',
    colorScheme: {
      name: 'پڕتەقاڵی گەرم',
      primary: '#EA580C',
      stroke: '#C2410C',
      atlasColor: '#8FBCBB',
      badgeBg: 'bg-orange-500/15 border-orange-400/30',
      badgeText: 'text-orange-500 dark:text-orange-300',
    },
  },
  {
    id: 'lqi4-sarchinar',
    name: 'ناوچەی سەرچنار',
    shortName: 'سەرچنار',
    centerName: 'سەرچنار',
    category: 'city',
    // West / North-West City (Sarchinar resort, University, Malik Mahmud West)
    path: 'M 310,305 C 345,280 375,270 405,265 C 420,295 425,330 415,350 C 380,365 350,370 325,360 C 310,345 305,325 310,305 Z',
    labelX: 362,
    labelY: 315,
    pinX: 360,
    pinY: 300,
    areaKmApprox: 'سەرچنار و ڕۆژئاوای شار',
    description: 'هاوینەهەواری سەرچنار، شەقامی سەرەکی سەرچنار، کۆمەڵگای زانکۆ و گەڕەکەکانی ڕۆژئاوا',
    colorScheme: {
      name: 'سەوزی زمڕووتی',
      primary: '#059669',
      stroke: '#047857',
      atlasColor: '#A3BE8C',
      badgeBg: 'bg-emerald-500/15 border-emerald-400/30',
      badgeText: 'text-emerald-500 dark:text-emerald-300',
    },
  },
  {
    id: 'lqi4-nawcha-1',
    name: 'ناوچەی یەک',
    shortName: 'ناوچەی ١ (باکوور و ناوەند)',
    centerName: 'ئازادی و ناوەند',
    category: 'city',
    // North-Central core of Sulaymaniyah City (Azadi, Malkandi, Toy Malik, Ali Naji, Chwarbax, 60m north)
    path: 'M 290,175 C 350,210 400,215 460,220 C 510,225 540,225 540,225 C 555,265 565,305 540,315 C 505,330 470,340 420,355 C 425,300 410,265 375,260 C 360,225 330,200 290,175 Z',
    labelX: 450,
    labelY: 275,
    pinX: 455,
    pinY: 250,
    areaKmApprox: 'باکوور و ناوەندی شاری سلێمانی',
    description: 'ناوەندی شار: گەڕەکەکانی ئازادی، مەڵکەندی، تووی مەلیک، عەلی ناجی، چوارباخ و باکووری شار',
    colorScheme: {
      name: 'شینی شاهانە',
      primary: '#2563EB',
      stroke: '#1D4ED8',
      atlasColor: '#5E81AC',
      badgeBg: 'bg-blue-500/15 border-blue-400/30',
      badgeText: 'text-blue-500 dark:text-blue-300',
    },
  },
  {
    id: 'lqi4-nawcha-2',
    name: 'ناوچەی دوو',
    shortName: 'ناوچەی ٢ (ڕۆژهەڵات و گۆیژە)',
    centerName: 'سەهۆڵەکە و مەولەوی',
    category: 'city',
    // Eastern sector (Goyzha foothills, Sabunkaran, Saholaka, Mawlawi, Kawa street)
    path: 'M 540,315 C 565,305 600,335 600,335 C 595,375 580,415 565,425 C 530,412 505,390 495,358 C 512,342 528,328 540,315 Z',
    labelX: 550,
    labelY: 365,
    pinX: 545,
    pinY: 345,
    areaKmApprox: 'ڕۆژهەڵات، گۆیژە و ناوبازاڕ',
    description: 'ناوەندی شار: بناری گۆیژە، سابونکەران، سەهۆڵەکە، ناوبازاڕ، شەقامی مەولەوی و کاوە',
    colorScheme: {
      name: 'مۆری بنەوشەیی',
      primary: '#9333EA',
      stroke: '#7E22CE',
      atlasColor: '#B48EAD',
      badgeBg: 'bg-purple-500/15 border-purple-400/30',
      badgeText: 'text-purple-500 dark:text-purple-300',
    },
  },
  {
    id: 'lqi4-nawcha-3',
    name: 'ناوچەی سێ',
    shortName: 'ناوچەی ٣ (باشوور)',
    centerName: 'ئیبراهیم ئەحمەد',
    category: 'city',
    // South & South-East (Ibrahim Ahmad, Kani Ba, Rzgari, Kurdsat, Sharawani)
    path: 'M 495,358 C 505,390 530,412 565,425 C 550,465 510,505 445,500 C 430,465 425,415 435,370 C 460,360 482,360 495,358 Z',
    labelX: 495,
    labelY: 435,
    pinX: 485,
    pinY: 415,
    areaKmApprox: 'باشوور و باشووری ڕۆژهەڵات',
    description: 'ناوەندی شار: ئیبراهیم ئەحمەد، ڕزگاری، کانی با، کوردسات، شارەوانی و باشووری شار',
    colorScheme: {
      name: 'شینباوی دەریایی (Teal)',
      primary: '#0D9488',
      stroke: '#0F766E',
      atlasColor: '#88C0D0',
      badgeBg: 'bg-teal-500/15 border-teal-400/30',
      badgeText: 'text-teal-500 dark:text-teal-300',
    },
  },
  {
    id: 'lqi4-nawcha-4',
    name: 'ناوچەی چوار',
    shortName: 'ناوچەی ٤ (باشووری ڕۆژئاوا)',
    centerName: 'زەرگەتە و بەختیاری',
    category: 'city',
    // South-West City (Zargata, Bakhtiari, Kwestan, Qalawa, West exit)
    path: 'M 325,360 C 350,370 380,365 420,355 C 425,370 420,415 445,500 C 375,505 295,475 260,410 C 285,370 305,360 325,360 Z',
    labelX: 350,
    labelY: 430,
    pinX: 345,
    pinY: 410,
    areaKmApprox: 'باشووری ڕۆژئاوا، زەرگەتە و بەختیاری',
    description: 'ناوەندی شار: زەرگەتە، بەختیاری، قەلاوە، کوێستان و باشووری ڕۆژئاوا',
    colorScheme: {
      name: 'سووری یاقووتی / ڕۆز',
      primary: '#E11D48',
      stroke: '#BE123C',
      atlasColor: '#D08770',
      badgeBg: 'bg-rose-500/15 border-rose-400/30',
      badgeText: 'text-rose-500 dark:text-rose-300',
    },
  },
];

export const BranchFourMap: React.FC<BranchFourMapProps> = ({
  round,
  selectedCommitteeId,
  onSelectCommittee,
  useKurdishNumerals,
  theme = 'dark',
}) => {
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapColorMode, setMapColorMode] = useState<'atlas' | 'distinct' | 'election'>('atlas');
  const [showCenters, setShowCenters] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Compute stats per subTab
  const areaStatsMap = useMemo(() => {
    const map = new Map<string, {
      subTab?: SubTab;
      totalValid: number;
      totalBurned: number;
      totalCast: number;
      leadingParty?: { name: string; votes: number; color: string; percentage: number };
    }>();

    BRANCH_FOUR_AREAS.forEach((area) => {
      const subTab = round.subTabs.find(
        (st) => st.id === area.id || st.name === area.name || st.name.includes(area.shortName)
      );

      if (subTab) {
        const totalBurned = Number(subTab.burnedVotes) || 0;
        const validSum = subTab.partyVotes.reduce((sum, p) => sum + (Number(p.votes) || 0), 0);
        const totalValid = subTab.autoCalcValidVotes ? validSum : (Number(subTab.validVotes) || validSum);
        const totalCast = totalValid + totalBurned;

        const sortedParties = [...subTab.partyVotes].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        let leadingParty: { name: string; votes: number; color: string; percentage: number } | undefined = undefined;

        if (sortedParties.length > 0 && (sortedParties[0].votes || 0) > 0) {
          const top = sortedParties[0];
          const pct = calculateVotePercentage(top.votes, totalValid);
          leadingParty = {
            name: top.partyName,
            votes: top.votes,
            color: top.color,
            percentage: pct,
          };
        }

        map.set(area.id, {
          subTab,
          totalValid,
          totalBurned,
          totalCast,
          leadingParty,
        });
      }
    });

    return map;
  }, [round.subTabs]);

  const activeAreaConfig = BRANCH_FOUR_AREAS.find((a) => a.id === selectedCommitteeId);
  const hoveredAreaConfig = BRANCH_FOUR_AREAS.find((a) => a.id === hoveredAreaId);
  const displayAreaConfig = hoveredAreaConfig || activeAreaConfig;
  const displayStats = displayAreaConfig ? areaStatsMap.get(displayAreaConfig.id) : null;

  // Theme-aware styles
  const isLight = theme === 'light';
  const isGray = theme === 'gray';

  // Atlas background parchment colors matching the official map
  const atlasParchment = isLight ? '#FAF5EB' : isGray ? '#1E293B' : '#0F172A';
  const atlasFrameColor = isLight ? '#2A1F18' : isGray ? '#475569' : '#334155';
  const atlasBorderColor = isLight ? '#8B4513' : isGray ? '#64748B' : '#475569';
  const atlasWaterColor = isLight ? '#8CB3C2' : isGray ? '#0F766E' : '#134E4A';
  const atlasLandColor = isLight ? '#7FA8B8' : isGray ? '#334155' : '#1E293B';

  return (
    <div
      id="branch-four-map-container"
      className={`rounded-2xl p-4 sm:p-6 border transition-all duration-300 shadow-2xl relative overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none p-4 overflow-y-auto' : ''
      } ${
        isLight
          ? 'bg-[#FCF9F2] border-amber-900/20 text-slate-900 shadow-amber-900/10'
          : isGray
          ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-slate-950/40'
          : 'bg-[#0B101E] border-slate-800 text-white shadow-black/70'
      }`}
    >
      {/* Top Map Control Bar */}
      <div
        className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-4 mb-4 ${
          isLight ? 'border-amber-900/15' : isGray ? 'border-slate-700' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border shadow-sm flex items-center justify-center shrink-0 ${
              isLight
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : isGray
                ? 'bg-slate-700 border-slate-600 text-amber-400'
                : 'bg-amber-600/20 border-amber-500/40 text-amber-400 shadow-inner'
            }`}
          >
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black flex flex-wrap items-center gap-2">
              <span>نەخشەی کارگێڕی سنووری لقی چوار - پارێزگای سلێمانی</span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                  isLight
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                شێوازی فەرمی کارگێڕی (KRSO Style)
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-amber-900/70' : 'text-slate-400'}`}>
              بەپێی نەخشەی فەرمی کارگێڕی بە هەموو سنووری ٨ ناوچەکەی لقی چوار
            </p>
          </div>
        </div>

        {/* View Style Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* Map Palette Mode */}
          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isLight
                ? 'bg-amber-100/60 border-amber-300/80'
                : isGray
                ? 'bg-slate-900 border-slate-700'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={() => setMapColorMode('atlas')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mapColorMode === 'atlas'
                  ? isLight
                    ? 'bg-white text-amber-950 shadow-sm'
                    : 'bg-amber-600 text-white shadow-sm'
                  : isLight
                  ? 'text-amber-900 hover:text-amber-950'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="شێوازی نەخشەی فەرمی کارگێڕی هاوشێوەی نەخشەی فەرمی"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>نەخشەی فەرمی</span>
            </button>

            <button
              onClick={() => setMapColorMode('distinct')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mapColorMode === 'distinct'
                  ? isLight
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'bg-indigo-600 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ڕەنگی جیاواز و دیار بۆ هەر ٨ ناوچەکە"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>٨ ڕەنگی جیاواز</span>
            </button>

            <button
              onClick={() => setMapColorMode('election')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mapColorMode === 'election'
                  ? isLight
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ڕەنگکردنی ناوچەکان بەپێی لایەنی سەرکەوتوو"
            >
              <Vote className="w-3.5 h-3.5" />
              <span>ڕەنگی دەنگەکان</span>
            </button>
          </div>

          {/* Select All */}
          <button
            onClick={() => onSelectCommittee('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedCommitteeId === 'all'
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-700 shadow-md'
                : isLight
                ? 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                : isGray
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>کۆی گشتی</span>
          </button>

          {/* Zoom Controls & Reset & Fullscreen */}
          <div
            className={`flex items-center gap-1 border rounded-lg p-0.5 ${
              isLight
                ? 'bg-amber-100/60 border-amber-300/80'
                : isGray
                ? 'bg-slate-900 border-slate-700'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.45))}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isLight ? 'hover:bg-amber-200 text-amber-950' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="گەورەکردن (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isLight ? 'hover:bg-amber-200 text-amber-950' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="بچووککردن (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isLight ? 'hover:bg-amber-200 text-amber-950' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="باری سەرەتا (Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isLight ? 'hover:bg-amber-200 text-amber-950' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isFullscreen ? 'بچووککردنەوە' : 'پڕ بەستەری شاشە (Fullscreen)'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: SVG Administrative Map (Col 8) + Area Stats & Legend (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* SVG Administrative Map Container (Col 8) */}
        <div
          className={`lg:col-span-8 relative flex flex-col items-center justify-center min-h-[520px] sm:min-h-[580px] rounded-2xl border-2 p-2 sm:p-4 overflow-hidden shadow-xl transition-all ${
            isLight
              ? 'bg-[#FAF5EB] border-amber-900/30'
              : isGray
              ? 'bg-[#1E293B] border-slate-700'
              : 'bg-[#080E1A] border-slate-800'
          }`}
        >
          {/* Outer Cartographic Double Border (matching the uploaded image) */}
          <div
            className="absolute inset-2 sm:inset-3 border-2 pointer-events-none rounded-xl"
            style={{ borderColor: isLight ? '#2B1A09' : '#475569' }}
          >
            <div
              className="absolute inset-1 border pointer-events-none"
              style={{ borderColor: isLight ? '#8B5A2B' : '#334155' }}
            />
          </div>

          {/* SVG Map Canvas */}
          <svg
            viewBox="0 0 920 620"
            className="w-full h-full max-h-[590px] select-none transition-transform duration-300 ease-out z-10"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <defs>
              {/* Outer Glow filter for active area selection */}
              <filter id="adminGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Live Signal Beacon Glow filter */}
              <filter id="livePinGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Area fills */}
              {BRANCH_FOUR_AREAS.map((area) => (
                <linearGradient
                  key={`admin-grad-${area.id}`}
                  id={`admin-grad-${area.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      mapColorMode === 'atlas'
                        ? isLight ? '#A0C6D4' : '#38586E'
                        : area.colorScheme.primary
                    }
                    stopOpacity={mapColorMode === 'atlas' ? 0.9 : 0.85}
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      mapColorMode === 'atlas'
                        ? isLight ? '#7FA8B8' : '#233948'
                        : area.colorScheme.primary
                    }
                    stopOpacity={mapColorMode === 'atlas' ? 0.95 : 0.95}
                  />
                </linearGradient>
              ))}
            </defs>

            {/* Top Coordinate Tick Marks (45°0'0"E - 46°0'0"E) */}
            <g className="font-mono text-[9px] font-bold" fill={isLight ? '#3A2818' : '#94A3B8'}>
              <line x1="460" y1="20" x2="460" y2="28" stroke={isLight ? '#3A2818' : '#94A3B8'} strokeWidth="1.5" />
              <text x="460" y="16" textAnchor="middle">45°0'0"E</text>

              <line x1="760" y1="20" x2="760" y2="28" stroke={isLight ? '#3A2818' : '#94A3B8'} strokeWidth="1.5" />
              <text x="760" y="16" textAnchor="middle">46°0'0"E</text>

              {/* Left & Right Latitudes */}
              <line x1="20" y1="200" x2="28" y2="200" stroke={isLight ? '#3A2818' : '#94A3B8'} strokeWidth="1.5" />
              <text x="14" y="203" textAnchor="end" transform="rotate(-90 14,203)">36°0'0"N</text>

              <line x1="20" y1="480" x2="28" y2="480" stroke={isLight ? '#3A2818' : '#94A3B8'} strokeWidth="1.5" />
              <text x="14" y="483" textAnchor="end" transform="rotate(-90 14,483)">35°0'0"N</text>

              <line x1="900" y1="200" x2="892" y2="200" stroke={isLight ? '#3A2818' : '#94A3B8'} strokeWidth="1.5" />
              <text x="906" y="203" textAnchor="start" transform="rotate(90 906,203)">36°0'0"N</text>

              <line x1="900" y1="480" x2="892" y2="480" stroke={isLight ? '#3A2818' : '#94A3B8'} strokeWidth="1.5" />
              <text x="906" y="483" textAnchor="start" transform="rotate(90 906,483)">35°0'0"N</text>
            </g>

            {/* Official Header Title Box at Top */}
            <g transform="translate(460, 48)">
              <rect
                x="-260"
                y="-18"
                width="520"
                height="32"
                rx="6"
                fill={isLight ? '#FCF8EE' : '#1E293B'}
                stroke={isLight ? '#3A2818' : '#475569'}
                strokeWidth="1.5"
                filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill={isLight ? '#1F1206' : '#FFFFFF'}
                fontSize="15"
                fontWeight="900"
                className="select-none tracking-wide"
              >
                نەخشەی کارگێڕی سنووری لقی چوار - پارێزگای سلێمانی
              </text>
            </g>

            {/* Official KRSO / لقی چوار Logo Badge (Top-Left) */}
            <g transform="translate(68, 55)">
              <circle
                r="26"
                fill={isLight ? '#FFFFFF' : '#1E293B'}
                stroke={isLight ? '#8B4513' : '#64748B'}
                strokeWidth="1.5"
                filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
              />
              <circle r="22" fill="none" stroke={isLight ? '#D4A373' : '#475569'} strokeWidth="0.8" strokeDasharray="3,2" />
              <text x="0" y="-8" textAnchor="middle" fontSize="6.5" fontWeight="900" fill={isLight ? '#2B1A09' : '#94A3B8'}>
                دەستەی ئامار
              </text>
              <text x="0" y="2" textAnchor="middle" fontSize="8" fontWeight="900" fill={isLight ? '#B45309' : '#F59E0B'}>
                KRSO
              </text>
              <text x="0" y="11" textAnchor="middle" fontSize="6" fontWeight="bold" fill={isLight ? '#2B1A09' : '#94A3B8'}>
                لقی چوار
              </text>
            </g>

            {/* Official Classic North Arrow / ئاڕاستەی باکوور (Top-Right) */}
            <g transform="translate(845, 65)">
              <circle r="22" fill={isLight ? '#FCF8EE' : '#1E293B'} stroke={isLight ? '#3A2818' : '#475569'} strokeWidth="1.2" />
              {/* North Arrow graphic */}
              <polygon points="0,-18 5,-2 0,2 -5,-2" fill={isLight ? '#B91C1C' : '#EF4444'} />
              <polygon points="0,-18 5,-2 0,-5" fill={isLight ? '#7F1D1D' : '#DC2626'} />
              <polygon points="0,18 5,2 0,-2 -5,2" fill={isLight ? '#3A2818' : '#94A3B8'} />
              <polygon points="0,18 5,2 0,5" fill={isLight ? '#1F1206' : '#64748B'} />
              <circle r="3" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
              <text x="0" y="-24" textAnchor="middle" fontSize="13" fontWeight="900" fill={isLight ? '#1F1206' : '#FFFFFF'}>
                N
              </text>
              <text x="0" y="32" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={isLight ? '#3A2818' : '#94A3B8'}>
                باکوور
              </text>
            </g>

            {/* Neighboring Regions & International Border Labels (like the image) */}
            <g className="font-bold select-none pointer-events-none" fill={isLight ? '#2A1808' : '#94A3B8'}>
              {/* International border line with Iran (Red-Brown dashed line) */}
              <path
                d="M 680,105 C 720,135 760,180 755,270 C 750,330 730,370 705,430 C 690,470 660,540 645,580"
                fill="none"
                stroke={isLight ? '#B91C1C' : '#EF4444'}
                strokeWidth="2.8"
                strokeDasharray="8,4,2,4"
              />
              <path
                d="M 680,105 C 720,135 760,180 755,270 C 750,330 730,370 705,430 C 690,470 660,540 645,580"
                fill="none"
                stroke={isLight ? '#78350F' : '#F59E0B'}
                strokeWidth="1.2"
              />

              {/* Neighboring Names */}
              <text x="760" y="220" fontSize="17" fontWeight="900" fill={isLight ? '#78350F' : '#F59E0B'}>
                ئێران (ڕۆژهەڵات)
              </text>
              <text x="735" y="420" fontSize="15" fontWeight="900" fill={isLight ? '#1F1206' : '#E2E8F0'}>
                هەڵەبجە
              </text>
              <text x="60" y="310" fontSize="15" fontWeight="900" fill={isLight ? '#1F1206' : '#E2E8F0'}>
                کەرکووک
              </text>
              <text x="70" y="195" fontSize="15" fontWeight="900" fill={isLight ? '#1F1206' : '#E2E8F0'}>
                هەولێر
              </text>
              <text x="180" y="560" fontSize="14" fontWeight="900" fill={isLight ? '#1F1206' : '#E2E8F0'}>
                دیالە
              </text>
              <text x="50" y="490" fontSize="14" fontWeight="900" fill={isLight ? '#1F1206' : '#E2E8F0'}>
                سەلاحەدین
              </text>

              {/* Other Sulaymaniyah Districts context */}
              <text x="210" y="145" fontSize="11" fontWeight="bold" opacity="0.75">دووکان</text>
              <text x="675" y="380" fontSize="11" fontWeight="bold" opacity="0.75">سەیدسادق</text>
              <text x="695" y="290" fontSize="11" fontWeight="bold" opacity="0.75">پێنجوێن</text>
              <text x="440" y="540" fontSize="11" fontWeight="bold" opacity="0.75">قەرەداغ و گەرمیان</text>
            </g>

            {/* Dukan Lake / Water reservoir accent */}
            <path
              d="M 190,130 C 220,110 245,135 240,155 C 230,175 205,185 185,170 C 175,150 175,140 190,130 Z"
              fill={isLight ? '#5E81AC' : '#0E7490'}
              fillOpacity="0.45"
              stroke={isLight ? '#4C566A' : '#0891B2'}
              strokeWidth="1.2"
            />
            <text x="205" y="152" fontSize="9" fontWeight="bold" fill={isLight ? '#2E3440' : '#E0F2FE'} textAnchor="middle">
              دەریاچەی دووکان
            </text>

            {/* Base Background Land Fill for Sulaymaniyah Region */}
            <path
              d="M 140,260 C 180,180 230,120 290,140 C 340,120 410,105 490,110 C 570,115 640,130 700,165 C 725,220 715,275 680,325 C 640,360 610,430 565,425 C 550,465 510,505 445,500 C 375,505 295,475 260,410 C 215,480 180,485 140,450 C 120,380 130,310 140,260 Z"
              fill={isLight ? '#B4D2DC' : '#1E293B'}
              fillOpacity={mapColorMode === 'atlas' ? 0.35 : 0.15}
              stroke={isLight ? '#2B1A09' : '#475569'}
              strokeWidth="2.5"
            />

            {/* RENDER THE 8 ADMINISTRATIVE AREAS OF BRANCH 4 */}
            {BRANCH_FOUR_AREAS.map((area) => {
              const isSelected = selectedCommitteeId === area.id;
              const isHovered = hoveredAreaId === area.id;
              const stats = areaStatsMap.get(area.id);
              const leaderColor = stats?.leadingParty?.color;

              let fillColor = `url(#admin-grad-${area.id})`;

              if (mapColorMode === 'atlas') {
                fillColor = isLight ? area.colorScheme.atlasColor : '#334155';
              } else if (mapColorMode === 'election') {
                if (leaderColor && stats && stats.totalValid > 0) {
                  fillColor = leaderColor;
                } else {
                  fillColor = isLight ? '#CBD5E1' : '#334155';
                }
              }

              // Fill opacity
              let fillOpacity = 0.9;
              if (isSelected) fillOpacity = 1;
              else if (isHovered) fillOpacity = 0.95;

              // Border styling matching administrative cartography
              let strokeColor = isLight ? '#2B1A09' : '#64748B';
              let strokeWidth = 1.8;

              if (mapColorMode === 'distinct') {
                strokeColor = isLight ? area.colorScheme.stroke : '#FFFFFF';
                strokeWidth = 2.2;
              }

              if (isSelected) {
                strokeColor = '#B91C1C';
                strokeWidth = 3.5;
              } else if (isHovered) {
                strokeColor = isLight ? '#000000' : '#FFFFFF';
                strokeWidth = 2.8;
              }

              return (
                <g
                  key={area.id}
                  id={`admin-poly-${area.id}`}
                  onClick={() => onSelectCommittee(area.id)}
                  onMouseEnter={() => setHoveredAreaId(area.id)}
                  onMouseLeave={() => setHoveredAreaId(null)}
                  className="cursor-pointer transition-all duration-200"
                >
                  {/* Selection glow */}
                  {isSelected && (
                    <path
                      d={area.path}
                      fill="none"
                      stroke="#B91C1C"
                      strokeWidth="8"
                      strokeOpacity="0.5"
                      filter="url(#adminGlow)"
                    />
                  )}

                  {/* Polygon shape */}
                  <path
                    d={area.path}
                    fill={fillColor}
                    fillOpacity={fillOpacity}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    className="transition-all duration-150"
                  />

                  {/* Administrative Boundary Inner Line pattern for distinct look */}
                  <path
                    d={area.path}
                    fill="none"
                    stroke={isLight ? '#4B2810' : '#1E293B'}
                    strokeWidth="0.8"
                    strokeDasharray={area.category === 'district' ? '5,3' : '3,2'}
                  />

                  {/* District / Area Kurdish Labels */}
                  <text
                    x={area.labelX}
                    y={area.labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none select-none font-bold"
                  >
                    <tspan
                      x={area.labelX}
                      dy={isSelected ? -6 : 0}
                      fill={
                        isSelected
                          ? '#991B1B'
                          : isLight
                          ? '#0F172A'
                          : '#FFFFFF'
                      }
                      fontSize={area.category === 'district' ? '13.5' : '12'}
                      fontWeight="900"
                      style={{
                        filter: isLight
                          ? 'drop-shadow(0px 1px 2px rgba(255,255,255,0.95))'
                          : 'drop-shadow(0px 2px 3px rgba(0,0,0,0.95))',
                      }}
                    >
                      {area.name}
                    </tspan>

                    {/* Votes Count Sub-label */}
                    {stats && stats.totalValid > 0 && !isSelected && (
                      <tspan
                        x={area.labelX}
                        dy="15"
                        fill={isLight ? '#1E293B' : '#E2E8F0'}
                        fontSize="10"
                        fontWeight="800"
                        style={{
                          filter: isLight
                            ? 'drop-shadow(0px 1px 2px rgba(255,255,255,0.95))'
                            : 'drop-shadow(0px 1px 2px rgba(0,0,0,0.95))',
                        }}
                      >
                        {formatNumber(stats.totalValid, useKurdishNumerals)} دەنگ
                      </tspan>
                    )}

                    {/* Selected Badge text */}
                    {isSelected && (
                      <tspan
                        x={area.labelX}
                        dy="15"
                        fill="#B91C1C"
                        fontSize="11"
                        fontWeight="900"
                      >
                        ★ دەستنیشانکراو
                      </tspan>
                    )}
                  </text>

                  {/* District / Subdistrict Center Point Markers with LIVE Pulsing Signal */}
                  {showCenters && (
                    <g transform={`translate(${area.pinX}, ${area.pinY})`} className="pointer-events-none">
                      {isSelected ? (
                        /* Continuous LIVE Radar Signal & Pulsing Point */
                        <g id={`live-signal-${area.id}`}>
                          {/* Outward Expanding Radar Wave 1 */}
                          <circle r="6" fill="none" stroke="#EF4444" strokeWidth="2.5" opacity="0.9">
                            <animate attributeName="r" from="6" to="38" dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.95" to="0" dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="stroke-width" from="2.5" to="0.6" dur="1.8s" repeatCount="indefinite" />
                          </circle>

                          {/* Outward Expanding Radar Wave 2 */}
                          <circle r="6" fill="none" stroke="#F59E0B" strokeWidth="2.2" opacity="0.9">
                            <animate attributeName="r" from="6" to="38" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
                            <animate attributeName="stroke-width" from="2.2" to="0.6" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
                          </circle>

                          {/* Outward Expanding Radar Wave 3 */}
                          <circle r="6" fill="none" stroke="#EF4444" strokeWidth="1.8" opacity="0.8">
                            <animate attributeName="r" from="6" to="38" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.85" to="0" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
                            <animate attributeName="stroke-width" from="1.8" to="0.5" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
                          </circle>

                          {/* Pulsing Outer Ring */}
                          <circle r="12" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.8">
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              from="0"
                              to="360"
                              dur="6s"
                              repeatCount="indefinite"
                            />
                          </circle>

                          {/* Glowing Live Center Core */}
                          <circle r="7.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2.5" filter="url(#livePinGlow)">
                            <animate attributeName="r" values="6.5;9;6.5" dur="1.1s" repeatCount="indefinite" />
                            <animate attributeName="fill" values="#DC2626;#B91C1C;#DC2626" dur="1.1s" repeatCount="indefinite" />
                          </circle>

                          {/* Inner White Signal Spark */}
                          <circle r="3" fill="#FFFFFF">
                            <animate attributeName="opacity" values="0.6;1;0.6" dur="0.9s" repeatCount="indefinite" />
                          </circle>

                          {/* Sleek Floating LIVE Badge */}
                          <g transform="translate(0, -22)" className="select-none">
                            <rect
                              x="-26"
                              y="-10"
                              width="52"
                              height="17"
                              rx="8.5"
                              fill="#991B1B"
                              stroke="#FFFFFF"
                              strokeWidth="1.5"
                              filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.5))"
                            />
                            {/* Blinking Live Green LED Dot */}
                            <circle cx="-15" cy="-1.5" r="2.8" fill="#22C55E">
                              <animate attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite" />
                              <animate attributeName="r" values="2.8;3.5;2.8" dur="0.7s" repeatCount="indefinite" />
                            </circle>
                            <text
                              x="6"
                              y="2"
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize="8"
                              fontWeight="900"
                              letterSpacing="0.8"
                            >
                              LIVE
                            </text>
                          </g>
                        </g>
                      ) : isHovered ? (
                        /* Hovered Quick Signal Pulse */
                        <g id={`hover-signal-${area.id}`}>
                          <circle r="5" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.8">
                            <animate attributeName="r" from="5" to="22" dur="1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite" />
                          </circle>
                          <circle
                            r="6"
                            fill="#F59E0B"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            style={{ filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.4))' }}
                          />
                        </g>
                      ) : (
                        /* Standard Official Administrative Center Point */
                        <g>
                          {area.category === 'city' && area.id === 'lqi4-nawcha-1' ? (
                            /* Sulaymaniyah Governorate Center (Square Icon ■) */
                            <rect
                              x="-6"
                              y="-6"
                              width="12"
                              height="12"
                              fill={isLight ? '#000000' : '#FFFFFF'}
                              stroke={isLight ? '#FFFFFF' : '#000000'}
                              strokeWidth="2"
                              style={{ filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.5))' }}
                            />
                          ) : (
                            /* Subdistrict / District Center (Circle Point ●) */
                            <circle
                              r="4.5"
                              fill={isLight ? '#8B4513' : '#F59E0B'}
                              stroke={isLight ? '#FFFFFF' : '#000000'}
                              strokeWidth="1.8"
                              style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))' }}
                            />
                          )}
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Central City Center Callout: سلێمانی (Prominent) */}
            <g transform="translate(460, 310)" className="pointer-events-none select-none">
              <rect
                x="-45"
                y="-14"
                width="90"
                height="24"
                rx="5"
                fill={isLight ? '#FFFFFF' : '#0F172A'}
                stroke={isLight ? '#000000' : '#FFFFFF'}
                strokeWidth="1.8"
                filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.25))"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fontSize="13"
                fontWeight="900"
                fill={isLight ? '#000000' : '#FFFFFF'}
              >
                سلێمانی
              </text>
            </g>

            {/* Official Scale Bar at Bottom Left (0 - 25 - 50 Km) */}
            <g transform="translate(80, 565)" className="select-none font-mono">
              <text x="60" y="-8" fontSize="10" fontWeight="900" fill={isLight ? '#1F1206' : '#CBD5E1'} textAnchor="middle">
                Km (کیلۆمەتر)
              </text>
              {/* Scale bar segments */}
              <rect x="0" y="0" width="60" height="7" fill={isLight ? '#000000' : '#FFFFFF'} />
              <rect x="60" y="0" width="60" height="7" fill={isLight ? '#FFFFFF' : '#475569'} stroke={isLight ? '#000000' : '#FFFFFF'} strokeWidth="1" />
              <text x="0" y="18" fontSize="9" fontWeight="bold" fill={isLight ? '#1F1206' : '#CBD5E1'} textAnchor="middle">0</text>
              <text x="60" y="18" fontSize="9" fontWeight="bold" fill={isLight ? '#1F1206' : '#CBD5E1'} textAnchor="middle">25</text>
              <text x="120" y="18" fontSize="9" fontWeight="bold" fill={isLight ? '#1F1206' : '#CBD5E1'} textAnchor="middle">50</text>
            </g>
          </svg>
        </div>

        {/* Dynamic Area Information & Vote Statistics Card (Col 4) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {displayAreaConfig && displayStats ? (
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 shadow-md transition-all ${
                isLight
                  ? 'bg-[#FAF6EE] border-amber-900/20'
                  : isGray
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-[#0B101B] border-slate-800'
              }`}
            >
              {/* Header of Area Card */}
              <div
                className={`flex items-center justify-between border-b pb-3 ${
                  isLight ? 'border-amber-900/15' : isGray ? 'border-slate-800' : 'border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="p-2 rounded-xl border text-white shadow-sm"
                    style={{
                      backgroundColor: displayAreaConfig.colorScheme.primary,
                      borderColor: displayAreaConfig.colorScheme.stroke,
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div>
                    <h4
                      className={`text-sm sm:text-base font-black ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {displayAreaConfig.name}
                    </h4>
                    <span
                      className="text-[11px] font-bold block"
                      style={{ color: displayAreaConfig.colorScheme.primary }}
                    >
                      {displayAreaConfig.areaKmApprox}
                    </span>
                  </div>
                </div>

                {selectedCommitteeId === displayAreaConfig.id && (
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                      isLight
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                    }`}
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                    </span>
                    <span>لایڤ دەستنیشانکراوە</span>
                  </span>
                )}
              </div>

              {/* Geographic Description */}
              <p
                className={`text-xs leading-relaxed p-3 rounded-xl border ${
                  isLight
                    ? 'bg-white border-amber-900/15 text-slate-800'
                    : isGray
                    ? 'bg-slate-800/90 border-slate-700 text-slate-300'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300'
                }`}
              >
                {displayAreaConfig.description}
              </p>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`p-3 rounded-xl border ${
                    isLight
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : isGray
                      ? 'bg-slate-800 border-slate-700 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-emerald-400'
                  }`}
                >
                  <span
                    className={`text-[11px] block mb-1 font-semibold ${
                      isLight ? 'text-emerald-900' : 'text-slate-400'
                    }`}
                  >
                    دەنگی دروست
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono">
                    {formatNumber(displayStats.totalValid, useKurdishNumerals)}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isLight
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                      : isGray
                      ? 'bg-slate-800 border-slate-700 text-amber-400'
                      : 'bg-slate-900 border-slate-800 text-amber-400'
                  }`}
                >
                  <span
                    className={`text-[11px] block mb-1 font-semibold ${
                      isLight ? 'text-amber-900' : 'text-slate-400'
                    }`}
                  >
                    دەنگی سوتاو
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono">
                    {formatNumber(displayStats.totalBurned, useKurdishNumerals)}
                  </span>
                </div>
              </div>

              {/* Leading Party in Area */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isLight
                    ? 'bg-white border-amber-900/15'
                    : isGray
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span
                  className={`text-[11px] font-bold block mb-2 flex items-center gap-1.5 ${
                    isLight ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>لایەنی پێشەنگ لەم ناوچەیە:</span>
                </span>

                {displayStats.leadingParty ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-1 ring-black/20"
                          style={{ backgroundColor: displayStats.leadingParty.color }}
                        />
                        <span
                          className={`text-xs font-black truncate ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {displayStats.leadingParty.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono shrink-0">
                        {formatNumber(displayStats.leadingParty.votes, useKurdishNumerals)} دەنگ (
                        {formatPercentage(displayStats.leadingParty.percentage, useKurdishNumerals)})
                      </span>
                    </div>

                    {/* Progress visual bar */}
                    <div
                      className={`w-full h-2.5 rounded-full overflow-hidden ${
                        isLight ? 'bg-slate-100' : 'bg-slate-950'
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{
                          width: `${Math.min(displayStats.leadingParty.percentage, 100)}%`,
                          backgroundColor: displayStats.leadingParty.color,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className={`text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    هیچ دەنگێک بۆ ئەم ناوچەیە تۆمار نەکراوە
                  </span>
                )}
              </div>

              {/* Action Button: Edit and select */}
              <button
                onClick={() => onSelectCommittee(displayAreaConfig.id)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md text-white"
                style={{
                  backgroundColor: displayAreaConfig.colorScheme.primary,
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {selectedCommitteeId === displayAreaConfig.id
                    ? 'داغڵکردنی دەنگەکان لە خشتەی خوارەوە ✏️'
                    : 'دیاریکردن و هێنانەپێشەوەی ئەم ناوچەیە'}
                </span>
              </button>
            </div>
          ) : (
            /* When All is selected */
            <div
              className={`p-5 rounded-2xl border space-y-3 shadow-md ${
                isLight
                  ? 'bg-[#FAF6EE] border-amber-900/20'
                  : isGray
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-[#0B101B] border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-600">
                <Layers className="w-5 h-5" />
                <h4 className="text-sm sm:text-base font-black">کۆی گشتی ٨ ناوچەکەی لقی چوار</h4>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                نەخشەکە بەپێی شێوازی فەرمی کارگێڕی دەستەی ئامار (KRSO) کێشراوە؛ بە سنووری نێودەوڵەتی، سنووری پارێزگاکان، سەنتەری شار و هەموو ٨ ناوچەکەی لقی چوار. کرتە لەسەر هەر ناوچەیەک بکە بۆ داغڵکردنی دەنگەکانی.
              </p>
            </div>
          )}

          {/* Quick Select Buttons Grid for 8 Areas */}
          <div className="space-y-2">
            <span
              className={`text-[11px] font-bold block px-1 ${
                isLight ? 'text-amber-900' : 'text-slate-400'
              }`}
            >
              هەڵبژاردنی خێرای ناوچەکان لەسەر نەخشە:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {BRANCH_FOUR_AREAS.map((a) => {
                const isSelected = selectedCommitteeId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelectCommittee(a.id)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold text-right transition-all cursor-pointer truncate flex items-center justify-between border shadow-sm ${
                      isSelected
                        ? 'bg-amber-900 text-white font-bold ring-2 ring-offset-1 border-transparent shadow-lg'
                        : isLight
                        ? 'bg-white hover:bg-amber-50 text-slate-800 border-amber-900/20'
                        : isGray
                        ? 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: a.colorScheme.primary,
                            boxShadow: `0 0 12px ${a.colorScheme.primary}40`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/40"
                        style={{ backgroundColor: a.colorScheme.primary }}
                      />
                      <span className="truncate">{a.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
