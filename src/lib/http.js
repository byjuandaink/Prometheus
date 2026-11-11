const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function mensaje(res) {
  const txt = await res.text();
  try { return JSON.parse(txt).error?.message || txt; } catch { return txt; }
}


export async function generar(modelos, body) {
  if (!KEY) throw new Error('Falta VITE_GEMINI_API_KEY en .env.local');
  const lista = [...new Set(modelos.filter(Boolean))];
  const errores = [];
  for (const modelo of lista) {
    for (let i = 0; i < 3; i++) {
      let res;
      try {
        res = await fetch(`${BASE}${modelo}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(40000),
        });
      } catch (e) {
        errores.push(`[${modelo}] sin respuesta (${e.name === 'TimeoutError' ? 'más de 40 s' : 'error de red'})`);
        break;
      }
      if (res.ok) return res.json();
      const msg = await mensaje(res);
      if (res.status === 404) { errores.push(`[${modelo}] no disponible (404): ${msg}`); break; }
      if (![429, 500, 503].includes(res.status)) throw new Error(`[${modelo}] ${res.status}: ${msg}`);
      if (i === 2) errores.push(`[${modelo}] saturado (${res.status}) tras 3 intentos`);
      else await esperar(1500 * 2 ** i);
    }
  }
  throw new Error(errores.join(' | '));
}