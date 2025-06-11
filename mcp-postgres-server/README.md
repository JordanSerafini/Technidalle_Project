# 🚀 Serveur MCP PostgreSQL Technidalle

Un serveur **Model Context Protocol (MCP)** spécialement conçu pour la base de données `postgres_sync` du projet Technidalle. Ce serveur permet aux assistants IA (comme Claude, Cursor, etc.) d'interagir de manière sécurisée avec votre base de données PostgreSQL de synchronisation.

## 🌟 Fonctionnalités

- ✅ **Connexion sécurisée** à la base `postgres_sync`
- 🔍 **Requêtes en lecture seule** (SELECT uniquement)
- 📊 **Analyse automatique** des tables et données
- 🏗️ **Inspection des schémas** et structures
- 🛡️ **Sécurité intégrée** avec validation des requêtes
- 🇫🇷 **Interface en français** adaptée au projet Technidalle

## 📋 Prérequis

- **Node.js** >= 18.0.0
- **PostgreSQL** accessible (base `postgres_sync`)
- **Accès réseau** à votre instance PostgreSQL

## 🚀 Installation

### 1. Cloner le serveur MCP

```bash
cd /votre/projet/technidalle
git clone <url-du-repo> mcp-postgres-server
cd mcp-postgres-server
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env` basé sur `env.example` :

```bash
cp env.example .env
```

Éditez le fichier `.env` avec vos paramètres :

```env
# Configuration de la base de données postgres_sync
POSTGRES_SYNC_HOST=localhost
POSTGRES_SYNC_PORT=5433
POSTGRES_SYNC_USER=sync_user
POSTGRES_SYNC_PASSWORD=sync_password
POSTGRES_SYNC_DATABASE=sync_db

# Configuration du serveur MCP
MCP_SERVER_NAME=technidalle-postgres-sync
MCP_SERVER_VERSION=1.0.0
NODE_ENV=development
LOG_LEVEL=info
```

### 4. Compiler le projet

```bash
npm run build
```

## 🔧 Configuration pour Cursor/Claude

### Pour Cursor

Créez ou éditez le fichier `.cursor/mcp.json` dans votre projet :

```json
{
  "mcpServers": {
    "technidalle-postgres": {
      "command": "node",
      "args": ["/chemin/absolu/vers/mcp-postgres-server/dist/index.js"],
      "env": {
        "POSTGRES_SYNC_HOST": "localhost",
        "POSTGRES_SYNC_PORT": "5433",
        "POSTGRES_SYNC_USER": "sync_user",
        "POSTGRES_SYNC_PASSWORD": "sync_password",
        "POSTGRES_SYNC_DATABASE": "sync_db"
      }
    }
  }
}
```

### Pour Claude Desktop

Ajoutez dans votre `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "technidalle-postgres": {
      "command": "node",
      "args": ["/chemin/absolu/vers/mcp-postgres-server/dist/index.js"],
      "env": {
        "POSTGRES_SYNC_HOST": "localhost",
        "POSTGRES_SYNC_PORT": "5433",
        "POSTGRES_SYNC_USER": "sync_user",
        "POSTGRES_SYNC_PASSWORD": "sync_password",
        "POSTGRES_SYNC_DATABASE": "sync_db"
      }
    }
  }
}
```

## 🛠️ Utilisation

### Démarrage du serveur

```bash
# Mode production
npm start

# Mode développement (avec hot reload)
npm run dev
```

### Outils disponibles

Le serveur MCP offre ces outils à votre assistant IA :

#### 1. `execute_query` - Exécuter une requête SQL

```
Exécute une requête SELECT sur la base postgres_sync
Paramètres:
- query (obligatoire): Requête SQL SELECT
- limit (optionnel): Limite de résultats (défaut: 100)
```

#### 2. `list_tables` - Lister les tables

```
Liste toutes les tables disponibles
Paramètres:
- schema (optionnel): Nom du schéma (défaut: public)
```

#### 3. `describe_table` - Décrire une table

```
Obtient la structure détaillée d'une table
Paramètres:
- table_name (obligatoire): Nom de la table
- schema (optionnel): Nom du schéma (défaut: public)
```

#### 4. `analyze_data` - Analyser les données

