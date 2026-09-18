import React, { useState, useEffect, useCallback } from 'react';
import { X, Bell, Plus, Trash2, MapPin, ToggleLeft, ToggleRight, Search, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

const RAYONS = [10, 20, 30, 50, 100];

export default function AlerteModal({ onClose, villePreselected }) {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(!!villePreselected);
  const [villeSelected, setVilleSelected] = useState(villePreselected || null);
  const [villeQuery, setVilleQuery] = useState(villePreselected ? villePreselected.label : '');
  const [villeResults, setVilleResults] = useState([]);
  const [searchingVille, setSearchingVille] = useState(false);
  const [rayonKm, setRayonKm] = useState(30);


  useEffect(() => {
    fetchAlertes();
  }, []);

  const fetchAlertes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/alertes`);
      setAlertes(res.data.alertes || []);
    } catch {
      setError('Impossible de charger les alertes.');
    } finally {
      setLoading(false);
    }
  };

  // Recherche de ville via API adresse.data.gouv.fr
  const searchVille = useCallback(async (q) => {
    if (!q || q.length < 2) { setVilleResults([]); return; }
    setSearchingVille(true);
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&type=municipality&limit=5`);
      const data = await res.json();
      setVilleResults(data.features || []);
    } catch {
      setVilleResults([]);
    } finally {
      setSearchingVille(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchVille(villeQuery), 350);
    return () => clearTimeout(t);
  }, [villeQuery, searchVille]);

  const handleSelectVille = (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    setVilleSelected({ nom: feature.properties.label, lat, lng });
    setVilleQuery(feature.properties.label);
    setVilleResults([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!villeSelected) return setError('Veuillez sélectionner une ville dans la liste.');
    setSaving(true);
    setError('');
    try {
      const res = await axios.post(`${API}/alertes`, {
        ville: villeSelected.nom,
        rayon_km: rayonKm,
        lat: villeSelected.lat,
        lng: villeSelected.lng,
      });
      setAlertes([res.data.alerte, ...alertes]);
      setShowForm(false);
      setVilleQuery('');
      setVilleSelected(null);
      setRayonKm(30);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (alerte) => {
    try {
      const res = await axios.patch(`${API}/alertes/${alerte.id}`, { active: !alerte.active });
      setAlertes(alertes.map((a) => (a.id === alerte.id ? res.data.alerte : a)));
    } catch {
      setError('Impossible de modifier l\'alerte.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/alertes/${id}`);
      setAlertes(alertes.filter((a) => a.id !== id));
    } catch {
      setError('Impossible de supprimer l\'alerte.');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] pointer-events-auto animate-fade-in"
          style={{ border: '1px solid rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">Mes alertes géographiques</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                  Soyez notifié des nouvelles procédures
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Bouton ajouter */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Créer une alerte
              </button>
            )}

            {/* Formulaire */}
            {showForm && (
              <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Nouvelle alerte</p>

                {/* Recherche ville */}
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3 h-3 inline mr-1" />Ville
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={villeQuery}
                      onChange={e => { setVilleQuery(e.target.value); setVilleSelected(null); }}
                      placeholder="Ex: Lyon, Bordeaux..."
                      className="w-full px-3 py-2.5 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 placeholder:text-slate-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {searchingVille ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  {/* Dropdown suggestions */}
                  {villeResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-10 overflow-hidden">
                      {villeResults.map((f, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectVille(f)}
                          className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0 flex items-center gap-2"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {f.properties.label}
                          <span className="ml-auto text-xs text-slate-400">{f.properties.context}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rayon */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Rayon : <span className="text-indigo-500 font-bold">{rayonKm} km</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {RAYONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRayonKm(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          rayonKm === r
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                            : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-500'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !villeSelected}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                  >
                    {saving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Création...</> : 'Créer l\'alerte'}
                  </button>
                </div>
              </form>
            )}

            {/* Liste des alertes */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : alertes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-10 h-10 mb-3 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucune alerte configurée</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Créez une alerte pour être notifié des nouvelles procédures.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alertes.map((a) => (
                  <div
                    key={a.id}
                    className={`bg-white dark:bg-slate-800 rounded-xl border p-3.5 flex items-center gap-3 group transition-all ${
                      a.active
                        ? 'border-indigo-200 dark:border-indigo-800/60 shadow-sm shadow-indigo-50 dark:shadow-none'
                        : 'border-slate-100 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {a.ville}
                        </p>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                          {a.rayon_km} km
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 pl-5">
                        {a.active ? '🟢 Active' : '⚫ Désactivée'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggle(a)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        title={a.active ? 'Désactiver' : 'Activer'}
                      >
                        {a.active
                          ? <ToggleRight className="w-5 h-5 text-indigo-500" />
                          : <ToggleLeft className="w-5 h-5" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
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
        </div>
      </div>
    </>
  );
}
