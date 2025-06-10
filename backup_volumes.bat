@echo off
echo Création des backups des volumes Docker...

REM Créer le dossier backups
if not exist "backups" mkdir backups

echo.
echo 1/3 - Backup du volume PostgreSQL principal...
docker run --rm -v technidalle_project_postgres_data:/volume -v "%CD%/backups:/backup" alpine tar czf /backup/postgres_data_backup.tar.gz -C /volume .

echo.
echo 2/3 - Backup du volume PostgreSQL Sync...
docker run --rm -v technidalle_project_postgres_sync_data:/volume -v "%CD%/backups:/backup" alpine tar czf /backup/postgres_sync_data_backup.tar.gz -C /volume .

echo.
echo 3/3 - Backup du volume Elasticsearch...
docker run --rm -v technidalle_project_elasticsearch_data:/volume -v "%CD%/backups:/backup" alpine tar czf /backup/elasticsearch_data_backup.tar.gz -C /volume .

echo.
echo ✅ Backups terminés ! Fichiers créés dans le dossier 'backups':
dir backups

echo.
echo Pour transférer sur un autre poste :
echo 1. Copiez le dossier 'backups' 
echo 2. Utilisez le script 'restore_volumes.bat' sur l'autre poste
pause 