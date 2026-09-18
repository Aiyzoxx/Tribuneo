# Plan de Refonte V2 (Interface et Fonctionnalités)

Cette mise à jour majeure transforme l'application en un véritable outil métier de prospection immobilière en repensant complètement l'ergonomie et en ajoutant des fonctionnalités d'analyse.

## User Review Required

> [!IMPORTANT]
> Les fonctionnalités avancées telles que **l'Analyse par IA**, le système **d'Alertes (Emails/Push)**, et le suivi **CRM (Contacter/Suivre)** nécessitent une infrastructure complexe (serveur d'IA, base de données utilisateurs, envois d'emails). 
> **Question :** Pour cette V2 immédiate, souhaitez-vous que je crée uniquement l'interface visuelle (maquettes interactives) pour ces nouvelles fonctionnalités afin de valider l'UX, ou dois-je également construire toute l'infrastructure backend (base de données, crons) dès maintenant ?

> [!NOTE]
> Le filtre "Activité" se basera sur la recherche textuelle (ex: "Boulangerie") car les données BODACC ne fournissent pas toujours un code NAF standardisé.

## Proposed Changes

### Composants Interface & UX (Frontend)

---

#### [MODIFY] [App.jsx](file:///c:/Users/Valentin/Videos/siteliquidation/frontend/src/App.jsx)
- **Navigation :** Modification de la barre supérieure (`<header>`) pour qu'elle soit en "bleu marine foncé" avec un texte contrasté.
- **Layout Central :** Suppression de la marge ou du chrome superflu. La carte occupera l'espace gauche.
- **Panneau de droite :** Remplacement de l'affichage conditionnel (Liste OU Fiche) par un système d'onglets (Tabs "Liste des résultats" / "Détail du dossier").

#### [MODIFY] [SearchBar.jsx](file:///c:/Users/Valentin/Videos/siteliquidation/frontend/src/components/SearchBar.jsx)
- **Filtres visuels :** Remplacement des menus déroulants (`<select>`) de type de procédure par des "pills" cliquables colorés (Rouge, Orange, Vert).
- **Filtre Activité :** Ajout d'un champ de saisie ou d'un menu de catégories pour filtrer par secteur (restauration, transport, etc.).
- **Bouton Alertes :** Ajout d'un bouton "Créer une Alerte" dans la barre d'outils.

#### [MODIFY] [MapView.jsx](file:///c:/Users/Valentin/Videos/siteliquidation/frontend/src/components/MapView.jsx)
- **Marqueurs personnalisés :** Suppression des icônes Leaflet par défaut. Création de marqueurs ronds en HTML/CSS (`divIcon`) avec code couleur (Rouge, Orange, Vert) et lettre centrale (L, R, S).
- **Suppression des Popups :** Enlèvement de la balise `<Popup>`. Le clic sur un marqueur mettra directement à jour l'onglet "Détail" du panneau droit et l'ouvrira automatiquement.

#### [MODIFY] [ResultList.jsx](file:///c:/Users/Valentin/Videos/siteliquidation/frontend/src/components/ResultList.jsx)
- **Refonte en Onglets :** Intégration dans le nouveau composant de panneau latéral avec la fiche.
- **Bouton Export :** Mise en évidence du bouton d'export CSV actuel.

#### [MODIFY] [FicheEntreprise.jsx](file:///c:/Users/Valentin/Videos/siteliquidation/frontend/src/components/FicheEntreprise.jsx)
- **Bloc "Analyse opportunité" :** Ajout d'une section synthétisant les données (générée statiquement ou via une règle pour l'instant) orientée immobilier.
- **Boutons d'Action :** Ajout des boutons "Suivre" (étoile/bookmark) et "Contacter" (icône téléphone/email) en haut de la fiche.

### Backend & API

---

#### [MODIFY] [search.js](file:///c:/Users/Valentin/Videos/siteliquidation/backend/src/routes/search.js)
- **Filtre Activité :** Modification de la requête SQL pour rechercher dans la colonne `activite` ou `raison_sociale` si un filtre de secteur est fourni.

## Verification Plan

### Manual Verification
1. Vérifier que la barre de navigation est bien bleu marine.
2. Vérifier que la carte ne montre plus de popups au clic, mais ouvre bien la fiche détaillée dans le panneau de droite.
3. Vérifier la présence des nouveaux boutons (Export, Alerte, Suivre, Contacter).
4. Vérifier l'affichage des nouveaux marqueurs L, R, S sur la carte.
5. Vérifier la présence du bloc "Analyse opportunité" sur la fiche détail.
