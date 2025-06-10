import { Customer as ClientEBP } from '../../interfaces/clients/clientEBP';
import { CreateClientWithAddressDto } from '../../interfaces/clients/clientApp';
import * as pgClientSource from '../../clients/PgClient';
import pgClientDestination from '../../clients/pgClient_2';
import { ConstructionsiteInterface } from '../../interfaces/projects/constructionSite';
import { Item as ItemEBP } from '../../interfaces/items/itemEBP';
import { ItemAPP } from '../../interfaces/items/itemAPP';
import { QueryResult, PoolClient, DatabaseError } from 'pg';
import { Logger } from '@nestjs/common';

// Interface pour les objets de base de données avec un ID numérique
interface DbObjectWithNumericId {
  id: number;
}

/**
 * Convertit un client EBP en client format application
 */
export function convertEBPtoAppClient(
  clientEBP: ClientEBP,
): CreateClientWithAddressDto {
  // Récupération du prénom en priorisant MainInvoicingContact puis MainDeliveryContact
  const firstname =
    clientEBP.MainInvoicingContact_FirstName ||
    clientEBP.MainDeliveryContact_FirstName ||
    extractFirstNameFromCompanyName(clientEBP.Name) ||
    '';

  // Récupération du nom en priorisant MainInvoicingContact puis MainDeliveryContact
  const lastname =
    clientEBP.MainInvoicingContact_Name ||
    clientEBP.MainDeliveryContact_Name ||
    extractLastNameFromCompanyName(clientEBP.Name) ||
    '';

  // Vérifier si clientEBP.Id est null
  if (clientEBP.Id === null) {
    throw new Error(
      `L'ID client EBP est null pour le client ${clientEBP.Name || 'Inconnu'}. Impossible de convertir.`,
    );
  }

  // Nettoyage et formatage du numéro de téléphone
  let phone =
    clientEBP.MainInvoicingContact_Phone ||
    clientEBP.MainDeliveryContact_Phone ||
    '';
  phone = phone.replace(/[^0-9+\s]/g, '');
  if (phone && (phone.length < 10 || phone.length > 15)) {
    phone = '';
  }

  // Nettoyage et formatage du numéro de mobile
  let mobile =
    clientEBP.MainInvoicingContact_Cellphone ||
    clientEBP.MainDeliveryContact_CellPhone ||
    '';
  mobile = mobile.replace(/[^0-9+\s]/g, '');
  if (mobile && (mobile.length < 10 || mobile.length > 15)) {
    mobile = '';
  }

  // Formatage et validation de l'email
  let email =
    clientEBP.MainInvoicingContact_Email ||
    clientEBP.MainDeliveryContact_Email ||
    '';
  // Vérification basique du format email
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    // Génération d'un email factice basé sur l'ID client
    email = `no-email-${clientEBP.Id}@example.com`;
  }

  // Récupérer et nettoyer les champs d'adresse
  let streetName =
    clientEBP.MainInvoicingAddress_Address1 ||
    clientEBP.MainDeliveryAddress_Address1 ||
    '';
  let zipCode =
    clientEBP.MainInvoicingAddress_ZipCode ||
    clientEBP.MainDeliveryAddress_ZipCode ||
    '';
  let city =
    clientEBP.MainInvoicingAddress_City ||
    clientEBP.MainDeliveryAddress_City ||
    '';

  // Garantir des valeurs valides pour l'adresse
  if (!streetName || streetName.trim() === '') {
    // Si nous avons un nom de client, utilisons-le pour créer une adresse par défaut
    if (clientEBP.Name) {
      streetName = `Adresse de ${clientEBP.Name}`;
    } else {
      streetName = 'Adresse non spécifiée';
    }
  }

  // S'assurer que le code postal est valide
  if (!zipCode || zipCode.trim() === '') {
    zipCode = '00000'; // Code postal par défaut
  }

  // S'assurer que la ville est valide
  if (!city || city.trim() === '') {
    city = 'Ville non spécifiée';
  }

  return {
    company_name: clientEBP.Name || undefined,
    customer_id: clientEBP.Id,
    firstname: firstname,
    lastname: lastname,
    email: email,
    phone: phone || undefined,
    mobile: mobile || undefined,
    notes: clientEBP.NotesClear || undefined,
    address: {
      street_name: streetName,
      additional_address: combineAdditionalAddresses(
        clientEBP.MainInvoicingAddress_Address2 || '',
        clientEBP.MainInvoicingAddress_Address3 || '',
        clientEBP.MainInvoicingAddress_Address4 || '',
      ),
      zip_code: zipCode,
      city: city,
      country:
        clientEBP.MainInvoicingAddress_State ||
        clientEBP.MainDeliveryAddress_State ||
        'France',
      street_number: '',
    },
  };
}

