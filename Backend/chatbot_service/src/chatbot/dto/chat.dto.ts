export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: Date;
}

export interface DatabaseQueryRequest {
  query: string;
  context?: string;
} 