import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from '@presentation/controllers/category.controller';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateCategoryUseCase, UpdateCategoryUseCase,
  GetCategoryUseCase, DeleteCategoryUseCase,
  CreateSubcategoryUseCase, UpdateSubcategoryUseCase, DeleteSubcategoryUseCase,
} from '@application/use-cases/categories/category.use-cases';

const mockCreateCategory    = { execute: jest.fn() };
const mockUpdateCategory    = { execute: jest.fn() };
const mockGetCategory       = { findAll: jest.fn(), findOne: jest.fn(), findSystemCategories: jest.fn() };
const mockDeleteCategory    = { execute: jest.fn() };
const mockCreateSubcategory = { execute: jest.fn() };
const mockUpdateSubcategory = { execute: jest.fn() };
const mockDeleteSubcategory = { execute: jest.fn() };

const USER = { userId: 'user-uuid-1' };
const CAT_ID = 'c1b2c3d4-e5f6-7890-abcd-ef1234567890';
const SUB_ID = 'd1b2c3d4-e5f6-7890-abcd-ef1234567890';

const CATEGORY = { id: CAT_ID, name: 'Alimentação', type: 'EXPENSE', isSystem: false };

describe('CategoryController', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: CreateCategoryUseCase,    useValue: mockCreateCategory },
        { provide: UpdateCategoryUseCase,    useValue: mockUpdateCategory },
        { provide: GetCategoryUseCase,       useValue: mockGetCategory },
        { provide: DeleteCategoryUseCase,    useValue: mockDeleteCategory },
        { provide: CreateSubcategoryUseCase, useValue: mockCreateSubcategory },
        { provide: UpdateSubcategoryUseCase, useValue: mockUpdateSubcategory },
        { provide: DeleteSubcategoryUseCase, useValue: mockDeleteSubcategory },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CategoryController);
    jest.clearAllMocks();
  });

  describe('POST /categories → create()', () => {
    it('delega para CreateCategoryUseCase com userId', async () => {
      mockCreateCategory.execute.mockResolvedValue(CATEGORY);

      const result = await controller.create({ name: 'Alimentação', type: 'EXPENSE' } as any, USER);

      expect(mockCreateCategory.execute).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alimentação' }),
        USER.userId,
      );
      expect(result).toEqual(CATEGORY);
    });
  });

  describe('GET /categories → findAll()', () => {
    it('lista categorias com filtro de type', async () => {
      mockGetCategory.findAll.mockResolvedValue([CATEGORY]);

      const result = await controller.findAll(USER, 'EXPENSE');

      expect(mockGetCategory.findAll).toHaveBeenCalledWith(USER.userId, 'EXPENSE');
      expect(result).toHaveLength(1);
    });

    it('lista categorias sem filtro de type', async () => {
      mockGetCategory.findAll.mockResolvedValue([CATEGORY]);

      await controller.findAll(USER, undefined);

      expect(mockGetCategory.findAll).toHaveBeenCalledWith(USER.userId, undefined);
    });
  });

  describe('GET /categories/system → findSystem()', () => {
    it('retorna categorias do sistema', async () => {
      const systemCats = [{ id: 's1', name: 'Moradia', isSystem: true }];
      mockGetCategory.findSystemCategories.mockResolvedValue(systemCats);

      const result = await controller.findSystem();

      expect(mockGetCategory.findSystemCategories).toHaveBeenCalled();
      expect(result).toEqual(systemCats);
    });
  });

  describe('GET /categories/:id → findOne()', () => {
    it('busca categoria por ID', async () => {
      mockGetCategory.findOne.mockResolvedValue(CATEGORY);

      const result = await controller.findOne(CAT_ID);

      expect(mockGetCategory.findOne).toHaveBeenCalledWith(CAT_ID);
      expect(result).toEqual(CATEGORY);
    });
  });

  describe('PUT /categories/:id → update()', () => {
    it('atualiza categoria', async () => {
      const updated = { ...CATEGORY, name: 'Alimentação Atualizada' };
      mockUpdateCategory.execute.mockResolvedValue(updated);

      const result = await controller.update(CAT_ID, { name: 'Alimentação Atualizada' } as any, USER);

      expect(mockUpdateCategory.execute).toHaveBeenCalledWith(CAT_ID, expect.any(Object), USER.userId);
      expect(result.name).toBe('Alimentação Atualizada');
    });
  });

  describe('DELETE /categories/:id → remove()', () => {
    it('exclui categoria', async () => {
      mockDeleteCategory.execute.mockResolvedValue(undefined);

      await controller.remove(CAT_ID, USER);

      expect(mockDeleteCategory.execute).toHaveBeenCalledWith(CAT_ID, USER.userId);
    });
  });

  describe('POST /categories/:id/subcategories → createSub()', () => {
    it('cria subcategoria vinculada à categoria', async () => {
      const sub = { id: SUB_ID, name: 'Restaurante', categoryId: CAT_ID };
      mockCreateSubcategory.execute.mockResolvedValue(sub);

      const result = await controller.createSub(CAT_ID, { name: 'Restaurante' } as any, USER);

      expect(mockCreateSubcategory.execute).toHaveBeenCalledWith(CAT_ID, expect.any(Object), USER.userId);
      expect(result).toEqual(sub);
    });
  });

  describe('PUT /categories/:id/subcategories/:sid → updateSub()', () => {
    it('atualiza subcategoria pelo subId', async () => {
      const updated = { id: SUB_ID, name: 'Fast Food' };
      mockUpdateSubcategory.execute.mockResolvedValue(updated);

      const result = await controller.updateSub(CAT_ID, SUB_ID, { name: 'Fast Food' } as any);

      expect(mockUpdateSubcategory.execute).toHaveBeenCalledWith(SUB_ID, expect.any(Object));
      expect(result.name).toBe('Fast Food');
    });
  });

  describe('DELETE /categories/:id/subcategories/:sid → removeSub()', () => {
    it('exclui subcategoria', async () => {
      mockDeleteSubcategory.execute.mockResolvedValue(undefined);

      await controller.removeSub(CAT_ID, SUB_ID);

      expect(mockDeleteSubcategory.execute).toHaveBeenCalledWith(SUB_ID);
    });
  });
});
