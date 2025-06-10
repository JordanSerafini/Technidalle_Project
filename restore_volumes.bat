@echo off
echo Restauration des volumes Docker...

REM Vérifier que le dossier backups existe
if not exist "backups" (
    echo ❌ Erreur : Le dossier 'backups' n'existe pas !
    echo Assurez-vous d'avoir copié le dossier 'backups' dans ce répertoire.
    pause
    exit /b 1
)

echo.
echo ATTENTION : Cette opération va ÉCRASER les volumes existants !
set /p confirm="Êtes-vous sûr de vouloir continuer ? (o/n): "
if /i not "%confirm%"=="o" (
    echo Opération annulée.
    pause
    exit /b 0
)

echo.
echo 1/3 - Restauration du volume PostgreSQL principal...
docker run --rm -v technidalle_project_postgres_data:/volume -v "%CD%/backups:/backup" alpine sh -c "rm -rf /volume/* && tar xzf /backup/postgres_data_backup.tar.gz -C /volume"

echo.
echo 2/3 - Restauration du volume PostgreSQL Sync...
docker run --rm -v technidalle_project_postgres_sync_data:/volume -v "%CD%/backups:/backup" alpine sh -c "rm -rf /volume/* && tar xzf /backup/postgres_sync_data_backup.tar.gz -C /volume"

echo.
echo 3/3 - Restauration du volume Elasticsearch...
docker run --rm -v technidalle_project_elasticsearch_data:/volume -v "%CD%/backups:/backup" alpine sh -c "rm -rf /volume/* && tar xzf /backup/elasticsearch_data_backup.tar.gz -C /volume"

echo.
echo ✅ Restauration terminée !
echo Vous pouvez maintenant démarrer vos conteneurs avec : docker-compose up -d
pause 