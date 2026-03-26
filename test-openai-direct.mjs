// Direct OpenAI API test — bypasses NestJS entirely
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve('./financial-management-backend/.env');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
const env = {};
for (const line of envLines) {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
}

const apiKey = env['OPENAI_API_KEY'];
const tlsVerify = env['OPENAI_DISABLE_TLS_VERIFY'];

console.log('API key starts with:', apiKey?.slice(0, 20) + '...');
console.log('TLS bypass env:', tlsVerify);

if (tlsVerify === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('✅ TLS verification disabled');
}

try {
  const { default: OpenAI } = await import('./financial-management-backend/node_modules/openai/index.js');
  const client = new OpenAI({ apiKey });

  console.log('\nCalling OpenAI gpt-3.5-turbo...');
  const completion = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    max_tokens: 100,
    messages: [
      { role: 'user', content: 'Olá! Responda em uma frase curta: o que é patrimônio líquido?' },
    ],
  });

  const response = completion.choices[0]?.message?.content;
  console.log('\n✅ OpenAI responded:', response);
} catch (err) {
  console.error('\n❌ OpenAI error:', err.message);
  if (err.cause) console.error('  cause:', err.cause?.message ?? err.cause, '| code:', err.cause?.code);
  if (err.status) console.error('  HTTP status:', err.status);
  if (err.error) console.error('  API error:', JSON.stringify(err.error));
}
