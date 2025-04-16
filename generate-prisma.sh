#!/bin/bash

echo "Génération des clients Prisma pour tous les services..."

# Arrêt des conteneurs
docker-compose down

# Régénération pour chaque service
echo "Génération pour le service clients..."
docker-compose run --rm client npx prisma generate

echo "Génération pour le service documents..."
docker-compose run --rm documents npx prisma generate

echo "Génération pour le service projects..."
docker-compose run --rm projects npx prisma generate

echo "Génération pour le service resources..."
docker-compose run --rm resources npx prisma generate

echo "Génération pour le service planning..."
docker-compose run --rm planning npx prisma generate

echo "Redémarrage des services..."
docker-compose up -d

echo "Terminé !"