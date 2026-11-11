import { useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { pedirAsesoria } from '../lib/advisor';
import { BUCKET, cop } from '../lib/finanzas';

const RIESGOS = ['conservador', 'moderado', 'arriesgado'];
const HORIZONTES = ['menos de 1 año', '1 a 3 años', '3 a 10 años', 'más de 10 años'];

export default function Inversion({ perfil, gastos }) {
  const [f, setF] = useLocalStorage('prometheus:inversion', { ahorro: '', riesgo: 'moderado', horizonte: '1 a 3 años', deudas: [] });
  const [nueva, setNueva] = useState({ nombre: '', saldo: '', tasa: '' });
  const [res, setRes] = useState({ loading: false, texto: '', fuentes: [], err: '', conBusqueda: true });

  const mes = new Date().toISOString().slice(0, 7);
  const ingreso = perfil.ingresoFijo + perfil.otros;
  const gastosBucket = useMemo(() => {
    const r = { necesidades: 0, deseos: 0, ahorro: 0 };
    gastos.filter((g) => g.fecha.startsWith(mes)).forEach((g) => { r[BUCKET[g.categoria] || 'deseos'] += g.monto; });
    return r;
  }, [gastos, mes]);
  const disponible = Math.max(0, ingreso - (gastosBucket.necesidades + gastosBucket.deseos + gastosBucket.ahorro));
  const totalDeuda = f.deudas.reduce((s, d) => s + d.saldo, 0);

  function addDeuda(e) {
    e.preventDefault();
    const saldo = Number(nueva.saldo), tasa = Number(nueva.tasa);
    if (!nueva.nombre.trim() || !(saldo > 0) || !(tasa >= 0)) return;
    setF({ ...f, deudas: [...f.deudas, { id: crypto.randomUUID(), nombre: nueva.nombre.trim(), saldo, tasa }] });
    setNueva({ nombre: '', saldo: '', tasa: '' });
  }

  async function consultar() {
    const ahorro = Number(f.ahorro);
    if (!(ahorro > 0)) { setRes((r) => ({ ...r, err: 'Indica cuánto ahorro tienes para destinar.' })); return; }
    setRes({ loading: true, texto: '', fuentes: [], err: '', conBusqueda: true });
    try {
      const r = await pedirAsesoria({ ingreso, ahorro, gastos: gastosBucket, riesgo: f.riesgo, horizonte: f.horizonte, deudas: f.deudas });
      setRes({ loading: false, texto: r.texto, fuentes: r.fuentes, err: '', conBusqueda: r.conBusqueda });
    } catch (e) {
      setRes({ loading: false, texto: '', fuentes: [], err: `No se pudo consultar a Gemini: ${e.message}`, conBusqueda: true });
    }
  }

  return (
    <>
      <header className="page-head">
        <h2 className="display page-title">Inversión</h2>
        <div className="head-total"><span className="muted">Deuda total</span><strong className="display">{cop(totalDeuda)}</strong></div>
      </header>

      <div className="split">
        <section className="box">
          <h3 className="box-title display">Tu situación</h3>
          <label className="field">Ahorro a destinar (COP)
            <input className="input" type="number" min="1" value={f.ahorro} onChange={(e) => setF({ ...f, ahorro: e.target.value })} />
          </label>
          <button className="btn btn-small" onClick={() => setF({ ...f, ahorro: String(Math.round(disponible)) })}>
            Usar disponible del mes ({cop(disponible)})
          </button>
          <label className="field">Perfil de riesgo
            <select className="input cap" value={f.riesgo} onChange={(e) => setF({ ...f, riesgo: e.target.value })}>{RIESGOS.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <label className="field">Horizonte
            <select className="input" value={f.horizonte} onChange={(e) => setF({ ...f, horizonte: e.target.value })}>{HORIZONTES.map((h) => <option key={h}>{h}</option>)}</select>
          </label>

          <h3 className="box-title display">Deudas</h3>
          {f.deudas.map((d) => (
            <div className="debt-row" key={d.id}>
              <span>{d.nombre}<em>{cop(d.saldo)} · {d.tasa}% E.A.</em></span>
              <button className="btn btn-small" onClick={() => setF({ ...f, deudas: f.deudas.filter((x) => x.id !== d.id) })} aria-label={`Quitar ${d.nombre}`}>Quitar</button>
            </div>
          ))}
          <form className="form" onSubmit={addDeuda}>
            <label className="field">Nombre<input className="input" value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} placeholder="Tarjeta, crédito…" /></label>
            <label className="field">Saldo (COP)<input className="input" type="number" min="1" value={nueva.saldo} onChange={(e) => setNueva({ ...nueva, saldo: e.target.value })} /></label>
            <label className="field">Tasa efectiva anual (%)<input className="input" type="number" min="0" step="any" value={nueva.tasa} onChange={(e) => setNueva({ ...nueva, tasa: e.target.value })} /></label>
            <button className="btn" type="submit">Agregar deuda</button>
          </form>
        </section>

        <section className="box">
          <h3 className="box-title display">Recomendación de la IA</h3>
          <button className="btn btn-primary" disabled={res.loading} onClick={consultar}>{res.loading ? 'Analizando y buscando tasas…' : 'Pedir recomendación'}</button>
          {res.err && <p className="warn small" role="alert">{res.err}</p>}
          {!res.texto && !res.loading && !res.err && <p className="muted">Completa tus datos y pulsa el botón. La IA decide si conviene pagar deudas antes de invertir y propone opciones con tasas recientes.</p>}
          {res.texto && (
            <>
              <div className="answer">{res.texto}</div>
              {!res.conBusqueda && <p className="warn small">No se pudo buscar en internet: las tasas pueden estar desactualizadas. Verifícalas con cada entidad.</p>}
              {res.fuentes.length > 0 && (
                <ul className="sources small">
                  {res.fuentes.slice(0, 6).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.titulo || s.url}</a></li>)}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}