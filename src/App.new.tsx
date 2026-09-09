import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { AppDatabase, AppLanguage, AuthState, ElectionRound, SubTab, Party, ChartType } from './types';
import { DEFAULT_PARTIES } from './data/defaultParties';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { RoundTabs } from './components/RoundTabs';
import { SubTabs } from './components/SubTabs';
import { VoteEntryForm } from './components/VoteEntryForm';
import { SubTabCharts } from './components/SubTabCharts';
import { GeneralDashboard } from './components/GeneralDashboard';
import { BranchFourDashboard } from './components/BranchFourDashboard';
import { SettingsModal } from './components/SettingsModal';
import { PrintReport } from './components/PrintReport';
import { applyPageLanguage } from './translatePage';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => StorageService.loadDatabase());
  const [authState, setAuthState] = useState<AuthState>(() => StorageService.getAuthState());
  const [showSettings, setShowSettings] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [openSubTabCreatorVersion, setOpenSubTabCreatorVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = StorageService.subscribe((updatedDb) => {
      setDb(updatedDb);
    });
    void StorageService.loadIndexedDb().then((snapshot) => {
      if (!snapshot || snapshot.lastUpdated <= db.lastUpdated) return;
      StorageService.saveDatabase(snapshot);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    StorageService.saveDatabase(db);
  }, [db]);

  const handleThemeChange = (theme: string) => {
    setDb({
      ...db,
      settings: {
        ...db.settings,
        theme,
      },
    });
  };

  const handleLanguageChange = (language: AppLanguage) => {
    setDb({
      ...db,
      settings: {
        ...db.settings,
        language,
      },
    });
  };

  useEffect(() => {
    const currentTheme = db.settings?.theme || 'dark';
    const currentLanguage: AppLanguage = db.settings?.language || 'ckb';

    document.body.className = `theme-${currentTheme}`;
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'en' ? 'ltr' : 'rtl';
    applyPageLanguage(currentLanguage);
  }, [db.settings?.theme, db.settings?.language]);

  const handleLoginSuccess = (username: string) => {
    setAuthState({ isAuthenticated: true, username, lastLogin: new Date().toISOString() });
  };

  const handleLogout = () => {
    StorageService.logout();
    setAuthState({ isAuthenticated: false, username: '', lastLogin: '' });
  };

  if (!authState.isAuthenticated) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const activeRound = db.rounds.find((r) => r.id === db.activeRoundId) || db.rounds[0];
  const isDashboardActive = db.activeRoundId === 'dashboard';
  const isBranchFourActive = db.activeRoundId === 'round-lqi4';

  const activeSubTab =
    activeRound?.subTabs.find((st) => st.id === activeRound.activeSubTabId) ||
    activeRound?.subTabs[0];

  const updateActiveRound = (changes: Partial<ElectionRound>) => {
    if (!activeRound) return;
    const updatedRound = { ...activeRound, ...changes };
    const updatedRounds = db.rounds.map((r) =>
      r.id === updatedRound.id ? updatedRound : r
    );
    setDb({
      ...db,
      rounds: updatedRounds,
    });
  };

  const handleAddRound = (title: string) => {
    const roundId = `round-${Date.now()}`;
    const initialSubTabId = `subtab-${Date.now()}-1`;

    const defaultPartyVotes = DEFAULT_PARTIES.map((p) => ({
      partyId: p.id,
      partyName: p.name,
      votes: 0,
      color: p.color,
      textColor: p.textColor,
    }));

    const newSubTab: SubTab = {
      id: initialSubTabId,
      name: 'ناوچەی یەکەم',
      partyVotes: defaultPartyVotes,
      chartType: 'bar' as ChartType,
      notes: '',
    };

    const newRound: ElectionRound = {
      id: roundId,
      title,
      branches: [{ id: 'default', name: 'بنچینە', subTabs: [newSubTab], activeSubTabId: initialSubTabId }],
      subTabs: [newSubTab],
      activeSubTabId: initialSubTabId,
    };

    setDb({
      ...db,
      rounds: [...db.rounds, newRound],
    });
  };

  const handleRenameRound = (roundId: string, newTitle: string) => {
    const updatedRounds = db.rounds.map((r) =>
      r.id === roundId ? { ...r, title: newTitle } : r
    );
    setDb({
      ...db,
      rounds: updatedRounds,
    });
  };

  const handleDeleteRound = (roundId: string) => {
    const filteredRounds = db.rounds.filter((r) => r.id !== roundId);
    if (filteredRounds.length === 0) return;
    setDb({
      ...db,
      rounds: filteredRounds,
      activeRoundId: filteredRounds[0].id,
    });
  };

  const handleSelectRound = (roundId: string) => {
    setDb({
      ...db,
      activeRoundId: roundId,
    });
  };

  const handleAddSubTab = () => {
    if (!activeRound) return;
    const newSubTabId = `subtab-${Date.now()}`;

    const defaultPartyVotes = DEFAULT_PARTIES.map((p) => ({
      partyId: p.id,
      partyName: p.name,
      votes: 0,
      color: p.color,
      textColor: p.textColor,
    }));

    const newSubTab: SubTab = {
      id: newSubTabId,
      name: `ناوچە ${activeRound.subTabs.length + 1}`,
      partyVotes: defaultPartyVotes,
      chartType: 'bar' as ChartType,
      notes: '',
    };

    const updatedRounds = db.rounds.map((r) => {
      if (r.id === activeRound.id) {
        return {
          ...r,
          subTabs: [...r.subTabs, newSubTab],
          activeSubTabId: newSubTabId,
        };
      }
      return r;
    });
    setDb({
      ...db,
      rounds: updatedRounds,
    });
    setOpenSubTabCreatorVersion(v => v + 1);
  };

  const handleRenameSubTab = (subTabId: string, newName: string) => {
    if (!activeRound) return;
    const updatedRounds = db.rounds.map((r) => {
      if (r.id === activeRound.id) {
        return {
          ...r,
          subTabs: r.subTabs.map((st) => (st.id === subTabId ? { ...st, name: newName } : st)),
        };
      }
      return r;
    });
    setDb({
      ...db,
      rounds: updatedRounds,
    });
  };

  const handleDeleteSubTab = (subTabId: string) => {
    if (!activeRound || activeRound.subTabs.length <= 1) {
      alert('نەتوانرا بسڕدرێتەوە. پێویستە بەلایەنی کەم یەک ناوچە/سەب تاب هەبێت.');
      return;
    }
    const updatedSubTabs = activeRound.subTabs.filter((st) => st.id !== subTabId);
    const newActiveSubTabId =
      activeRound.activeSubTabId === subTabId ? updatedSubTabs[0].id : activeRound.activeSubTabId;

    const updatedRounds = db.rounds.map((r) => {
      if (r.id === activeRound.id) {
        return {
          ...r,
          subTabs: updatedSubTabs,
          activeSubTabId: newActiveSubTabId,
        };
      }
      return r;
    });
    setDb({
      ...db,
      rounds: updatedRounds,
    });
  };

  const handleSelectSubTab = (subTabId: string) => {
    const updatedRounds = db.rounds.map((r) =>
      r.id === activeRound.id ? { ...r, activeSubTabId: subTabId } : r
    );
    setDb({
      ...db,
      rounds: updatedRounds,
    });
  };

  const handleUpdateSubTab = (updatedSubTab: SubTab) => {
    if (!activeRound) return;
    const updatedRounds = db.rounds.map((r) => {
      if (r.id === activeRound.id) {
        return {
          ...r,
          subTabs: r.subTabs.map((st) => (st.id === updatedSubTab.id ? updatedSubTab : st)),
        };
      }
      return r;
    });
    setDb({
      ...db,
      rounds: updatedRounds,
    });
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-blue-500 selection:text-white font-sans transition-colors duration-300 ${
      (db.settings?.theme || 'dark') === 'dark'
        ? 'bg-slate-950 text-white'
        : 'bg-white text-slate-900'
    }`}>
      <Navbar
        username={authState.username}
        onSettingsClick={() => setShowSettings(true)}
        onPrintClick={() => setShowPrintReport(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16">
        {isDashboardActive ? (
          <GeneralDashboard rounds={db.rounds} />
        ) : isBranchFourActive ? (
          <BranchFourDashboard round={db.rounds.find((r) => r.id === 'round-lqi4')!} />
        ) : (
          <div className="space-y-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Side - Vote Entry Form */}
                <div className="lg:col-span-6 space-y-4">
                  {activeSubTab && (
                    <VoteEntryForm
                      subTab={activeSubTab}
                      onUpdate={handleUpdateSubTab}
                      key={openSubTabCreatorVersion}
                    />
                  )}
                </div>

                {/* Right Side - Tabs and Dashboard */}
                <div className="lg:col-span-6 space-y-4 sticky top-20">
                  {/* Rounds Tabs */}
                  <RoundTabs
                    rounds={db.rounds}
                    activeRoundId={db.activeRoundId}
                    onSelectRound={handleSelectRound}
                    onAddRound={handleAddRound}
                    onRenameRound={handleRenameRound}
                    onDeleteRound={handleDeleteRound}
                  />

                  {/* SubTabs */}
                  {activeRound && (
                    <SubTabs
                      subTabs={activeRound.subTabs}
                      activeSubTabId={activeRound.activeSubTabId}
                      onSelectSubTab={handleSelectSubTab}
                      onAddSubTab={handleAddSubTab}
                      onRenameSubTab={handleRenameSubTab}
                      onDeleteSubTab={handleDeleteSubTab}
                    />
                  )}

                  {/* Charts Dashboard */}
                  {activeSubTab && (
                    <SubTabCharts
                      subTab={activeSubTab}
                      onUpdate={handleUpdateSubTab}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 no-print">
        <p>© 2024 سیستەمی بەڕێوەبردنی دەنگدان - Election Vote Management System</p>
      </footer>

      {showSettings && (
        <SettingsModal
          currentTheme={db.settings?.theme || 'dark'}
          currentLanguage={db.settings?.language || 'ckb'}
          username={authState.username}
          onThemeChange={handleThemeChange}
          onLanguageChange={handleLanguageChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showPrintReport && (
        <PrintReport
          round={activeRound}
          onClose={() => setShowPrintReport(false)}
        />
      )}
    </div>
  );
}
