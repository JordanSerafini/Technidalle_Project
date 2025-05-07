export type EmailAnalysis = {
  summary: string;
  priority: string;
  category: string;
  actionRequired: boolean;
  actionItems: string[];
};

export type EmailData = {
  id: string;
  folderPath: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  analysis: EmailAnalysis;
};

export interface EmailSummaryStats {
  totalEmails: number;
  highPriorityCount: number;
  actionRequiredCount: number;
  categoryCounts: Record<string, number>;
}

export type MailSummaryResponse = {
  status: string;
  message: string;
  data: EmailData[];
  summary: {
    overview: string;
    totalEmails: number;
    highPriorityCount: number;
    actionRequiredCount: number;
    categoryCounts: Record<string, number>;
    actionItems: string[];
  };
};

// Ajouter un export par défaut pour résoudre l'erreur d'Expo Router
export default function MailTypesExport() {
  return null;
} 