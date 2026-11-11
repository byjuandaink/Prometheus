import { generar } from './http';

const MODEL = import.meta.env.VITE_GEMINI_ADVISOR_MODEL || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.1-pro-preview';
const FALLBACK = import.meta.env.VITE_GEMINI_FALLBACK_MODEL;

async function llamar(prompt, conBusqueda) {
  const data = await generar([MODEL, FALLBACK], {
    contents: [{ parts: [{ text: prompt }] }],
    ...(conBusqueda ? { tools: [{ google_search: {} }] } : {}),
  });
  const cand = data.candidates?.[0];
  return {
    texto: cand?.content?.parts?.map((p) => p.text).join('') ?? '',
    fuentes: (cand?.groundingMetadata?.groundingChunks ?? [])
      .map((c) => c.web).filter(Boolean).map((w) => ({ titulo: w.title, url: w.uri })),
    conBusqueda,
  };
}

export function construirPrompt(d) {
  const deudas = d.deudas.length
    ? d.deudas.map((x) => `- ${x.nombre}: saldo ${x.saldo} COP, tasa ${x.tasa}% efectivo anual`).join('\n')
    : '- Sin deudas';
  return `Eres un asesor financiero para una persona en Colombia (moneda COP). Fecha: ${new Date().toISOString().slice(0, 10)}.

DATOS
- Ingreso mensual: ${d.ingreso} COP
- Ahorro disponible para destinar: ${d.ahorro} COP
- Gastos del mes: necesidades ${d.gastos.necesidades}, gustos ${d.gastos.deseos}, deudas ${d.gastos.ahorro} COP
- Perfil de riesgo: ${d.riesgo}
- Horizonte: ${d.horizonte}
- Deudas:
${deudas}

INSTRUCCIONES
1. Decide primero qué es lo más sensato: si hay deudas con tasa alta, compara el costo de la deuda con la rentabilidad realista de invertir y explica si conviene pagar antes de invertir. Verifica que exista fondo de emergencia.
2. Propón una distribución concreta del ahorro en porcentajes y en pesos (fondo de emergencia, pago de deuda, inversión).
3. Da opciones reales disponibles en Colombia (por ejemplo cuentas de ahorro de alto rendimiento, CDT, fondos de inversión colectiva, TES, fondos voluntarios de pensión, ETFs mediante comisionista). Para cada una indica rentabilidad aproximada ACTUAL (busca datos recientes), riesgo, liquidez y para quién sirve. Si no encuentras una cifra confiable, dilo en vez de inventarla.
4. No prometas rendimientos ni des certezas. Menciona riesgos e impuestos relevantes.
Formato: español, texto plano SIN markdown ni asteriscos; títulos en mayúsculas, párrafos cortos y listas con guiones. Cierra aclarando que es orientación educativa y que conviene verificar tasas con cada entidad.`;
}

/** Usa Google Search para tasas actuales; si falla, reintenta sin búsqueda. */
export async function pedirAsesoria(datos) {
  const prompt = construirPrompt(datos);
  try {
    return await llamar(prompt, true);
  } catch {
    return await llamar(prompt, false);
  }
}