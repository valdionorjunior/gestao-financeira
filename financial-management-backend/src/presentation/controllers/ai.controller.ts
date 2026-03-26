import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser }  from '../decorators/current-user.decorator';
import {
  AICategorizationUseCase, AIInsightsUseCase, AIPredictionUseCase, AIChatUseCase,
} from '../../application/use-cases/ai/ai.use-cases';

class CategorizeSuggestionDto {
  @ApiProperty({ description: 'Descrição da transação a ser categorizada', example: 'Supermercado Extra' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Valor da transação', example: 150.00 })
  @IsNumber()
  @IsPositive()
  amount!: number;
}

class AIChatDto {
  @ApiProperty({
    description: 'Mensagem ou pergunta para o assistente financeiro',
    example: 'Quanto gastei este mês e como posso economizar?',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  message!: string;
}

class AIChatResponseDto {
  @ApiProperty({ description: 'Resposta gerada pelo assistente de IA financeiro', example: 'Suas despesas do mês somam R$ 2.300,00...' })
  response!: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(
    private readonly categorizeUseCase: AICategorizationUseCase,
    private readonly insightsUseCase:   AIInsightsUseCase,
    private readonly predictionUseCase: AIPredictionUseCase,
    private readonly chatUseCase:       AIChatUseCase,
  ) {}

  @Post('categorize')
  @ApiOperation({ summary: 'Sugerir categoria para uma transação via IA' })
  categorize(@Body() dto: CategorizeSuggestionDto, @CurrentUser() user: any) {
    return this.categorizeUseCase.suggest(dto.description, dto.amount, user.userId);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Insights financeiros personalizados do mês atual' })
  insights(@CurrentUser() user: any) {
    return this.insightsUseCase.execute(user.userId);
  }

  @Get('predict')
  @ApiOperation({ summary: 'Previsão de gastos para o próximo mês' })
  predict(@CurrentUser() user: any) {
    return this.predictionUseCase.execute(user.userId);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chat com assistente financeiro de IA',
    description: `Envie uma mensagem em linguagem natural para o assistente financeiro.
O assistente tem acesso ao contexto financeiro atual do usuário (saldo, receitas, despesas do mês e principais categorias de gasto).
Quando a chave OPENAI_API_KEY estiver configurada, utiliza GPT-3.5-turbo para respostas personalizadas.
Caso contrário, utiliza um motor de regras local com respostas baseadas nos dados financeiros reais do usuário.`,
  })
  @ApiBody({ type: AIChatDto })
  @ApiResponse({
    status: 200,
    description: 'Resposta do assistente financeiro',
    type: AIChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Mensagem inválida (muito curta, muito longa ou ausente)' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente ou inválido' })
  chat(@Body() dto: AIChatDto, @CurrentUser() user: any) {
    return this.chatUseCase.execute(dto.message, user.userId);
  }
}
