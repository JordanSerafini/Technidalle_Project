#!/bin/bash
set -e

echo "Attente que la base de données postgres_sync soit prête..."
sleep 10

# Vérification si les données existent déjà
EXISTING_TABLES=$(psql -U sync_user -d sync_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$EXISTING_TABLES" -eq "0" ]; then
  echo "Restauration de la base de données sync_db à partir du fichier dump..."
  pg_restore -U sync_user -d sync_db -v /docker-entrypoint-initdb.d/sync_db_backup.dump
  echo "Restauration terminée !"
else
  echo "La base de données sync_db contient déjà des tables. Restauration ignorée."
fi