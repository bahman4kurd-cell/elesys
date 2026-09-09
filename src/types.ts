export interface Party {
  id: string;
  name: string;
  color: string;
  textColor?: string;
  isCustom?: boolean;
}

export interface PartyVote {
  partyId: string;
  partyName: string;
  votes: number;
  color: string;
  textColor?: string;
}

export type ChartType = 'pie' | 'donut' | 'bar' | 'line' | 'area';

export type AppLanguage = 'ckb' | 'kmr' | 'ar' | 'en';

export interface SubTab {
  id: string;
  name: string; // e.g., "پارێزگای هەولێر", "سلێمانی", "دهۆک", "هەڵەبجە", "کەرکوک"
  totalCastVotes: number; // کۆی گشتی دەنگدەر (reference only)
  burnedVotes: number; // دەنگی سوتاو (reference only)
  validVotes: number; // دەنگی دروستی تەواو (basis for % calculations)
  autoCalcValidVotes: boolean; // whether validVotes is auto calculated as sum of partyVotes
  partyVotes: PartyVote[];
  selectedChartType: ChartType;
  notes?: string;
}

export interface ElectionRound {
  id: string;
  title: string; // e.g., "پەرلەمانی کوردستان - خولی شەشەم ٢٠٢٤"
  category: 'kurdistan' | 'iraq' | 'provincial' | 'custom';
  year: number;
  dateStr?: string;
  subTabs: SubTab[];
  activeSubTabId: string;
  notes?: string;
  branches?: ElectionBranch[];
}

export interface ElectionBranch {
  id: string;
  name: string;
  subTabs: SubTab[];
  activeSubTabId: string;
}

export interface AppDatabase {
  version: number;
  lastUpdated: string;
  rounds: ElectionRound[];
  activeRoundId: string; // or 'dashboard'
  customParties: Party[];
  settings: {
    useKurdishNumerals: boolean;
    autoSaveIntervalMs: number;
    appName: string;
    theme?: 'dark' | 'light' | 'gray' | 'government';
    language?: AppLanguage;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string;
  lastLogin?: string;
}
