import { Customer as ClientEBP } from '../../interfaces/clients/clientEBP';
import { CreateClientWithAddressDto } from '../../interfaces/clients/clientApp';
import * as pgClientSource from '../../clients/PgClient';
import pgClientDestination from '../../clients/pgClient_2';
import { Item as ItemEBP } from '../../interfaces/items/itemEBP';
import { ItemAPP } from '../../interfaces/items/itemAPP';

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

  return {
    company_name: clientEBP.Name || undefined,
    firstname: firstname,
    lastname: lastname,
    email:
      clientEBP.MainInvoicingContact_Email ||
      clientEBP.MainDeliveryContact_Email ||
      '',
    phone:
      clientEBP.MainInvoicingContact_Phone ||
      clientEBP.MainDeliveryContact_Phone ||
      undefined,
    mobile:
      clientEBP.MainInvoicingContact_Cellphone ||
      clientEBP.MainDeliveryContact_CellPhone ||
      undefined,
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
      return clientsData;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients EBP:', error);
      throw error;
    }
  }

  /**
   * Insère un client dans la base de données de destination
   */
  async insertClientIntoApp(
    clientData: CreateClientWithAddressDto,
  ): Promise<number> {
    // Préparation des données avec validation pour respecter les contraintes
    const addressValues = [
      clientData.address.street_number || '',
      clientData.address.street_name,
      clientData.address.additional_address || null,
      // S'assurer que le code postal est au format correct (5 chiffres)
      clientData.address.zip_code
        ? clientData.address.zip_code.padStart(5, '0')
        : '00000',
      clientData.address.city,
      clientData.address.country || null,
    ];

    try {
      // Commencer une transaction
      await pgClientDestination.query('BEGIN');

      // Insérer l'adresse
      const addressQuery = `
      INSERT INTO addresses (
        street_number, 
        street_name, 
        additional_address, 
        zip_code, 
        city, 
        country
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id`;

      const addressResult = (await pgClientDestination.query(
        addressQuery,
        addressValues,
      )) as { rows: { id: number }[] };
      const addressId = addressResult.rows[0].id;

      // Vérifier si l'email existe déjà
      let emailToUse =
        clientData.email ||
        `no-email-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

      if (clientData.email) {
        const checkEmailQuery = `SELECT EXISTS(SELECT 1 FROM clients WHERE email = $1)`;
        const emailExists = await pgClientDestination.query(checkEmailQuery, [
          emailToUse,
        ]);

        if (emailExists.rows[0].exists) {
          // Ajouter un timestamp unique à l'email existant
          const emailParts = emailToUse.split('@');
          emailToUse = `${emailParts[0]}-${Date.now()}-${Math.floor(Math.random() * 10000)}@${emailParts[1]}`;
        }
      }

      // Préparation des données client avec validation pour respecter les contraintes
      const clientValues = [
        clientData.company_name || null,
        clientData.firstname || '',
        clientData.lastname || '',
        // Utiliser l'email unique
        emailToUse,
        // S'assurer que le numéro de téléphone est au format valide
        clientData.phone ? clientData.phone.replace(/[^\d+]/g, '') : null,
        // S'assurer que le numéro de mobile est au format valide
        clientData.mobile ? clientData.mobile.replace(/[^\d+]/g, '') : null,
        addressId,
        clientData.notes || null,
      ];

      // Insérer le client avec l'ID de l'adresse
      const clientQuery = `
        INSERT INTO clients (
          company_name, 
          firstname, 
          lastname, 
          email, 
          phone, 
          mobile, 
          address_id, 
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id`;

      const clientResult = (await pgClientDestination.query(
        clientQuery,
        clientValues,
      )) as { rows: { id: number }[] };

      // Valider la transaction
      await pgClientDestination.query('COMMIT');

      return clientResult.rows[0].id;
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await pgClientDestination.query('ROLLBACK');
      console.error("Erreur lors de l'insertion du client:", error);
      throw error;
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
    // Préparation des données pour l'insertion
    const dbObject = itemData.toDBObject();

    try {
      // Vérifier si l'article existe déjà par sa référence
      if (itemData.reference) {
        const checkRefQuery = `SELECT id FROM materials WHERE reference = $1`;
        const existingItem = await pgClientDestination.query(checkRefQuery, [
          itemData.reference,
        ]);

        if (existingItem.rows && existingItem.rows.length > 0) {
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
            dbObject.name,
            dbObject.description,
            dbObject.unit,
            dbObject.price,
            dbObject.stock_quantity,
            dbObject.minimum_stock,
            dbObject.supplier,
            dbObject.supplier_reference,
            existingItem.rows[0].id,
          ];

          const updateResult = await pgClientDestination.query(
            updateQuery,
            updateValues,
          );
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
        dbObject.name,
        dbObject.description,
        itemData.reference,
        dbObject.unit,
        dbObject.price,
        dbObject.stock_quantity,
        dbObject.minimum_stock,
        dbObject.supplier,
        dbObject.supplier_reference,
      ];

      const insertResult = await pgClientDestination.query(
        insertQuery,
        insertValues,
      );
      return insertResult.rows[0].id;
    } catch (error) {
      console.error("Erreur lors de l'insertion de l'article:", error);
      throw error;
    }
  }
}
