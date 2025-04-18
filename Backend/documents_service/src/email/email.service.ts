import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import * as fs from 'fs';

@Injectable()
export class EmailService {
  constructor() {
    // Initialiser SendGrid avec la clé API
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('SENDGRID_API_KEY is not defined in environment variables');
      return;
    }
    sgMail.setApiKey(apiKey);
  }

  /**
   * Envoie un email avec un PDF en pièce jointe
   * @param to Adresse email du destinataire
   * @param subject Sujet de l'email
   * @param text Contenu de l'email en format texte
   * @param html Contenu de l'email en format HTML
   * @param attachmentPath Chemin du fichier PDF à joindre
   * @returns Promise qui se résout à true si l'email a été envoyé avec succès
   */
  async sendEmailWithAttachment(
    to: string,
    subject: string,
    text: string,
    html: string,
    attachmentPath: string,
  ): Promise<boolean> {
    try {
      // Vérifier que le fichier existe
      if (!fs.existsSync(attachmentPath)) {
        throw new Error(`Le fichier ${attachmentPath} n'existe pas`);
      }

      // Lire le fichier en base64
      const attachment = fs.readFileSync(attachmentPath).toString('base64');
      const filename = attachmentPath.split('/').pop() || 'document.pdf';

      const msg = {
        to,
        from: 'jordanserafini74370@gmail.com',
        subject,
        text,
        html,
        attachments: [
          {
            content: attachment,
            filename,
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ],
      };

      const response = await sgMail.send(msg);
      console.log('Email envoyé avec succès:', response[0].statusCode);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      return false;
    }
  }
}
