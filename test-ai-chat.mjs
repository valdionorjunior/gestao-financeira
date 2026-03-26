const BASE = 'http://localhost:3000/api/v1';

async function run() {
  // Login
  const loginRes = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'valdionorjunior@outlook.com', password: 'Bwi280281*' }),
  });
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    return;
  }
  const { accessToken } = await loginRes.json();
  console.log('✅ Token OK:', accessToken.substring(0, 30) + '...');

  // AI Chat
  const chatRes = await fetch(BASE + '/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken,
    },
    body: JSON.stringify({ message: 'Como posso calcular meu patrimônio líquido e qual a fórmula utilizada para isso?' }),
  });
  const data = await chatRes.json();
  console.log('Status:', chatRes.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

run().catch(console.error);
