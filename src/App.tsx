import React, { useEffect, useState } from 'react';
import { StorageService } from './services/storage';
import { OnlineApiService } from './services/onlineApi';
import {
  AppDatabase,
  AppLanguage,
  AuthState,
  ChartType,
  ElectionBranch,
  ElectionRound,
  Party,
  SubTab,
} from './types';
import { DEFAULT_PARTIES } from './data/defaultParties';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { RoundTabs } from './components/RoundTabs';
import { BranchTabs } from './components/BranchTabs';
import { SubTabs } from './components/SubTabs';
import { VoteEntryForm } from './components/VoteEntryForm';
import { SubTabCharts } from './components/SubTabCharts';
import { GeneralDashboard } from './components/GeneralDashboard';
import { SettingsModal } from './components/SettingsModal';
import { PrintReport } from './components/PrintReport';
import { applyPageLanguage } from './translatePage';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => {
    try {
      const storedDatabase = StorageService.loadDatabase();
      return storedDatabase?.settings && Array.isArray(storedDatabase.rounds)
        ? storedDatabase
        : StorageService.resetToDefault();
    } catch (e) {
      console.error('Error loading database, resetting to standard seeded database:', e);
      return StorageService.resetToDefault();
    }
  });

  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      return StorageService.getAuthState();
    } catch (e) {
      console.error('Error getting auth state:', e);
      return { isAuthenticated: false, username: '' };
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [openSubTabCreatorVersion, setOpenSubTabCreatorVersion] = useState(0);
  const [activeBranchId, setActiveBranchId] = useState('');
  const [hasHydratedRemoteState, setHasHydratedRemoteState] = useState(false);

  useEffect(() => {
    const unsubscribe = StorageService.subscribe((updatedDb) => {
      if (!updatedDb?.settings || !Array.isArray(updatedDb.rounds)) return;
      setDb(updatedDb);
    });

    void StorageService.loadIndexedDb().then((snapshot) => {
      if (!snapshot?.settings || !Array.isArray(snapshot.rounds)) return;
      try {
        if (snapshot.lastUpdated <= db.lastUpdated) return;
        StorageService.saveDatabase(snapshot);
      } catch (err) {
        console.error('Error with IndexedDb snapshot:', err);
      }
    });

    return () => unsubscribe();
  }, [db?.lastUpdated]);

  const updateDbState = (newDb: AppDatabase) => {
    setDb(newDb);
    try {
      StorageService.saveDatabase(newDb);
    } catch (e) {
      console.error('Save database failed:', e);
    }
  };

  const currentTheme = db.settings?.theme || 'government';
  const currentLanguage: AppLanguage = db.settings?.language || 'ckb';

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'en' ? 'ltr' : 'rtl';
    const cleanupTranslation = applyPageLanguage(currentLanguage);
    return () => cleanupTranslation();
  }, [currentTheme, currentLanguage]);

  const handleLoginSuccess = (username: string) => {
    const newAuthState = { isAuthenticated: true, username, lastLogin: new Date().toISOString() };
    setAuthState(newAuthState);
    StorageService.setAuthState(newAuthState);
  };

  const handleLogout = () => {
    StorageService.logout();
    OnlineApiService.clearToken();
    setAuthState({ isAuthenticated: false, username: '', lastLogin: '' });
  };

  useEffect(() => {
    let isCancelled = false;

    const hydrateRemoteState = async () => {
      if (!authState.isAuthenticated || !OnlineApiService.isEnabled()) {
        setHasHydratedRemoteState(true);
        return;
      }

      const token = OnlineApiService.getToken();
      if (!token) {
        setHasHydratedRemoteState(true);
        return;
      }

      try {
        const remoteState = await OnlineApiService.loadState();
        if (!remoteState || isCancelled) {
          setHasHydratedRemoteState(true);
          return;
        }

        setDb(remoteState);
        StorageService.saveDatabase(remoteState);
      } catch (error) {
        console.error('Remote state hydrate failed:', error);
      } finally {
        if (!isCancelled) {
          setHasHydratedRemoteState(true);
        }
      }
    };

    setHasHydratedRemoteState(false);
    void hydrateRemoteState();

    return () => {
      isCancelled = true;
    };
  }, [authState.isAuthenticated]);

  useEffect(() => {
    if (!authState.isAuthenticated || !OnlineApiService.isEnabled() || !hasHydratedRemoteState) {
      return;
    }

    const timer = setTimeout(() => {
      void OnlineApiService.saveState(db).catch((error) => {
        console.error('Remote state sync failed:', error);
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [db, authState.isAuthenticated, hasHydratedRemoteState]);

  const handleDatabaseImported = () => {
    updateDbState(StorageService.loadDatabase());
  };

  const handleUpdateTheme = (theme: 'dark' | 'light' | 'gray' | 'government') => {
    updateDbState({
      ...db,
      settings: { ...db.settings, theme },
    });
  };

  const activeRound = db.rounds.find((r) => r.id === db.activeRoundId) || db.rounds[0];
  const isDashboardActive = db.activeRoundId === 'dashboard';
  const legacyBranchNames = new Set(['لقی سەرەکی', 'بنچینە']);
  const branches: ElectionBranch[] = (activeRound?.branches ?? []).filter(
    (branch) => !legacyBranchNames.has((branch.name || '').trim())
  );
  const selectedBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const activeSubTab =
    selectedBranch?.subTabs.find((st) => st.id === selectedBranch.activeSubTabId) ||
    selectedBranch?.subTabs[0];

  useEffect(() => {
    if (!activeRound || branches.length === 0) {
      setActiveBranchId('');
      return;
    }
    if (!branches.some((b) => b.id === activeBranchId)) {
      setActiveBranchId(branches[0].id);
    }
  }, [activeRound?.id, branches, activeBranchId]);

  if (!authState.isAuthenticated) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const updateActiveRound = (changes: Partial<ElectionRound>) => {
    if (!activeRound) return;
    updateDbState({
      ...db,
      rounds: db.rounds.map((round) => (round.id === activeRound.id ? { ...round, ...changes } : round)),
    });
  };

  const handleSelectRound = (roundId: string) => {
    updateDbState({
      ...db,
      activeRoundId: roundId,
    });
  };

  const handleAddRound = (
    title: string,
    category: 'kurdistan' | 'iraq' | 'provincial' | 'custom',
    year: number
  ) => {
    const roundId = `round-${Date.now()}`;
    const newRound: ElectionRound = {
      id: roundId,
      title,
      category,
      year,
      subTabs: [],
      activeSubTabId: '',
      branches: [],
    };

    updateDbState({
      ...db,
      rounds: [...db.rounds, newRound],
      activeRoundId: roundId,
    });
  };

  const handleEditRound = (roundId: string, newTitle: string) => {
    updateDbState({
      ...db,
      rounds: db.rounds.map((r) => (r.id === roundId ? { ...r, title: newTitle } : r)),
    });
  };

  const handleDeleteRound = (roundId: string) => {
    const filteredRounds = db.rounds.filter((r) => r.id !== roundId);
    if (filteredRounds.length === 0) return;
    updateDbState({
      ...db,
      rounds: filteredRounds,
      activeRoundId: filteredRounds[0].id,
    });
  };

  const handleReorderRounds = (fromRoundId: string, toRoundId: string) => {
    if (fromRoundId === toRoundId) return;

    const fromIndex = db.rounds.findIndex((round) => round.id === fromRoundId);
    const toIndex = db.rounds.findIndex((round) => round.id === toRoundId);
    if (fromIndex < 0 || toIndex < 0) return;

    const reorderedRounds = [...db.rounds];
    const [movedRound] = reorderedRounds.splice(fromIndex, 1);
    reorderedRounds.splice(toIndex, 0, movedRound);

    updateDbState({
      ...db,
      rounds: reorderedRounds,
    });
  };

  const handleSelectBranch = (branchId: string) => {
    setActiveBranchId(branchId);
  };

  const handleAddBranch = (name: string) => {
    if (!activeRound) return;

    const initialSubTabId = `subtab-${Date.now()}`;
    const initialSubTab: SubTab = {
      id: initialSubTabId,
      name,
      totalCastVotes: 0,
      burnedVotes: 0,
      validVotes: 0,
      autoCalcValidVotes: true,
      partyVotes: DEFAULT_PARTIES.map((party) => ({
        partyId: party.id,
        partyName: party.name,
        votes: 0,
        color: party.color,
        textColor: party.textColor,
      })),
      selectedChartType: 'bar',
    };

    const newBranch: ElectionBranch = {
      id: `branch-${Date.now()}`,
      name,
      subTabs: [initialSubTab],
      activeSubTabId: initialSubTabId,
    };

    const updatedBranches = [...branches, newBranch];
    updateActiveRound({
      branches: updatedBranches,
      subTabs: updatedBranches.flatMap((b) => b.subTabs),
      activeSubTabId: initialSubTabId,
    });

    setActiveBranchId(newBranch.id);
    setOpenSubTabCreatorVersion((v) => v + 1);
  };

  const handleEditBranch = (branchId: string, newName: string) => {
    const updatedBranches = branches.map((b) => (b.id === branchId ? { ...b, name: newName } : b));
    updateActiveRound({
      branches: updatedBranches,
      subTabs: updatedBranches.flatMap((b) => b.subTabs),
      activeSubTabId: updatedBranches.find((b) => b.id === activeBranchId)?.activeSubTabId || '',
    });
  };

  const handleDeleteBranch = (branchId: string) => {
    const updatedBranches = branches.filter((b) => b.id !== branchId);
    const nextActiveBranchId = updatedBranches[0]?.id || '';
    updateActiveRound({
      branches: updatedBranches,
      subTabs: updatedBranches.flatMap((b) => b.subTabs),
      activeSubTabId: updatedBranches[0]?.activeSubTabId || '',
    });
    setActiveBranchId(nextActiveBranchId);
  };

  const handleUpdateSubTab = (updatedSubTab: SubTab) => {
    if (!selectedBranch) return;

    const updatedBranches = branches.map((b) => {
      if (b.id !== selectedBranch.id) return b;
      return {
        ...b,
        subTabs: b.subTabs.map((st) => (st.id === updatedSubTab.id ? updatedSubTab : st)),
      };
    });

    updateActiveRound({
      branches: updatedBranches,
      subTabs: updatedBranches.flatMap((b) => b.subTabs),
      activeSubTabId: updatedBranches.find((b) => b.id === selectedBranch.id)?.activeSubTabId || '',
    });
  };

  const handleSelectSubTab = (subTabId: string) => {
    if (!selectedBranch || !activeRound) return;
    const updatedBranches = branches.map((b) =>
      b.id === selectedBranch.id ? { ...b, activeSubTabId: subTabId } : b
    );
    updateActiveRound({
      branches: updatedBranches,
      subTabs: updatedBranches.flatMap((b) => b.subTabs),
      activeSubTabId: subTabId,
    });
  };

  const handleAddSubTab = (name: string) => {
    if (!selectedBranch || !activeRound) return;

    const newSubTabId = `subtab-${Date.now()}`;
    const newSubTab: SubTab = {
      id: newSubTabId,
      name,
      totalCastVotes: 0,
      burnedVotes: 0,
      validVotes: 0,
      autoCalcValidVotes: true,
      partyVotes: [],
      selectedChartType: 'bar',
    };

    const updatedBranches = branches.map((b) =>
      b.id === selectedBranch.id
        ? {
            ...b,
            subTabs: [...b.subTabs, newSubTab],
            activeSubTabId: newSubTabId,
          }
        : b
    );

    updateActiveRound({
      branches: updatedBranches,
      subTabs: updatedBranches.flatMap((b) => b.subTabs),
      activeSubTabId: newSubTabId,
    });
    setOpenSubTabCreatorVersion((v) => v + 1);
  };

  const handleEditSubTab = (subTabId: string, newName: string) => {
    if (!selectedBranch || !activeRound) return;

    const updatedBranches = branches.map((b) =>
      b.id === selectedBranch.id
        ? {
            ...b,
            subTabs: b.subTabs.map((st) => (st.id === subTabId ? { ...st, name: newName } : st)),
          }
        : b
    );

    updateActiveRound({
      branches: updatedBranches,
      subTabs: updatedBranches.flatMap((b) => b.subTabs),
      activeSubTabId: updatedBranches.find((b) => b.id === selectedBranch.id)?.activeSubTabId || '',
    });
  };

  const handleDeleteSubTab = (subTabId: string) => {
    if (!selectedBranch || !activeRound) return;

    const updatedBranches = branches.map((b) => {
      if (b.id !== selectedBranch.id) return b;
      const filteredSubTabs = b.subTabs.filter((st) => st.id !== subTabId);
      const nextActiveSubTabId = filteredSubTabs[0]?.id || '';
      return {
        ...b,
        subTabs: filteredSubTabs,
        activeSubTabId: nextActiveSubTabId,
      };
    });

    const selectedAfterDelete = updatedBranches.find((b) => b.id === selectedBranch.id);
    const nextActiveSubTabId = selectedAfterDelete?.activeSubTabId || '';

    updateActiveRound({
      branches: updatedBranches,
      subTabs: updatedBranches.flatMap((b) => b.subTabs),
      activeSubTabId: nextActiveSubTabId,
    });
    setOpenSubTabCreatorVersion((v) => v + 1);
  };

  const handleAddCustomParty = (name: string, color: string) => {
    const newParty: Party = {
      id: `custom-${Date.now()}`,
      name,
      color,
      isCustom: true,
    };

    updateDbState({
      ...db,
      customParties: [...(db.customParties || []), newParty],
    });
  };

  const handleResetDatabase = () => {
    if (window.confirm('ئایا دڵنیایت لە ڕیستکردنی تەواوی داتابەیس؟ سەرجەم جۆل و دەنگەکان دەسڕدرێنەوە!')) {
      const fresh = StorageService.resetToDefault();
      setDb(fresh);
    }
  };

  return (
    <div className={`theme-adaptive min-h-screen flex flex-col selection:bg-[#d5a438] selection:text-slate-950 font-sans ${
      currentTheme === 'government'
        ? 'bg-[#eef3f8] text-slate-900'
        : currentTheme === 'light'
        ? 'bg-slate-50 text-slate-900'
        : currentTheme === 'gray'
        ? 'bg-slate-800 text-slate-100'
        : 'bg-slate-950 text-white'
    }`}>
      <Navbar
        db={db}
        onOpenSettings={() => setShowSettings(true)}
        onOpenPrint={() => setShowPrintReport(true)}
        onLogout={handleLogout}
        onDatabaseImported={handleDatabaseImported}
        onUpdateTheme={handleUpdateTheme}
      />

      <main className="flex-1 pb-16">
        {isDashboardActive ? (
          <div className="w-full pl-4 pr-0 sm:pl-6 sm:pr-0 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <aside className="self-start lg:col-span-2 lg:order-first lg:sticky lg:top-20">
                <RoundTabs
                  rounds={db.rounds}
                  activeRoundId={db.activeRoundId}
                  onSelectRound={handleSelectRound}
                  onAddRound={handleAddRound}
                  onEditRound={handleEditRound}
                  onDeleteRound={handleDeleteRound}
                  onReorderRounds={handleReorderRounds}
                />
              </aside>

              <section className="lg:col-span-10 lg:order-last min-w-0">
                <GeneralDashboard
                  db={db}
                  useKurdishNumerals={db.settings?.useKurdishNumerals ?? false}
                  onNavigateToRound={handleSelectRound}
                />
              </section>
            </div>
          </div>
        ) : (
          <div className="w-full pl-4 pr-0 sm:pl-6 sm:pr-0 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <aside className="self-start lg:col-span-2 lg:order-first lg:sticky lg:top-20 space-y-4">
                <RoundTabs
                  rounds={db.rounds}
                  activeRoundId={db.activeRoundId}
                  onSelectRound={handleSelectRound}
                  onAddRound={handleAddRound}
                  onEditRound={handleEditRound}
                  onDeleteRound={handleDeleteRound}
                  onReorderRounds={handleReorderRounds}
                />
              </aside>

              <section className="lg:col-span-10 lg:order-last space-y-4">
                {activeRound && (
                  <BranchTabs
                    round={activeRound}
                    activeBranchId={activeBranchId}
                    onSelectBranch={handleSelectBranch}
                    onAddBranch={handleAddBranch}
                    onEditBranch={handleEditBranch}
                    onDeleteBranch={handleDeleteBranch}
                  />
                )}
                  {selectedBranch && (
                    <SubTabs
                      subTabs={selectedBranch.subTabs}
                      activeSubTabId={selectedBranch.activeSubTabId}
                      onSelectSubTab={handleSelectSubTab}
                      onAddSubTab={handleAddSubTab}
                      onEditSubTab={handleEditSubTab}
                      onDeleteSubTab={handleDeleteSubTab}
                    />
                  )}

                {activeSubTab ? (
                  <>
                    <SubTabCharts
                      subTab={activeSubTab}
                      onSelectChartType={(type: ChartType) => {
                        handleUpdateSubTab({
                          ...activeSubTab,
                          selectedChartType: type,
                        });
                      }}
                    />

                    <VoteEntryForm
                      subTab={activeSubTab}
                      customParties={db.customParties || []}
                      useKurdishNumerals={db.settings?.useKurdishNumerals ?? false}
                      onUpdateSubTab={handleUpdateSubTab}
                      onAddCustomParty={handleAddCustomParty}
                      key={openSubTabCreatorVersion}
                    />
                  </>
                ) : (
                  <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-slate-600">
                    تکایە یەک لق زیاد بکە بۆ دەستپێکردنی تۆمارکردنی دەنگ و نیشاندانی چارت.
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className={`py-4 text-center text-xs no-print ${
        currentTheme === 'government' || currentTheme === 'light'
          ? 'border-t border-slate-200 bg-white text-slate-500'
          : currentTheme === 'gray'
          ? 'border-t border-slate-700 bg-slate-800 text-slate-300'
          : 'border-t border-slate-800 bg-slate-950 text-slate-500'
      }`}>
        سیستەمی شیکاری ئەنجامەکانی هەڵبژاردن © 2026 | دروستکردنی: بەهمەن دەروێش علی/یەکەی ئایتی-لقی چوار
      </footer>

      {showSettings && (
        <SettingsModal
          db={db}
          onUpdateDb={updateDbState}
          onResetDb={handleResetDatabase}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showPrintReport && (
        <PrintReport
          db={db}
          activeRoundId={db.activeRoundId}
          onClose={() => setShowPrintReport(false)}
        />
      )}
    </div>
  );
}
