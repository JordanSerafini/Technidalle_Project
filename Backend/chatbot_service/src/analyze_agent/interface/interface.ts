class AnalyzeQuestionDto {
    question: string;
  }
  
  class ExecuteQueryDto {
    query_id: string;
    parameters?: Record<string, unknown>;
  }
  
  class ConversationMessageDto {
    userId: string;
    message: string;
  }
  
  interface ChatbotResponse {
    analysis?: any;
    message?: string;
    query_executed?: string;
    query_description?: string;
    data?: unknown;
    response_format?: string;
    response?: string;
  }

  export { AnalyzeQuestionDto, ExecuteQueryDto, ConversationMessageDto, ChatbotResponse };