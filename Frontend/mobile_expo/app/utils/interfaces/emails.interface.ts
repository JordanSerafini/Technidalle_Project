export interface CategoryCount {
    [key: string]: number;
}

export interface EmailAnalysis {
    summary: string;
    priority: string;
    category: string;
    actionRequired: boolean;
    actionItems: string[];
    tokensUsed?: {
        input: number;
        output: number;
        total: number;
    };
}

export interface EmailData {
    id: string;
    folderPath: string;
    imapUID: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    body: string;
    analysis: EmailAnalysis;
}

export interface SummaryData {
    overview: string;
    totalEmails: number;
    highPriorityCount: number;
    actionRequiredCount: number;
    categoryCounts: CategoryCount;
    topPriorityEmails: EmailData[];
    actionItems: string[];
    tokensUsed: {
        input: number;
        output: number;
        total: number;
    };
}

export interface OverviewProps {
    summary: SummaryData;
}