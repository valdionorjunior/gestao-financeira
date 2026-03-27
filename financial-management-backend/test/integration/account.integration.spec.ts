/**
 * Account Integration Tests
 *
 * Testa a integração real entre use-cases de contas, EncryptionService e a
 * camada de domínio — sem banco de dados real.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAccountUseCase } from '@application/use-cases/accounts/create-account.use-case';
import { UpdateAccountUseCase } from '@application/use-cases/accounts/update-account.use-case';
import { GetAccountUseCase, DeleteAccountUseCase } from '@application/use-cases/accounts/get-account.use-case';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository.interface';
import { EncryptionService } from '@infrastructure/services/encryption.service';
import { AccountType } from '@domain/entities/account.entity';

const mockConfigService = { get: jest.fn().mockReturnValue(undefined) };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACCOUNT_ID = 'acct-uuid-1';
const USER_ID = 'user-uuid-1';
const OTHER_USER_ID = 'user-uuid-other';

function makeAccountRepo() {
  return {
    existsByNameAndUser: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findAllByUserId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    updateBalance: jest.fn(),
  };
}

function makeAccount(overrides: Record<string, any> = {}) {
  return {
    id: ACCOUNT_ID,
    userId: USER_ID,
    name: 'Conta Corrente',
    type: AccountType.CHECKING,
    balance: 1000,
    currency: 'BRL',
    isActive: true,
    includeInTotal: true,
    color: '#17c1e8',
    createdAt: new Date(),
    updatedAt: new Date(),
    isOwnedBy: (uid: string) => uid === USER_ID,
    ...overrides,
  };
}

// ─── CreateAccountUseCase integration ─────────────────────────────────────────

describe('[Integration] CreateAccountUseCase', () => {
  let createUseCase: CreateAccountUseCase;
  let accountRepo: ReturnType<typeof makeAccountRepo>;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAccountUseCase,
        EncryptionService,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    createUseCase = module.get(CreateAccountUseCase);
    encryptionService = module.get(EncryptionService);
    jest.clearAllMocks();
  });

  it('cria conta básica com valores padrão', async () => {
    accountRepo.existsByNameAndUser.mockResolvedValue(false);
    accountRepo.save.mockImplementation(async (data: any) => ({ id: ACCOUNT_ID, ...data }));

    const result = await createUseCase.execute(
      { name: 'Conta Corrente', type: AccountType.CHECKING },
      USER_ID,
    );

    expect(result.id).toBe(ACCOUNT_ID);
    expect(accountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        name: 'Conta Corrente',
        type: AccountType.CHECKING,
        currency: 'BRL',
        includeInTotal: true,
        isActive: true,
      }),
    );
  });

  it('usa initialBalance fornecido pelo usuário', async () => {
    accountRepo.existsByNameAndUser.mockResolvedValue(false);
    accountRepo.save.mockImplementation(async (data: any) => ({ id: ACCOUNT_ID, ...data }));

    await createUseCase.execute(
      { name: 'Poupança', type: AccountType.SAVINGS, initialBalance: 5000 },
      USER_ID,
    );

    expect(accountRepo.save.mock.calls[0][0].balance).toBe(5000);
  });

  it('criptografa agência e número de conta', async () => {
    accountRepo.existsByNameAndUser.mockResolvedValue(false);
    accountRepo.save.mockImplementation(async (data: any) => ({ id: ACCOUNT_ID, ...data }));

    await createUseCase.execute(
      {
        name: 'Conta BB',
        type: AccountType.CHECKING,
        agency: '0001',
        accountNumber: '12345-6',
      },
      USER_ID,
    );

    const saved = accountRepo.save.mock.calls[0][0];
    // Campos devem estar criptografados (não em texto plano)
    expect(saved.agency).not.toBe('0001');
    expect(saved.accountNumber).not.toBe('12345-6');
    // Mas descriptografáveis
    expect(encryptionService.decrypt(saved.agency)).toBe('0001');
    expect(encryptionService.decrypt(saved.accountNumber)).toBe('12345-6');
  });

  it('lança ConflictException quando nome já existe para o usuário', async () => {
    accountRepo.existsByNameAndUser.mockResolvedValue(true);

    await expect(
      createUseCase.execute({ name: 'Conta Corrente', type: AccountType.CHECKING }, USER_ID),
    ).rejects.toThrow(ConflictException);

    expect(accountRepo.save).not.toHaveBeenCalled();
  });
});

// ─── GetAccountUseCase integration ────────────────────────────────────────────

describe('[Integration] GetAccountUseCase', () => {
  let getUseCase: GetAccountUseCase;
  let accountRepo: ReturnType<typeof makeAccountRepo>;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAccountUseCase,
        EncryptionService,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    getUseCase = module.get(GetAccountUseCase);
    encryptionService = module.get(EncryptionService);
    jest.clearAllMocks();
  });

  it('retorna lista de contas do usuário', async () => {
    accountRepo.findAllByUserId.mockResolvedValue([makeAccount()]);

    const result = await getUseCase.findAll(USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(ACCOUNT_ID);
    expect(accountRepo.findAllByUserId).toHaveBeenCalledWith(USER_ID);
  });

  it('descriptografa campos sensíveis ao buscar conta', async () => {
    const encryptedAgency = encryptionService.encrypt('0001');
    const encryptedAccount = encryptionService.encrypt('12345-6');
    accountRepo.findById.mockResolvedValue(makeAccount({
      agency: encryptedAgency,
      accountNumber: encryptedAccount,
    }));

    const result = await getUseCase.findOne(ACCOUNT_ID, USER_ID);

    expect(result.agency).toBe('0001');
    expect(result.accountNumber).toBe('12345-6');
  });

  it('lança NotFoundException quando conta não encontrada', async () => {
    accountRepo.findById.mockResolvedValue(null);

    await expect(getUseCase.findOne(ACCOUNT_ID, USER_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando conta pertence a outro usuário', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());

    await expect(getUseCase.findOne(ACCOUNT_ID, OTHER_USER_ID)).rejects.toThrow(ForbiddenException);
  });
});

// ─── DeleteAccountUseCase integration ─────────────────────────────────────────

describe('[Integration] DeleteAccountUseCase', () => {
  let deleteUseCase: DeleteAccountUseCase;
  let accountRepo: ReturnType<typeof makeAccountRepo>;

  beforeEach(async () => {
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAccountUseCase,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
      ],
    }).compile();

    deleteUseCase = module.get(DeleteAccountUseCase);
    jest.clearAllMocks();
  });

  it('executa soft delete da conta do usuário', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    accountRepo.softDelete.mockResolvedValue(undefined);

    await deleteUseCase.execute(ACCOUNT_ID, USER_ID);

    expect(accountRepo.softDelete).toHaveBeenCalledWith(ACCOUNT_ID);
  });

  it('lança NotFoundException para conta inexistente', async () => {
    accountRepo.findById.mockResolvedValue(null);

    await expect(deleteUseCase.execute(ACCOUNT_ID, USER_ID)).rejects.toThrow(NotFoundException);
    expect(accountRepo.softDelete).not.toHaveBeenCalled();
  });

  it('lança ForbiddenException para conta de outro usuário', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());

    await expect(deleteUseCase.execute(ACCOUNT_ID, OTHER_USER_ID)).rejects.toThrow(ForbiddenException);
    expect(accountRepo.softDelete).not.toHaveBeenCalled();
  });
});

// ─── Fluxo Create → Get → Delete ─────────────────────────────────────────────

describe('[Integration] Fluxo Create → Get → Delete', () => {
  let createUseCase: CreateAccountUseCase;
  let getUseCase: GetAccountUseCase;
  let deleteUseCase: DeleteAccountUseCase;
  let accountRepo: ReturnType<typeof makeAccountRepo>;

  beforeEach(async () => {
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAccountUseCase,
        GetAccountUseCase,
        DeleteAccountUseCase,
        EncryptionService,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    createUseCase = module.get(CreateAccountUseCase);
    getUseCase = module.get(GetAccountUseCase);
    deleteUseCase = module.get(DeleteAccountUseCase);
    jest.clearAllMocks();
  });

  it('cria conta, busca e depois exclui com sucesso', async () => {
    let db: any = null;

    accountRepo.existsByNameAndUser.mockResolvedValue(false);
    accountRepo.save.mockImplementation(async (data: any) => {
      db = { id: ACCOUNT_ID, ...data, isOwnedBy: (uid: string) => uid === USER_ID };
      return db;
    });
    accountRepo.findById.mockImplementation(async () => db);
    accountRepo.softDelete.mockImplementation(async () => { db = null; });

    // Create
    const created = await createUseCase.execute(
      { name: 'Minha Conta', type: AccountType.CASH },
      USER_ID,
    );
    expect(created.id).toBe(ACCOUNT_ID);

    // Get
    const found = await getUseCase.findOne(ACCOUNT_ID, USER_ID);
    expect(found.id).toBe(ACCOUNT_ID);

    // Delete
    await deleteUseCase.execute(ACCOUNT_ID, USER_ID);
    expect(accountRepo.softDelete).toHaveBeenCalledWith(ACCOUNT_ID);
  });
});

// ─── UpdateAccountUseCase integration ────────────────────────────────────────

describe('[Integration] UpdateAccountUseCase', () => {
  let updateUseCase: UpdateAccountUseCase;
  let accountRepo: ReturnType<typeof makeAccountRepo>;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAccountUseCase,
        EncryptionService,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    updateUseCase = module.get(UpdateAccountUseCase);
    encryptionService = module.get(EncryptionService);
    jest.clearAllMocks();
  });

  it('atualiza nome da conta com sucesso', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    accountRepo.existsByNameAndUser.mockResolvedValue(false);
    accountRepo.update.mockResolvedValue({ ...makeAccount(), name: 'Conta Atualizada' });

    const result = await updateUseCase.execute(ACCOUNT_ID, { name: 'Conta Atualizada' }, USER_ID);

    expect(accountRepo.existsByNameAndUser).toHaveBeenCalledWith('Conta Atualizada', USER_ID, ACCOUNT_ID);
    expect(result.name).toBe('Conta Atualizada');
  });

  it('não checa duplicidade quando nome não muda', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount({ name: 'Mesmo Nome' }));
    accountRepo.update.mockResolvedValue(makeAccount({ name: 'Mesmo Nome' }));

    await updateUseCase.execute(ACCOUNT_ID, { name: 'Mesmo Nome' }, USER_ID);

    expect(accountRepo.existsByNameAndUser).not.toHaveBeenCalled();
  });

  it('criptografa agência e número de conta ao atualizar', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    accountRepo.existsByNameAndUser.mockResolvedValue(false);
    accountRepo.update.mockImplementation(async (_id, data) => ({ ...makeAccount(), ...data }));

    await updateUseCase.execute(
      ACCOUNT_ID,
      { agency: '0001', accountNumber: '98765-4' },
      USER_ID,
    );

    const updated = accountRepo.update.mock.calls[0][1];
    expect(updated.agency).not.toBe('0001');
    expect(updated.accountNumber).not.toBe('98765-4');
    expect(encryptionService.decrypt(updated.agency)).toBe('0001');
    expect(encryptionService.decrypt(updated.accountNumber)).toBe('98765-4');
  });

  it('lança ConflictException quando novo nome já existe', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    accountRepo.existsByNameAndUser.mockResolvedValue(true);

    await expect(
      updateUseCase.execute(ACCOUNT_ID, { name: 'Conta Duplicada' }, USER_ID),
    ).rejects.toThrow(ConflictException);
  });

  it('lança NotFoundException para conta inexistente', async () => {
    accountRepo.findById.mockResolvedValue(null);

    await expect(
      updateUseCase.execute(ACCOUNT_ID, { name: 'Nova' }, USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException para conta de outro usuário', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());

    await expect(
      updateUseCase.execute(ACCOUNT_ID, { name: 'Nova' }, OTHER_USER_ID),
    ).rejects.toThrow(ForbiddenException);
  });
});
