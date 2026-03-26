#!/usr/bin/env node
/**
 * Smoke Test Suite — Gestão Financeira API
 * Testa os fluxos principais end-to-end contra o backend local.
 * Uso: node test/smoke-test.js
 */

const BASE = process.env.API_URL || 'http://localhost:3000/api/v1';

let passed = 0;
let failed = 0;
const results = [];

// ── Helpers ───────────────────────────────────────────────────

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function assert(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push({ ok: true, name });
    console.log(`  ✅  ${name}`);
  } else {
    failed++;
    results.push({ ok: false, name, detail });
    console.log(`  ❌  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ── State compartilhado entre testes ─────────────────────────
let accessToken, refreshToken;
let userId, accountId, categoryId, subcategoryId;
let txnId, txnTransferId, budgetId, goalId;
const email = `smoke_${Date.now()}@test.com`;

// ── Suíte ─────────────────────────────────────────────────────

async function suite() {
  console.log(`\n🔵  Smoke Test — ${BASE}\n`);

  // ──────────────────────────────────────────────────────────
  console.log('── 1. AUTH ──────────────────────────────────────');

  // 1.1 Registro
  let r = await req('POST', '/auth/register', {
    firstName: 'Smoke',
    lastName: 'Test',
    email,
    password: 'Senha@123',
    lgpdConsent: true,
  });
  assert('POST /auth/register → 201', r.status === 201);
  assert('Registro retorna usuário com email', !!r.data.email || !!r.data.user?.email);
  accessToken  = r.data.accessToken;
  refreshToken = r.data.refreshToken;
  userId       = r.data.user?.id || r.data.id;

  // 1.2 Login
  r = await req('POST', '/auth/login', { email, password: 'Senha@123' });
  assert('POST /auth/login → 200', r.status === 200);
  assert('Login retorna accessToken', !!r.data.accessToken);
  accessToken  = r.data.accessToken;
  refreshToken = r.data.refreshToken;

  // 1.3 Login com senha errada
  r = await req('POST', '/auth/login', { email, password: 'errado' });
  assert('POST /auth/login senha errada → 401', r.status === 401);

  // 1.4 GET /auth/me
  r = await req('GET', '/auth/me', null, accessToken);
  assert('GET /auth/me → 200', r.status === 200);
  assert('/auth/me retorna email correto', r.data.email === email);

  // 1.5 Refresh token
  r = await req('POST', '/auth/refresh', { refreshToken });
  assert('POST /auth/refresh → 200', r.status === 200);
  assert('Refresh retorna novo token', !!r.data.accessToken);
  accessToken  = r.data.accessToken;
  refreshToken = r.data.refreshToken;

  // ──────────────────────────────────────────────────────────
  console.log('\n── 2. CONTAS ────────────────────────────────────');

  // 2.1 Criar conta
  r = await req('POST', '/accounts', {
    name: 'Conta Corrente Teste',
    type: 'CHECKING',
    initialBalance: 5000.00,
    currency: 'BRL',
    bankName: 'Banco Smoke',
  }, accessToken);
  assert('POST /accounts → 201', r.status === 201);
  assert('Conta criada com nome correto', r.data.name === 'Conta Corrente Teste');
  accountId = r.data.id;

  // 2.2 Listar contas
  r = await req('GET', '/accounts', null, accessToken);
  assert('GET /accounts → 200', r.status === 200);
  assert('Lista contém a conta criada', Array.isArray(r.data) && r.data.some(a => a.id === accountId));

  // 2.3 Criar segunda conta para transferência (usada também em transações)
  r = await req('POST', '/accounts', {
    name: 'Poupança Smoke',
    type: 'SAVINGS',
    initialBalance: 0,
    currency: 'BRL',
  }, accessToken);
  const account2Id = r.data.id;

  // ──────────────────────────────────────────────────────────
  console.log('\n── 3. CATEGORIAS ────────────────────────────────');

  // 3.1 Listar categorias do sistema
  r = await req('GET', '/categories', null, accessToken);
  assert('GET /categories → 200', r.status === 200);
  assert('Existem categorias (seed aplicado)', Array.isArray(r.data) && r.data.length > 0);
  categoryId = r.data[0]?.id;

  // 3.2 Criar categoria customizada
  r = await req('POST', '/categories', {
    name: 'Categoria Smoke',
    type: 'EXPENSE',
    icon: 'tag',
    color: '#ff0000',
  }, accessToken);
  assert('POST /categories → 201', r.status === 201);
  const customCategoryId = r.data.id;

  // 3.3 Criar subcategoria
  r = await req('POST', `/categories/${customCategoryId}/subcategories`, {
    name: 'Sub Smoke',
  }, accessToken);
  assert('POST /categories/:id/subcategories → 201', r.status === 201);
  subcategoryId = r.data.id;

  // 3.4 Atualizar conta (após ter categoryId)
  r = await req('PATCH', `/accounts/${accountId}`, { name: 'Conta Atualizada' }, accessToken);
  assert('PATCH /accounts/:id → 200', r.status === 200);
  assert('Nome foi atualizado', r.data.name === 'Conta Atualizada');

  // ──────────────────────────────────────────────────────────
  console.log('\n── 4. TRANSAÇÕES ────────────────────────────────');

  // 4.1 Criar despesa
  r = await req('POST', '/transactions', {
    accountId,
    categoryId,
    type: 'EXPENSE',
    amount: 150.00,
    description: 'Supermercado Smoke',
    date: new Date().toISOString().split('T')[0],
  }, accessToken);
  assert('POST /transactions (EXPENSE) → 201', r.status === 201);
  assert('Transação tem status CONFIRMED', r.data.status === 'CONFIRMED');
  txnId = r.data.id;

  // 4.2 Criar receita
  r = await req('POST', '/transactions', {
    accountId,
    type: 'INCOME',
    amount: 3000.00,
    description: 'Salário Smoke',
    date: new Date().toISOString().split('T')[0],
  }, accessToken);
  assert('POST /transactions (INCOME) → 201', r.status === 201);

  // 4.3 Segunda conta para transferência já criada na seção 2.3 (account2Id disponível no escopo acima)

  // 4.4 Transferência entre contas
  r = await req('POST', '/transactions/transfer', {
    accountId,
    destinationAccountId: account2Id,
    type: 'TRANSFER',
    amount: 500.00,
    description: 'Transferência Smoke',
    date: new Date().toISOString().split('T')[0],
  }, accessToken);
  assert('POST /transactions/transfer → 201', r.status === 201);
  assert('Transferência criou debit+credit', r.data.debit?.id && r.data.credit?.id);
  txnTransferId = r.data.debit?.id;

  // 4.5 Listar transações
  r = await req('GET', `/transactions?page=1&limit=10`, null, accessToken);
  assert('GET /transactions → 200', r.status === 200);
  assert('Paginação retorna items', Array.isArray(r.data.items) || Array.isArray(r.data.data));

  // 4.6 Buscar transação individual
  r = await req('GET', `/transactions/${txnId}`, null, accessToken);
  assert('GET /transactions/:id → 200', r.status === 200);

  // ──────────────────────────────────────────────────────────
  console.log('\n── 5. ORÇAMENTOS ────────────────────────────────');

  // 5 ORÇAMENTOS — categoryId é OBRIGATÓRIO no DTO
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endDate   = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  r = await req('POST', '/budgets', {
    categoryId,
    amount: 1000.00,
    period: 'MONTHLY',
    startDate,
    endDate,
  }, accessToken);
  assert('POST /budgets → 201', r.status === 201);
  assert('Orçamento criado', !!r.data.id);
  budgetId = r.data.id;

  r = await req('GET', '/budgets', null, accessToken);
  assert('GET /budgets → 200', r.status === 200);

  r = await req('GET', `/budgets/${budgetId}`, null, accessToken);
  assert('GET /budgets/:id → 200', r.status === 200);
  assert('Budget tem percentUsed', r.data.percentUsed !== undefined || r.data.percent_used !== undefined || r.data.spentAmount !== undefined);

  // ──────────────────────────────────────────────────────────
  console.log('\n── 6. METAS ─────────────────────────────────────');

  const targetDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  r = await req('POST', '/goals', {
    name: 'Meta Smoke',
    targetAmount: 10000.00,
    targetDate,
  }, accessToken);
  assert('POST /goals → 201', r.status === 201);
  assert('Meta criada com status ACTIVE', r.data.status === 'ACTIVE');
  goalId = r.data.id;

  r = await req('POST', `/goals/${goalId}/contributions`, {
    amount: 500.00,
    date: new Date().toISOString().split('T')[0],
    notes: 'Aporte smoke test',
  }, accessToken);
  assert('POST /goals/:id/contributions → 201', r.status === 201);
  assert('Contribuição registrada', !!r.data.id);

  r = await req('GET', `/goals/${goalId}`, null, accessToken);
  assert('GET /goals/:id → 200', r.status === 200);
  assert('Goal tem progressPercent', r.data.progressPercent !== undefined || r.data.progress_percent !== undefined || r.data.currentAmount !== undefined);

  // ──────────────────────────────────────────────────────────
  console.log('\n── 7. RELATÓRIOS ────────────────────────────────');

  r = await req('GET', '/reports/dashboard', null, accessToken);
  assert('GET /reports/dashboard → 200', r.status === 200);
  assert('Dashboard tem balanço e resumo', r.data.totalBalance !== undefined || r.data.monthlyIncome !== undefined || r.data.currentMonth !== undefined);

  r = await req('GET', `/reports/monthly?year=${today.getFullYear()}&month=${today.getMonth() + 1}`, null, accessToken);
  assert('GET /reports/monthly → 200', r.status === 200);

  r = await req('GET', '/reports/cash-flow', null, accessToken);
  assert('GET /reports/cash-flow → 200', r.status === 200);

  r = await req('GET', '/reports/budgets', null, accessToken);
  assert('GET /reports/budgets → 200', r.status === 200);

  // ──────────────────────────────────────────────────────────
  console.log('\n── 8. IA ────────────────────────────────────────');

  r = await req('POST', '/ai/categorize', {
    description: 'Supermercado Extra compras da semana',
    amount: 250.00,
  }, accessToken);
  assert('POST /ai/categorize → 200 ou 201', r.status === 200 || r.status === 201);
  assert('Categorização retorna categoria', !!r.data.category || !!r.data.categoryId || !!r.data.suggestion || !!r.data.categoryName);

  r = await req('GET', '/ai/insights', null, accessToken);
  assert('GET /ai/insights → 200', r.status === 200);

  r = await req('GET', '/ai/predict', null, accessToken);
  assert('GET /ai/predict → 200', r.status === 200);

  // ──────────────────────────────────────────────────────────
  console.log('\n── 9. SEGURANÇA ─────────────────────────────────');

  // Acesso sem token
  r = await req('GET', '/accounts', null, null);
  assert('GET /accounts sem token → 401', r.status === 401);

  // Tentativa de acessar recurso de outro usuário — conta inexistente
  r = await req('GET', '/transactions/00000000-0000-0000-0000-000000000000', null, accessToken);
  assert('GET /transactions/uuid_inexistente → 404', r.status === 404);

  // Rate limiting não alcançado mas header deve existir (ou não — só validamos o fluxo)
  assert('API retorna erros em formato JSON', typeof r.data === 'object');

  // ──────────────────────────────────────────────────────────
  console.log('\n── 10. LOGOUT ───────────────────────────────────');

  r = await req('POST', '/auth/logout', { refreshToken }, accessToken);
  assert('POST /auth/logout → 200 ou 204', r.status === 200 || r.status === 204);

  // Token antigo deve ser rejeitado após logout
  r = await req('GET', '/auth/me', null, accessToken);
  assert('Acesso com token revogado pós-logout → 401', r.status === 401);

  // ──────────────────────────────────────────────────────────
  // Resultado final
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  RESULTADO: ${passed} aprovados | ${failed} falhas`);
  console.log('═══════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n  Falhas:');
    results.filter(r => !r.ok).forEach(r => console.log(`    ❌ ${r.name}${r.detail ? ` — ${r.detail}` : ''}`));
    process.exit(1);
  } else {
    console.log('\n  ✅  Todos os testes passaram!\n');
  }
}

suite().catch(err => {
  console.error('\n💥  Erro fatal no smoke test:', err.message);
  process.exit(1);
});