/**
 * Tente d'extraire un prénom du nom de l'entreprise pour les cas spéciaux
 * (ex: "DEMILLY Jean" -> "Jean")
 */
function extractFirstNameFromCompanyName(
  companyName: string | null | undefined,
): string | null {
  if (!companyName) return null;

  // Recherche des motifs courants où le prénom suit le nom de famille
  const patterns = [
    /([A-Z]+)\s+([A-Z][a-z]+)/, // Format: "NOM Prénom"
    /([A-Z][a-z]+)\s+([A-Z][a-z]+)/, // Format: "Nom Prénom"
  ];

  for (const pattern of patterns) {
    const match = companyName.match(pattern);
    if (match && match[2]) {
      return match[2]; // Le groupe 2 contient le prénom
    }
  }

  return null;
}

/**
 * Tente d'extraire un nom de famille du nom de l'entreprise pour les cas spéciaux
 * (ex: "DEMILLY Jean" -> "DEMILLY")
 */
function extractLastNameFromCompanyName(
  companyName: string | null | undefined,
): string | null {
  if (!companyName) return null;

  // Recherche des motifs courants où le nom de famille précède le prénom
  const patterns = [
    /([A-Z]+)\s+([A-Z][a-z]+)/, // Format: "NOM Prénom"
    /([A-Z][a-z]+)\s+([A-Z][a-z]+)/, // Format: "Nom Prénom"
  ];

  for (const pattern of patterns) {
    const match = companyName.match(pattern);
    if (match && match[1]) {
      return match[1]; // Le groupe 1 contient le nom de famille
    }
  }

  return null;
}

/**
 * Combine les adresses additionnelles en une seule chaîne
 */
function combineAdditionalAddresses(...addresses: string[]): string {
  return addresses.filter((addr) => addr && addr.trim() !== '').join(', ');
}

/**
 * Service pour gérer les clients EBP
 */
export default class EBPclient {
  private readonly logger = new Logger(EBPclient.name);

  /**
   * Récupère tous les clients EBP depuis la base de données source
   */
  async getAllClientsFromEBP(): Promise<ClientEBP[]> {
    const query = `
      SELECT
        "Name",
        "Id",
        "MainInvoicingContact_Name",
        "MainInvoicingContact_FirstName",
        "MainInvoicingContact_Phone",
        "MainInvoicingContact_CellPhone",
        "MainInvoicingContact_Email",
        "MainDeliveryContact_Name",
        "MainDeliveryContact_FirstName",
        "MainDeliveryContact_Phone",
        "MainDeliveryContact_CellPhone",
        "MainDeliveryContact_Email",
        "MainInvoicingAddress_Address1",
        "MainInvoicingAddress_Address2",
        "MainInvoicingAddress_Address3",
        "MainInvoicingAddress_Address4",
        "MainInvoicingAddress_ZipCode",
        "MainInvoicingAddress_City",
        "MainInvoicingAddress_State",
        "MainDeliveryAddress_Address1",
        "MainDeliveryAddress_Address2",
        "MainDeliveryAddress_Address3",
        "MainDeliveryAddress_Address4",
        "MainDeliveryAddress_ZipCode",
        "MainDeliveryAddress_City",
        "MainDeliveryAddress_State",
        "NotesClear"
      FROM "Customer"`;

    try {
      const clientsData = (await pgClientSource.executeQuery(
        query,
      )) as ClientEBP[];
      if (!Array.isArray(clientsData)) {
        console.error(
          "Erreur: executeQuery pour getAllClientsFromEBP n'a pas retourné un tableau.",
          clientsData,
        );
        return [];
      }
      return clientsData;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients EBP:', error);
      throw error;
    }
  }

