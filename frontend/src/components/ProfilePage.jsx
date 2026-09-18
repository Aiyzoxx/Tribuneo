import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Star, Bell, Trash2, MapPin, Building2, Calendar, ExternalLink } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function ProfilePage({ onClose, onSelectProcedure, appColor = 'orange' }) {
  const { user, logout, updateUser } = useAuth();

  const [nom, setNom] = useState(user?.nom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [forceDarkMap, setForceDarkMap] = useState(() => localStorage.getItem('forceDarkMap') !== 'false');

  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');

  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Suivis
  const [suivis, setSuivis] = useState([]);
  const [loadingSuivis, setLoadingSuivis] = useState(true);

  // Alertes
  const [alertes, setAlertes] = useState([]);
  const [loadingAlertes, setLoadingAlertes] = useState(true);

  // Onglet actif
  const [tab, setTab] = useState('profil'); // 'profil' | 'suivis' | 'alertes'

  useEffect(() => {
    // Charger les suivis
    axios.get(`${API}/suivis`)
      .then(res => setSuivis(res.data.suivis || []))
      .catch(() => {})
      .finally(() => setLoadingSuivis(false));

    // Charger les alertes
    axios.get(`${API}/alertes`)
      .then(res => setAlertes(res.data.alertes || []))
      .catch(() => {})
      .finally(() => setLoadingAlertes(false));
  }, []);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoError(''); setInfoSuccess('');
    setInfoLoading(true);
    try {
      const res = await axios.put('/api/auth/profile', { nom, email });
      localStorage.setItem('tribuneo_token', res.data.token);
      updateUser(res.data.user, res.data.token);
      setInfoSuccess('Informations mises à jour avec succès !');
      localStorage.setItem('forceDarkMap', forceDarkMap);
      window.dispatchEvent(new Event('storage')); // Notifier MapView du changement
    } catch (err) {
      setInfoError(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (newPassword !== confirmNewPassword) {
      setPwdError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setPwdLoading(true);
    try {
      const res = await axios.put('/api/auth/profile', { currentPassword, newPassword });
      localStorage.setItem('tribuneo_token', res.data.token);
      setPwdSuccess('Mot de passe mis à jour avec succès !');
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleUnfollow = async (procedureId) => {
    try {
      await axios.delete(`${API}/suivis/${procedureId}`);
      setSuivis(suivis.filter(s => s.procedureId !== procedureId));
    } catch {}
  };

  const handleToggleAlerte = async (alerte) => {
    try {
      const res = await axios.patch(`${API}/alertes/${alerte.id}`, { active: !alerte.active });
      setAlertes(alertes.map(a => a.id === alerte.id ? res.data.alerte : a));
    } catch {}
  };

  const handleDeleteAlerte = async (id) => {
    try {
      await axios.delete(`${API}/alertes/${id}`);
      setAlertes(alertes.filter(a => a.id !== id));
    } catch {}
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const getTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('liquidation')) return { color: '#dc2626', bg: '#fef2f2', label: 'Liquidation' };
    if (t.includes('redressement')) return { color: '#ea580c', bg: '#fff7ed', label: 'Redressement' };
    if (t.includes('sauvegarde')) return { color: '#a16207', bg: '#fefce8', label: 'Sauvegarde' };
    return { color: '#475569', bg: '#f8fafc', label: type || '—' };
  };

  const isIndigo = appColor === 'indigo';
  const primaryText = isIndigo ? 'text-indigo-600' : 'text-[#FF7900]';
  const primaryGradient = isIndigo ? 'from-indigo-600 to-indigo-700' : 'from-[#FF7900] to-[#e66800]';
  const primaryCheckbox = isIndigo ? 'text-indigo-600 focus:ring-indigo-600' : 'text-[#FF7900] focus:ring-[#FF7900]';
  const primaryInputFocus = isIndigo ? 'focus:border-indigo-500 focus:ring-indigo-500/20' : 'focus:border-[#FF7900] focus:ring-[#FF7900]/20';
  
  const getBtnStyle = (isLoading) => {
    if (isIndigo) {
      return { 
        background: isLoading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)', 
        boxShadow: isLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.3)' 
      };
    }
    return { 
      background: isLoading ? 'rgba(255,121,0,0.5)' : 'linear-gradient(135deg, #FF7900, #e66800)', 
      boxShadow: isLoading ? 'none' : '0 4px 14px rgba(255,121,0,0.3)' 
    };
  };

  const inputCls = `w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 
    border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white 
    text-sm outline-none transition-all ${primaryInputFocus}
    placeholder:text-slate-400 dark:placeholder:text-slate-500`;

  const labelCls = `block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2`;

  const tabs = [
    { key: 'profil', label: 'Mon profil' },
    { key: 'suivis', label: `Suivis${suivis.length > 0 ? ` (${suivis.length})` : ''}` },
    { key: 'alertes', label: `Alertes${alertes.length > 0 ? ` (${alertes.length})` : ''}` },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col animate-slide-right overflow-hidden">

        {/* Header du drawer */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${primaryGradient} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
              {(user?.nom || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-[15px]">{user?.nom || 'Utilisateur'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0">
          <div className="flex gap-1 w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  tab === t.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── TAB: PROFIL ── */}
          {tab === 'profil' && (
            <div className="space-y-8 animate-fade-in animate-slide-right" key="profil">
              {/* Infos générales */}
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={primaryText}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Informations personnelles
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Modifiez votre nom et adresse email.</p>

                {infoError && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
                    {infoError}
                  </div>
                )}
                {infoSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl px-4 py-3 text-sm mb-4">
                    {infoSuccess}
                  </div>
                )}

                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div>
                    <label className={labelCls}>Nom complet</label>
                    <input type="text" value={nom} onChange={e => setNom(e.target.value)} className={inputCls} placeholder="Jean Dupont" required />
                  </div>
                  <div>
                    <label className={labelCls}>Adresse email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="vous@exemple.com" required />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="forceDarkMap"
                      checked={forceDarkMap}
                      onChange={(e) => setForceDarkMap(e.target.checked)}
                      className={`w-4 h-4 rounded border-slate-300 ${primaryCheckbox}`}
                    />
                    <label htmlFor="forceDarkMap" className="text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      En thème sombre, afficher la carte en noir
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={infoLoading}
                    className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2"
                    style={getBtnStyle(infoLoading)}
                  >
                    {infoLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</> : 'Enregistrer les modifications'}
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Mot de passe */}
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={primaryText}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Mot de passe
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
                  {user?.google_id ? 'Compte connecté via Google — changement de mot de passe non disponible.' : 'Changez votre mot de passe de connexion.'}
                </p>

                {!user?.google_id && (
                  <>
                    {pwdError && (
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
                        {pwdError}
                      </div>
                    )}
                    {pwdSuccess && (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl px-4 py-3 text-sm mb-4">
                        {pwdSuccess}
                      </div>
                    )}
                    <form onSubmit={handlePwdSubmit} className="space-y-4">
                      <div>
                        <label className={labelCls}>Mot de passe actuel</label>
                        <div className="relative">
                          <input type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={`${inputCls} pr-12`} placeholder="••••••••" required />
                          <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            {showPasswords ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Nouveau mot de passe</label>
                        <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} placeholder="••••••••" required />
                        <p className="text-xs text-slate-400 mt-1.5">Minimum 8 caractères</p>
                      </div>
                      <div>
                        <label className={labelCls}>Confirmer le nouveau mot de passe</label>
                        <input type={showPasswords ? 'text' : 'password'} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className={inputCls} placeholder="••••••••" required />
                      </div>
                      <button
                        type="submit"
                        disabled={pwdLoading}
                        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2"
                        style={getBtnStyle(pwdLoading)}
                      >
                        {pwdLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mise à jour...</> : 'Changer le mot de passe'}
                      </button>
                    </form>
                  </>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Déconnexion */}
              <button
                onClick={logout}
                className="w-full py-3 rounded-xl font-semibold text-red-500 text-sm border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Se déconnecter
              </button>
            </div>
          )}

          {/* ── TAB: SUIVIS ── */}
          {tab === 'suivis' && (
            <div className="animate-fade-in animate-slide-right" key="suivis">
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Dossiers suivis</h2>
                {suivis.length > 0 && (
                  <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {suivis.length}
                  </span>
                )}
              </div>

              {loadingSuivis ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : suivis.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Star className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucun dossier suivi</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Cliquez sur "Suivre" dans une fiche entreprise.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {suivis.map(s => {
                    const badge = getTypeBadge(s.procedure.type_procedure);
                    return (
                      <div
                        key={s.id}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {s.procedure.raison_sociale || 'Raison sociale inconnue'}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              {s.procedure.ville && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{s.procedure.ville}
                                </p>
                              )}
                              {s.procedure.date_jugement && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />{formatDate(s.procedure.date_jugement)}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnfollow(s.procedureId)}
                            className="shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                            title="Retirer des suivis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: ALERTES ── */}
          {tab === 'alertes' && (
            <div className="animate-fade-in animate-slide-right" key="alertes">
              <div className="flex items-center gap-2 mb-5">
                <Bell className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Mes alertes géographiques</h2>
                {alertes.length > 0 && (
                  <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {alertes.length}
                  </span>
                )}
              </div>

              {loadingAlertes ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : alertes.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Bell className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucune alerte configurée</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Utilisez l'icône 🔔 dans l'en-tête pour créer une alerte.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alertes.map(a => (
                    <div
                      key={a.id}
                      className={`bg-white dark:bg-slate-800 rounded-xl border p-3.5 flex items-center gap-3 group transition-all ${
                        a.active
                          ? 'border-indigo-200 dark:border-indigo-800/60 shadow-sm'
                          : 'border-slate-100 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{a.ville}</p>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                            {a.rayon_km} km
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 pl-5">
                          {a.active ? '🟢 Active' : '⚫ Désactivée'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleAlerte(a)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            a.active
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                              : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {a.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleDeleteAlerte(a.id)}
                          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
