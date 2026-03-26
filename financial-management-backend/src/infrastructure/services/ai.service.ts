import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface CategorySuggestion {
  categoryId?: string;
  categoryName: string;
  confidence: number;
  reasoning?: string;
}

export interface FinancialInsight {
  type: 'saving_tip' | 'overspend_alert' | 'goal_projection' | 'monthly_comparison';
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class AICategoryService {
  private readonly logger = new Logger(AICategoryService.name);
  private readonly client?: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async categorize(
    description: string,
    amount: number,
    availableCategories: Array<{ id: string; name: string; type: string }>,
  ): Promise<CategorySuggestion> {
    // Fallback: keyword-based classification when no OpenAI key is set
    if (!this.client) {
      return this.keywordClassify(description, availableCategories);
    }

    try {
      const categoryList = availableCategories
        .map(c => `${c.id}|${c.name}|${c.type}`)
        .join('\n');

      const completion = await this.client.chat.completions.create({
        model:      'gpt-3.5-turbo',
        max_tokens: 150,
        messages: [
          {
            role: 'system',
            content: 'Você é um classificador de transações financeiras. Responda APENAS com JSON no formato: {"categoryId":"<id>","categoryName":"<name>","confidence":<0-1>,"reasoning":"<brief>"}',
          },
          {
            role: 'user',
            content: `Classifique a transação:\nDescrição: "${description}"\nValor: R$ ${amount}\n\nCategorias disponíveis:\n${categoryList}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);
      return {
        categoryId:   parsed.categoryId,
        categoryName: parsed.categoryName ?? 'Outros',
        confidence:   parsed.confidence   ?? 0.5,
        reasoning:    parsed.reasoning,
      };
    } catch (err) {
      this.logger.warn(`OpenAI categorization failed: ${(err as Error).message}`);
      return this.keywordClassify(description, availableCategories);
    }
  }

  private keywordClassify(
    description: string,
    categories: Array<{ id: string; name: string; type: string }>,
  ): CategorySuggestion {
    const desc  = description.toLowerCase();
    const rules: Array<{ keywords: string[]; name: string }> = [
      { keywords: ['supermercado', 'mercado', 'padaria', 'hortifruti', 'feira'], name: 'Alimentação' },
      { keywords: ['restaurante', 'lanchonete', 'pizza', 'hamburguer', 'sushi', 'ifood', 'rappi'], name: 'Restaurantes' },
      { keywords: ['uber', 'lyft', '99', 'taxi', 'combustivel', 'combustível', 'gasolina', 'posto'], name: 'Transporte' },
      { keywords: ['netflix', 'spotify', 'amazon', 'prime', 'disney', 'hbo'], name: 'Entretenimento' },
      { keywords: ['luz', 'energia', 'agua', 'água', 'gás', 'internet', 'telefone', 'celular'], name: 'Contas & Serviços' },
      { keywords: ['farmacia', 'remédio', 'médico', 'hospital', 'plano de saude'], name: 'Saúde' },
      { keywords: ['salario', 'salário', 'pagamento', 'vencimento'], name: 'Salário' },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(k => desc.includes(k))) {
        const matched = categories.find(c => c.name.toLowerCase().includes(rule.name.toLowerCase()));
        return {
          categoryId:   matched?.id,
          categoryName: rule.name,
          confidence:   0.75,
        };
      }
    }

    return { categoryName: 'Outros', confidence: 0.3 };
  }
}

@Injectable()
export class AIInsightsService {
  private readonly client?: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async generateInsights(
    currentMonth: { income: number; expense: number; byCategory: Record<string, number> },
    previousMonth: { income: number; expense: number },
  ): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    // Local insights (always available)
    const savingsRate = currentMonth.income > 0
      ? ((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100
      : 0;

    if (savingsRate < 10 && currentMonth.income > 0) {
      insights.push({
        type:    'saving_tip',
        title:   'Taxa de poupança baixa',
        message: `Sua taxa de poupança este mês é ${savingsRate.toFixed(1)}%. Tente economizar pelo menos 20% da sua renda.`,
        data:    { savingsRate },
      });
    }

    if (previousMonth.expense > 0) {
      const changePercent = ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100;
      if (changePercent > 20) {
        insights.push({
          type:    'overspend_alert',
          title:   'Aumento de gastos',
          message: `Seus gastos aumentaram ${changePercent.toFixed(1)}% em relação ao mês anterior.`,
          data:    { changePercent },
        });
      }
    }

    const topCategory = Object.entries(currentMonth.byCategory).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && currentMonth.income > 0) {
      const pct = (topCategory[1] / currentMonth.income) * 100;
      if (pct > 40) {
        insights.push({
          type:    'overspend_alert',
          title:   'Categoria dominante',
          message: `A categoria principal representa ${pct.toFixed(1)}% da sua renda. Avalie se está em linha com seus objetivos.`,
          data:    { category: topCategory[0], percent: pct },
        });
      }
    }

    // AI-powered insights when key is available
    if (this.client) {
      try {
        const prompt = `Dados financeiros do usuário:\nRenda: R$ ${currentMonth.income}\nGastos: R$ ${currentMonth.expense}\nMês anterior - Gastos: R$ ${previousMonth.expense}\n\nGere 1 dica financeira personalizada curta em português.`;
        const completion = await this.client.chat.completions.create({
          model:      'gpt-3.5-turbo',
          max_tokens: 100,
          messages:   [{ role: 'user', content: prompt }],
        });
        const tip = completion.choices[0]?.message?.content?.trim();
        if (tip) {
          insights.push({ type: 'saving_tip', title: 'Dica personalizada', message: tip });
        }
      } catch {
        // silently degrade
      }
    }

    return insights;
  }
}

@Injectable()
export class AIExpensePredictionService {
  predictNextMonth(historicalMonths: Array<{ expense: number }>): number {
    if (historicalMonths.length === 0) return 0;
    // Simple weighted moving average (most recent months weigh more)
    const weights  = historicalMonths.map((_, i) => i + 1);
    const totalW   = weights.reduce((s, w) => s + w, 0);
    const weighted = historicalMonths.reduce((s, m, i) => s + m.expense * weights[i], 0);
    return weighted / totalW;
  }
}

export interface AIChatContext {
  totalBalance?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  topCategories?: Array<{ name: string; amount: number }>;
  goals?: Array<{ name: string; progressPercent: number; remainingAmount: number; isAchieved: boolean; daysLeft?: number }>;
}

@Injectable()
export class AIChatService {
  private readonly logger = new Logger(AIChatService.name);
  private readonly client?: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async chat(message: string, context?: AIChatContext): Promise<string> {
    if (this.client) {
      try {
        const systemPrompt = this.buildSystemPrompt(context);
        const completion = await this.client.chat.completions.create({
          model:      'gpt-3.5-turbo',
          max_tokens: 400,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: message },
          ],
        });
        return completion.choices[0]?.message?.content?.trim() ?? this.fallbackResponse(message, context);
      } catch (err) {
        const cause = (err as any)?.cause;
        this.logger.error(
          `OpenAI chat failed: ${(err as Error).message}${cause ? ` | cause: ${String(cause.message ?? cause)} (code: ${cause.code ?? 'unknown'})` : ''}`,
        );
      }
    }
    return this.fallbackResponse(message, context);
  }

  private buildSystemPrompt(context?: AIChatContext): string {
    let ctx = '';
    if (context) {
      if (context.totalBalance   !== undefined) ctx += `\n- Saldo total das contas: R$ ${context.totalBalance.toFixed(2)}`;
      if (context.monthlyIncome  !== undefined) ctx += `\n- Receita do mês atual: R$ ${context.monthlyIncome.toFixed(2)}`;
      if (context.monthlyExpense !== undefined) ctx += `\n- Despesa do mês atual: R$ ${context.monthlyExpense.toFixed(2)}`;
      if (context.topCategories?.length) {
        ctx += `\n- Principais categorias de gasto: ${context.topCategories.map(c => `${c.name} (R$ ${c.amount.toFixed(2)})`).join(', ')}`;
      }
      if (context.goals?.length) {
        const goalsSummary = context.goals
          .map(g => {
            const status = g.isAchieved ? '✅ concluída' : `${g.progressPercent.toFixed(0)}% concluída, faltam R$ ${g.remainingAmount.toFixed(2)}`;
            const deadline = g.daysLeft !== undefined ? `, prazo em ${g.daysLeft} dias` : '';
            return `${g.name}: ${status}${deadline}`;
          })
          .join('; ');
        ctx += `\n- Metas financeiras ativas: ${goalsSummary}`;
      }
    }

    return `Você é um assistente financeiro pessoal inteligente e empático, especializado em gestão de finanças pessoais e familiares no Brasil.
Responda sempre em português, de forma clara, objetiva e amigável.
Quando sugerir ações, seja específico e prático.
${ctx ? `\nContexto financeiro atual do usuário:${ctx}` : ''}
Limite suas respostas a no máximo 3 parágrafos curtos.`;
  }

  private fallbackResponse(message: string, context?: AIChatContext): string {
    const lower = message.toLowerCase();

    // Basic rule-based responses when OpenAI is unavailable
    if (lower.includes('saldo') || lower.includes('quanto tenho')) {
      if (context?.totalBalance !== undefined) {
        return `Seu saldo total atual é R$ ${context.totalBalance.toFixed(2)}. ${context.totalBalance < 0 ? 'Atenção: seu saldo está negativo. Revise seus gastos urgentemente.' : 'Continue mantendo um controle rigoroso das suas finanças!'}`;
      }
      return 'Para consultar seu saldo, acesse a seção de Contas no menu lateral. Lá você encontra o saldo atualizado de cada conta.';
    }

    if (lower.includes('gasto') || lower.includes('despesa') || lower.includes('gastei')) {
      if (context?.monthlyExpense !== undefined) {
        return `Suas despesas no mês atual somam R$ ${context.monthlyExpense.toFixed(2)}. ${context?.monthlyIncome && context.monthlyExpense > context.monthlyIncome ? 'Alerta: seus gastos estão superando a renda. Identifique onde cortar.' : 'Continue acompanhando regularmente para manter sua saúde financeira.'}`;
      }
      return 'Acesse a seção de Transações para ver um detalhamento completo dos seus gastos por categoria e período.';
    }

    if (lower.includes('economia') || lower.includes('poupar') || lower.includes('economizar')) {
      const rate = (context?.monthlyIncome && context?.monthlyExpense)
        ? ((context.monthlyIncome - context.monthlyExpense) / context.monthlyIncome) * 100
        : null;
      if (rate !== null) {
        return `Sua taxa de poupança atual é de ${rate.toFixed(1)}%. ${rate < 10 ? 'Tente aumentar para pelo menos 20%. Revise assinaturas e gastos supérfluos.' : rate < 20 ? 'Bom começo! Tente chegar a 20% de poupança.' : 'Excelente! Continue assim e considere investir o excedente.'}`;
      }
      return 'Uma boa regra é poupar pelo menos 20% da renda. Comece revisando assinaturas, alimentação fora de casa e compras por impulso.';
    }

    if (lower.includes('orçamento') || lower.includes('budget')) {
      return 'Acesse a seção de Orçamentos para criar limites por categoria. Com orçamentos ativos, você recebe alertas quando estiver próximo de estourar o limite.';
    }

    if (lower.includes('meta') || lower.includes('objetivo') || lower.includes('caminho certo')) {
      if (context?.goals?.length) {
        const active  = context.goals.filter(g => !g.isAchieved);
        const done    = context.goals.filter(g => g.isAchieved);
        const onTrack = active.filter(g => g.progressPercent >= 50);
        const behind  = active.filter(g => g.progressPercent < 50);

        let reply = '';
        if (done.length) reply += `Você já concluiu ${done.length} meta(s): ${done.map(g => g.name).join(', ')}. Parabéns! `;
        if (active.length === 0) return `${reply}Você não tem metas ativas no momento. Cadastre suas metas financeiras para acompanhar seu progresso!`;

        reply += `Você tem ${active.length} meta(s) ativa(s). `;
        if (onTrack.length)  reply += `${onTrack.length} meta(s) estão bem encaminhada(s) (acima de 50% de progresso): ${onTrack.map(g => `${g.name} (${g.progressPercent.toFixed(0)}%)`).join(', ')}. `;
        if (behind.length)   reply += `${behind.length} meta(s) precisam de atenção: ${behind.map(g => `${g.name} (${g.progressPercent.toFixed(0)}% — faltam R$ ${g.remainingAmount.toFixed(2)})`).join(', ')}. `;
        const urgent = active.filter(g => g.daysLeft !== undefined && g.daysLeft <= 30);
        if (urgent.length)   reply += `Atenção: ${urgent.map(g => `${g.name} vence em ${g.daysLeft} dias`).join(', ')}. `;
        return reply.trim();
      }
      return 'Na seção de Metas você pode cadastrar objetivos financeiros, acompanhar o progresso e registrar aportes. Defina um valor alvo e prazo para cada meta!';
    }

    if (lower.includes('invest')) {
      return 'Para investimentos, considere a regra da pirâmide: primeiro quite dívidas de alto custo, forme uma reserva de emergência (3-6 meses de gastos) e depois explore opções como Tesouro Direto, CDB e fundos de investimento.';
    }

    return 'Sou seu assistente financeiro! Posso ajudar com dúvidas sobre saldo, gastos, economia, orçamentos e metas. Para análises completas, ative a integração com OpenAI nas configurações do sistema.';
  }
}
