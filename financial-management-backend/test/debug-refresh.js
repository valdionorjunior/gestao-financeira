const BASE = 'http://localhost:3000/api/v1';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

async function debug() {
  const email = `dbg2_${Date.now()}@test.com`;
  
  let r = await req('POST', '/auth/register', { firstName:'D', lastName:'T', email, password:'Senha@123', lgpdConsent:true });
  console.log('REGISTER', r.status, JSON.stringify(r.data).slice(0,200));
  
  r = await req('POST', '/auth/login', { email, password:'Senha@123' });
  const token = r.data.accessToken;
  const refreshToken = r.data.refreshToken;
  console.log('LOGIN', r.status, 'access:', token?.slice(0,20), 'refresh:', refreshToken?.slice(0,20));
  
  // Test refresh
  r = await req('POST', '/auth/refresh', { refreshToken });
  console.log('REFRESH (body)', r.status, JSON.stringify(r.data).slice(0,300));
  
  // Maybe refresh needs Bearer header with refreshToken?
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${refreshToken}` },
    body: JSON.stringify({ refreshToken }),
  });
  const d = await res.json();
  console.log('REFRESH (bearer+body)', res.status, JSON.stringify(d).slice(0,300));
  
  // Test with valid token
  const useToken = r.status === 200 ? r.data.accessToken : token;
  r = await req('GET', '/accounts', null, useToken);
  console.log('GET /accounts status:', r.status, JSON.stringify(r.data).slice(0,200));
}

debug().catch(e => console.error('FATAL:', e.message));
