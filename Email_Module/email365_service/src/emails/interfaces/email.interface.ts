export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Recipient {
  emailAddress: EmailAddress;
}

export interface EmailBody {
  contentType: 'Text' | 'HTML';
  content: string;
}

export interface Attachment {
  '@odata.type': '#microsoft.graph.fileAttachment';
  name: string;
  contentType: string;
  contentBytes: string;
}

export interface EmailMessage {
  subject?: string;
  importance?: 'Low' | 'Normal' | 'High';
  body?: EmailBody;
  toRecipients?: Recipient[];
  ccRecipients?: Recipient[];
  bccRecipients?: Recipient[];
  attachments?: Attachment[];
  bodyPreview?: string;
  receivedDateTime?: string;
  from?: Recipient;
}

export interface EmailOptions {
  filter?: string;
  select?: string;
  orderby?: string;
  top?: number;
}

export interface SendMailRequest {
  message: EmailMessage;
  saveToSentItems?: boolean;
}
