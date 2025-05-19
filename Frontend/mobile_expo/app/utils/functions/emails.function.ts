import url from "../url";

export const analyzeEmailsInRange = async (
  startDate: string,
  endDate: string,
  unseenOnly: boolean = false,
  summary: boolean = false,
  limit?: number,
  fastMode: boolean = false
) => {
  try {
    // Construction de l'URL avec les paramètres
    let apiUrl = `${url.email}/analyze-email/date-range?startDate=${startDate}&endDate=${endDate}`;
    
    // Ajout des paramètres optionnels
    if (unseenOnly) apiUrl += `&unseenOnly=true`;
    if (summary) apiUrl += `&summary=true`;
    if (limit) apiUrl += `&limit=${limit}`;
    if (fastMode) apiUrl += `&fastMode=true`;

    // Appel à l'API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'analyse des emails: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de l'analyse des emails par plage de dates:", error);
    throw error;
  }
};

/**
 * Génère un brouillon de réponse à un email
 * @param emailId ID de l'email à répondre
 * @param mailbox Nom de la boîte aux lettres (par défaut: INBOX)
 * @param responseLength Niveau de détail de la réponse (par défaut: normal)
 */
export const generateDraftResponse = async (
  emailId: string,
  mailbox: string = 'INBOX',
  responseLength: 'court' | 'normal' | 'détaillé' = 'normal'
) => {
  try {
    const apiUrl = `${url.email}/send-email/draft-response/${emailId}?mailbox=${mailbox}&responseLength=${responseLength}&forceRefresh=false`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la génération de la réponse: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la génération de la réponse:", error);
    throw error;
  }
};

/**
 * Reformule une réponse à un email selon des instructions spécifiques
 * @param emailId ID de l'email à répondre
 * @param draftResponse Brouillon de réponse à reformuler
 * @param instructions Instructions pour la reformulation
 * @param mailbox Nom de la boîte aux lettres (par défaut: INBOX)
 */
export const rewriteResponse = async (
  emailId: string,
  draftResponse: string,
  instructions: string,
  mailbox: string = 'INBOX'
) => {
  try {
    const apiUrl = `${url.email}/send-email/rewrite-response/${emailId}?mailbox=${mailbox}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ draftResponse, instructions }),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la reformulation de la réponse: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la reformulation de la réponse:", error);
    throw error;
  }
};

/**
 * Envoie une réponse à un email spécifique
 * @param emailId ID de l'email auquel répondre
 * @param responseText Texte de la réponse à envoyer
 * @param customSubject Objet personnalisé (optionnel)
 * @param mailbox Nom de la boîte aux lettres (par défaut: INBOX)
 */
export const sendEmailResponse = async (
  emailId: string,
  responseText: string,
  customSubject?: string,
  mailbox: string = 'INBOX'
) => {
  try {
    const apiUrl = `${url.email}/send-email/send-response/${emailId}?mailbox=${mailbox}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        responseText, 
        customSubject 
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'envoi de la réponse: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de l'envoi de la réponse:", error);
    throw error;
  }
};

