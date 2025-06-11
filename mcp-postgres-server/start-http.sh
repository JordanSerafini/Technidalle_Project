#!/bin/bash

# Script pour démarrer le serveur HTTP MCP Bridge

echo "🚀 Démarrage du serveur HTTP MCP Bridge..."

# Vérifier que le serveur MCP est compilé
if [ ! -f "dist/index.js" ]; then
    echo "❌ Le serveur MCP n'est pas compilé. Exécution de 'npm run build'..."
    npm run build
fi

# Vérifier que le serveur HTTP est compilé
if [ ! -f "dist/http-server.js" ]; then
    echo "❌ Le serveur HTTP n'est pas compilé. Exécution de 'npm run build'..."
    npm run build
fi

# Définir les variables d'environnement par défaut si elles ne sont pas définies
export HTTP_PORT=${HTTP_PORT:-3000}
export NODE_ENV=${NODE_ENV:-development}

echo "🌐 Démarrage sur le port ${HTTP_PORT}..."
echo "📋 Mode: ${NODE_ENV}"

# Démarrer le serveur HTTP
node dist/http-server.js 