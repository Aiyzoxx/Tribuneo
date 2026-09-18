# Site Liquidation - Procédures Collectives

Application web full-stack pour visualiser sur une carte les entreprises en procédure collective (liquidation, redressement, sauvegarde) dans un rayon donné autour d'une ville française.

## Prérequis

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Installation & Lancement via Docker

1. Clonez ce dépôt ou accédez au dossier du projet.
2. (Optionnel) Copiez le fichier `.env.example` vers `.env` si vous souhaitez modifier les configurations par défaut.
   ```bash
   cp .env.example .env
   ```
3. Lancez les conteneurs Docker (Postgres/PostGIS, Redis, Backend, Frontend) :
   ```bash
   docker-compose up -d --build
   ```
4. Exécutez les migrations de base de données :
   ```bash
   docker-compose exec backend npx prisma db push
   ```
5. Accédez à l'application web :
   - Frontend : [http://localhost:5173](http://localhost:5173)
   - API Backend : [http://localhost:3000](http://localhost:3000)

## Synchronisation des données (BODACC)

La base de données se met à jour automatiquement toutes les nuits à 2h du matin.

Vous pouvez également déclencher une synchronisation manuelle via l'API :
```bash
curl -X POST http://localhost:3000/api/sync \
     -H "Authorization: Bearer my-super-secret-token"
```
*(Remplacez `my-super-secret-token` par la valeur de `SYNC_TOKEN` dans votre fichier `.env`)*

## Stack Technique

- **Frontend** : React, Vite, Tailwind CSS, react-leaflet
- **Backend** : Node.js, Express, node-cron
- **Base de données** : PostgreSQL avec PostGIS (via Prisma)
- **Cache** : Redis
- **APIs tierces** : BODACC OpenData, API Adresse data.gouv.fr
