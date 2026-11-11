import { generar } from './http';
 
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.1-pro-preview';
const FALLBACK = import.meta.env.VITE_GEMINI_FALLBACK_MODEL;
 
async function callGemini(parts, { json = false } = {}) {
  const data = await generar([MODEL, FALLBACK], {
    contents: [{ parts }],
    generationConfig: json ? { responseMimeType: 'application/json' } : {},
  });
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
}
 
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = () => reject(new Error('No se pudo leer la imagen'));
    r.readAsDataURL(file);
  });
 
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
 
