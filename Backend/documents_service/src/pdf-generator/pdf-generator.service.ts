import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { DevisWithLines } from '../interfaces/devis.interface';
import * as fs from 'fs';
import * as path from 'path';

// Interface pour les champs clients pour éviter les erreurs d'unsafe member access
interface ClientInfo {
  company_name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  addresses?: AddressInfo;
}

// Interface pour les adresses
interface AddressInfo {
  street_number?: string;
  street_name: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country: string;
}

// Interface pour les projets
interface ProjectInfo {
  name: string;
  reference: string;
}

@Injectable()
export class PdfGeneratorService {
  /**
   * Génère un PDF pour un devis
   * @param devis Le devis avec ses lignes
   * @param outputPath Chemin de sortie du fichier PDF (optionnel)
   * @returns Chemin du fichier PDF généré
   */
  async generateDevisPdf(
    devis: DevisWithLines,
    outputPath?: string,
  ): Promise<string> {
    // Créer un nouveau document PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Définir le chemin de sortie s'il n'est pas fourni
    if (!outputPath) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'pdf');
      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      outputPath = path.join(uploadDir, `devis_${devis.reference}.pdf`);
    }

    // Créer le flux de fichier
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // En-tête du document
    this.addHeader(doc);

    // Informations client et projet
    this.addClientInfo(doc, devis);

    // Information du devis
    this.addDevisInfo(doc, devis);

    // Tableau des lignes du devis
    this.addDevisLines(doc, devis);

    // Total et informations de paiement
    this.addDevisTotal(doc, devis);

    // Pied de page
    this.addFooter(doc);

    // Finaliser le document
    doc.end();

    // Attendre que le flux soit terminé
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(outputPath);
      });
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Ajoute l'en-tête du document
   */
  private addHeader(doc: PDFKit.PDFDocument): void {
    // Logo de l'entreprise (si disponible)
    // doc.image('path/to/logo.png', 50, 45, { width: 150 });

    // Nom de l'entreprise
    doc
      .fontSize(20)
      .text('TECHNIDALLE', 50, 45, { align: 'left' })
      .fontSize(10)
      .text('123 Rue des Travaux', { align: 'left' })
      .text('75000 Paris', { align: 'left' })
      .text('Tél: 01 23 45 67 89', { align: 'left' })
      .text('Email: contact@technidalle.fr', { align: 'left' });

    doc.moveDown(2);
  }

  /**
   * Ajoute les informations du client
   */
  private addClientInfo(doc: PDFKit.PDFDocument, devis: DevisWithLines): void {
    doc.fontSize(14).text('Client:', 50, 150);

    if (devis.clients) {
      doc.fontSize(10);
      const client = devis.clients as ClientInfo;

      // Nom du client ou entreprise
      if (client.company_name) {
        doc.text(client.company_name);
      }

      if (client.firstname && client.lastname) {
        doc.text(`${client.firstname} ${client.lastname}`);
      }

      // Adresse du client (depuis la relation addresses)
      if (client.addresses) {
        const address = client.addresses;
        let addressText = '';

        // Numéro et nom de rue
        if (address.street_number && address.street_name) {
          addressText += `${address.street_number} ${address.street_name}`;
        } else if (address.street_name) {
          addressText += address.street_name;
        }

        // Complément d'adresse si existant
        if (address.additional_address) {
          doc.text(addressText);
          addressText = address.additional_address;
        }

        // Code postal et ville
        if (address.zip_code && address.city) {
          doc.text(addressText);
          addressText = `${address.zip_code} ${address.city}`;
        }

        // Pays (si différent de France)
        if (address.country && address.country !== 'France') {
          doc.text(addressText);
          addressText = address.country;
        }

        // Afficher la dernière ligne d'adresse
        if (addressText) {
          doc.text(addressText);
        }
      }

      // Coordonnées du client
      if (client.email) {
        doc.text(`Email: ${client.email}`);
      }

      if (client.phone) {
        doc.text(`Tél: ${client.phone}`);
      }
    } else {
      doc.text('Informations client non disponibles');
    }

    doc.moveDown(1);
  }

  /**
   * Ajoute les informations du devis
   */
  private addDevisInfo(doc: PDFKit.PDFDocument, devis: DevisWithLines): void {
    doc.fontSize(16).text('DEVIS', 400, 150, { align: 'right' });

    doc.fontSize(10);
    doc.text(`Référence: ${devis.reference}`, { align: 'right' });
    doc.text(`Date d'émission: ${this.formatDate(devis.issue_date)}`, {
      align: 'right',
    });

    if (devis.due_date) {
      doc.text(`Date d'échéance: ${this.formatDate(devis.due_date)}`, {
        align: 'right',
      });
    }

    if (devis.projects) {
      const project = devis.projects as ProjectInfo;
      doc.text(`Projet: ${project.name} (${project.reference})`, {
        align: 'right',
      });
    }

    doc.moveDown(2);
  }

  /**
   * Ajoute le tableau des lignes du devis
   */
  private addDevisLines(doc: PDFKit.PDFDocument, devis: DevisWithLines): void {
    // Titre du tableau
    doc.fontSize(14).text('Détail des prestations', 50, 240);
    doc.moveDown(0.5);

    // En-têtes du tableau
    const tableTop = 260;
    const itemCodeX = 50;
    const descriptionX = 100;
    const quantityX = 330;
    const unitX = 380;
    const priceX = 430;
    const amountX = 490;

    // Style de l'en-tête
    doc.fontSize(10).font('Helvetica-Bold');

    // En-têtes
    doc.text('Réf.', itemCodeX, tableTop);
    doc.text('Description', descriptionX, tableTop);
    doc.text('Qté', quantityX, tableTop);
    doc.text('Unité', unitX, tableTop);
    doc.text('Prix Unit.', priceX, tableTop);
    doc.text('Montant HT', amountX, tableTop);

    // Ligne de séparation sous l'en-tête
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Position de départ pour les lignes
    let y = tableTop + 25;

    // Style pour les lignes du tableau
    doc.font('Helvetica');

    // Afficher chaque ligne du devis
    if (devis.lines && devis.lines.length > 0) {
      devis.lines.forEach((line) => {
        // Vérifier s'il faut une nouvelle page
        if (y > 700) {
          doc.addPage();
          y = 50;

          // Ajouter les en-têtes sur la nouvelle page
          doc.font('Helvetica-Bold');
          doc.text('Réf.', itemCodeX, y);
          doc.text('Description', descriptionX, y);
          doc.text('Qté', quantityX, y);
          doc.text('Unité', unitX, y);
          doc.text('Prix Unit.', priceX, y);
          doc.text('Montant HT', amountX, y);

          // Ligne de séparation sous l'en-tête
          doc
            .moveTo(50, y + 15)
            .lineTo(550, y + 15)
            .stroke();

          y += 25;
          doc.font('Helvetica');
        }

        // Convertir les valeurs Decimal en number
        const unitPrice = Number(line.unit_price);
        const discountPercent = line.discount_percent
          ? Number(line.discount_percent)
          : 0;
        const discountAmount = line.discount_amount
          ? Number(line.discount_amount)
          : 0;
        const totalHt = line.total_ht
          ? Number(line.total_ht)
          : Number(line.quantity) * unitPrice * (1 - discountPercent / 100) -
            discountAmount;

        // Référence du matériel (si disponible)
        doc.text(line.material_id?.toString() || '', itemCodeX, y);

        // Description (avec gestion de texte long)
        const descriptionWidth = quantityX - descriptionX - 10;
        const textOptions = {
          width: descriptionWidth,
          align: 'left' as const,
        };
        const descriptionHeight = doc.heightOfString(
          line.description,
          textOptions,
        );
        doc.text(line.description, descriptionX, y, textOptions);

        // Quantité, unité, prix unitaire, montant
        doc.text(line.quantity.toString(), quantityX, y, { align: 'right' });
        doc.text(line.unit, unitX, y);
        doc.text(this.formatCurrency(unitPrice), priceX, y, {
          align: 'right',
        });
        doc.text(this.formatCurrency(totalHt), amountX, y, {
          align: 'right',
        });

        // Ajuster la position y pour la prochaine ligne
        y += Math.max(20, descriptionHeight + 5);
      });
    } else {
      doc.text('Aucune ligne dans ce devis', 50, y);
      y += 20;
    }

    // Ligne de séparation après le tableau
    doc.moveTo(50, y).lineTo(550, y).stroke();

    // Mettre à jour la position verticale pour le total
    doc.y = y + 10;
  }

  /**
   * Ajoute le total du devis
   */
  private addDevisTotal(doc: PDFKit.PDFDocument, devis: DevisWithLines): void {
    const labelX = 400;
    const valueX = 500;
    let y = doc.y;

    // Calculer le total HT (convertir Decimal en number si nécessaire)
    const totalHT = devis.amount ? Number(devis.amount) : 0;

    // Calculer la TVA
    const tvaRate = devis.tva_rate ? Number(devis.tva_rate) : 20;
    const totalTVA = totalHT * (tvaRate / 100);

    // Calculer le total TTC
    const totalTTC = totalHT + totalTVA;

    // Style
    doc.font('Helvetica');

    // Total HT
    doc.text('Total HT:', labelX, y, { align: 'right' });
    doc.text(this.formatCurrency(totalHT), valueX, y, { align: 'right' });
    y += 20;

    // TVA
    doc.text(`TVA (${tvaRate}%):`, labelX, y, { align: 'right' });
    doc.text(this.formatCurrency(totalTVA), valueX, y, { align: 'right' });
    y += 20;

    // Total TTC en gras
    doc.font('Helvetica-Bold');
    doc.text('Total TTC:', labelX, y, { align: 'right' });
    doc.text(this.formatCurrency(totalTTC), valueX, y, { align: 'right' });

    doc.moveDown(2);

    // Conditions de paiement
    doc.font('Helvetica');
    doc.fontSize(10).text('Conditions de paiement:', 50, y + 50);
    doc.text(
      `Devis valable 30 jours à compter de sa date d'émission.`,
      50,
      y + 70,
    );

    if (devis.notes) {
      doc.moveDown(1);
      doc.text('Notes:', 50);
      doc.text(devis.notes, 50);
    }
  }

  /**
   * Ajoute le pied de page
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Positionnement en bas de page
      doc
        .fontSize(8)
        .text(
          `TECHNIDALLE - SIRET: 123 456 789 00010 - TVA: FR12 123 456 789 - Page ${i + 1}/${pageCount}`,
          50,
          800,
          { align: 'center' },
        );
    }
  }

  /**
   * Formatte une date en format français
   */
  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  }

  /**
   * Formatte un montant en euros
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}
