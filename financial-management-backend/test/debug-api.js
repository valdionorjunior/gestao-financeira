const BASE = 'http://localhost:3000/api/v1';

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

async function debug() {
  const email = `debug_${Date.now()}@test.com`;

  let r = await req('POST', '/auth/register', {
    firstName: 'Debug', lastName: 'Test',
    email, password: 'Senha@123', lgpdConsent: true,
  });
  console.log('REGISTER', r.status, JSON.stringify(r.data).slice(0, 400));

  r = await req('POST', '/auth/login', { email, password: 'Senha@123' });
  const token = r.data.accessToken;
  console.log('LOGIN', r.status, 'token:', token ? 'OK' : 'MISSING');

  r = await req('POST', '/accounts', {
    name: 'Debug Account', type: 'CHECKING', balance: 1000, currency: 'BRL',
  }, token);
  console.log('POST /accounts', r.status, JSON.stringify(r.data).slice(0, 400));
  const accountId = r.data.id;

  r = await req('POST', '/transactions', {
    accountId,
    type: 'EXPENSE',
    amount: 50,
    description: 'Debug Txn',
    date: new Date().toISOString().split('T')[0],
  }, token);
  console.log('POST /transactions', r.status, JSON.stringify(r.data).slice(0, 400));

  const today = new Date();
  r = await req('POST', '/budgets', {
    name: 'Debug Budget',
    amount: 1000,
    period: 'MONTHLY',
    startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0],
  }, token);
  console.log('POST /budgets', r.status, JSON.stringify(r.data).slice(0, 400));

  r = await req('POST', '/ai/categorize', {
    description: 'Supermercado', amount: 100,
  }, token);
  console.log('POST /ai/categorize', r.status, JSON.stringify(r.data).slice(0, 400));

  r = await req('GET', '/reports/dashboard', null, token);
  console.log('GET /reports/dashboard', r.status, JSON.stringify(r.data).slice(0, 400));
}

debug().catch(e => console.error('FATAL:', e.message));
