import { useMemo, useRef, useState } from 'react';
import { parseReceipt } from '../lib/gemini';
import { CATEGORIAS, cop } from '../lib/finanzas';

const hoy = () => new Date().toISOString().slice(0, 10);
const vacio = () => ({ descripcion: '', monto: '', categoria: 'otros', fecha: hoy() });

export default function Gastos({ gastos, setGastos }) {
  const [form, setForm] = useState(vacio());
  const [scan, setScan] = useState({ loading: false, msg: '', err: false });
  const fileRef = useRef(null);
  const mes = hoy().slice(0, 7);

  const totalMes = useMemo(() => gastos.filter((g) => g.fecha.startsWith(mes)).reduce((s, g) => s + g.monto, 0), [gastos, mes]);
  const ordenados = useMemo(() => [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha)), [gastos]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function agregar(e) {
    e.preventDefault();
    const monto = Number(form.monto);
    if (!form.descripcion.trim() || !(monto > 0)) return;
    setGastos((p) => [...p, { id: crypto.randomUUID(), ...form, monto }]);
    setForm(vacio());
  }

  async function escanear(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScan({ loading: true, msg: 'Leyendo factura…', err: false });
    try {
      const r = await parseReceipt(file);
      setForm({ descripcion: r.comercio || 'Factura', monto: r.total ?? '', categoria: CATEGORIAS.includes(r.categoria) ? r.categoria : 'otros', fecha: r.fecha || hoy() });
      setScan({ loading: false, msg: 'Factura leída. Revisa los datos y pulsa Agregar gasto.', err: false });
    } catch (err) {
      setScan({ loading: false, msg: `No se pudo leer la factura: ${err.message}`, err: true });
    }
  }

  return (
    <>
      <header className="page-head">
        <h2 className="display page-title">Gastos</h2>
        <div className="head-total"><span className="muted">Este mes</span><strong className="display">{cop(totalMes)}</strong></div>
      </header>

      <div className="split">
        <section className="box">
          <h3 className="box-title display">Nuevo gasto</h3>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={escanear} />
          <button className="btn btn-primary btn-wide" disabled={scan.loading} onClick={() => fileRef.current?.click()}>
            {scan.loading ? 'Leyendo…' : 'Escanear factura'}
          </button>
          {scan.msg && <p className={`small ${scan.err ? 'warn' : 'muted'}`} role="status">{scan.msg}</p>}
          <form className="form" onSubmit={agregar}>
            <label className="field">Descripción<input className="input" value={form.descripcion} onChange={set('descripcion')} required /></label>
            <label className="field">Monto (COP)<input className="input" type="number" min="1" step="any" value={form.monto} onChange={set('monto')} required /></label>
            <label className="field">Categoría
              <select className="input cap" value={form.categoria} onChange={set('categoria')}>{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </label>
            <label className="field">Fecha<input className="input" type="date" value={form.fecha} onChange={set('fecha')} required /></label>
            <button className="btn btn-light btn-wide" type="submit">Agregar gasto</button>
          </form>
        </section>

        <section className="box">
          <h3 className="box-title display">Historial</h3>
          {ordenados.length === 0 ? <p className="muted">Aún no hay gastos. Agrega el primero.</p> : (
            <ul className="rows">
              {ordenados.map((g) => (
                <li className="row" key={g.id}>
                  <span className="muted small">{g.fecha}</span>
                  <span className="row-desc">{g.descripcion}<em className="cap">{g.categoria}</em></span>
                  <span className="display row-amount">{cop(g.monto)}</span>
                  <button className="btn btn-small" onClick={() => setGastos((p) => p.filter((x) => x.id !== g.id))} aria-label={`Eliminar ${g.descripcion}`}>Eliminar</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}