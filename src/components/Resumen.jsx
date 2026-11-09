import { useMemo } from 'react';
import { BUCKET, BUCKETS, PLANES, cop } from '../lib/finanzas';

export default function Resumen({ perfil, setPerfil, gastos, onReset }) {
  const ingreso = perfil.ingresoFijo + perfil.otros;
  const plan = PLANES[perfil.plan];
  const mes = new Date().toISOString().slice(0, 7);

  const real = useMemo(() => {
    const r = { necesidades: 0, deseos: 0, ahorro: 0 };
    gastos.filter((g) => g.fecha.startsWith(mes)).forEach((g) => { r[BUCKET[g.categoria] || 'deseos'] += g.monto; });
    return r;
  }, [gastos, mes]);

  const gastado = real.necesidades + real.deseos + real.ahorro;
  const emergencia = ingreso * (plan.necesidades / 100) * 3;

  return (
    <>
      <header className="page-head">
        <h2 className="display page-title">Resumen</h2>
        <button className="btn" onClick={onReset}>Editar ingresos</button>
      </header>

      <div className="kpis">
        <div className="box kpi"><span className="muted">Ingreso mensual</span><strong className="display">{cop(ingreso)}</strong></div>
        <div className="box kpi"><span className="muted">Gastado este mes</span><strong className="display">{cop(gastado)}</strong></div>
        <div className="box kpi"><span className="muted">Disponible</span><strong className={`display ${ingreso - gastado < 0 ? 'neg' : 'pos'}`}>{cop(ingreso - gastado)}</strong></div>
        <div className="box kpi"><span className="muted">Fondo de emergencia sugerido</span><strong className="display">{cop(emergencia)}</strong></div>
      </div>

      <section className="box">
        <h3 className="box-title display">Elige tu estrategia</h3>
        <div className="chips">
          {Object.entries(PLANES).map(([id, p]) => (
            <button key={id} className={`chip ${perfil.plan === id ? 'on' : ''}`} onClick={() => setPerfil({ ...perfil, plan: id })}>{p.nombre}</button>
          ))}
        </div>
        <div className="buckets">
          {BUCKETS.map((b) => {
            const pct = plan[b.id];
            const meta = (ingreso * pct) / 100;
            const uso = meta ? (real[b.id] / meta) * 100 : 0;
            const sobre = b.id !== 'ahorro' && uso > 100;
            return (
              <div className="bucket" key={b.id}>
                <div className="bucket-top">
                  <span className="display bucket-pct">{pct}%</span>
                  <span className="bucket-name">{b.titulo}</span>
                </div>
                <p className="muted small">{b.ayuda}</p>
                <div className="bar"><i className={sobre ? 'over' : ''} style={{ width: `${Math.min(100, uso)}%` }} /></div>
                <p className="small">{cop(real[b.id])} de {cop(meta)}{sobre ? ' · te pasaste del límite' : ''}</p>
              </div>
            );
          })}
        </div>
        <p className="muted small note">Orientación educativa: el fondo de emergencia sugerido equivale a 3 meses de gastos fijos del plan elegido.</p>
      </section>
    </>
  );
}