```
Analyse statistique d'une table
Paramètres:
- table_name (obligatoire): Nom de la table
- columns (optionnel): Colonnes spécifiques à analyser
```

## 💬 Exemples d'utilisation avec l'IA

Voici comment utiliser le serveur avec votre assistant IA :

### Exemple 1: Explorer les tables

```
"Peux-tu me lister toutes les tables dans la base postgres_sync ?"
```

### Exemple 2: Analyser les données de synchronisation

```
"Montre-moi la structure de la table Customer et donne-moi quelques exemples de données"
```

### Exemple 3: Requête personnalisée

```
"Exécute cette requête: SELECT COUNT(*) FROM Customer WHERE Name LIKE '%Solution%'"
```

### Exemple 4: Analyse statistique

```
"Analyse les données de la table StockDocument et montre-moi les statistiques des colonnes principales"
```

## 🔒 Sécurité

### Mesures de sécurité intégrées

- **Lecture seule**: Seules les requêtes SELECT sont autorisées
- **Validation des requêtes**: Vérification automatique avant exécution
- **Limite de résultats**: Protection contre les grandes requêtes
- **Gestion des erreurs**: Messages d'erreur sécurisés

### Bonnes pratiques

1. **Utilisateur dédié**: Créez un utilisateur PostgreSQL avec des droits limités en lecture
2. **Variables d'environnement**: Ne jamais exposer les mots de passe dans le code
3. **Accès réseau**: Limitez l'accès à votre base de données par IP si possible
4. **Surveillance**: Surveillez les logs de connexion PostgreSQL

## 🐛 Dépannage

### Problème de connexion

```bash
# Vérifiez que PostgreSQL est accessible
pg_isready -h localhost -p 5433

# Testez la connexion avec psql
psql -h localhost -p 5433 -U sync_user -d sync_db
```

### Problème de permissions

```sql
-- Accordez les permissions nécessaires
GRANT CONNECT ON DATABASE sync_db TO sync_user;
GRANT USAGE ON SCHEMA public TO sync_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sync_user;
```

### Problème de compilation TypeScript

```bash
# Nettoyez et recompilez
npm run clean
npm run build
```

### Logs de débogage

Activez le mode debug dans votre `.env` :

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 🏗️ Architecture du projet

```
mcp-postgres-server/
├── src/
│   └── index.ts          # Serveur MCP principal
├── dist/                 # Code compilé
├── package.json          # Dépendances npm
├── tsconfig.json         # Configuration TypeScript
├── env.example           # Exemple de configuration
└── README.md            # Cette documentation
```

## 🚀 Intégration avec Docker

Si vous utilisez Docker Compose (comme dans votre projet), ajoutez le serveur MCP :

```yaml
mcp-postgres-server:
  build:
    context: ./mcp-postgres-server
    dockerfile: Dockerfile
  container_name: mcp-postgres-server
  environment:
    - POSTGRES_SYNC_HOST=postgres_sync
    - POSTGRES_SYNC_PORT=5432
    - POSTGRES_SYNC_USER=sync_user
    - POSTGRES_SYNC_PASSWORD=sync_password
    - POSTGRES_SYNC_DATABASE=sync_db
  depends_on:
    postgres_sync:
      condition: service_healthy
  networks:
    - app-network
```

## 📊 Tables disponibles dans postgres_sync

Selon votre configuration Docker, le serveur peut accéder aux tables synchronisées :

- `Customer` - Données clients EBP
- `Item` - Articles et produits
- `StockDocument` - Documents de stock
- `StockDocumentLine` - Lignes de documents de stock
- `Address` - Adresses
- `Supplier` - Fournisseurs
- `SupplierItem` - Articles fournisseurs
- Et bien d'autres...

## 🤝 Contribution

1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité
3. **Commitez** vos changements
4. **Poussez** vers la branche
5. **Ouvrez** une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour obtenir de l'aide :

1. **Vérifiez** ce README
2. **Consultez** les logs du serveur
3. **Ouvrez** une issue sur le dépôt
4. **Contactez** l'équipe Technidalle

---

💡 **Conseil** : Ce serveur MCP est spécialement optimisé pour le projet Technidalle et la base `postgres_sync`. Il respecte l'architecture existante et s'intègre parfaitement avec votre infrastructure Docker. 