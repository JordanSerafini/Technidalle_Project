#!/bin/bash

# Script d'installation automatique du serveur MCP PostgreSQL Technidalle
# Usage: ./scripts/install.sh

set -e

echo "🚀 Installation du serveur MCP PostgreSQL Technidalle"
echo "=================================================="

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION détectée. Version >= 18 requise"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Installer les dépendances
echo "📦 Installation des dépendances npm..."
npm install

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "⚙️ Création du fichier .env..."
    cp .env .env
    echo "✅ Fichier .env créé. Veuillez l'éditer avec vos paramètres de base de données."
else
    echo "✅ Fichier .env déjà présent"
fi

# Compiler le TypeScript
echo "🔨 Compilation du TypeScript..."
npm run build

# Vérifier la connexion à la base de données
echo "🔍 Test de la connexion à PostgreSQL..."
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5433 -q; then
        echo "✅ PostgreSQL accessible sur localhost:5433"
    else
        echo "⚠️  PostgreSQL non accessible sur localhost:5433"
        echo "   Assurez-vous que Docker Compose est démarré: docker-compose up -d postgres_sync"
    fi
else
    echo "⚠️  pg_isready non disponible. Assurez-vous que PostgreSQL est accessible."
fi

# Configuration pour Cursor
CURSOR_CONFIG_DIR=".cursor"
CURSOR_CONFIG_FILE="$CURSOR_CONFIG_DIR/mcp.json"
PROJECT_ROOT=$(pwd)

if [ ! -d "$CURSOR_CONFIG_DIR" ]; then
    echo "📁 Création du dossier .cursor..."
    mkdir -p "$CURSOR_CONFIG_DIR"
fi

echo "⚙️ Configuration pour Cursor..."
cat > "$CURSOR_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "technidalle-postgres-sync": {
      "command": "node",
      "args": ["$PROJECT_ROOT/mcp-postgres-server/dist/index.js"],
      "env": {
        "POSTGRES_SYNC_HOST": "localhost",
        "POSTGRES_SYNC_PORT": "5433",
        "POSTGRES_SYNC_USER": "sync_user",
        "POSTGRES_SYNC_PASSWORD": "sync_password",
        "POSTGRES_SYNC_DATABASE": "sync_db",
        "MCP_SERVER_NAME": "technidalle-postgres-sync",
        "MCP_SERVER_VERSION": "1.0.0",
        "NODE_ENV": "development",
        "LOG_LEVEL": "info"
      }
    }
  }
}
EOF

echo "✅ Configuration Cursor créée dans $CURSOR_CONFIG_FILE"

# Vérification finale
echo ""
echo "🎉 Installation terminée avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Éditez le fichier .env avec vos paramètres de base de données"
echo "2. Démarrez votre base PostgreSQL : docker-compose up -d postgres_sync"
echo "3. Testez le serveur : npm start"
echo "4. Redémarrez Cursor pour charger la configuration MCP"
echo ""
echo "🔧 Commandes utiles :"
echo "   npm start          # Démarrer le serveur MCP"
echo "   npm run dev        # Mode développement avec hot reload"
echo "   npm run build      # Compiler le TypeScript"
echo ""
echo "📚 Consultez le README.md pour plus d'informations" 