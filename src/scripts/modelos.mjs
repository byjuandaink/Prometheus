// Uso: node scripts/modelos.mjs
// Lista los modelos que TU api key puede usar con generateContent.
import { readFileSync } from 'node:fs';

let key = process.env.VITE_GEMINI_API_KEY;
if (!key) {
  try {
    const env = readFileSync('.env.local', 'utf8');
    key = env.match(/^VITE_GEMINI_API_KEY=(.+)$/m)?.[1]?.trim();
  } catch { /* sin .env.local */ }
}
if (!key) { console.error('No encontré VITE_GEMINI_API_KEY en .env.local'); process.exit(1); }

const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
  headers: { 'x-goog-api-key': key },
});
if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
const { models = [] } = await res.json();
models
  .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
  .forEach((m) => console.log(m.name.replace('models/', '')));