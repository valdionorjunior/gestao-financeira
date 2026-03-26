const BASE = 'http://localhost:3000/api/v1';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

async function debug() {
  const email = `dbg3_${Date.now()}@test.com`;
  let r = await req('POST', '/auth/register', { firstName:'D', lastName:'T', email, password:'Senha@123', lgpdConsent:true });
  r = await req('POST', '/auth/login', { email, password:'Senha@123' });
  const token = r.data.accessToken;

  // Create account
  r = await req('POST', '/accounts', { name:'Acc', type:'CHECKING', initialBalance:1000, currency:'BRL' }, token);
  const accountId = r.data.id;
  console.log('Account created:', accountId);

  // PATCH account
  r = await req('PATCH', `/accounts/${accountId}`, { name:'Updated' }, token);
  console.log('PATCH /accounts', r.status, JSON.stringify(r.data).slice(0,300));

  // Get categories
  r = await req('GET', '/categories', null, token);
  const categoryId = r.data[0]?.id;
  console.log('categoryId:', categoryId);

  // POST expense
  r = await req('POST', '/transactions', {
    accountId, categoryId, type:'EXPENSE', amount: 50, description:'Test EXPENSE', date: new Date().toISOString().split('T')[0],
  }, token);
  console.log('POST /transactions EXPENSE', r.status, JSON.stringify(r.data).slice(0,400));

  // POST income (for comparison)
  r = await req('POST', '/transactions', {
    accountId, type:'INCOME', amount: 3000, description:'Salário', date: new Date().toISOString().split('T')[0],
  }, token);
  console.log('POST /transactions INCOME', r.status, JSON.stringify(r.data).slice(0,300));

  // POST budget without name
  const today = new Date();
  r = await req('POST', '/budgets', {
    categoryId,
    amount: 1000,
    period: 'MONTHLY',
    startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().split('T')[0],
  }, token);
  console.log('POST /budgets', r.status, JSON.stringify(r.data).slice(0,400));
}

debug().catch(e => console.error('FATAL:', e.message));