  /**
   * Insère ou met à jour une adresse dans la base de données de destination.
   * Gère les conflits d'unicité et l'extraction du numéro de rue.
   * @param addressData Données de l'adresse à insérer/màj.
   * @param dbClient Client de base de données PostgreSQL actif.
   */
  public async upsertAddress(
    addressData: CreateClientWithAddressDto['address'],
    dbClient: PoolClient,
  ): Promise<number | null> {
    // Vérifier si l'adresse existe déjà
    const checkAddressQuery = `
      SELECT id FROM addresses
      WHERE street_name = $1 AND zip_code = $2 AND city = $3
    `;

    try {
      const checkResult: QueryResult<DbObjectWithNumericId> =
        await dbClient.query(checkAddressQuery, [
          addressData.street_name,
          addressData.zip_code,
          addressData.city,
        ]);

      if (checkResult.rows.length > 0) {
        // Adresse trouvée, retourner son ID
        return checkResult.rows[0].id;
      }

      // L'adresse n'existe pas, l'insérer
      const insertAddressQuery = `
        INSERT INTO addresses(
          street_name,
          additional_address,
          zip_code,
          city,
          country,
          street_number
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
      `;

      const insertResult: QueryResult<DbObjectWithNumericId> =
        await dbClient.query(insertAddressQuery, [
          addressData.street_name,
          addressData.additional_address,
          addressData.zip_code,
          addressData.city,
          addressData.country,
          addressData.street_number,
        ]);

      if (insertResult.rows.length > 0) {
        return insertResult.rows[0].id;
      }

      return null; // Devrait rarement arriver si l'insertion réussit
    } catch (error) {
      console.error("Erreur lors de l'upsert de l'adresse:", error);
      throw error;
    }
  }

  /**
   * Insère un nouveau client dans la base de données de destination.
   * @param clientData Données du client à insérer.
   * @returns L'ID du client inséré ou null en cas d'échec ou de duplication.
   */
  async insertClientIntoApp(
    clientData: CreateClientWithAddressDto,
  ): Promise<number | null> {
    let dbClient: PoolClient | null = null; // Initialisation à null
    try {
      // Utiliser la pool de connexion pour obtenir un client
      dbClient = await pgClientDestination.getClient();

      if (!dbClient) {
        this.logger.error(
          "Impossible d'obtenir un client de la pool de destination.",
        );
        return null;
      }

      // Insérer ou mettre à jour l'adresse et obtenir l'ID
      const addressId = await this.upsertAddress(clientData.address, dbClient);

      if (addressId === null) {
        this.logger.error(
          `Impossible d'insérer ou de mettre à jour l'adresse pour le client ${clientData.customer_id}.`,
        );
        return null; // Échec de l'upsert de l'adresse
      }

      // Préparer les données du client pour l'insertion
      const clientQuery = `
        INSERT INTO clients(
          company_name,
          customer_id,
          firstname,
          lastname,
          email,
          phone,
          mobile,
          notes,
          address_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (customer_id) DO UPDATE
        SET
          company_name = EXCLUDED.company_name,
          firstname = EXCLUDED.firstname,
          lastname = EXCLUDED.lastname,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          mobile = EXCLUDED.mobile,
          notes = EXCLUDED.notes,
          address_id = EXCLUDED.address_id,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id;
      `;

      // Exécuter la requête d'insertion/màj
      const result: QueryResult<DbObjectWithNumericId> = await dbClient.query(
        clientQuery,
        [
          clientData.company_name,
          clientData.customer_id,
          clientData.firstname,
          clientData.lastname,
          clientData.email,
          clientData.phone,
          clientData.mobile,
          clientData.notes,
          addressId,
        ],
      );

      if (result.rows.length > 0) {
        // Retourner l'ID du client inséré ou mis à jour
        return result.rows[0].id;
      }

      return null; // Devrait rarement arriver si l'upsert réussit
    } catch (error: unknown) {
      this.logger.error(
        `Error inserting client ${clientData.customer_id}`,
        error,
      );

      // Gérer spécifiquement l'erreur de duplication (bien que ON CONFLICT DO UPDATE gère déjà cela)
      if (error instanceof DatabaseError && error.code === '23505') {
        this.logger.warn(
          `Client with EBP ID ${clientData.customer_id} already exists. Skipping insertion.`, // Message plus précis
        );
        return null;
      }

      // Pour les autres erreurs, relancer l'exception après logging
      if (error instanceof Error) {
        this.logger.error(
          `Detailed error during client insertion: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Unknown error during client insertion: ${String(error)}`,
        );
      }
      throw error; // Relancer l'erreur après logging
    } finally {
      // Relâcher le client de la pool
      if (dbClient) {
        dbClient.release();
      }
    }
  }

