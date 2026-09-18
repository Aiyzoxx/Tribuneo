import React from 'react';
import { Map, Users, Bell, Moon, Sun, LogOut } from 'lucide-react';

export default function Sidebar({ 
  currentApp, 
  onNavigate, 
  user, 
  theme, 
  setTheme, 
  setShowProfile, 
  setShowAlertes, 
  logout 
}) {
  return (
    <div className="w-16 md:w-20 lg:w-64 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 z-30 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100 dark:border-slate-700/50">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => onNavigate('map')}
          title="Tribuneo Hub"
        >
          <div style={{
            borderRadius: '10px',
            border: '1px solid rgba(255,121,0,0.2)',
            boxShadow: '0 2px 8px rgba(255,121,0,0.15)',
            overflow: 'hidden', padding: '1px',
          }} className="w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-slate-800 shrink-0">
            <img src="/logo.png" alt="Tribuneo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight mb-0.5">Tribuneo</h1>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              by Groupe Duret
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tools */}
      <div className="flex-1 py-6 flex flex-col gap-2 px-2 lg:px-4">
        <button
          onClick={() => onNavigate('map')}
          className={`flex items-center gap-3 p-3 lg:px-4 rounded-xl transition-all ${
            currentApp === 'map' 
              ? 'bg-duret-50 dark:bg-duret-900/30 text-duret-600 dark:text-duret-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
          title="Procédures Map"
        >
          <Map size={22} className="shrink-0" />
          <span className="hidden lg:block">Procédures Map</span>
        </button>

        <button
          onClick={() => onNavigate('contacts')}
          className={`flex items-center gap-3 p-3 lg:px-4 rounded-xl transition-all ${
            currentApp === 'contacts' 
              ? 'bg-duret-50 dark:bg-duret-900/30 text-duret-600 dark:text-duret-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
          title="Base de données Contact"
        >
          <Users size={22} className="shrink-0" />
          <span className="hidden lg:block">Base de Contacts</span>
        </button>
      </div>

      {/* User Actions */}
      <div className="p-2 lg:p-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-2">
        {currentApp === 'map' && (
          <button
            onClick={() => setShowAlertes(true)}
            className="flex items-center gap-3 p-3 lg:px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-duret-500 dark:hover:text-duret-400 transition-colors"
            title="Alertes"
          >
            <Bell size={20} className="shrink-0" />
            <span className="hidden lg:block font-medium">Alertes Géo.</span>
          </button>
        )}

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="flex items-center gap-3 p-3 lg:px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          title="Thème"
        >
          {theme === 'light' ? <Moon size={20} className="shrink-0" /> : <Sun size={20} className="shrink-0" />}
          <span className="hidden lg:block font-medium">{theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}</span>
        </button>

        <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1 lg:my-2 mx-2" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-2 lg:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowProfile(true)}
              title="Mon profil"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7900] to-[#e66800] border-2 border-white dark:border-slate-700 flex items-center justify-center text-[14px] font-bold text-white shrink-0 shadow-md hover:scale-105 transition-transform"
            >
              {(user?.nom || user?.email || 'U')[0].toUpperCase()}
            </button>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                {user?.nom || user?.prenom ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Utilisateur'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            title="Se déconnecter"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
