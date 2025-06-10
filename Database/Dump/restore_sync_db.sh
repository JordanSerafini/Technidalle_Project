#!/bin/bash
set -e

echo "Attente que la base de données postgres_sync soit prête..."
sleep 10

# Vérification si les données existent déjà
EXISTING_TABLES=$(psql -U sync_user -d sync_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

echo "Nombre de tables existantes: $EXISTING_TABLES"

if [ "$EXISTING_TABLES" -eq "0" ]; then
  echo "Restauration de la base de données sync_db à partir du fichier dump..."
  
  # Vérification de l'existence du fichier
  if [ ! -f "/docker-entrypoint-initdb.d/sync_db_backup.dump" ]; then
    echo "ERREUR: Le fichier de sauvegarde n'existe pas!"
    exit 1
  fi
  
  # Affichage des informations du fichier
  echo "Informations du fichier de sauvegarde:"
  ls -la /docker-entrypoint-initdb.d/sync_db_backup.dump
  
  # Tentative de restauration avec différentes options
  echo "Tentative de restauration avec pg_restore..."
  pg_restore -U sync_user -d sync_db -v --clean --if-exists --no-owner --no-privileges /docker-entrypoint-initdb.d/sync_db_backup.dump || {
    echo "Échec de pg_restore, tentative avec des options alternatives..."
    pg_restore -U sync_user -d sync_db -v --no-owner --no-privileges /docker-entrypoint-initdb.d/sync_db_backup.dump || {
      echo "Échec de la restauration avec pg_restore. Tentative d'analyse du fichier..."
      file /docker-entrypoint-initdb.d/sync_db_backup.dump
      head -c 20 /docker-entrypoint-initdb.d/sync_db_backup.dump | hexdump -C
      exit 1
    }
  }
  
  echo "Restauration terminée !"
else
  echo "La base de données sync_db contient déjà des tables. Restauration ignorée."
fi
