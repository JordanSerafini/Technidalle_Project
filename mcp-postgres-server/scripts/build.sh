#!/bin/bash

# Script de construction pour le serveur MCP PostgreSQL

set -e

echo "🏗️  Construction du serveur MCP PostgreSQL..."

# Aller dans le répertoire du serveur MCP
cd "$(dirname "$0")/.."

# Nettoyer les fichiers de compilation précédents
echo "🧹 Nettoyage des fichiers précédents..."
npm run clean 2>/dev/null || true

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Compiler le TypeScript
echo "🔨 Compilation TypeScript..."
npm run build

echo "✅ Construction terminée avec succès!"
echo "📂 Fichiers compilés dans: dist/"
echo "🚀 Pour démarrer: npm start" 