import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service';
import { LangchainService } from '../langchain/langchain.service';

const analyzeAgentServiceMock = {
  analyzeQuestion: jest.fn(),
  getConversationContext: jest.fn(),
  updateConversationContext: jest.fn(),
};

const queryExecutorServiceMock = {
  executeQuery: jest.fn(),
  getParameterDefinitions: jest.fn(),
};

const langchainServiceMock = {
  generateResponse: jest.fn(),
  generateGeneralResponse: jest.fn(),
  extractParameters: jest.fn(),
};

describe('ChatbotService', () => {
  let service: ChatbotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        { provide: 'AnalyzeAgentService', useValue: analyzeAgentServiceMock },
        { provide: 'QueryExecutorService', useValue: queryExecutorServiceMock },
        { provide: LangchainService, useValue: langchainServiceMock },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns planning for tomorrow', async () => {
    analyzeAgentServiceMock.analyzeQuestion.mockResolvedValue({
      reformulatedQuestion: 'planning du 10/04/2024',
      analysis: {
        intent: 'get_planning',
        entities: [{ name: 'date', value: '2024-04-10', type: 'date' }],
      },
      similarPredefinedQueries: [
        { query_id: 'planning_by_date', description: 'Planning pour une date', score: 0.9 },
      ],
    });
    analyzeAgentServiceMock.getConversationContext.mockReturnValue(undefined);
    queryExecutorServiceMock.getParameterDefinitions.mockReturnValue([{ name: 'DATE', description: 'date' }]);
    langchainServiceMock.extractParameters.mockResolvedValue({ DATE: '2024-04-10' });
    queryExecutorServiceMock.executeQuery.mockResolvedValue({
      data: [{ task: 'Pose de carrelage' }],
      description: 'Planning pour une date',
      response_format: 'json',
    });
    langchainServiceMock.generateResponse.mockResolvedValue('Demain: Pose de carrelage.');

    const response = await service.handleUserMessage('u1', 'Quel est le planning de demain ?');

    expect(response).toBe('Demain: Pose de carrelage.');
    expect(analyzeAgentServiceMock.updateConversationContext).toHaveBeenCalled();
  });

  it('lists documents of project Dupont', async () => {
    analyzeAgentServiceMock.analyzeQuestion.mockResolvedValue({
      reformulatedQuestion: 'documents du projet Dupont',
      analysis: {
        intent: 'get_documents',
        entities: [{ name: 'project', value: 'Dupont', type: 'project' }],
      },
      similarPredefinedQueries: [
        { query_id: 'documents_by_project', description: 'Documents par projet', score: 0.92 },
      ],
    });
    analyzeAgentServiceMock.getConversationContext.mockReturnValue(undefined);
    queryExecutorServiceMock.getParameterDefinitions.mockReturnValue([{ name: 'PROJECT', description: 'Nom du projet' }]);
    langchainServiceMock.extractParameters.mockResolvedValue({ PROJECT: 'Dupont' });
    queryExecutorServiceMock.executeQuery.mockResolvedValue({
      data: [{ name: 'plan.pdf' }, { name: 'budget.xlsx' }],
      description: 'Documents par projet',
      response_format: 'json',
    });
    langchainServiceMock.generateResponse.mockResolvedValue('Deux documents trouvés pour le chantier Dupont.');

    const response = await service.handleUserMessage('u1', 'Affiche les documents du chantier Dupont');

    expect(response).toContain('chantier Dupont');
  });

  it("answers with clients without quote", async () => {
    analyzeAgentServiceMock.analyzeQuestion.mockResolvedValue({
      reformulatedQuestion: 'clients sans devis',
      analysis: { intent: 'list_clients_without_quote', entities: [] },
      similarPredefinedQueries: [
        { query_id: 'clients_without_quote', description: 'Clients sans devis', score: 0.95 },
      ],
    });
    analyzeAgentServiceMock.getConversationContext.mockReturnValue(undefined);
    queryExecutorServiceMock.getParameterDefinitions.mockReturnValue([]);
    langchainServiceMock.extractParameters.mockResolvedValue({});
    queryExecutorServiceMock.executeQuery.mockResolvedValue({
      data: [{ name: 'Client A' }, { name: 'Client B' }],
      description: 'Clients sans devis',
      response_format: 'json',
    });
    langchainServiceMock.generateResponse.mockResolvedValue('Clients sans devis : Client A, Client B.');

    const response = await service.handleUserMessage('u1', "Quels clients n'ont pas de devis ?");

    expect(response).toMatch(/Client A/);
  });

  it('returns general answer when no predefined query', async () => {
    analyzeAgentServiceMock.analyzeQuestion.mockResolvedValue({
      reformulatedQuestion: 'hello',
      analysis: { intent: 'smalltalk', entities: [] },
      similarPredefinedQueries: [],
    });
    langchainServiceMock.generateGeneralResponse.mockResolvedValue('Salut!');

    const response = await service.handleUserMessage('u1', 'Bonjour');

    expect(response).toBe('Salut!');
    expect(langchainServiceMock.generateGeneralResponse).toHaveBeenCalled();
    expect(analyzeAgentServiceMock.updateConversationContext).toHaveBeenCalled();
  });

  it('provides health status', async () => {
    const status = await service.getHealth();
    expect(status.status).toBe('ok');
    expect(status.database).toBe('connected');
    expect(status.services.length).toBeGreaterThan(0);
  });
});
