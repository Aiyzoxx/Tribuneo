import React, { useMemo, useEffect, useState } from 'react';
import { BarChart3, TrendingDown, AlertTriangle, Shield } from 'lucide-react';

const StatisticsPanel = ({ results }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [results]);

  const stats = useMemo(() => {
    const total = results.length;
    let liquidation = 0, redressement = 0, sauvegarde = 0, autre = 0;
    const byMonth = {};

    results.forEach(r => {
      const t = (r.type_procedure || '').toLowerCase();
      if (t.includes('liquidation')) liquidation++;
      else if (t.includes('redressement')) redressement++;
      else if (t.includes('sauvegarde')) sauvegarde++;
      else autre++;

      if (r.date_jugement) {
        const d = new Date(r.date_jugement);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        byMonth[key] = (byMonth[key] || 0) + 1;
      }
    });

    const sortedMonths = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);

    return { total, liquidation, redressement, sauvegarde, autre, sortedMonths };
  }, [results]);

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3 transition-colors">
          <BarChart3 className="w-7 h-7 text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">Lancez une recherche pour voir les statistiques.</p>
      </div>
    );
  }

  const pct = (n) => stats.total ? Math.round((n / stats.total) * 100) : 0;
  const maxMonth = Math.max(...stats.sortedMonths.map(([, v]) => v), 1);

  const categories = [
    { label: 'Liquidation', value: stats.liquidation, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: TrendingDown },
    { label: 'Redressement', value: stats.redressement, color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', icon: AlertTriangle },
    { label: 'Sauvegarde', value: stats.sauvegarde, color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)', icon: Shield },
  ];

  return (
    <div className="p-3 space-y-3 animate-fade-in bg-transparent transition-colors">

      {/* KPI principal */}
      <div className="relative overflow-hidden rounded-2xl p-5 shadow-[0_8px_24px_rgba(255,121,0,0.25)]" style={{
        background: 'linear-gradient(135deg, #FF7900 0%, #e66800 100%)',
      }}>
        <div className="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full bg-white/10" />
        <div className="absolute -bottom-7 right-5 w-[70px] h-[70px] rounded-full bg-white/5" />
        <p className="text-[11px] font-bold text-white/80 tracking-wide mb-1">
          TOTAL PROCÉDURES
        </p>
        <p className="text-5xl font-extrabold text-white leading-none mb-1">
          {stats.total.toLocaleString('fr-FR')}
        </p>
        <p className="text-xs text-white/70">dans le périmètre sélectionné</p>
      </div>

      {/* Répartition */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-colors">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-3 transition-colors">RÉPARTITION</p>
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <div key={cat.label} className={`animate-slide-up stagger-${i + 1}`}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: cat.bg, border: `1px solid ${cat.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <cat.icon style={{ width: '14px', height: '14px', color: cat.color }} />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 transition-colors">{cat.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-200 transition-colors">{cat.value}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1 transition-colors">{pct(cat.value)}%</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden transition-colors">
                <div style={{
                  height: '100%', borderRadius: '99px',
                  background: `linear-gradient(90deg, ${cat.color}, ${cat.color}cc)`,
                  width: animated ? `${pct(cat.value)}%` : '0%',
                  transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.12}s`,
                  boxShadow: `0 0 8px ${cat.color}40`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique mensuel */}
      {stats.sortedMonths.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-colors">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-3 transition-colors">
            ACTIVITÉ (6 DERNIERS MOIS)
          </p>
          <div className="flex items-end gap-1.5 h-[72px]">
            {stats.sortedMonths.map(([month, count], i) => {
              const height = Math.max(8, (count / maxMonth) * 100);
              const label = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' });
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[9px] font-semibold text-slate-300 dark:text-slate-500 transition-colors">{count}</span>
                  <div style={{
                    width: '100%', borderRadius: '6px 6px 4px 4px',
                    background: 'linear-gradient(180deg, #FF7900, #e66800)',
                    boxShadow: '0 2px 8px rgba(255,121,0,0.25)',
                    height: animated ? `${height}%` : '0%',
                    transition: `height 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s`,
                    minHeight: '4px',
                  }} />
                  <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 transition-colors">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Autres */}
      {stats.autre > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 px-3.5 py-2.5 flex justify-between items-center transition-colors">
          <span className="text-xs text-slate-400 dark:text-slate-500 transition-colors">Autres types</span>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 transition-colors">{stats.autre}</span>
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
