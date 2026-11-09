const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini(parts, { json = false } = {}) {
  if (!KEY) throw new Error('Falta VITE_GEMINI_API_KEY en .env.local');
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: json ? { responseMimeType: 'application/json' } : {},
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = () => reject(new Error('No se pudo leer la imagen'));
    r.readAsDataURL(file);
  });

/** Foto de factura -> gasto estructurado */
export async function parseReceipt(file) {
  const data = await fileToBase64(file);
  const prompt = `Analiza esta factura o recibo. Responde SOLO un JSON con:
{"comercio":string,"fecha":"YYYY-MM-DD","moneda":string,"total":number,
"categoria":"alimentacion|transporte|vivienda|servicios|salud|ocio|educacion|deudas|otros",
"items":[{"descripcion":string,"cantidad":number,"precio":number}]}
Si un dato no es legible usa null. Traduce descripciones al español.`;
  const text = await callGemini(
    [{ inline_data: { mime_type: file.type || 'image/jpeg', data } }, { text: prompt }],
    { json: true }
  );
  return JSON.parse(text);
}

/** Resumen de gastos/deudas -> recomendaciones en texto */
export async function getAdvice({ gastos, deudas, ingresos, tipo = 'ahorro' }) {
  const foco = {
    ahorro: 'Detecta fugas de dinero y propone un plan de ahorro concreto.',
    deuda: 'Compara estrategias avalancha y bola de nieve con estos datos y recomienda una.',
    inversion: 'Da opiniones educativas de inversión según perfil de riesgo y horizonte.',
  }[tipo];
  const prompt = `Eres un asesor financiero personal. Moneda: COP. ${foco}
Datos: ${JSON.stringify({ ingresos, gastos, deudas })}
Responde en español, con pasos accionables y breves. Cierra aclarando que es orientación educativa, no asesoría financiera regulada.`;
  return callGemini([{ text: prompt }]);
}