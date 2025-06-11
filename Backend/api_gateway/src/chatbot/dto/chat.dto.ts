import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class ChatRequest {
  @IsString()
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  database?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  database: string;
  timestamp: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationHistory {
  conversationId: string;
  database: string;
  messages: ConversationMessage[];
} 