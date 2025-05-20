export interface PredefinedQuery {
  id: string;
  keywords: string[];
  questions: string[];
  parameters?: Record<string, string | number | boolean>;
  prisma_query: string;
  fallback_sql?: string;
  response_format?: 'table' | 'list' | 'text' | 'card';
  description: string;
}

export interface QueryResult {
  data: any[];
  query: string;
  matchedQueryId?: string;
  score?: number;
}

export interface QueryResponse {
  queryResult: QueryResult;
  formattedResponse: string;
}

export interface MatchedQuery {
  predefinedQuery: PredefinedQuery;
  score: number;
  extractedParams?: Record<string, any>;
}
