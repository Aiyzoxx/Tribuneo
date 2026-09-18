import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, ScanLine, CheckCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';

export default function AddContactModal({ isOpen, onClose, onAdd, onUpdate, token, contactToEdit }) {
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState(''); // Message de progression OCR
  const [scanSuccess, setScanSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    entreprise: '',
    titre_poste: '',
    email: '',
    telephone_mobile: '',
    telephone_fixe: '',
    ville: '',
    code_postal: '',
    linkedin: '',
    site_web: ''
  });

  useEffect(() => {
    if (contactToEdit) {
      setFormData({
        prenom: contactToEdit.prenom || '',
        nom: contactToEdit.nom || '',
        entreprise: contactToEdit.entreprise || '',
        titre_poste: contactToEdit.titre_poste || '',
        email: contactToEdit.email || '',
        telephone_mobile: contactToEdit.telephone_mobile || '',
        telephone_fixe: contactToEdit.telephone_fixe || '',
        ville: contactToEdit.ville || '',
        code_postal: contactToEdit.code_postal || '',
        linkedin: contactToEdit.linkedin || '',
        site_web: contactToEdit.site_web || ''
      });
    } else {
      setFormData({
        prenom: '', nom: '', entreprise: '', titre_poste: '', email: '',
        telephone_mobile: '', telephone_fixe: '', ville: '', code_postal: '', linkedin: '', site_web: ''
      });
    }
    setError('');
  }, [contactToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setScanSuccess(false);
    setError('');
    setOcrStatus('Lecture de l\'image...');

    try {
      // Étape 1 : OCR avec Tesseract.js (100% client, sans API)
      setOcrStatus('Extraction du texte (OCR)...');
      const worker = await createWorker('fra+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrStatus(`Reconnaissance... ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      if (!text || text.trim().length < 5) {
        throw new Error('Impossible de lire le texte de l\'image. Essayez avec une photo plus nette.');
      }

      // Étape 2 : Envoyer le texte brut à l'IA pour structurer les données
      setOcrStatus('Analyse par l\'IA...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/ai/parse-card-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ocrText: text })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse IA du texte.');
      }

      const data = await response.json();

      // Mise à jour du formulaire avec les données extraites
      setFormData(prev => ({
        ...prev,
        prenom: data.prenom || prev.prenom,
        nom: data.nom || prev.nom,
        entreprise: data.entreprise || prev.entreprise,
        titre_poste: data.titre_poste || prev.titre_poste,
        email: data.email || prev.email,
        telephone_mobile: data.telephone_mobile || prev.telephone_mobile,
        telephone_fixe: data.telephone_fixe || prev.telephone_fixe,
        ville: data.ville || prev.ville,
        code_postal: data.code_postal || prev.code_postal,
        linkedin: data.linkedin || prev.linkedin,
        site_web: data.site_web || prev.site_web
      }));

      setScanSuccess(true);
      setOcrStatus('');
    } catch (err) {
      setError(err.message || 'Erreur inattendue.');
      setOcrStatus('');
    } finally {
      setIsScanning(false);
      // Reset le champ fichier pour permettre de resélectionner le même fichier
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isEditing = !!contactToEdit;
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL || '/api'}/directory-contacts/${contactToEdit.id}`
        : `${import.meta.env.VITE_API_URL || '/api'}/directory-contacts`;
        
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(isEditing ? 'Erreur lors de la modification du contact' : 'Erreur lors de l\'ajout du contact');
      }

      const savedContact = await response.json();
      if (isEditing && onUpdate) {
        onUpdate(savedContact);
      } else if (onAdd) {
        onAdd(savedContact); // Notifie le parent
      }
      onClose(); // Ferme la modale
      setFormData({
        prenom: '', nom: '', entreprise: '', titre_poste: '', email: '',
        telephone_mobile: '', telephone_fixe: '', ville: '', code_postal: '', linkedin: '', site_web: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {contactToEdit ? 'Modifier le contact' : 'Ajouter un nouveau contact'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scan Banner - Cachée en mode édition */}
        {!contactToEdit && (
          <div className="bg-duret-50 dark:bg-duret-900/20 p-4 border-b border-duret-100 dark:border-duret-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-duret-100 dark:bg-duret-800 rounded-full flex items-center justify-center text-duret-600 dark:text-duret-400">
                <Camera size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-duret-900 dark:text-duret-200">Gagnez du temps avec l'IA</p>
                <p className="text-xs text-duret-700 dark:text-duret-400">Prenez en photo une carte de visite pour tout pré-remplir.</p>
              </div>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={isScanning}
              className="w-full sm:w-auto px-4 py-2 bg-duret-600 hover:bg-duret-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {ocrStatus || 'Analyse en cours...'}
                </>
              ) : scanSuccess ? (
                <>
                  <CheckCircle size={16} />
                  Données extraites !
                </>
              ) : (
                <>
                  <ScanLine size={16} />
                  Scanner une carte
                </>
              )}
            </button>
          </div>
        )}

        {/* Formulaire */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <form id="add-contact-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prénom</label>
                <input required type="text" name="prenom" value={formData.prenom} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nom</label>
                <input required type="text" name="nom" value={formData.nom} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Entreprise</label>
                <input type="text" name="entreprise" value={formData.entreprise} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Titre / Poste</label>
                <input type="text" name="titre_poste" value={formData.titre_poste} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Site web</label>
                <input type="url" name="site_web" value={formData.site_web} onChange={handleChange} placeholder="https://..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Téléphone mobile</label>
                <input type="tel" name="telephone_mobile" value={formData.telephone_mobile} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Téléphone fixe</label>
                <input type="tel" name="telephone_fixe" value={formData.telephone_fixe} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ville</label>
                <input type="text" name="ville" value={formData.ville} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Code postal</label>
                <input type="text" name="code_postal" value={formData.code_postal} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Profil LinkedIn</label>
              <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-duret-500 focus:ring-2 focus:ring-duret-200 dark:text-white transition-colors" />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
            Annuler
          </button>
          <button type="submit" form="add-contact-form" disabled={loading || isScanning} className="px-5 py-2.5 text-sm font-semibold text-white bg-duret-600 hover:bg-duret-700 disabled:opacity-50 rounded-xl shadow-md shadow-duret-200 dark:shadow-none transition-all flex items-center gap-2">
            {loading ? 'Enregistrement...' : (contactToEdit ? 'Enregistrer' : 'Ajouter le contact')}
          </button>
        </div>

      </div>
    </div>
  );
}
