export const CATEGORIAS = ['alimentacion','transporte','vivienda','servicios','salud','ocio','educacion','deudas','otros'];

export const cop = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

// Dónde cae cada categoría dentro de la regla de porcentajes
export const BUCKET = {
  alimentacion: 'necesidades', transporte: 'necesidades', vivienda: 'necesidades',
  servicios: 'necesidades', salud: 'necesidades', educacion: 'necesidades',
  ocio: 'deseos', otros: 'deseos', deudas: 'ahorro',
};

export const PLANES = {
  equilibrado: { nombre: 'Equilibrado 50/30/20', necesidades: 50, deseos: 30, ahorro: 20 },
  ajustado:    { nombre: 'Ajustado 60/25/15',    necesidades: 60, deseos: 25, ahorro: 15 },
  agresivo:    { nombre: 'Ahorro fuerte 50/20/30', necesidades: 50, deseos: 20, ahorro: 30 },
};

export const BUCKETS = [
  { id: 'necesidades', titulo: 'Gastos fijos y necesidades', ayuda: 'Vivienda, servicios, comida, transporte, salud y educación.' },
  { id: 'deseos',      titulo: 'Gustos y estilo de vida',    ayuda: 'Ocio, salidas y compras no esenciales.' },
  { id: 'ahorro',      titulo: 'Ahorro y pago de deudas',    ayuda: 'Fondo de emergencia, inversión y cuotas extra de deuda.' },
];