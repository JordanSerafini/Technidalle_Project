export interface ChatRequest {
  message: string;
  conversationId?: string;
  database?: 'sync' | 'app';
  userId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: Date;
  database?: 'sync' | 'app';
}

export interface DatabaseQueryRequest {
  query: string;
  database: 'sync' | 'app';
  limit?: number;
} 