/**
 * Category Contract Tests
 *
 * Verifica o contrato HTTP da API de categorias e subcategorias:
 * status codes, shapes de resposta, validação de entrada.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CategoryController } from '@presentation/controllers/category.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateCategoryUseCase, UpdateCategoryUseCase,
  GetCategoryUseCase, DeleteCategoryUseCase,
  CreateSubcategoryUseCase, UpdateSubcategoryUseCase, DeleteSubcategoryUseCase,
} from '@application/use-cases/categories/category.use-cases';
import { NotFoundException } from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCreateCat    = { execute: jest.fn() };
const mockUpdateCat    = { execute: jest.fn() };
const mockGetCat       = { findAll: jest.fn(), findOne: jest.fn(), findSystemCategories: jest.fn() };
const mockDeleteCat    = { execute: jest.fn() };
const mockCreateSub    = { execute: jest.fn() };
const mockUpdateSub    = { execute: jest.fn() };
const mockDeleteSub    = { execute: jest.fn() };

const CAT_ID  = '11111111-1111-4111-a111-111111111111';
const SUB_ID  = '22222222-2222-4222-a222-222222222222';
const USER_ID = '33333333-3333-4333-a333-333333333333';

const CAT_STUB = { id: CAT_ID, name: 'Alimentação', type: 'EXPENSE', isSystem: false };
const SUB_STUB = { id: SUB_ID, categoryId: CAT_ID, name: 'Supermercado' };

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('[Contract] Category API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: CreateCategoryUseCase,    useValue: mockCreateCat },
        { provide: UpdateCategoryUseCase,    useValue: mockUpdateCat },
        { provide: GetCategoryUseCase,       useValue: mockGetCat    },
        { provide: DeleteCategoryUseCase,    useValue: mockDeleteCat },
        { provide: CreateSubcategoryUseCase, useValue: mockCreateSub },
        { provide: UpdateSubcategoryUseCase, useValue: mockUpdateSub },
        { provide: DeleteSubcategoryUseCase, useValue: mockDeleteSub },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: USER_ID, email: 'test@example.com', role: 'TITULAR' };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  // ─── POST /categories ───────────────────────────────────────────────────────

  describe('POST /api/v1/categories', () => {
    it('201 — cria categoria', async () => {
      mockCreateCat.execute.mockResolvedValue(CAT_STUB);

      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Alimentação', type: 'EXPENSE' })
        .expect(201);

      expect(res.body).toMatchObject({ id: CAT_ID, name: 'Alimentação' });
    });

    it('400 — corpo vazio retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({})
        .expect(400);
    });
  });

  // ─── GET /categories ────────────────────────────────────────────────────────

  describe('GET /api/v1/categories', () => {
    it('200 — lista categorias do usuário', async () => {
      mockGetCat.findAll.mockResolvedValue([CAT_STUB]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockGetCat.findAll).toHaveBeenCalledWith(USER_ID, undefined);
    });

    it('200 — filtra por type=EXPENSE', async () => {
      mockGetCat.findAll.mockResolvedValue([CAT_STUB]);

      await request(app.getHttpServer())
        .get('/api/v1/categories?type=EXPENSE')
        .expect(200);

      expect(mockGetCat.findAll).toHaveBeenCalledWith(USER_ID, 'EXPENSE');
    });
  });

  // ─── GET /categories/system ─────────────────────────────────────────────────

  describe('GET /api/v1/categories/system', () => {
    it('200 — retorna categorias do sistema', async () => {
      mockGetCat.findSystemCategories.mockResolvedValue([CAT_STUB]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/categories/system')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── GET /categories/:id ────────────────────────────────────────────────────

  describe('GET /api/v1/categories/:id', () => {
    it('200 — retorna categoria por ID', async () => {
      mockGetCat.findOne.mockResolvedValue(CAT_STUB);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${CAT_ID}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: CAT_ID });
    });

    it('404 — categoria não encontrada', async () => {
      mockGetCat.findOne.mockRejectedValue(new NotFoundException('Categoria não encontrada'));

      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${CAT_ID}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  // ─── PUT /categories/:id ────────────────────────────────────────────────────

  describe('PUT /api/v1/categories/:id', () => {
    it('200 — atualiza categoria', async () => {
      mockUpdateCat.execute.mockResolvedValue({ ...CAT_STUB, name: 'Alimentação Atualizada' });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/categories/${CAT_ID}`)
        .send({ name: 'Alimentação Atualizada' })
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Alimentação Atualizada' });
    });
  });

  // ─── DELETE /categories/:id ─────────────────────────────────────────────────

  describe('DELETE /api/v1/categories/:id', () => {
    it('204 — exclui categoria', async () => {
      mockDeleteCat.execute.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${CAT_ID}`)
        .expect(204);
    });
  });

  // ─── POST /categories/:id/subcategories ─────────────────────────────────────

  describe('POST /api/v1/categories/:id/subcategories', () => {
    it('201 — cria subcategoria', async () => {
      mockCreateSub.execute.mockResolvedValue(SUB_STUB);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/categories/${CAT_ID}/subcategories`)
        .send({ name: 'Supermercado' })
        .expect(201);

      expect(res.body).toMatchObject({ id: SUB_ID });
      expect(mockCreateSub.execute).toHaveBeenCalledWith(
        CAT_ID,
        expect.objectContaining({ name: 'Supermercado' }),
        USER_ID,
      );
    });
  });

  // ─── PUT /categories/:id/subcategories/:sid ──────────────────────────────────

  describe('PUT /api/v1/categories/:id/subcategories/:sid', () => {
    it('200 — atualiza subcategoria', async () => {
      mockUpdateSub.execute.mockResolvedValue({ ...SUB_STUB, name: 'Hipermercado' });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/categories/${CAT_ID}/subcategories/${SUB_ID}`)
        .send({ name: 'Hipermercado' })
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Hipermercado' });
    });
  });

  // ─── DELETE /categories/:id/subcategories/:sid ───────────────────────────────

  describe('DELETE /api/v1/categories/:id/subcategories/:sid', () => {
    it('204 — exclui subcategoria', async () => {
      mockDeleteSub.execute.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${CAT_ID}/subcategories/${SUB_ID}`)
        .expect(204);
    });
  });
});
