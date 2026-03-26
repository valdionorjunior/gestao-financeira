import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  GetCategoryUseCase,
  DeleteCategoryUseCase,
  CreateSubcategoryUseCase,
} from '../category.use-cases';
import {
  CATEGORY_REPOSITORY,
  SUBCATEGORY_REPOSITORY,
} from '../../../../domain/repositories/category.repository.interface';
import { CategoryType } from '../../../../domain/entities/category.entity';

const makeCategory = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 'cat-uuid-1',
  userId: 'user-1',
  name: 'Alimentação',
  type: CategoryType.EXPENSE,
  isSystem: false,
  isActive: true,
  color: '#8392ab',
  isOwnedBy: (id: string) => id === 'user-1',
  ...overrides,
});

const mockCategoryRepo = {
  existsByNameAndUser: jest.fn(),
  save: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
};

const mockSubcategoryRepo = {
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ─── CreateCategoryUseCase ────────────────────────────────────────────────────

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;

  beforeEach(() => {
    useCase = new CreateCategoryUseCase(mockCategoryRepo as any);
  });

  it('should create a category successfully', async () => {
    mockCategoryRepo.existsByNameAndUser.mockResolvedValue(false);
    mockCategoryRepo.save.mockResolvedValue(makeCategory());

    const result = await useCase.execute(
      { name: 'Alimentação', type: CategoryType.EXPENSE } as any,
      'user-1',
    );

    expect(mockCategoryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', name: 'Alimentação', isSystem: false }),
    );
    expect(result.id).toBe('cat-uuid-1');
  });

  it('should apply default color when not provided', async () => {
    mockCategoryRepo.existsByNameAndUser.mockResolvedValue(false);
    mockCategoryRepo.save.mockResolvedValue(makeCategory());

    await useCase.execute({ name: 'Test', type: CategoryType.EXPENSE } as any, 'user-1');

    expect(mockCategoryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ color: '#8392ab' }),
    );
  });

  it('should throw ConflictException when category name already exists', async () => {
    mockCategoryRepo.existsByNameAndUser.mockResolvedValue(true);

    await expect(
      useCase.execute({ name: 'Alimentação', type: CategoryType.EXPENSE } as any, 'user-1'),
    ).rejects.toThrow(ConflictException);
  });
});

// ─── UpdateCategoryUseCase ────────────────────────────────────────────────────

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase;

  beforeEach(() => {
    useCase = new UpdateCategoryUseCase(mockCategoryRepo as any);
  });

  it('should update a category successfully', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory());
    mockCategoryRepo.update.mockResolvedValue({ ...makeCategory(), name: 'Comida' });

    const result = await useCase.execute('cat-uuid-1', { name: 'Comida' } as any, 'user-1');

    expect(mockCategoryRepo.update).toHaveBeenCalledWith('cat-uuid-1', { name: 'Comida' });
    expect(result.name).toBe('Comida');
  });

  it('should throw NotFoundException when category does not exist', async () => {
    mockCategoryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent', { name: 'X' } as any, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when category is a system category', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory({ isSystem: true }));

    await expect(
      useCase.execute('cat-uuid-1', { name: 'X' } as any, 'user-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user does not own the category', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory());

    await expect(
      useCase.execute('cat-uuid-1', { name: 'X' } as any, 'outsider'),
    ).rejects.toThrow(ForbiddenException);
  });
});

// ─── GetCategoryUseCase ───────────────────────────────────────────────────────

describe('GetCategoryUseCase', () => {
  let useCase: GetCategoryUseCase;

  beforeEach(() => {
    useCase = new GetCategoryUseCase(mockCategoryRepo as any);
  });

  it('should return all categories for a user', async () => {
    mockCategoryRepo.findAll.mockResolvedValue([makeCategory(), makeCategory({ id: 'cat-uuid-2', name: 'Transporte' })]);

    const result = await useCase.findAll('user-1');

    expect(result).toHaveLength(2);
    expect(mockCategoryRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', includeInactive: false }),
    );
  });

  it('should return system categories', async () => {
    mockCategoryRepo.findAll.mockResolvedValue([
      makeCategory({ isSystem: true, userId: null }),
    ]);

    const result = await useCase.findSystemCategories();
    expect(result[0].isSystem).toBe(true);
  });

  it('should return one category by id', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory());

    const result = await useCase.findOne('cat-uuid-1');
    expect(result.id).toBe('cat-uuid-1');
  });

  it('should throw NotFoundException when category is not found', async () => {
    mockCategoryRepo.findById.mockResolvedValue(null);

    await expect(useCase.findOne('non-existent')).rejects.toThrow(NotFoundException);
  });
});

// ─── DeleteCategoryUseCase ────────────────────────────────────────────────────

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;

  beforeEach(() => {
    useCase = new DeleteCategoryUseCase(mockCategoryRepo as any);
  });

  it('should delete a user-owned category', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory());
    mockCategoryRepo.delete.mockResolvedValue(undefined);

    await useCase.execute('cat-uuid-1', 'user-1');

    expect(mockCategoryRepo.delete).toHaveBeenCalledWith('cat-uuid-1');
  });

  it('should throw NotFoundException when category does not exist', async () => {
    mockCategoryRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when deleting a system category', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory({ isSystem: true }));

    await expect(useCase.execute('cat-uuid-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user does not own the category', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory());

    await expect(useCase.execute('cat-uuid-1', 'outsider')).rejects.toThrow(ForbiddenException);
  });
});

// ─── CreateSubcategoryUseCase ─────────────────────────────────────────────────

describe('CreateSubcategoryUseCase', () => {
  let useCase: CreateSubcategoryUseCase;

  beforeEach(() => {
    useCase = new CreateSubcategoryUseCase(mockCategoryRepo as any, mockSubcategoryRepo as any);
  });

  it('should create a subcategory for an owned category', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory());
    mockSubcategoryRepo.save.mockResolvedValue({ id: 'sub-1', name: 'Restaurante', categoryId: 'cat-uuid-1', isActive: true });

    const result = await useCase.execute('cat-uuid-1', { name: 'Restaurante' } as any, 'user-1');

    expect(mockSubcategoryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-uuid-1', name: 'Restaurante', isActive: true }),
    );
    expect(result.id).toBe('sub-1');
  });

  it('should allow creating subcategory under a system category', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory({ isSystem: true }));
    mockSubcategoryRepo.save.mockResolvedValue({ id: 'sub-2', name: 'Mercearia', categoryId: 'cat-uuid-1', isActive: true });

    const result = await useCase.execute('cat-uuid-1', { name: 'Mercearia' } as any, 'any-user');
    expect(result.id).toBe('sub-2');
  });

  it('should throw NotFoundException when parent category does not exist', async () => {
    mockCategoryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent', { name: 'Teste' } as any, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the non-system category', async () => {
    mockCategoryRepo.findById.mockResolvedValue(makeCategory({ isSystem: false }));

    await expect(
      useCase.execute('cat-uuid-1', { name: 'X' } as any, 'outsider'),
    ).rejects.toThrow(ForbiddenException);
  });
});
