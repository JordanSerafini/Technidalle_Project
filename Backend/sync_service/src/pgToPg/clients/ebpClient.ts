import { Customer as ClientEBP } from '../../interfaces/clients/clientEBP';
import { CreateClientWithAddressDto } from '../../interfaces/clients/clientApp';
import * as pgClientSource from '../../clients/PgClient';
import pgClientDestination from '../../clients/pgClient_2';
import { Item as ItemEBP } from '../../interfaces/items/itemEBP';
import { ItemAPP } from '../../interfaces/items/itemAPP';
import { QueryResult, DatabaseError, PoolClient } from 'pg';
import { Logger } from '@nestjs/common';

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
  phone = phone.replace(/[^0-9+\s]/g, ''); // Ne garde que chiffres, +, et espaces
  if (phone && (phone.length < 10 || phone.length > 15)) {
    phone = ''; // Si format invalide, on préfère ne pas mettre de valeur
  }

  // Nettoyage et formatage du numéro de mobile
  let mobile =
    clientEBP.MainInvoicingContact_Cellphone ||
    clientEBP.MainDeliveryContact_CellPhone ||
    '';
  mobile = mobile.replace(/[^0-9+\s]/g, ''); // Ne garde que chiffres, +, et espaces
  if (mobile && (mobile.length < 10 || mobile.length > 15)) {
    mobile = ''; // Si format invalide, on préfère ne pas mettre de valeur
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
      street_name:
        clientEBP.MainInvoicingAddress_Address1 ||
        clientEBP.MainDeliveryAddress_Address1 ||
        '',
      additional_address: combineAdditionalAddresses(
        clientEBP.MainInvoicingAddress_Address2 || '',
        clientEBP.MainInvoicingAddress_Address3 || '',
        clientEBP.MainInvoicingAddress_Address4 || '',
      ),
      zip_code:
        clientEBP.MainInvoicingAddress_ZipCode ||
        clientEBP.MainDeliveryAddress_ZipCode ||
        '',
      city:
        clientEBP.MainInvoicingAddress_City ||
        clientEBP.MainDeliveryAddress_City ||
        '',
      country:
        clientEBP.MainInvoicingAddress_State ||
        clientEBP.MainDeliveryAddress_State ||
        '',
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
   * Insère ou récupère l'ID d'une adresse. Fonction helper réutilisable.
   * Gère les conflits d'unicité en récupérant l'ID existant.
   */
  private async upsertAddress(
    addressData: CreateClientWithAddressDto['address'],
    dbClient: PoolClient,
  ): Promise<number | null> {
    // Normalisation et validation
    const streetParts = addressData.street_name?.trim().split(/\\s+/) || [];
    const streetNumber =
      addressData.street_number?.trim() || streetParts[0] || '';
    // Utiliser une valeur par défaut pour street_name si elle est vide
    let streetName = addressData.street_number?.trim()
      ? (addressData.street_name?.trim() ?? '')
      : streetParts.slice(1).join(' ') || '';
    
    // Si la rue est vide, utiliser une valeur par défaut basée sur la ville
    if (!streetName || streetName.trim() === '') {
      streetName = "Adresse non spécifiée";
    }

    const zipCode = addressData.zip_code
      ? addressData.zip_code.trim().padStart(5, '0')
      : '';
    const city = addressData.city?.trim() || '';
    const additionalAddress = addressData.additional_address?.trim() || '';
    const country = addressData.country?.trim() || 'France';

    // Maintenant on vérifie seulement si le code postal et la ville sont présents
    if (!zipCode || !city) {
      this.logger.warn(
        `Adresse client incomplète ignorée (code postal ou ville manquant): CP='${zipCode}', Ville='${city}'`,
      );
      return null;
    }

    // Tentative d'insertion
    try {
      const insertQuery = `
        INSERT INTO addresses (street_number, street_name, additional_address, zip_code, city, country)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      if (!dbClient)
        throw new Error(
          'Client DB invalide pour insert query dans upsertAddress',
        );
      const insertResult = await dbClient.query<{ id: number }>(insertQuery, [
        streetNumber,
        streetName,
        additionalAddress,
        zipCode,
        city,
        country,
      ]);
      if (insertResult?.rows?.[0]?.id) {
        this.logger.debug(
          `Nouvelle adresse client insérée avec ID: ${insertResult.rows[0].id}`,
        );
        return insertResult.rows[0].id;
      } else {
        throw new Error("L'insertion d'adresse n'a pas retourné d'ID.");
      }
    } catch (error) {
      const typedError = error as DatabaseError;
      if (
        typedError.code === '23505' &&
        typedError.constraint === 'addresses_unique_constraint'
      ) {
        this.logger.debug(
          `Conflit d'adresse client détecté (Code: ${typedError.code}) pour: Num='${streetNumber}', Rue='${streetName}', CP='${zipCode}', Ville='${city}'. Recherche de l'ID existant.`,
        );
        // Si conflit, sélectionner l'ID existant
        try {
          const selectQuery = `
            SELECT id FROM addresses
            WHERE COALESCE(street_number, '') = $1
              AND street_name = $2
              AND zip_code = $3
              AND city = $4
            LIMIT 1
          `;
          if (!dbClient)
            throw new Error(
              'Client DB invalide pour select query dans upsertAddress',
            );
          const selectResult = await dbClient.query<{ id: number }>(
            selectQuery,
            [streetNumber, streetName, zipCode, city],
          );

          if (selectResult?.rows?.[0]?.id) {
            const existingId = selectResult.rows[0].id;
            this.logger.debug(
              `Adresse client existante trouvée avec ID: ${existingId}`,
            );
            return existingId;
          } else {
            this.logger.error(
              `Erreur incohérente après conflit d'adresse client (Code: ${typedError.code}): Impossible de retrouver l'adresse existante.`,
              typedError.stack ?? 'Pas de stack trace',
            );
            return null;
          }
        } catch (selectError) {
          const typedSelectError = selectError as DatabaseError;
          this.logger.error(
            `Erreur lors de la recherche de l'adresse client existante après conflit: ${typedSelectError.message}`,
            typedSelectError.stack ?? 'Pas de stack trace',
          );
          return null;
        }
      } else {
        this.logger.error(
          `Erreur inattendue lors de l'upsert de l'adresse client: ${typedError.message} (Code: ${typedError.code})`,
          typedError.stack ?? 'Pas de stack trace',
        );
        return null;
      }
    }
  }

  /**
   * Insère un client dans la base de données de destination, en gérant les adresses dupliquées.
   * Transaction explicite retirée pour le debug.
   */
  async insertClientIntoApp(
    clientData: CreateClientWithAddressDto,
  ): Promise<number | null> {
    let dbClient: PoolClient | null = null;
    let addressId: number | null = null;

    try {
      dbClient = await pgClientDestination.getClient();
      if (!dbClient) {
        this.logger.error(
          "Impossible d'obtenir un client de pool pour insertClientIntoApp.",
        );
        return null;
      }

      if (
        clientData.address &&
        clientData.address.street_name &&
        clientData.address.zip_code &&
        clientData.address.city
      ) {
        addressId = await this.upsertAddress(clientData.address, dbClient);
        if (addressId === null) {
          this.logger.warn(
            `Impossible de déterminer l'ID de l'adresse pour le client ${clientData.customer_id}. address_id sera NULL.`,
          );
        }
      } else {
        this.logger.warn(
          `Données d'adresse incomplètes pour le client ${clientData.customer_id}. address_id sera NULL.`,
        );
      }

      // S'assurer que l'email est valide ou créer un email de secours
      let emailToUse =
        clientData.email || `no-email-${clientData.customer_id}@example.com`;

      // Email validation plus stricte pour correspondre à la contrainte PostgreSQL
      // Le format doit être exactement conforme à xxx@xxx.xxx sans caractères spéciaux autres que ceux autorisés
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!emailRegex.test(emailToUse)) {
        // Si l'email n'est pas valide, générer un email sécurisé qui respecte certainement la contrainte
        const safeCustomerId = clientData.customer_id.replace(
          /[^a-zA-Z0-9]/g,
          '',
        );
        emailToUse = `no-email-${safeCustomerId}@example.com`;
      }

      // Vérifier que la longueur de l'email est valide (généralement limité dans les BDD)
      if (emailToUse.length > 254) {
        // Tronquer l'email tout en gardant le format valide
        const emailParts = emailToUse.split('@');
        const localPart = emailParts[0].substring(0, 64); // Local part max 64 caractères
        const domainPart = emailParts[1] || 'example.com';
        emailToUse = `${localPart}@${domainPart}`;
      }

      // Vérifier si l'email existe déjà
      if (clientData.email) {
        try {
          const emailExistsResult = await dbClient.query<{ exists: boolean }>(
            `SELECT EXISTS(SELECT 1 FROM clients WHERE email = $1) as "exists"`,
            [emailToUse],
          );

          if (emailExistsResult?.rows?.[0]?.exists) {
            this.logger.warn(
              `Email ${emailToUse} existe déjà pour le client ${clientData.customer_id}. Génération d'un email unique.`,
            );
            const safeCustomerId = clientData.customer_id.replace(
              /[^a-zA-Z0-9]/g,
              '',
            );
            const timestamp = Date.now();
            emailToUse = `no-email-${safeCustomerId}-${timestamp}@example.com`;
          }
        } catch (emailCheckError) {
          this.logger.error(
            `Erreur lors de la vérification de l'email ${emailToUse} pour le client ${clientData.customer_id}`,
            emailCheckError,
          );
          // En cas d'erreur, utiliser un email de secours garanti valide
          const safeCustomerId = clientData.customer_id.replace(
            /[^a-zA-Z0-9]/g,
            '',
          );
          const timestamp = Date.now();
          emailToUse = `no-email-${safeCustomerId}-${timestamp}@example.com`;
        }
      }

      // Nettoyage des numéros de téléphone et mobile
      let phoneToUse = clientData.phone
        ? clientData.phone.replace(/[^0-9+\s]/g, '')
        : null;
      if (phoneToUse && (phoneToUse.length < 10 || phoneToUse.length > 15)) {
        this.logger.warn(
          `Numéro de téléphone invalide pour le client ${clientData.customer_id}: "${clientData.phone}". Sera remplacé par NULL.`,
        );
        phoneToUse = null;
      }

      let mobileToUse = clientData.mobile
        ? clientData.mobile.replace(/[^0-9+\s]/g, '')
        : null;
      if (mobileToUse && (mobileToUse.length < 10 || mobileToUse.length > 15)) {
        this.logger.warn(
          `Numéro de mobile invalide pour le client ${clientData.customer_id}: "${clientData.mobile}". Sera remplacé par NULL.`,
        );
        mobileToUse = null;
      }

      const clientValues = [
        clientData.company_name || null,
        clientData.customer_id,
        clientData.firstname || '',
        clientData.lastname || '',
        emailToUse,
        phoneToUse,
        mobileToUse,
        addressId,
        clientData.siret || null,
        clientData.notes || null,
      ];

      const clientQuery = `
        INSERT INTO clients (
          company_name, customer_id, firstname, lastname, email, phone, mobile, address_id, siret, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (customer_id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          firstname = EXCLUDED.firstname,
          lastname = EXCLUDED.lastname,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          mobile = EXCLUDED.mobile,
          address_id = CASE WHEN EXCLUDED.address_id IS NOT NULL THEN EXCLUDED.address_id ELSE clients.address_id END,
          siret = EXCLUDED.siret,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING id`;

      if (!dbClient) throw new Error('Client DB invalide pour client query');
      const clientResult = await dbClient.query<{ id: number }>(
        clientQuery,
        clientValues,
      );

      if (!clientResult?.rows?.[0]?.id) {
        throw new Error(
          `L'upsert du client ${clientData.customer_id} a échoué, pas d'ID retourné.`,
        );
      }
      const clientId = clientResult.rows[0].id;
      this.logger.log(
        `Client ${clientData.customer_id} inséré/mis à jour avec succès (ID App: ${clientId})`,
      );

      return clientId;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'insertion/màj du client ${clientData.customer_id}:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    } finally {
      if (dbClient) {
        dbClient.release();
      }
    }
  }

  /**
   * Convertit un client EBP en client format application
   */
  convertToAppClient(clientEBP: ClientEBP): CreateClientWithAddressDto {
    return convertEBPtoAppClient(clientEBP);
  }

  /**
   * Convertit une liste de clients EBP en clients format application
   */
  convertMultipleToAppClient(
    clientsEBP: ClientEBP[],
  ): CreateClientWithAddressDto[] {
    return clientsEBP.map((clientEBP) => convertEBPtoAppClient(clientEBP));
  }

  /**
   * Récupère tous les articles EBP depuis la base de données source
   */
  async getAllItemsFromEBP(): Promise<ItemEBP[]> {
    const query = `
      SELECT
        "Id",
        "UniqueId",
        "Caption",
        "DesCom",
        "SalePriceVatExcluded",
        "RealStock",
        "SupplierId",
        "ManageStock",
        "Weight",
        "Volume",
        "VatId",
        "PurchasePrice",
        "SalePriceVatIncluded"
      FROM "Item"`;

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
      console.error('Erreur lors de la récupération des articles EBP:', error);
      throw error;
    }
  }

  /**
   * Insère un article dans la base de données de destination
   */
  async insertItemIntoApp(itemData: ItemAPP): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dbObject: any = itemData.toDBObject();

    try {
      // Vérifier si l'article existe déjà par sa référence
      if (itemData.reference) {
        const checkRefQuery = `SELECT id FROM materials WHERE reference = $1`;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const existingItemResult = (await pgClientDestination.query(
          checkRefQuery,
          [itemData.reference],
        )) as QueryResult<{ id: number }>;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (existingItemResult?.rows?.[0]?.id) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const existingItemId = existingItemResult.rows[0].id;
          // Mise à jour de l'article existant
          const updateQuery = `
            UPDATE materials
            SET
              name = $1,
              description = $2,
              unit = $3,
              price = $4,
              stock_quantity = $5,
              minimum_stock = $6,
              supplier = $7,
              supplier_reference = $8,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING id`;

          const updateValues = [
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            dbObject.name,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            dbObject.description,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            dbObject.unit,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            dbObject.price,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            dbObject.stock_quantity,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            dbObject.minimum_stock,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            dbObject.supplier,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            dbObject.supplier_reference,
            existingItemId,
          ];

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const updateResult = (await pgClientDestination.query(
            updateQuery,
            updateValues,
          )) as QueryResult<{ id: number }>;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!updateResult?.rows?.[0]?.id) {
            throw new Error(
              "La mise à jour de l'article a échoué, pas d'ID retourné.",
            );
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          return updateResult.rows[0].id;
        }
      }

      // Insertion d'un nouvel article
      const insertQuery = `
        INSERT INTO materials (
          name,
          description,
          reference,
          unit,
          price,
          stock_quantity,
          minimum_stock,
          supplier,
          supplier_reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`;

      const insertValues = [
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dbObject.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dbObject.description,
        itemData.reference,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dbObject.unit,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dbObject.price,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dbObject.stock_quantity,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dbObject.minimum_stock,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dbObject.supplier,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dbObject.supplier_reference,
      ];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const insertResult = (await pgClientDestination.query(
        insertQuery,
        insertValues,
      )) as QueryResult<{ id: number }>;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!insertResult?.rows?.[0]?.id) {
        throw new Error(
          "L'insertion de l'article a échoué, pas d'ID retourné.",
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return insertResult.rows[0].id;
    } catch (error) {
      console.error("Erreur lors de l'insertion de l'article:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les sites de construction depuis la base EBP
   */
  async getAllConstructionSitesFromEBP(): Promise<any[] | undefined> {
    console.log('[EBPClient] Début de getAllConstructionSitesFromEBP');
    try {
      const query = `SELECT * FROM "ConstructionSite"`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await pgClientSource.executeQuery(query);
      console.log(
        '[EBPClient] getAllConstructionSitesFromEBP - Requête réussie, résultat:',
        result,
      );

      if (!Array.isArray(result)) {
        console.error(
          "[EBPClient] Erreur: executeQuery pour getAllConstructionSitesFromEBP n'a pas retourné un tableau.",
          result,
        );
        return undefined;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result;
    } catch (error) {
      console.error(
        '[EBPClient] Erreur dans getAllConstructionSitesFromEBP',
        error,
      );
      throw error;
    }
  }

  /**
   * Récupère tous les documents de référence des sites de construction depuis la base EBP
   */
  async getAllConstructionSiteReferenceDocumentsFromEBP(): Promise<any[]> {
    console.log(
      '[EBPClient] Début de getAllConstructionSiteReferenceDocumentsFromEBP',
    );
    try {
      const query = `SELECT * FROM "ConstructionSiteReferenceDocument"`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await pgClientSource.executeQuery(query);

      if (!Array.isArray(result)) {
        console.error(
          "[EBPClient] Erreur: executeQuery pour getAllConstructionSiteReferenceDocumentsFromEBP n'a pas retourné un tableau.",
          result,
        );
        return [];
      }
      return result;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des documents de référence',
        error,
      );
      throw error;
    }
  }

  /**
   * Synchronise un client spécifique par son ID customer_id.
   * @param customer_id ID du client dans la base EBP
   * @returns L'ID du client dans l'application ou null en cas d'erreur.
   */
  async syncClientByCustomerId(customer_id: string): Promise<number | null> {
    try {
      const query = `SELECT * FROM "Customer" WHERE "Id" = $1`;
      const result = await pgClientSource.executeQuery(query, [customer_id]);

      const clientsEBP = result as ClientEBP[];

      if (!Array.isArray(clientsEBP) || clientsEBP.length === 0) {
        this.logger.warn(
          `Client avec l'ID EBP ${customer_id} non trouvé dans la source.`,
        );
        return null;
      }

      const clientEBP: ClientEBP = clientsEBP[0];

      if (!clientEBP?.Id) {
        this.logger.error(
          `Données EBP invalides pour le client avec l'ID de recherche ${customer_id}. ID manquant après récupération.`,
        );
        return null;
      }

      const clientApp = this.convertToAppClient(clientEBP);
      return await this.insertClientIntoApp(clientApp);
    } catch (error) {
      this.logger.error(
        `Erreur majeure lors de la synchronisation du client EBP ${customer_id}:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : 'Pas de stack trace',
      );
      return null;
    }
  }
}
