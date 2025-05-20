import { PredefinedQuery } from './querybuilder.types';

export const PREDEFINED_QUERIES_FROM_CLIENTS: PredefinedQuery[] = [
  {
    id: 'clients_list',
    keywords: [
      'liste', 
      'clients', 
      'tous', 
      'répertoire', 
      'annuaire', 
      'clientèle',
      'base',
      'enregistré'
    ],
    questions: [
      'Liste des clients',
      'Tous les clients',
      'Quels sont nos clients ?',
      'Répertoire clients',
      'Base de clients',
      'Afficher clients',
      'Clients enregistrés',
      'Voir tous les clients',
      'Notre clientèle',
      'Annuaire des clients',
    ],
    prisma_query: `
      prisma.clients.findMany({
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          mobile: true,
          addresses: {
            select: {
              city: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      })
    `,
    fallback_sql: 'SELECT * FROM clients ORDER BY lastname, firstname',
    response_format: 'table',
    description: 'Liste complète des clients',
  },
  
  {
    id: 'client_details',
    keywords: [
      'détail', 
      'information', 
      'client', 
      'fiche', 
      'profil', 
      'coordonnée', 
      'contact',
      'donnée',
      'dossier'
    ],
    questions: [
      'Détails du client {client}',
      'Informations sur {client}',
      'Fiche client {client}',
      'Profil de {client}',
      'Coordonnées de {client}',
      'Qui est {client} ?',
      'Informations client {client}',
      'Contact {client}',
      'Données de {client}',
      'Dossier client {client}',
    ],
    parameters: {
      client: ''
    },
    prisma_query: `
      prisma.clients.findFirst({
        where: {
          OR: [
            { firstname: { contains: params.client, mode: 'insensitive' } },
            { lastname: { contains: params.client, mode: 'insensitive' } },
            { company_name: { contains: params.client, mode: 'insensitive' } },
            { email: { contains: params.client, mode: 'insensitive' } },
          ],
        },
        include: {
          addresses: true,
          client_addresses: {
            include: {
              addresses: true,
            },
          },
          projects: {
            select: {
              name: true,
              reference: true,
              status: true,
              start_date: true,
              end_date: true,
            },
            orderBy: {
              start_date: 'desc',
            },
          },
          documents: {
            select: {
              type: true,
              reference: true,
              status: true,
              issue_date: true,
              amount: true,
              payment_status: true,
            },
            orderBy: {
              issue_date: 'desc',
            },
          },
          events: {
            where: {
              start_date: {
                gte: new Date(),
              },
            },
            select: {
              title: true,
              start_date: true,
              end_date: true,
              location: true,
            },
            orderBy: {
              start_date: 'asc',
            },
          },
        },
      })
    `,
    fallback_sql: "SELECT * FROM clients WHERE firstname ILIKE '%{client}%' OR lastname ILIKE '%{client}%' OR company_name ILIKE '%{client}%' OR email ILIKE '%{client}%'",
    response_format: 'card',
    description: 'Informations détaillées sur un client spécifique',
  },
  
  {
    id: 'clients_with_unpaid_invoices',
    keywords: [
      'facture', 
      'impayé', 
      'non réglé', 
      'retard', 
      'paiement', 
      'débiteur', 
      'impayés',
      'attente',
      'non payé'
    ],
    questions: [
      'Clients avec factures impayées',
      'Factures non réglées par client',
      "Qui n'a pas payé ses factures ?",
      'Clients en retard de paiement',
      'Factures en attente de paiement',
      'Clients débiteurs',
      'Paiements clients en retard',
      'Liste des impayés',
      'Clients avec paiements en attente',
      'Factures non payées',
    ],
    prisma_query: `
      prisma.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'facture',
              payment_status: 'non_payé',
              due_date: {
                lt: new Date(),
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: {
              type: 'facture',
              payment_status: 'non_payé',
            },
            select: {
              reference: true,
              issue_date: true,
              due_date: true,
              amount: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      })
    `,
    fallback_sql: "SELECT c.*, d.reference, d.issue_date, d.due_date, d.amount FROM clients c JOIN documents d ON c.id = d.client_id WHERE d.type = 'facture' AND d.payment_status = 'non_payé' AND d.due_date < CURRENT_DATE ORDER BY c.lastname, c.firstname",
    response_format: 'table',
    description: 'Liste des clients avec des factures impayées et en retard',
  },
  
  {
    id: 'clients_by_city',
    keywords: [
      'client', 
      'ville', 
      'localité', 
      'location', 
      'habiter', 
      'résider', 
      'commune',
      'localisation',
      'adresse'
    ],
    questions: [
      'Clients à {city}',
      'Quels clients à {city} ?',
      'Clients dans la ville {city}',
      'Clientèle à {city}',
      'Clients localisés à {city}',
      'Clients habitant à {city}',
      'Clients par ville {city}',
      'Rechercher clients à {city}',
      'Clients de {city}',
      'Répertoire clients {city}',
    ],
    parameters: {
      city: ''
    },
    prisma_query: `
      prisma.clients.findMany({
        where: {
          OR: [
            {
              addresses: {
                city: {
                  contains: params.city,
                  mode: 'insensitive',
                },
              },
            },
            {
              client_addresses: {
                some: {
                  addresses: {
                    city: {
                      contains: params.city,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          ],
        },
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          addresses: {
            select: {
              street: true,
              city: true,
              postal_code: true,
            },
          },
          client_addresses: {
            select: {
              addresses: {
                select: {
                  street: true,
                  city: true,
                  postal_code: true,
                },
              },
            },
          },
        },
      })
    `,
    fallback_sql: "SELECT c.*, a.street, a.city, a.postal_code FROM clients c LEFT JOIN addresses a ON c.address_id = a.id WHERE a.city ILIKE '%{city}%'",
    response_format: 'table',
    description: 'Liste des clients localisés dans une ville spécifique',
  },
]; 