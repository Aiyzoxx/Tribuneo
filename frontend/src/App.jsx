import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Map, List } from 'lucide-react';
import useSearch from './hooks/useSearch';
import SearchBar from './components/SearchBar';
import MapView from './components/MapView';
import ResultList from './components/ResultList';
import FicheEntreprise from './components/FicheEntreprise';
import StatisticsPanel from './components/StatisticsPanel';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import AlerteModal from './components/AlerteModal';
import { useAuth } from './context/AuthContext';
import ContactDatabase from './components/ContactDatabase';
import Sidebar from './components/Sidebar';

function App() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { results, loading, error, performSearch, searchParams } = useSearch();
  const [selectedResult, setSelectedResult] = useState(null);
  const [activeTab, setActiveTab] = useState('liste'); // 'liste' or 'fiche'
  const [mobileView, setMobileView] = useState('map'); // 'map' or 'panel'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showProfile, setShowProfile] = useState(false);
  const [showAlertes, setShowAlertes] = useState(false);
  const [alerteVille, setAlerteVille] = useState(null); // ville pré-remplie depuis SearchBar
  const getAppFromPath = () => {
    const path = window.location.pathname;
    if (path.includes('/clientdb')) return 'contacts';
    return 'map'; // Par défaut
  };

  const [currentApp, setCurrentApp] = useState(getAppFromPath());

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Écouter les retours navigateur (flèche retour)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentApp(getAppFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (appId) => {
    let path = '/';
    if (appId === 'map') path = '/proceduresmap';
    if (appId === 'contacts') path = '/clientdb';
    
    window.history.pushState({}, '', path);
    setCurrentApp(appId);
  };

  // Écran de chargement pendant la vérification du token
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,121,0,0.2)', borderTopColor: '#FF7900', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Page de login si non authentifié
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // When a marker is clicked, switch to 'fiche' tab
  const handleResultClick = (result) => {
    setSelectedResult(result);
    setActiveTab('fiche');
    setMobileView('panel'); // Automatically switch to panel on mobile
  };

  return (
    <div className="h-screen w-screen flex flex-row overflow-hidden font-sans bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      {/* HUB SIDEBAR */}
      <Sidebar 
        currentApp={currentApp}
        onNavigate={navigateTo}
        user={user}
        theme={theme}
        setTheme={setTheme}
        setShowProfile={setShowProfile}
        setShowAlertes={setShowAlertes}
        logout={logout}
      />

      {/* CONTAINER PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}
        {showAlertes && <AlerteModal villePreselected={alerteVille} onClose={() => { setShowAlertes(false); setAlerteVille(null); }} />}

        {/* OUTIL : CONTACTS */}
        <div 
          className={`absolute inset-0 bg-slate-50 dark:bg-slate-900 overflow-hidden transition-all duration-300 ease-in-out transform ${
            currentApp === 'contacts' 
              ? 'opacity-100 translate-y-0 pointer-events-auto z-10' 
              : 'opacity-0 translate-y-4 pointer-events-none z-0'
          }`}
        >
          <ContactDatabase 
            theme={theme} 
            setTheme={setTheme} 
            user={user} 
            logout={logout}
          />
        </div>

        {/* OUTIL : MAP */}
        <div 
          className={`absolute inset-0 flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden transition-all duration-300 ease-in-out transform ${
            currentApp === 'map' 
              ? 'opacity-100 translate-y-0 pointer-events-auto z-10' 
              : 'opacity-0 translate-y-4 pointer-events-none z-0'
          }`}
        >
          {/* HEADER PREMIUM B2B (Light/Dark) pour la map */}
          <header className="bg-white dark:bg-slate-800 shrink-0 z-20 relative transition-colors duration-300" style={{
            boxShadow: '0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.03)',
          }}>
            <div className="max-w-screen-2xl mx-auto px-2 md:px-4 py-2 md:py-3 flex flex-col gap-2 md:gap-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
                <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-end gap-3 md:gap-4">
                  <div className="w-full">
                    <SearchBar onSearch={performSearch} isHeader={true} onAlerte={(city) => { setAlerteVille(city); setShowAlertes(true); }} />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content: Map Left / Panel Right */}
          <main className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center animate-fade-in">
            <div className="flex flex-col items-center bg-white rounded-2xl px-8 py-6 shadow-xl border border-slate-100">
              <div className="relative w-14 h-14 mb-4">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#FF7900] border-t-transparent rounded-full animate-spin-slow"></div>
                <div className="absolute inset-2 border-2 border-orange-200 border-b-transparent rounded-full animate-spin" style={{animationDirection:'reverse', animationDuration:'0.5s'}}></div>
              </div>
              <p className="text-slate-800 font-semibold text-sm">Recherche en cours</p>
              <p className="text-slate-400 text-xs mt-1">Analyse des procédures...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-700 px-6 py-3 rounded-lg shadow-lg z-30">
            {error}
          </div>
        )}

        {/* Map View */}
        <section className={`
          h-full z-10 relative transition-all duration-500 ease-in-out border-r-0 md:border-r border-slate-300 dark:border-slate-800
          ${(searchParams && !loading) 
            ? (mobileView === 'map' ? 'block w-full md:w-[60%] lg:w-[65%]' : 'hidden md:block md:w-[60%] lg:w-[65%]') 
            : 'block w-full'}
        `}>
          <MapView 
            results={results} 
            searchParams={searchParams}
            onMarkerClick={handleResultClick}
            selectedResult={selectedResult}
            theme={theme}
          />
        </section>

        {/* Panel View (Tabs) */}
        {(searchParams && !loading) && (
          <section className={`
            flex-col min-h-0 z-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 shadow-[-4px_0_20px_rgba(0,0,0,0.08)] animate-slide-right
            ${mobileView === 'panel' ? 'flex w-full md:w-[40%] lg:w-[35%] h-full' : 'hidden md:flex md:w-[40%] lg:w-[35%] h-full'}
          `}>

          {/* Tabs Navigation — style pilule */}
          <div className="shrink-0 px-3 pt-3 pb-0">
            <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200/60 dark:border-slate-700 transition-colors">
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  activeTab === 'liste'
                    ? 'bg-gradient-to-r from-[#FF7900] to-[#e66800] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
                onClick={() => setActiveTab('liste')}
              >
                Liste
                {results.length > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'liste' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {results.length}
                  </span>
                )}
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  activeTab === 'fiche'
                    ? 'bg-gradient-to-r from-[#FF7900] to-[#e66800] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                } ${!selectedResult ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => selectedResult && setActiveTab('fiche')}
              >
                Détail
              </button>
            </div>
          </div>


          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'liste' ? (
              <ResultList 
                results={results} 
                searchParams={searchParams}
                selectedResult={selectedResult}
                onResultClick={handleResultClick}
                isTabMode={true}
              />
            ) : (
              selectedResult ? (
                <div className="h-full overflow-y-auto">
                  <FicheEntreprise 
                    result={selectedResult} 
                    onBack={() => setActiveTab('liste')} 
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <p>Sélectionnez un point sur la carte ou dans la liste pour voir l'analyse détaillée.</p>
                </div>
              )
            )}
          </div>
        </section>
        )}

        {/* Floating Mobile Toggle Button */}
        {(searchParams && !loading) && (
          <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
            <button 
              onClick={() => setMobileView(mobileView === 'map' ? 'panel' : 'map')}
              className="bg-[#FF7900] hover:bg-[#E66D00] text-white px-6 py-3 rounded-full font-bold shadow-[0_4px_14px_0_rgba(255,121,0,0.39)] flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 border-2 border-white/20"
            >
              {mobileView === 'map' ? <List className="w-5 h-5" /> : <Map className="w-5 h-5" />}
              {mobileView === 'map' ? 'Voir la liste' : 'Voir la carte'}
            </button>
          </div>
        )}
        </main>
        </div>
      </div>
    </div>
  );
}

export default App;
