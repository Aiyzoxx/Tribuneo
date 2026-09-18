import express from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import axios from 'axios';

const router = express.Router();
const prisma = new PrismaClient();

// Initialiser OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

router.get('/analyse/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    // 1. Récupérer la procédure
    const procedure = await prisma.procedure.findUnique({
      where: { id }
    });

    if (!procedure) {
      return res.status(404).json({ error: 'Procédure non trouvée' });
    }

    // 2. Si l'analyse existe déjà, on la renvoie directement !
    if (procedure.analyse_ia) {
      return res.json({ analyse: procedure.analyse_ia });
    }

    // 3. Récupérer des détails supplémentaires via l'API Sirene si on a le SIREN
    let activiteDetails = 'Non spécifiée';
    if (procedure.siren) {
      try {
        const sirenRes = await axios.get(`https://recherche-entreprises.api.gouv.fr/search?q=${procedure.siren}`);
        if (sirenRes.data?.results?.length > 0) {
          const company = sirenRes.data.results[0];
          activiteDetails = `${company.activite_principale_entreprise || company.libelle_activite_principale} (Code NAF: ${company.activite_principale})`;
        }
      } catch (err) {
        console.error("Erreur appel API Sirene:", err.message);
      }
    }

    // 4. Construire le prompt pour Gemini
    const prompt = `
Tu es un expert en immobilier d'entreprise et en investissement commercial.
Analyse cette procédure collective et déduis-en une opportunité immobilière. 

Informations sur l'entreprise :
- Nom : ${procedure.raison_sociale}
- Forme juridique : ${procedure.forme_juridique}
- Activité / Code NAF : ${activiteDetails}
- Adresse : ${procedure.adresse}, ${procedure.code_postal} ${procedure.ville}
- Type de procédure : ${procedure.type_procedure}

Consignes pour la réponse :
1. Rédige un paragraphe de 3-4 lignes maximum qui analyse la probabilité qu'un local commercial intéressant soit libéré suite à cette procédure.
2. Estime une fourchette de surface typique pour cette activité (ex: Boulangerie = 80 à 150m2, Transport = entrepôt de 500m2+).
3. Ne fais pas de phrases d'introduction du type "Voici l'analyse...". Va droit au but, sois très professionnel et concis.

Réponds au format texte simple ou avec un peu de Markdown (gras).
`;

    // 5. Appeler OpenAI
    let responseText = "";
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }]
      });
      responseText = response.choices[0].message.content;
    } catch (apiError) {
      console.warn("Erreur API Bluesminds/Gemini, utilisation d'un mock en fallback :", apiError.message);
      // Fallback
      responseText = `**Analyse de secours** : D'après les informations, l'entreprise ${procedure.raison_sociale} spécialisée en "${activiteDetails}" libèrera probablement un local. La surface estimée pour cette activité est entre 100 et 300m². C'est une opportunité à suivre attentivement compte tenu de la procédure de ${procedure.type_procedure}.`;
    }

    // 6. Sauvegarder dans la DB
    await prisma.procedure.update({
      where: { id },
      data: { analyse_ia: responseText }
    });

    // 7. Renvoyer au frontend
    res.json({ analyse: responseText });

  } catch (error) {
    console.error('Erreur IA Bluesminds (globale):', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'analyse IA' });
  }
});

// POST /api/ai/scan-card
router.post('/scan-card', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 requise' });
    }

    const prompt = "Extrais les informations de cette carte de visite et renvoie UNIQUEMENT un objet JSON valide avec les clés exactes suivantes : prenom, nom, entreprise, titre_poste, email, telephone_mobile, telephone_fixe, ville, code_postal, linkedin, site_web. Laisse vide (\"\") si non trouvé.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modèle avec vision
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    const parsedData = JSON.parse(response.choices[0].message.content);
    res.json(parsedData);

  } catch (error) {
    console.error('Erreur lors du scan de la carte de visite:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse de l\'image' });
  }
});

// POST /api/ai/parse-card-text — prend du texte brut OCR et structure les infos
router.post('/parse-card-text', async (req, res) => {
  try {
    const { ocrText } = req.body;

    if (!ocrText || ocrText.trim().length === 0) {
      return res.status(400).json({ error: 'Texte OCR requis' });
    }

    const prompt = `Tu es un assistant qui extrait des informations de contact à partir d'un texte brut issu d'une carte de visite.
    
Voici le texte brut extrait par OCR :
---
${ocrText}
---

Extrais les informations et renvoie UNIQUEMENT un objet JSON valide avec ces clés exactes :
prenom, nom, entreprise, titre_poste, email, telephone_mobile, telephone_fixe, ville, code_postal, linkedin, site_web

Règles :
- Si une information n'est pas trouvée, mets une chaîne vide ""
- Pour le téléphone mobile, prends un numéro de portable (commence par 06 ou 07 en France, ou avec +33 6/7)
- Pour le téléphone fixe, prends un numéro fixe (01 à 05, 08, 09)
- Ne renvoie QUE le JSON, rien d'autre`;

    let parsedData = {};

    try {
      // Utilise un modèle texte simple (pas vision) — bien plus compatible
      const response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      parsedData = JSON.parse(response.choices[0].message.content);
    } catch (apiError) {
      console.warn('Erreur API IA (parse-card-text), fallback regex :', apiError.message);
      // Fallback : extraction basique par regex si l'IA échoue
      const emailMatch = ocrText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatches = ocrText.match(/(?:\+33|0)[0-9](?:[\s.-]?[0-9]{2}){4}/g) || [];
      const urlMatch = ocrText.match(/(?:https?:\/\/|www\.)[^\s]+/i);
      const linkedinMatch = ocrText.match(/linkedin\.com\/in\/[^\s]*/i);
      const postalMatch = ocrText.match(/\b[0-9]{5}\b/);

      const mobile = phoneMatches.find(p => /^(?:\+33\s?6|\+33\s?7|06|07)/.test(p)) || '';
      const fixe = phoneMatches.find(p => !/^(?:\+33\s?6|\+33\s?7|06|07)/.test(p)) || '';

      parsedData = {
        prenom: '',
        nom: '',
        entreprise: '',
        titre_poste: '',
        email: emailMatch ? emailMatch[0] : '',
        telephone_mobile: mobile,
        telephone_fixe: fixe,
        ville: '',
        code_postal: postalMatch ? postalMatch[0] : '',
        linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
        site_web: urlMatch && !urlMatch[0].includes('linkedin') ? urlMatch[0] : ''
      };
    }

    res.json(parsedData);
  } catch (error) {
    console.error('Erreur parse-card-text :', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse du texte' });
  }
});

export default router;
