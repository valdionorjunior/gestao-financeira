const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  console.log('=== Diagnóstico OpenAI ===');
  console.log('Key presente:', !!key);
  console.log('Key prefix:', key ? key.substring(0, 20) + '...' : 'NÃO ENCONTRADA');

  if (!key) {
    console.error('PROBLEMA: OPENAI_API_KEY não carregada do .env');
    return;
  }

  const { default: OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: key });

  try {
    console.log('\nTestando conexão com api.openai.com...');
    const result = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 30,
      messages: [{ role: 'user', content: 'responda apenas a palavra: funcionando' }],
    });
    console.log('✅ SUCESSO! Resposta:', result.choices[0]?.message?.content);
  } catch (err) {
    console.error('❌ ERRO tipo:', err.constructor.name);
    console.error('❌ ERRO msg:', err.message);
    console.error('❌ ERRO code:', err.code);
    console.error('❌ ERRO status:', err.status);
    if (err.cause) {
      console.error('❌ CAUSA raiz:', err.cause.message);
      console.error('❌ CAUSA código:', err.cause.code);
    }

    // Diagnóstico adicional: testa conectividade raw
    const https = require('https');
    console.log('\nTestando conectividade TCP para api.openai.com:443...');
    const req = https.request({ host: 'api.openai.com', port: 443, path: '/', method: 'HEAD', timeout: 5000 }, (res) => {
      console.log('✅ TCP conectado! HTTP status:', res.statusCode);
      req.destroy();
    });
    req.on('error', (e) => console.error('❌ TCP falhou:', e.message, e.code));
    req.on('timeout', () => { console.error('❌ TCP timeout'); req.destroy(); });
    req.end();
  }
}

testOpenAI();
