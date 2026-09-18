import React, { useState, useEffect } from 'react';
import { Building2, Scale, ExternalLink, Hash, Briefcase, Star, Phone, Sparkles, ArrowLeft, MapPin, Calendar, MessageSquare } from 'lucide-react';
import axios from 'axios';
import ContactModal from './ContactModal';

const API = import.meta.env.VITE_API_URL || '/api';

const FicheEntreprise = ({ result, onBack }) => {
  const [activityInfo, setActivityInfo] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [iaAnalysis, setIaAnalysis] = useState(null);
  const [loadingIa, setLoadingIa] = useState(false);

  // États Suivre
  const [suivie, setSuivie] = useState(false);
  const [loadingSuivi, setLoadingSuivi] = useState(true);
  const [togglingFollow, setTogglingFollow] = useState(false);

  // États Contacter
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    if (!result?.siren) return;
    setLoadingActivity(true);
    axios.get(`https://recherche-entreprises.api.gouv.fr/search?q=${result.siren}`)
      .then(res => {
        if (res.data?.results?.length > 0) {
          const c = res.data.results[0];
          setActivityInfo({ naf: c.activite_principale, libelle: c.activite_principale_entreprise || c.libelle_activite_principale, categorie: c.categorie_entreprise });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingActivity(false));
  }, [result?.siren]);

  useEffect(() => {
    if (!result?.id) return;
    setLoadingIa(true);
    setIaAnalysis(null);
    axios.get(`${API}/ai/analyse/${result.id}`)
      .then(res => { if (res.data?.analyse) setIaAnalysis(res.data.analyse); })
      .catch(() => setIaAnalysis("L'analyse n'a pas pu être générée."))
      .finally(() => setLoadingIa(false));
  }, [result?.id]);

  // Vérifier si la procédure est suivie + count contacts
  useEffect(() => {
    if (!result?.id) return;
    setLoadingSuivi(true);

    // Check suivi
    axios.get(`${API}/suivis/check/${result.id}`)
      .then(res => setSuivie(res.data.suivie))
      .catch(() => {})
      .finally(() => setLoadingSuivi(false));

    // Count contacts
    axios.get(`${API}/contacts/${result.id}`)
      .then(res => setContactCount(res.data.contacts?.length || 0))
      .catch(() => {});
  }, [result?.id]);

  const handleToggleSuivi = async () => {
    if (togglingFollow) return;
    setTogglingFollow(true);
    try {
      if (suivie) {
        await axios.delete(`${API}/suivis/${result.id}`);
        setSuivie(false);
      } else {
        await axios.post(`${API}/suivis`, { procedureId: result.id });
        setSuivie(true);
      }
    } catch (err) {
      console.error('Erreur toggle suivi:', err);
    } finally {
      setTogglingFollow(false);
    }
  };

  const getTypeConfig = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('liquidation')) return { label: 'Liquidation', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', headerBg: 'linear-gradient(135deg, #ef4444, #dc2626)', darkBg: 'rgba(239,68,68,0.1)', darkBorder: 'rgba(239,68,68,0.2)' };
    if (t.includes('redressement')) return { label: 'Redressement', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', headerBg: 'linear-gradient(135deg, #f97316, #ea580c)', darkBg: 'rgba(249,115,22,0.1)', darkBorder: 'rgba(249,115,22,0.2)' };
    if (t.includes('sauvegarde')) return { label: 'Sauvegarde', color: '#a16207', bg: '#fefce8', border: '#fde68a', headerBg: 'linear-gradient(135deg, #eab308, #ca8a04)', darkBg: 'rgba(250,204,21,0.1)', darkBorder: 'rgba(250,204,21,0.2)' };
    return { label: type || 'Autre', color: '#475569', bg: '#f8fafc', border: '#e2e8f0', headerBg: 'linear-gradient(135deg, #64748b, #475569)', darkBg: 'rgba(100,116,139,0.1)', darkBorder: 'rgba(100,116,139,0.2)' };
  };

  const cfg = getTypeConfig(result.type_procedure);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <div className="flex flex-col h-full animate-fade-in bg-transparent transition-colors">

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 transition-colors shrink-0" style={{
        borderTop: `4px solid ${cfg.color}`,
        padding: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Bouton retour + badge */}
        <div className="flex justify-between items-center mb-2.5">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 cursor-pointer text-slate-500 dark:text-slate-400 text-xs font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour
            </button>
          )}
          <span
            className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color }}></span>
            {cfg.label}
          </span>
        </div>

        {/* Nom */}
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug mb-1 transition-colors">
          {result.raison_sociale || 'Raison sociale inconnue'}
        </h2>
        {result.siren && (
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-3 transition-colors">
            <Hash className="w-3 h-3" /> SIREN {result.siren}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {/* Bouton Suivre */}
          <button
            onClick={handleToggleSuivi}
            disabled={loadingSuivi || togglingFollow}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 cursor-pointer text-xs font-semibold transition-all border ${
              suivie
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100'
                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {togglingFollow ? (
              <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <Star className={`w-3.5 h-3.5 transition-all ${suivie ? 'fill-amber-500 text-amber-500' : ''}`} />
            )}
            {suivie ? 'Suivi ✓' : 'Suivre'}
          </button>

          {/* Bouton Contacter */}
          <button
            style={{ background: cfg.color, boxShadow: `0 3px 10px ${cfg.color}40` }}
            className="flex-1 flex items-center justify-center gap-1.5 text-white border-none rounded-lg py-1.5 cursor-pointer text-xs font-bold transition-transform hover:scale-[1.02] relative"
            onClick={() => setShowContactModal(true)}
          >
            <Phone className="w-3.5 h-3.5" />
            Contacter
            {contactCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm" style={{ color: cfg.color }}>
                {contactCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Contenu défilable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Analyse IA */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-500/15 dark:border-indigo-500/30 overflow-hidden shadow-[0_1px_8px_rgba(99,102,241,0.08)] dark:shadow-none transition-colors">
          <div className="px-3.5 py-3 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-bold text-white">Analyse IA — Opportunité</p>
          </div>
          <div className="p-3.5">
            {loadingIa ? (
              <div className="flex flex-col items-center py-4 gap-2">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin-slow" />
                <p className="text-xs text-indigo-500 font-medium">Analyse en cours...</p>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap transition-colors">
                  {iaAnalysis || 'Analyse non disponible.'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700 italic transition-colors">
                  Analyse générée automatiquement par IA.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Localisation */}
        <InfoCard icon={<MapPin className="w-4 h-4 text-[#FF7900]" />} title="Localisation">
          {(result.adresse || result.ville) && (
            <InfoRow label="Adresse" value={[result.adresse, result.code_postal, result.ville].filter(Boolean).join(' ')} />
          )}
          {result.forme_juridique && <InfoRow label="Forme juridique" value={result.forme_juridique} />}
          {activityInfo && (
            <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-colors">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wide mb-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> CODE NAF
              </p>
              <p className="text-[13px] text-slate-800 dark:text-slate-200 font-semibold transition-colors">{activityInfo.libelle || '—'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 transition-colors">{activityInfo.naf}{activityInfo.categorie ? ` · ${activityInfo.categorie}` : ''}</p>
            </div>
          )}
          {loadingActivity && <p className="text-xs text-slate-400 italic mt-1.5">Recherche du secteur...</p>}
        </InfoCard>

        {/* Jugement */}
        <InfoCard icon={<Scale className="w-4 h-4 text-[#FF7900]" />} title="Détails du jugement">
          <InfoRow label="Date" value={formatDate(result.date_jugement)} />
          <InfoRow label="Tribunal" value={result.tribunal || '—'} />
          {result.liquidateur && <InfoRow label="Mandataire" value={result.liquidateur} />}
        </InfoCard>

        {/* BODACC */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex justify-between items-center transition-colors">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Source: BODACC <span className="text-slate-300 dark:text-slate-600">·</span> {result.numen}</p>
          <a
            href={`https://www.bodacc.fr/pages/annonces-commerciales-detail/?q.id=id:${result.numen}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#FF7900] no-underline hover:text-[#e66800] transition-colors"
          >
            BODACC.fr <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Modal Contacts */}
      {showContactModal && (
        <ContactModal
          procedure={result}
          onClose={() => {
            setShowContactModal(false);
            // Refresh count
            axios.get(`${API}/contacts/${result.id}`)
              .then(res => setContactCount(res.data.contacts?.length || 0))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
};

// Composants helpers
const InfoCard = ({ icon, title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-colors">
    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 transition-colors">
      {icon}
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">{title.toUpperCase()}</p>
    </div>
    <div className="p-3.5 flex flex-col gap-2">
      {children}
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start gap-3">
    <span className="text-[12px] text-slate-400 dark:text-slate-500 shrink-0 min-w-[80px] transition-colors">{label}</span>
    <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 text-right transition-colors">{value}</span>
  </div>
);

export default FicheEntreprise;
