---
name: arquitetura-financeira
description: "Desenvolvemento de sistemas financeiros seguindo Clean Architecture, DDD e SOLID. Use when: implementar entidades financeiras, agregados de domínio, cálculos monetários, regras de negócio financeiras, repositórios, casos de uso, validações de transações, estratégias de saldo, auditoria financeira, consistência transacional."
---

# Skill: Arquitetura de Sistemas Financeiros

## Quando Usar

Esta skill se aplica quando você está:
- Desenvolvendo entidades financeiras (User, Account, Transaction, Category, Budget, Goal)
- Implementando regras de negócio do domínio financeiro
- Criando agregados e value objects para operações monetárias
- Definindo casos de uso financeiros (transferências, cálculos de saldo, categorização)
- Aplicando padrões DDD em contexto de gestão financeira
- Validando consistência transacional e integridade de dados financeiros

## Princípios Obrigatórios

### Clean Architecture para Domínio Financeiro

```
src/
├── domain/
│   ├── entities/          # User, Account, Transaction, Category, Budget
│   ├── value-objects/     # Money, Currency, TransactionType, Period
│   ├── aggregates/        # AccountAggregate, TransactionAggregate
│   ├── repositories/      # Interfaces: IAccountRepo, ITransactionRepo
│   └── services/          # DomainServices: BalanceCalculator, CategoryMatcher
├── application/
│   ├── use-cases/         # CreateTransaction, TransferMoney, CalculateBalance
│   ├── dtos/              # CreateTransactionDto, TransferDto
│   └── mappers/           # Entity <-> DTO mappers
├── infrastructure/
│   ├── repositories/      # AccountRepository, TransactionRepository
│   ├── persistence/       # TypeORM entities, migrations
│   └── external-services/ # Bank APIs, AI services
└── presentation/
    ├── controllers/       # AccountController, TransactionController
    └── middlewares/       # AuthMiddleware, AuditMiddleware
```

### Value Objects Financeiros Obrigatórios

```typescript
// Money Value Object
export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: Currency = Currency.BRL
  ) {
    this.validateAmount(amount);
  }

  private validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Amount must be a finite positive number');
    }
    if (this.hasMoreThan2Decimals(amount)) {
      throw new Error('Amount cannot have more than 2 decimal places');
    }
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    return new Money(result, this.currency);
  }

  toNumber(): number {
    return this.amount;
  }
}
```

### Agregados de Domínio

```typescript
// Account Aggregate
export class AccountAggregate {
  private constructor(
    public readonly id: AccountId,
    public readonly userId: UserId,
    private name: string,
    private balance: Money,
    private transactions: Transaction[] = []
  ) {}

  static create(userId: UserId, name: string, initialBalance: Money): AccountAggregate {
    // Validações de negócio
    return new AccountAggregate(AccountId.generate(), userId, name, initialBalance);
  }

  addTransaction(transaction: Transaction): void {
    this.validateTransaction(transaction);
    this.transactions.push(transaction);
    this.updateBalance(transaction);
    // Eventos de domínio para auditoria
    this.addDomainEvent(new TransactionAddedEvent(this.id, transaction.id));
  }

  private updateBalance(transaction: Transaction): void {
    if (transaction.type === TransactionType.INCOME) {
      this.balance = this.balance.add(transaction.amount);
    } else {
      this.balance = this.balance.subtract(transaction.amount);
    }
  }

  getCurrentBalance(): Money {
    return this.balance;
  }
}
```

## Padrões de Design Obrigatórios

### 1. Repository Pattern

```typescript
// Interface no domínio
export interface IAccountRepository {
  save(account: AccountAggregate): Promise<void>;
  findById(id: AccountId): Promise<AccountAggregate | null>;
  findByUserId(userId: UserId): Promise<AccountAggregate[]>;
}

// Implementação na infraestrutura
@Injectable()
export class AccountRepository implements IAccountRepository {
  async save(account: AccountAggregate): Promise<void> {
    // Implementação usando TypeORM
  }
}
```

### 2. Strategy Pattern para Cálculos

```typescript
interface IBalanceCalculationStrategy {
  calculate(transactions: Transaction[]): Money;
}

class SimpleBalanceStrategy implements IBalanceCalculationStrategy {
  calculate(transactions: Transaction[]): Money {
    return transactions.reduce((balance, transaction) => {
      return transaction.type === TransactionType.INCOME 
        ? balance.add(transaction.amount)
        : balance.subtract(transaction.amount);
    }, new Money(0));
  }
}
```

### 3. Domain Services

```typescript
@Injectable()
export class TransferService {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async transfer(
    fromAccountId: AccountId,
    toAccountId: AccountId,
    amount: Money,
    description: string
  ): Promise<void> {
    // Validações de domínio
    const fromAccount = await this.accountRepo.findById(fromAccountId);
    const toAccount = await this.accountRepo.findById(toAccountId);
    
    if (!fromAccount || !toAccount) {
      throw new Error('Invalid accounts for transfer');
    }

    if (fromAccount.getCurrentBalance().toNumber() < amount.toNumber()) {
      throw new Error('Insufficient balance');
    }

    // Transação atômica
    await this.executeTransfer(fromAccount, toAccount, amount, description);
  }
}
```

## Validações Financeiras Essenciais

### DTOs com Validações

```typescript
export class CreateTransactionDto {
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsPositive()
  @IsDecimal({ decimal_digits: '0,2' })
  amount: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsNotEmpty()
  @Length(1, 255)
  description: string;

  @IsDateString()
  date: string;
}
```

### Guards Financeiros

```typescript
@Injectable()
export class FinancialOperationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const operation = request.body;

    // Verificar se o usuário pode realizar operação financeira
    return this.canPerformFinancialOperation(user, operation);
  }

  private canPerformFinancialOperation(user: any, operation: any): boolean {
    // Implementar regras de autorização financeira
    return user.role !== 'READ_ONLY' && this.isValidAmount(operation.amount);
  }
}
```

## Checklist de Implementação

- [ ] Entidades carregam apenas regras de domínio, sem dependências externas
- [ ] Value objects são imutáveis e contêm validações intrínsecas
- [ ] Agregados controlam consistência transacional
- [ ] Repositórios abstraem persistência do domínio
- [ ] Cases de uso orquestram operações sem regras de domínio
- [ ] DTOs validam entrada de dados
- [ ] Money é tratado como value object, não como number primitivo
- [ ] Operações financeiras são auditadas
- [ ] Transferências são atomicamente consistentes
- [ ] Guards protegem operações financeiras críticas

## Anti-Patterns a Evitar

- **Anemic Domain Model**: Entidades sem comportamento, apenas getters/setters
- **Fat Controllers**: Lógica de negócio em controllers em vez do domínio
- **Direct Database Dependency**: Domain dependendo de TypeORM ou PostgreSQL
- **Primitive Obsession**: Usar number para valores monetários
- **Missing Transaction Boundaries**: Operações financeiras sem atomicidade
- **Weak Validation**: Permitir valores monetários inválidos em qualquer camada