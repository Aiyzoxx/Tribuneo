import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Globe, MapPin, Building, Briefcase, Download, Plus, Bell, Moon, Sun, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AddContactModal from './AddContactModal';

function ContactDatabase({ theme, setTheme, user, logout }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  const { token } = useAuth(); // using existing auth

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const fetchContacts = async () => {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/directory-contacts${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!contacts || contacts.length === 0) return;

    // Définir les en-têtes du CSV
    const headers = [
      'Prénom', 'Nom', 'Email', 'Téléphone Mobile', 'Téléphone Fixe',
      'Entreprise', 'Fonction', 'Site Web', 'LinkedIn', 'Ville', 'Code Postal'
    ];

    // Créer les lignes CSV
    const csvRows = [headers.join(',')];

    for (const contact of contacts) {
      const row = [
        contact.prenom || '',
        contact.nom || '',
        contact.email || '',
        contact.telephone_mobile || '',
        contact.telephone_fixe || '',
        contact.entreprise || '',
        contact.titre_poste || '',
        contact.site_web || '',
        contact.linkedin || '',
        contact.ville || '',
        contact.code_postal || ''
      ].map(val => {
        // Gérer les guillemets et les virgules dans les données
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });

      csvRows.push(row.join(','));
    }

    // Ajouter le BOM UTF-8 pour que Excel lise bien les accents
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `base_contacts_tribuneo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleContactAdded = (newContact) => {
    // Ajoute le contact au début de la liste
    setContacts(prev => [newContact, ...prev]);
  };

  const handleContactUpdated = (updatedContact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
  };

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/directory-contacts/${contactToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setContacts(prev => prev.filter(c => c.id !== contactToDelete));
        setContactToDelete(null);
      } else {
        console.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const openAddModal = () => {
    setContactToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (contact) => {
    setContactToEdit(contact);
    setIsModalOpen(true);
  };

  const filteredContacts = contacts;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-duret-200 border-t-duret-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col font-sans bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Titre de la page */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-duret-100 dark:bg-duret-900/50 rounded-lg flex items-center justify-center text-duret-600 dark:text-duret-400 shrink-0">
                <UsersIcon size={16} />
              </div>
              <h2 className="text-md font-bold text-slate-700 dark:text-slate-200">Base de données contact</h2>
            </div>
            
            {/* Count for mobile */}
            <p className="text-xs text-slate-500 dark:text-slate-400 md:hidden">{contacts.length} contacts trouvés</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-duret-600 hover:bg-duret-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-duret-200 dark:shadow-none transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Ajouter un contact</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Download size={18} className="text-duret-500" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, entreprise, email, fonction..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:focus:ring-duret-900/30 transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
            <div className="px-6 py-3 bg-duret-50 dark:bg-duret-900/20 text-duret-700 dark:text-duret-300 rounded-xl font-semibold flex items-center justify-center whitespace-nowrap">
              {filteredContacts.length} contacts trouvés
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {contacts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <UsersIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucun contact trouvé</h3>
              <p className="text-slate-500 dark:text-slate-400">Essayez de modifier votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map(contact => (
                <div key={contact.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 flex flex-col group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {contact.prenom} {contact.nom}
                      </h3>
                      {contact.titre_poste && (
                        <div className="flex items-center gap-1.5 text-sm text-duret-600 dark:text-duret-400 mt-1 font-medium">
                          <Briefcase size={14} />
                          {contact.titre_poste}
                        </div>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-400 dark:text-slate-500 shrink-0">
                      {contact.prenom ? contact.prenom[0].toUpperCase() : (contact.nom ? contact.nom[0].toUpperCase() : '?')}
                    </div>
                  </div>

                  {contact.entreprise && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-4 font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <Building size={16} className="text-slate-400" />
                      {contact.entreprise}
                    </div>
                  )}

                  <div className="space-y-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 text-sm">
                    {contact.email && (
                      <div className="flex items-start gap-3">
                        <Mail size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <a href={`mailto:${contact.email}`} className="text-slate-600 dark:text-slate-300 hover:text-duret-500 break-all">{contact.email}</a>
                      </div>
                    )}
                    {(contact.telephone_mobile || contact.telephone_fixe) && (
                      <div className="flex items-start gap-3">
                        <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <div className="text-slate-600 dark:text-slate-300">
                          {contact.telephone_mobile && <div className="hover:text-duret-500"><a href={`tel:${contact.telephone_mobile}`}>{contact.telephone_mobile}</a></div>}
                          {contact.telephone_fixe && <div className="text-slate-500 text-xs mt-0.5 hover:text-duret-400"><a href={`tel:${contact.telephone_fixe}`}>{contact.telephone_fixe} (fixe)</a></div>}
                        </div>
                      </div>
                    )}
                    {contact.ville && (
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {contact.ville} {contact.code_postal && `(${contact.code_postal})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex gap-2">
                      {contact.site_web && (
                        <a href={contact.site_web.startsWith('http') ? contact.site_web : `https://${contact.site_web}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-duret-500 hover:bg-duret-50 dark:hover:bg-duret-900/30 rounded-lg transition-colors" title="Site Web">
                          <Globe size={18} />
                        </a>
                      )}
                      {contact.linkedin && (
                        <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-[#0A66C2] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="LinkedIn">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                        </a>
                      )}
                    </div>
                    
                    {/* Boutons Editer / Supprimer */}
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditModal(contact)}
                        className="p-2 text-slate-400 hover:text-duret-600 hover:bg-duret-50 dark:hover:bg-duret-900/30 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => setContactToDelete(contact.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modale d'ajout/modification de contact */}
      <AddContactModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setContactToEdit(null);
        }} 
        onAdd={handleContactAdded}
        onUpdate={handleContactUpdated}
        contactToEdit={contactToEdit}
        token={token}
      />
      {/* Modale de confirmation de suppression */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Supprimer le contact ?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer ce contact définitivement ?
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDeleteContact}
                className="px-4 py-2 font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-200 dark:shadow-none transition-all"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick fallback for icon used twice
function UsersIcon({ size, className }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

export default ContactDatabase;
