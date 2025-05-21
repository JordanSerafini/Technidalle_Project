export interface Attachment {
  uri: string;
  type: string;
  name: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  attachments?: Attachment[];
  data?: any[];
  responseFormat?: string;
  queryDescription?: string;
}

export interface ChatMessageProps {
  message: Message;
}

export interface QuickReplyProps {
  suggestions: string[];
  onPress: (suggestion: string) => void;
}

export interface AttachmentButtonProps {
  onFileSelected: (uri: string, type: string, name: string) => void;
} 