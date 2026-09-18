import React, { useState, useEffect } from 'react';
import { X, Phone, Plus, Trash2, User, Calendar, FileText, MessageSquare } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ContactModal({ procedure, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [interlocuteur, setInterlocuteur] = useState('');
  const [note, setNote] = useState('');
  const [dateContact, setDateContact] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/contacts/${procedure.id}`);
      setContacts(res.data.contacts || []);
    } catch {
      setError('Impossible de charger les contacts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await axios.post(`${API}/contacts`, {
        procedureId: procedure.id,
        interlocuteur,
        note,
        date_contact: dateContact,
      });
      setContacts([res.data.contact, ...contacts]);
      setInterlocuteur('');
      setNote('');
      setDateContact(new Date().toISOString().slice(0, 10));
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/contacts/${id}`);
      setContacts(contacts.filter((c) => c.id !== id));
    } catch {
      setError('Impossible de supprimer le contact.');
    }
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 
    bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none 
    transition-all focus:border-[#FF7900] focus:ring-2 focus:ring-[#FF7900]/20
    placeholder:text-slate-400 dark:placeholder:text-slate-500`;

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
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF7900, #e66800)' }}>
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">Contacts CRM</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-none mt-0.5 truncate max-w-[220px]">
                  {procedure.raison_sociale}
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
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-[#FF7900] hover:text-[#FF7900] transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajouter un contact
              </button>
            )}

            {/* Formulaire */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1">Nouveau contact</p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    <User className="w-3 h-3 inline mr-1" />Interlocuteur
                  </label>
                  <input
                    type="text"
                    value={interlocuteur}
                    onChange={e => setInterlocuteur(e.target.value)}
                    className={inputCls}
                    placeholder="Jean Dupont — Liquidateur"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />Date du contact
                  </label>
                  <input
                    type="date"
                    value={dateContact}
                    onChange={e => setDateContact(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    <FileText className="w-3 h-3 inline mr-1" />Note
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="Résumé de l'échange, opportunités identifiées..."
                  />
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
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                    style={{ background: saving ? 'rgba(255,121,0,0.5)' : 'linear-gradient(135deg, #FF7900, #e66800)', boxShadow: saving ? 'none' : '0 4px 12px rgba(255,121,0,0.3)' }}
                  >
                    {saving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enregistrement...</> : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            {/* Liste des contacts */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-[#FF7900] rounded-full animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mb-3 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucun contact enregistré</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ajoutez vos premiers échanges avec ce dossier.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3.5 group relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {c.interlocuteur && (
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {c.interlocuteur}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(c.date_contact)}
                        </p>
                        {c.note && (
                          <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
                            {c.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
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
