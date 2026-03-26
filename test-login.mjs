import http from 'http';

function req(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', 'Origin': 'http://localhost:5173' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { hostname: 'localhost', port: 3000, path: '/api/v1' + path, method, headers };
    const r = http.request(opts, res => {
      let s = '';
      res.on('data', c => s += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: s }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const EMAIL    = 'valdionorjunior@outlook.com';
const PASSWORD = 'Bwi280281*';

console.log('=== Teste de Login ===');
console.log(`  Email:    ${EMAIL}`);
console.log(`  Password: ${PASSWORD}\n`);

// 1. Tenta login direto
console.log('── 1. POST /auth/login ──────────────────────────');
const r1 = await req('/auth/login', 'POST', { email: EMAIL, password: PASSWORD });
console.log(`  Status HTTP: ${r1.status}`);
console.log(`  Resposta:    ${r1.body}\n`);

if (r1.status === 200 || r1.status === 201) {
  const b1 = JSON.parse(r1.body);
  console.log('✅ Login OK!');
  console.log(`   user: ${b1.user?.email}`);
  console.log(`   accessToken: ${b1.accessToken?.substring(0, 50)}...`);
  process.exit(0);
}

// 2. Falhou — investigar o que está no banco checando se o email existe
console.log('❌ Login falhou. Investigando...\n');

// 3. Tenta variações de senha (encoding/caracteres especiais)
const variants = [
  PASSWORD,
  PASSWORD.trim(),
  'Bwi280281',      // sem *
  'bwi280281*',     // minúscula
  'BWI280281*',     // maiúscula
];

console.log('── 2. Testando variações de senha ───────────────');
for (const pwd of variants) {
  const r = await req('/auth/login', 'POST', { email: EMAIL, password: pwd });
  console.log(`  "${pwd}" → ${r.status} ${r.status === 200 || r.status === 201 ? '✅ SUCESSO' : '❌'}: ${r.body.substring(0,100).replace(/\n/g,'')}`);
  if (r.status === 200 || r.status === 201) {
    console.log('\n✅ SENHA ENCONTRADA:', pwd);
    break;
  }
}

// 4. Tenta registro para ver se retorna "já existe" ou cria
console.log('\n── 3. Tentativa de registro (verifica se email existe) ──');
const rReg = await req('/auth/register', 'POST', {
  email: EMAIL, password: PASSWORD,
  firstName: 'Valdionor', lastName: 'Junior', lgpdConsent: true,
});
console.log(`  POST /auth/register → ${rReg.status}: ${rReg.body.substring(0,200).replace(/\n/g,'')}`);
if (rReg.status === 409 || rReg.body.includes('already') || rReg.body.includes('existe') || rReg.body.includes('conflict')) {
  console.log('  → Email JÁ EXISTE no banco (conflito de registro)');
} else if (rReg.status === 201 || rReg.status === 200) {
  console.log('  → Email NÃO EXISTIA — conta criada agora. Testando login...');
  const rLogin = await req('/auth/login', 'POST', { email: EMAIL, password: PASSWORD });
  console.log(`  Login após registro → ${rLogin.status}: ${rLogin.body.substring(0,150)}`);
}
