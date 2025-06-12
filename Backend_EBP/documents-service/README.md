<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Documents Service

Service de gestion des documents pour l'application BTP Technidalle.

## Fonctionnalités

### Gestion des Documents
- ✅ Création de documents avec upload de fichiers
- ✅ Lecture, mise à jour et suppression de documents
- ✅ Gestion des versions de documents
- ✅ Téléchargement de fichiers et versions
- ✅ Recherche dans les documents (titre, description, nom de fichier, tags)
- ✅ Filtrage par type, statut, projet, client, fournisseur
- ✅ Gestion des documents confidentiels
- ✅ Gestion des dates d'expiration

### Types de Documents Supportés
- Devis
- Factures
- Plans techniques
- Photos de chantier
- Contrats
- Rapports
- Certificats
- Autres documents

### Catégorisation
- ✅ Création et gestion des catégories
- ✅ Organisation par couleurs et icônes
- ✅ Tri personnalisé

### Fonctionnalités Avancées
- ✅ Système de versioning complet
- ✅ Métadonnées JSON personnalisées
- ✅ Système de tags
- ✅ Statistiques d'utilisation
- ✅ Documents récents pour mobile
- ✅ Gestion des documents expirés

## Installation

```bash
npm install
```

## Configuration

Variables d'environnement requises :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=documents_db

# NATS
NATS_URL=nats://localhost:4222

# Upload configuration
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=52428800

# Application
NODE_ENV=development
PORT=3003
```

## Démarrage

```bash
# Mode développement
npm run start:dev

# Mode production
npm run start:prod
```

## Architecture

### Entités
- **Document** : Entité principale pour les documents
- **DocumentCategory** : Catégories de documents
- **DocumentVersion** : Versions des documents

### Patterns NATS Messages

#### Documents
- `documents.create` - Créer un document
- `documents.findAll` - Lister les documents
- `documents.findOne` - Obtenir un document
- `documents.update` - Mettre à jour un document
- `documents.delete` - Supprimer un document
- `documents.search` - Rechercher des documents

#### Versions
- `documents.createVersion` - Créer une nouvelle version
- `documents.getVersions` - Obtenir les versions d'un document

#### Catégories
- `documents.categories.create` - Créer une catégorie
- `documents.categories.findAll` - Lister les catégories
- `documents.categories.findOne` - Obtenir une catégorie
- `documents.categories.update` - Mettre à jour une catégorie
- `documents.categories.delete` - Supprimer une catégorie

#### Filtres et Recherche
- `documents.byProject` - Documents par projet
- `documents.byClient` - Documents par client
- `documents.byType` - Documents par type
- `documents.byStatus` - Documents par statut
- `documents.byTags` - Documents par tags
- `documents.confidential` - Documents confidentiels
- `documents.expired` - Documents expirés
- `documents.recent` - Documents récents

#### Fichiers
- `documents.download` - Télécharger un fichier
- `documents.statistics` - Statistiques d'utilisation

## Sécurité

- Validation des fichiers uploadés
- Limitation de taille des fichiers (50MB par défaut)
- Gestion des documents confidentiels
- Contrôle d'accès par projet/client

## Optimisations Mobile

- Métadonnées calculées (taille formatée, URLs)
- Documents récents
- Miniatures pour les images
- Chargement optimisé avec pagination
