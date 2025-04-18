import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Res,
  Query,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DevisService } from './devis.service';
import {
  CreateDevisDto,
  DevisWithLines,
  PdfResult,
} from '../interfaces/devis.interface';
import { Response } from 'express';
import * as fs from 'fs';
import { EmailService } from '../email/email.service';

@Controller('devis')
export class DevisController {
  constructor(
    private readonly devisService: DevisService,
    private readonly emailService: EmailService,
  ) {}

  @MessagePattern({ cmd: 'create_devis' })
  async createDevis(data: CreateDevisDto): Promise<DevisWithLines> {
    try {
      return await this.devisService.createDevis(data);
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'get_devis_by_id' })
  async getDevisById(data: { id: number }): Promise<DevisWithLines | null> {
    try {
      return await this.devisService.getDevisById(data.id);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du devis ${data.id}:`,
        error,
      );
      return null;
    }
  }

  @MessagePattern({ cmd: 'get_all_devis' })
  async getAllDevis(data?: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
    clientId?: number;
    projectId?: number;
  }): Promise<DevisWithLines[]> {
    try {
      return await this.devisService.getAllDevis(
        data?.limit,
        data?.offset,
        data?.searchQuery,
        data?.clientId,
        data?.projectId,
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des devis:', error);
      return [];
    }
  }

  @MessagePattern({ cmd: 'update_devis' })
  async updateDevis(data: {
    id: number;
    devisDto: CreateDevisDto;
  }): Promise<DevisWithLines | null> {
    try {
      return await this.devisService.updateDevis(data.id, data.devisDto);
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour du devis ${data.id}:`,
        error,
      );
      return null;
    }
  }

  @MessagePattern({ cmd: 'delete_devis' })
  async deleteDevis(data: { id: number }): Promise<boolean> {
    try {
      return await this.devisService.deleteDevis(data.id);
    } catch (error) {
      console.error(
        `Erreur lors de la suppression du devis ${data.id}:`,
        error,
      );
      return false;
    }
  }

  @MessagePattern({ cmd: 'convert_devis_to_facture' })
  async convertDevisToFacture(data: {
    id: number;
  }): Promise<DevisWithLines | null> {
    try {
      return await this.devisService.convertDevisToFacture(data.id);
    } catch (error) {
      console.error(
        `Erreur lors de la conversion du devis ${data.id} en facture:`,
        error,
      );
      return null;
    }
  }

  @MessagePattern({ cmd: 'generate_devis_pdf' })
  async generateDevisPdfForMicroservice(data: {
    id: number;
  }): Promise<PdfResult | null> {
    try {
      const pdfResult = await this.devisService.generateDevisPdf(data.id);
      return pdfResult;
    } catch (error) {
      console.error(
        `Erreur lors de la génération du PDF pour le devis ${data.id}:`,
        error,
      );
      return null;
    }
  }

  @Get(':id/pdf')
  async generatePdf(
    @Param('id') id: number,
    @Res() res: Response,
    @Query('sendEmail') sendEmail?: string,
  ): Promise<void> {
    try {
      console.log(`Démarrage de la génération du PDF pour le devis ${id}`);
      // Générer le PDF
      const pdfResult = await this.devisService.generateDevisPdf(id);
      console.log(`PDF généré avec succès dans: ${pdfResult.pdfPath}`);

      // Vérifier que le fichier existe
      if (!fs.existsSync(pdfResult.pdfPath)) {
        console.error(`Le fichier n'existe pas: ${pdfResult.pdfPath}`);
        throw new HttpException(
          "Le fichier PDF n'a pas pu être généré",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Récupérer le devis pour les infos
      const devis = await this.devisService.getDevisById(id);
      if (!devis) {
        throw new HttpException('Devis introuvable', HttpStatus.NOT_FOUND);
      }

      // Envoyer par email si demandé
      if (sendEmail === 'true') {
        console.log(`Envoi du PDF par email pour le devis ${id}`);
        try {
          const emailTo = 'jordanserafini74370@gmail.com';
          const emailSubject = `Devis ${devis.reference}`;
          const emailText = `Veuillez trouver ci-joint le devis ${devis.reference}.`;
          const emailHtml = `
            <h1>Devis ${devis.reference}</h1>
            <p>Bonjour,</p>
            <p>Veuillez trouver ci-joint le devis <strong>${devis.reference}</strong>.</p>
            <p>Date d'émission: ${new Date(devis.issue_date).toLocaleDateString('fr-FR')}</p>
            <p>Montant: ${devis.amount ? devis.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : 'Non spécifié'}</p>
            <p>Cordialement,<br>L'équipe Technidalle</p>
          `;

          // Envoi de l'email de façon synchrone pour s'assurer qu'il est envoyé
          const emailSuccess = await this.emailService.sendEmailWithAttachment(
            emailTo,
            emailSubject,
            emailText,
            emailHtml,
            pdfResult.pdfPath,
          );

          console.log(
            `Email envoyé pour le devis ${id}: ${emailSuccess ? 'Succès' : 'Échec'}`,
          );

          if (!emailSuccess) {
            console.warn(
              `L'email n'a pas pu être envoyé pour le devis ${id}, mais le PDF sera quand même téléchargé`,
            );
          }
        } catch (emailError) {
          console.error(
            `Erreur lors de l'envoi de l'email pour le devis ${id}:`,
            emailError,
          );
          // On continue pour permettre le téléchargement même si l'email échoue
        }
      }

      // Récupérer le nom du fichier
      const filename = pdfResult.filename;
      console.log(`Envoi du fichier: ${filename}`);

      // Envoyer le fichier au client
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      // Envoi direct du buffer au lieu d'utiliser un stream du système de fichiers
      // Cela évite les problèmes d'accès aux fichiers
      res.send(pdfResult.pdfBuffer);
      console.log(`PDF envoyé avec succès pour le devis ${id}`);
    } catch (error) {
      console.error(
        `Erreur lors de la génération du PDF pour le devis ${id}:`,
        error,
      );
      throw new HttpException(
        "Le fichier PDF n'a pas pu être généré",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
