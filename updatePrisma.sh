#!/bin/bash

# Dossier principal
BACKEND_DIR="./Backend"

# Parcourir tous les sous-dossiers
for SERVICE_DIR in "$BACKEND_DIR"/*_service "$BACKEND_DIR"/api_gateway; do
  # Vérifier si le dossier existe
  if [ -d "$SERVICE_DIR" ]; then
    # Vérifier si prisma existe dans ce dossier
    if [ -d "$SERVICE_DIR/prisma" ] || grep -q "prisma" "$SERVICE_DIR/package.json" 2>/dev/null; then
      echo "Mise à jour de Prisma dans $SERVICE_DIR..."
      
      # Aller dans le dossier du service
      cd "$SERVICE_DIR"
      
      # Exécuter les commandes Prisma
      npx prisma db pull
      npx prisma generate
      
      # Retourner au dossier parent
      cd -
      
      echo "Mise à jour terminée pour $SERVICE_DIR"
      echo "-----------------------------------"
    else
      echo "Prisma non trouvé dans $SERVICE_DIR, passage au suivant..."
    fi
  fi
done

echo "Toutes les mises à jour Prisma sont terminées!"
