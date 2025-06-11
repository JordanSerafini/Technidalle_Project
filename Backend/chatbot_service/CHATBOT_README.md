# 🤖 Service Chatbot avec Base de Données

Ce service NestJS fournit un chatbot intelligent qui peut interroger directement vos bases de données PostgreSQL en utilisant l'API OpenAI pour générer et interpréter les requêtes SQL.

## 🚀 Fonctionnalités

- **Chat intelligent** : Répond aux questions en langage naturel
- **Connexion directe PostgreSQL** : Accès direct aux bases de données sans intermédiaire
- **Requêtes SQL automatiques** : Génère et exécute des requêtes SQL basées sur vos questions
- **Multi-bases** : Supporte les bases `sync` et `app`
- **Historique des conversations** : Maintient le contexte des conversations
- **API REST** : Interface facile à intégrer
- **Sécurité** : Requêtes READ-ONLY uniquement

## 🛠️ Configuration

### 1. Variables d'environnement

Créez un fichier `.env` basé sur `env.example` :

```bash
cp env.example .env
```

Configurez vos variables :

```env
# Configuration OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Configuration Base de données Sync
POSTGRES_SYNC_HOST=localhost
POSTGRES_SYNC_PORT=5433
POSTGRES_SYNC_USER=sync_user
POSTGRES_SYNC_PASSWORD=sync_password
POSTGRES_SYNC_DATABASE=sync_db

# Configuration Base de données App
POSTGRES_APP_HOST=localhost
POSTGRES_APP_PORT=5432
POSTGRES_APP_USER=postgres
POSTGRES_APP_PASSWORD=postgres
POSTGRES_APP_DATABASE=postgres

# Configuration du service
PORT=3001
NODE_ENV=development
```

### 2. Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run start:dev

# Démarrage en production
npm run start:prod
```

## 📋 API Endpoints

### POST /chatbot/chat
Envoie un message au chatbot

**Request:**
```json
{
  "message": "Combien d'utilisateurs dans la base app ?",
  "conversationId": "optional-conversation-id",
  "database": "sync"
}
```

**Response:**
```json
{
  "message": "Il y a 1,245 utilisateurs dans la base app.",
  "conversationId": "uuid-conversation-id",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "app"
}
```

### GET /chatbot/conversation/:id/history
Récupère l'historique d'une conversation

### DELETE /chatbot/conversation/:id
Supprime une conversation

### GET /chatbot/health
Vérification de l'état du service

### GET /chatbot/databases/status
Statut des connexions aux bases de données

## 💬 Exemples d'utilisation

### Commandes supportées :

1. **Sélection de base de données :**
   - "base sync" - Utilise la base de synchronisation
   - "base app" - Utilise la base applicative

2. **Informations générales :**
   - "liste tables" - Affiche toutes les tables
   - "schéma" - Montre la structure des tables
   - "aide" - Guide d'utilisation

3. **Requêtes de données :**
   - "Combien d'enregistrements dans la table Customer ?"
   - "Montre-moi les 10 derniers enregistrements de la table orders"
   - "Quelle est la moyenne des prix ?"
   - "Liste des produits par catégorie"

### Test avec curl :

```bash
# Test de santé
curl http://localhost:3001/chatbot/health

# Sélection de base de données
curl -X POST http://localhost:3001/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "base sync"}'

# Liste des tables
curl -X POST http://localhost:3001/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "liste tables"}'

# Question avec données
curl -X POST http://localhost:3001/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Combien d'\''enregistrements dans la première table ?", "database": "sync"}'
```

## 🔧 Architecture

```
src/
├── chatbot/
│   ├── chatbot.controller.ts    # API REST endpoints
│   ├── chatbot.service.ts       # Logique métier principale
│   ├── chatbot.module.ts        # Module NestJS
│   ├── openai.service.ts        # Intégration OpenAI
│   ├── database.service.ts      # Connexion directe PostgreSQL
│   └── dto/
│       └── chat.dto.ts         # Types TypeScript
├── app.module.ts               # Module principal
└── main.ts                     # Point d'entrée
```

## 🔄 Flux de fonctionnement

1. **Réception du message** → Contrôleur REST
2. **Analyse du message** → Détection des intentions (liste tables, requête, etc.)
3. **Sélection de base** → Détermine quelle base de données utiliser
4. **Génération SQL** → OpenAI génère la requête SQL appropriée
5. **Exécution directe** → PostgreSQL via connexion directe
6. **Formatage** → Réponse structurée pour l'utilisateur

## 🛡️ Sécurité

- **Requêtes READ-ONLY** : Seules les requêtes SELECT sont autorisées
- **Validation stricte** : Vérification des mots-clés dangereux
- **Connexions sécurisées** : Pools de connexions PostgreSQL avec timeout
- **Gestion d'erreurs** : Messages d'erreur sécurisés
- **Validation des entrées** : Messages et IDs de conversation validés

## 🚨 Dépannage

### Erreur de connexion PostgreSQL
```bash
# Vérifiez que PostgreSQL est accessible
pg_isready -h localhost -p 5433

# Testez la connexion avec psql
psql -h localhost -p 5433 -U sync_user -d sync_db
```

### Erreur OpenAI
- Vérifiez votre clé API `OPENAI_API_KEY`
- Contrôlez vos quotas OpenAI

### Pas de réponse aux requêtes
- Vérifiez les logs du service
- Contrôlez les variables d'environnement
- Vérifiez les permissions PostgreSQL

## 📝 Configuration PostgreSQL

### Permissions requises pour l'utilisateur sync_user :

```sql
-- Accordez les permissions nécessaires
GRANT CONNECT ON DATABASE sync_db TO sync_user;
GRANT USAGE ON SCHEMA public TO sync_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sync_user;

-- Pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO sync_user;
```

## 📊 Différences avec l'approche MCP

Cette version utilise une **connexion directe PostgreSQL** plutôt que le serveur MCP :

**Avantages :**
- ✅ Plus simple à configurer
- ✅ Moins de latence
- ✅ Gestion d'erreurs plus directe
- ✅ Pas de dépendance WebSocket

**Inconvénients :**
- ❌ Duplication de la logique de base de données
- ❌ Maintenance séparée des connexions DB

## 💡 Notes importantes

- Le service se connecte directement aux bases PostgreSQL
- Les requêtes sont automatiquement limitées (LIMIT 50 par défaut)
- Les conversations sont stockées en mémoire (redémarrage = perte)
- Les logs affichent les requêtes SQL exécutées pour le débogage

---

🚀 **Le chatbot est prêt à interroger intelligemment vos bases de données PostgreSQL !** 