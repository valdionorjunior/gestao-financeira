import http from 'http';

function req(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4201' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(
      { hostname: 'localhost', port: 3000, path: '/api/v1' + path, method, headers },
      res => { let s = ''; res.on('data', c => s += c); res.on('end', () => resolve({ status: res.statusCode, body: s })); }
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const OK  = msg => console.log('  PASS:', msg);
const FAIL = msg => console.log('  FAIL:', msg);
let pass = true;

console.log('\n============================================');
console.log('  Teste: valdionorjunior@outlook.com       ');
console.log('============================================\n');

console.log('1. POST /auth/login');
const r1 = await req('/auth/login', 'POST', { email: 'valdionorjunior@outlook.com', password: 'Bwi280281*' });
const b1 = JSON.parse(r1.body);
if (r1.status === 200 || r1.status === 201) {
  OK('Login OK — ' + b1.user.email + ' (' + b1.user.firstName + ')');
  OK('accessToken: ' + b1.accessToken.substring(0, 50) + '...');
} else {
  FAIL('Login falhou — HTTP ' + r1.status + ' — ' + JSON.stringify(b1));
  pass = false;
  process.exit(1);
}

console.log('\n2. GET /reports/dashboard (autenticado)');
const r2 = await req('/reports/dashboard', 'GET', null, b1.accessToken);
if (r2.status === 200) {
  const d = JSON.parse(r2.body);
  OK('Dashboard OK — totalBalance: ' + d.totalBalance + ', monthlyIncome: ' + d.monthlyIncome);
} else {
  FAIL('Dashboard falhou — HTTP ' + r2.status + ' — ' + r2.body.substring(0, 120));
  pass = false;
}

console.log('\n3. POST /auth/logout');
const r3 = await req('/auth/logout', 'POST', { refreshToken: b1.refreshToken }, b1.accessToken);
if (r3.status === 200 || r3.status === 204) {
  OK('Logout OK');
} else {
  FAIL('Logout falhou — HTTP ' + r3.status);
  pass = false;
}

console.log('\n4. POST /auth/login (re-login apos logout)');
const r4 = await req('/auth/login', 'POST', { email: 'valdionorjunior@outlook.com', password: 'Bwi280281*' });
const b4 = JSON.parse(r4.body);
if (r4.status === 200 || r4.status === 201) {
  OK('Re-login OK — ' + b4.accessToken.substring(0, 50) + '...');
} else {
  FAIL('Re-login falhou — HTTP ' + r4.status + ' — ' + JSON.stringify(b4));
  pass = false;
}

console.log('\n============================================');
console.log(pass ? '  TODOS OS TESTES PASSARAM' : '  ALGUM TESTE FALHOU');
console.log('============================================\n');