  /**
   * Récupère tous les items (articles) EBP depuis la base de données source
   */
  async getAllItemsFromEBP(): Promise<ItemEBP[]> {
    const query = `SELECT * FROM "Item"`;
    try {
      const itemsData = (await pgClientSource.executeQuery(query)) as ItemEBP[];
      if (!Array.isArray(itemsData)) {
        console.error(
          "Erreur: executeQuery pour getAllItemsFromEBP n'a pas retourné un tableau.",
          itemsData,
        );
        return [];
      }
      return itemsData;
    } catch (error) {
      console.error('Erreur lors de la récupération des items EBP:', error);
      throw error;
    }
  }

  /**
   * Insère un nouvel item dans la base de données de destination ou le met à jour s'il existe.
   * @param itemData Données de l'item à insérer/màj.
   * @returns L'ID de l'item inséré/màj.
   */
  async insertItemIntoApp(itemData: ItemAPP): Promise<number> {
    const client = await pgClientDestination.getClient();
    try {
      await client.query('BEGIN');

      // D'abord, vérifier si l'article existe déjà
      const checkItemQuery = `
        SELECT id FROM materials
        WHERE "ebp_id" = $1
      `;

      const checkResult: QueryResult<{
        id: number;
      }> = await client.query<{
        id: number;
      }>(checkItemQuery, [itemData.ebp_id]); // Utiliser ebp_id

      let itemResult: QueryResult<{ id: number }>;

      if (checkResult.rows && checkResult.rows.length > 0) {
        // L'article existe déjà, faire un UPDATE
        const updateItemQuery = `
            UPDATE materials SET
              "name" = $2,
              "description" = $3,
              "reference" = $4,
              "unit" = $5,
              "price" = $6,
              "stock_quantity" = $7,
              "minimum_stock" = $8,
              "supplier" = $9,
              "supplier_reference" = $10,
              "updated_at" = NOW()
            WHERE "ebp_id" = $1
            RETURNING id
          `;

        const updateValues = [
          itemData.ebp_id, // $1
          itemData.name, // $2
          itemData.description, // $3 // Utiliser description au lieu de notes
          itemData.reference, // $4
          itemData.unit, // $5
          itemData.price, // $6 // Utiliser price au lieu de unit_price
          itemData.stock_quantity, // $7
          itemData.minimum_stock, // $8
          itemData.supplier, // $9
          itemData.supplier_reference, // $10
        ];

        itemResult = await client.query<{ id: number }>(
          updateItemQuery,
          updateValues,
        );
      } else {
        // L'article n'existe pas, faire un INSERT
        const insertItemQuery = `
            INSERT INTO materials (
              "ebp_id", "name", "description", "reference", "unit", "price",
              "stock_quantity", "minimum_stock", "supplier", "supplier_reference",
              "created_at", "updated_at"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING id
          `;

        const insertValues = [
          itemData.ebp_id, // $1 // Utiliser ebp_id au lieu de material_id ou external_ebp_id
          itemData.name, // $2
          itemData.description, // $3 // Utiliser description au lieu de notes
          itemData.reference, // $4
          itemData.unit, // $5
          itemData.price, // $6 // Utiliser price au lieu de unit_price
          itemData.stock_quantity, // $7
          itemData.minimum_stock, // $8
          itemData.supplier, // $9
          itemData.supplier_reference, // $10
        ];

        itemResult = await client.query<{ id: number }>(
          insertItemQuery,
          insertValues,
        );
      }

      if (!itemResult.rows || itemResult.rows.length === 0) {
        throw new Error(
          "Échec de l'insertion ou de la mise à jour de l'article",
        );
      }

      await client.query('COMMIT');
      return itemResult.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(
        `Erreur lors de l'insertion/mise à jour de l'article: ${itemData.reference}`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      // Log de l'erreur détaillée si possible
      if (error instanceof Error) {
        this.logger.error(`Détails de l'erreur: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Détails de l'erreur: ${String(error)}`);
      }
      throw error; // Relancer l'erreur après logging
    } finally {
      // Libérer le client après utilisation
      if (client && typeof client.release === 'function') {
        client.release();
      }
    }
  }

  /**
   * Récupère tous les projets (sites de construction) EBP depuis la base de données source
   */
  async getAllConstructionSitesFromEBP(): Promise<
    ConstructionsiteInterface[] | undefined
  > {
    try {
      // Utiliser le client source pour interroger la base EBP
      const result = await pgClientSource.executeQuery(
        'SELECT * FROM "ConstructionSite"',
      );

      if (!Array.isArray(result) || result.length === 0) {
        this.logger.warn(
          'La requête getAllConstructionSitesFromEBP a retourné un résultat vide ou indéfini.',
        );
        return undefined;
      }
      return result; // executeQuery retourne déjà un tableau
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération de tous les sites de construction depuis EBP',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      throw error; // Rethrow the error
    }
  }

  /**
   * Récupère un site de construction EBP par son ID
   * @param id L'ID du site de construction EBP (format PRJxxxxx)
   */
  async getConstructionSiteByIdFromEBP(
    id: string,
  ): Promise<ConstructionsiteInterface | null> {
    try {
      // Utiliser le client source pour interroger la base EBP
      const result = await pgClientSource.executeQuery(
        'SELECT * FROM "ConstructionSite" WHERE "Id" = $1',
        [id],
      );

      // Vérifier si un résultat a été trouvé
      if (!Array.isArray(result) || result.length === 0) {
        return null;
      }
      return result[0]; // Retourner le premier élément du tableau
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du site de construction par ID: ${id}`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      throw error; // Rethrow the error
    }
  }

  /**
   * Récupère tous les documents de référence des sites de construction EBP
   */
  async getAllConstructionSiteReferenceDocumentsFromEBP(): Promise<any[]> {
    try {
      // Utiliser le client source pour interroger la base EBP
      const result = await pgClientSource.executeQuery(
        'SELECT * FROM "ConstructionSiteReferenceDocument"',
      );

      // Vérifier si un résultat a été trouvé
      if (!Array.isArray(result)) {
        this.logger.warn(
          'La requête getAllConstructionSiteReferenceDocumentsFromEBP a retourné un résultat vide ou indéfini.',
        );
        return [];
      }
      return result; // executeQuery retourne déjà un tableau
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération de tous les documents de référence des sites de construction depuis EBP',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      throw error; // Rethrow the error
    }
  }

  /**
   * Synchronise un client spécifique depuis EBP vers la base de données de destination en utilisant son customer_id EBP.
   * @param customer_id L'ID du client dans EBP.
   * @returns L'ID du client dans la base de données de destination ou null si le client EBP n'est pas trouvé.
   */
  async syncClientByCustomerId(customer_id: string): Promise<number | null> {
    try {
      const query = `
        SELECT "Id", "Name", "MainInvoicingAddress_Address1", "MainInvoicingAddress_ZipCode", "MainInvoicingAddress_City"
        FROM "Customer"
        WHERE "Id" = $1
      `;

      // Utiliser le client source pour interroger la base EBP
      const result = (await pgClientSource.executeQuery(query, [customer_id])) as ClientEBP[];

      if (!Array.isArray(result) || result.length === 0) {
        this.logger.warn(
          `Client avec EBP ID ${customer_id} non trouvé dans la base source.`,
        );
        return null;
      }

      const clientEBP = result[0];
      const clientApp = convertEBPtoAppClient(clientEBP);
      const clientId = await this.insertClientIntoApp(clientApp);

      return clientId;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation du client par ID: ${customer_id}`,
        error,
      );
      throw error; // Rethrow the error
    }
  }
}
