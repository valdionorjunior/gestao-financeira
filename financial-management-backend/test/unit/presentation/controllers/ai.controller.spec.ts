import { Test, TestingModule } from '@nestjs/testing';
import { AIController } from '@presentation/controllers/ai.controller';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  AICategorizationUseCase, AIInsightsUseCase,
  AIPredictionUseCase, AIChatUseCase,
} from '@application/use-cases/ai/ai.use-cases';

const mockCategorizeUseCase = { suggest: jest.fn() };
const mockInsightsUseCase   = { execute: jest.fn() };
const mockPredictionUseCase = { execute: jest.fn() };
const mockChatUseCase       = { execute: jest.fn() };

const USER = { userId: 'user-uuid-1' };

describe('AIController', () => {
  let controller: AIController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        { provide: AICategorizationUseCase, useValue: mockCategorizeUseCase },
        { provide: AIInsightsUseCase,       useValue: mockInsightsUseCase },
        { provide: AIPredictionUseCase,     useValue: mockPredictionUseCase },
        { provide: AIChatUseCase,           useValue: mockChatUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AIController);
    jest.clearAllMocks();
  });

  describe('POST /ai/categorize → categorize()', () => {
    it('delega para AICategorizationUseCase com description, amount e userId', async () => {
      const suggestion = { categoryId: 'cat-1', categoryName: 'Alimentação', confidence: 0.9 };
      mockCategorizeUseCase.suggest.mockResolvedValue(suggestion);

      const result = await controller.categorize(
        { description: 'Supermercado Extra', amount: 150 },
        USER,
      );

      expect(mockCategorizeUseCase.suggest).toHaveBeenCalledWith('Supermercado Extra', 150, USER.userId);
      expect(result).toEqual(suggestion);
    });
  });

  describe('GET /ai/insights → insights()', () => {
    it('retorna insights do mês atual', async () => {
      const insights = { summary: 'Seus gastos aumentaram 10%', suggestions: ['Reduza alimentação'] };
      mockInsightsUseCase.execute.mockResolvedValue(insights);

      const result = await controller.insights(USER);

      expect(mockInsightsUseCase.execute).toHaveBeenCalledWith(USER.userId);
      expect(result).toEqual(insights);
    });
  });

  describe('GET /ai/predict → predict()', () => {
    it('retorna previsão de gastos', async () => {
      const prediction = { predictedExpense: 2500, trend: 'stable', confidence: 0.82 };
      mockPredictionUseCase.execute.mockResolvedValue(prediction);

      const result = await controller.predict(USER);

      expect(mockPredictionUseCase.execute).toHaveBeenCalledWith(USER.userId);
      expect(result).toEqual(prediction);
    });
  });

  describe('POST /ai/chat → chat()', () => {
    it('envia mensagem para o assistente e retorna resposta', async () => {
      const chatResponse = { response: 'Você gastou R$ 2.300 este mês.' };
      mockChatUseCase.execute.mockResolvedValue(chatResponse);

      const result = await controller.chat(
        { message: 'Quanto gastei este mês?' },
        USER,
      );

      expect(mockChatUseCase.execute).toHaveBeenCalledWith('Quanto gastei este mês?', USER.userId);
      expect(result).toEqual(chatResponse);
    });
  });
});
