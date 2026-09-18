import React from 'react';
import { MapPin, Calendar, ChevronRight, AlertCircle, Download, Search, Building2 } from 'lucide-react';

const ResultList = ({ results, searchParams, onResultClick }) => {
  if (!searchParams) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in h-full">
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          border: '1.5px solid rgba(255,121,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px', boxShadow: '0 4px 20px rgba(255,121,0,0.08)'
        }} className="bg-orange-50 dark:bg-orange-900/20">
          <Search className="w-8 h-8" style={{ color: '#FF7900', opacity: 0.6 }} />
        </div>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 transition-colors">Lancez une recherche</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed transition-colors">
          Saisissez une ville et un rayon, ou recherchez par SIREN ou nom d'entreprise.
        </p>
      </div>
    );
  }

  const getTypeConfig = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('liquidation')) return {
      label: 'Liquidation',
      bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#ef4444',
      dot: '#ef4444', leftBar: '#ef4444', glow: 'rgba(239,68,68,0.15)',
    };
    if (t.includes('redressement')) return {
      label: 'Redressement',
      bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', color: '#f97316',
      dot: '#f97316', leftBar: '#f97316', glow: 'rgba(249,115,22,0.12)',
    };
    if (t.includes('sauvegarde')) return {
      label: 'Sauvegarde',
      bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.3)', color: '#eab308',
      dot: '#eab308', leftBar: '#eab308', glow: 'rgba(250,204,21,0.1)',
    };
    return {
      label: type || 'Autre',
      bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', color: '#94a3b8',
      dot: '#94a3b8', leftBar: '#cbd5e1', glow: 'rgba(0,0,0,0.04)',
    };
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;
    const headers = ['Raison sociale', 'SIREN', 'Adresse', 'Ville', 'Code postal', 'Type de procédure', 'Date du jugement', 'Tribunal', 'Liquidateur'];
    const escapeCSV = (str) => {
      if (str == null) return '';
      const s = String(str);
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = results.map(r => [r.raison_sociale, r.siren, r.adresse, r.ville, r.code_postal, r.type_procedure,
      r.date_jugement ? new Date(r.date_jugement).toLocaleDateString('fr-FR') : '', r.tribunal, r.liquidateur
    ].map(escapeCSV).join(','));
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const cityName = searchParams?.cityName?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'recherche';
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `resultats_${cityName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-3 py-2.5 shrink-0 animate-slide-right flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #FF7900, #e66800)',
            boxShadow: '0 2px 8px rgba(255,121,0,0.3)',
          }}>
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm transition-colors">Résultats</span>
          <span style={{
            background: 'linear-gradient(135deg, #FF7900, #e66800)',
            color: 'white', fontSize: '11px', fontWeight: '700',
            padding: '2px 8px', borderRadius: '20px',
            boxShadow: '0 2px 6px rgba(255,121,0,0.3)',
          }}>{results.length}</span>
        </div>
        {results.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors hover:border-[#FF7900] dark:hover:border-[#FF7900] hover:text-[#FF7900] dark:hover:text-[#FF7900]"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3 transition-colors">
            <AlertCircle className="w-6 h-6 text-slate-300 dark:text-slate-500" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs transition-colors">
            Aucune entreprise trouvée dans ce périmètre pour ce type de procédure.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {results.map((result, index) => {
            const cfg = getTypeConfig(result.type_procedure);
            const staggerClass = `stagger-${Math.min(index + 1, 10)}`;

            return (
              <li
                key={result.id}
                className={`animate-slide-up ${staggerClass} bg-white dark:bg-slate-800 rounded-xl cursor-pointer transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:-translate-y-0.5`}
                onClick={() => onResultClick(result)}
                style={{
                  border: '1px solid',
                  borderColor: 'var(--tw-border-opacity) var(--tw-border-opacity) var(--tw-border-opacity) transparent', // Fallback
                  borderLeft: `3px solid ${cfg.leftBar}`,
                  padding: '12px 12px 12px 14px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.09), 0 0 0 1px ${cfg.leftBar}22`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                }}
              >
                {/* Nom + flèche */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[13px] text-slate-800 dark:text-slate-100 leading-snug mr-2 overflow-hidden line-clamp-1 transition-colors">
                    {result.raison_sociale || 'Raison sociale inconnue'}
                  </h3>
                  <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 opacity-60" style={{ color: cfg.leftBar }} />
                </div>

                {/* Badge type + distance */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '11px', fontWeight: '600',
                    padding: '3px 8px', borderRadius: '6px',
                    background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }}></span>
                    {cfg.label}
                  </span>
                  {result.distance_m != null && (
                    <span className="text-[11px] font-semibold px-2 py-[3px] rounded-md bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 transition-colors">
                      {(result.distance_m / 1000).toFixed(1)} km
                    </span>
                  )}
                </div>

                {/* Lieu + date */}
                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex flex-col gap-[3px] transition-colors">
                  {(result.adresse || result.ville) && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-slate-300 dark:text-slate-500" />
                      <span className="overflow-hidden whitespace-nowrap text-ellipsis">
                        {[result.adresse, result.code_postal, result.ville].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  )}
                  {result.date_jugement && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 shrink-0 text-slate-300 dark:text-slate-500" />
                      <span>{new Date(result.date_jugement).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ResultList;
