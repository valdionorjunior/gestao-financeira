import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from '@presentation/controllers/account.controller';
import { CreateAccountUseCase } from '@application/use-cases/accounts/create-account.use-case';
import { UpdateAccountUseCase } from '@application/use-cases/accounts/update-account.use-case';
import { GetAccountUseCase, DeleteAccountUseCase } from '@application/use-cases/accounts/get-account.use-case';
import { AccountType } from '@domain/entities/account.entity';

const mockCreateUseCase = { execute: jest.fn() };
const mockUpdateUseCase = { execute: jest.fn() };
const mockGetUseCase    = { findAll: jest.fn(), findOne: jest.fn() };
const mockDeleteUseCase = { execute: jest.fn() };

const currentUser = { userId: 'user-uuid-1', email: 'a@b.com', role: 'TITULAR' };

const mockAccount = {
  id: 'acc-uuid-1',
  userId: 'user-uuid-1',
  name: 'Conta Corrente',
  type: AccountType.CHECKING,
  balance: 1500,
  currency: 'BRL',
};

describe('AccountController', () => {
  let controller: AccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        { provide: CreateAccountUseCase, useValue: mockCreateUseCase },
        { provide: UpdateAccountUseCase, useValue: mockUpdateUseCase },
        { provide: GetAccountUseCase,    useValue: mockGetUseCase },
        { provide: DeleteAccountUseCase, useValue: mockDeleteUseCase },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    jest.clearAllMocks();
  });

  describe('POST /accounts', () => {
    it('should create an account and return it', async () => {
      mockCreateUseCase.execute.mockResolvedValue(mockAccount);

      const result = await controller.create(
        { name: 'Conta Corrente', type: AccountType.CHECKING } as any,
        currentUser,
      );

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(
        { name: 'Conta Corrente', type: AccountType.CHECKING },
        'user-uuid-1',
      );
      expect(result.id).toBe('acc-uuid-1');
    });
  });

  describe('GET /accounts', () => {
    it('should return all accounts for current user', async () => {
      mockGetUseCase.findAll.mockResolvedValue([mockAccount]);

      const result = await controller.findAll(currentUser);

      expect(mockGetUseCase.findAll).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /accounts/:id', () => {
    it('should return one account by id', async () => {
      mockGetUseCase.findOne.mockResolvedValue(mockAccount);

      const result = await controller.findOne('acc-uuid-1', currentUser);

      expect(mockGetUseCase.findOne).toHaveBeenCalledWith('acc-uuid-1', 'user-uuid-1');
      expect(result.id).toBe('acc-uuid-1');
    });
  });

  describe('PATCH /accounts/:id', () => {
    it('should update an account', async () => {
      mockUpdateUseCase.execute.mockResolvedValue({ ...mockAccount, name: 'Poupança' });

      const result = await controller.update('acc-uuid-1', { name: 'Poupança' } as any, currentUser);

      expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('acc-uuid-1', { name: 'Poupança' }, 'user-uuid-1');
      expect(result.name).toBe('Poupança');
    });
  });

  describe('DELETE /accounts/:id', () => {
    it('should soft-delete an account', async () => {
      mockDeleteUseCase.execute.mockResolvedValue(undefined);

      await controller.remove('acc-uuid-1', currentUser);

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('acc-uuid-1', 'user-uuid-1');
    });
  });
});
