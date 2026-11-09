import { useState } from 'react';

export default function Onboarding({ onSave }) {
  const [fijo, setFijo] = useState('');
  const [otros, setOtros] = useState('');

  function enviar(e) {
    e.preventDefault();
    const f = Number(fijo);
    if (!(f > 0)) return;
    onSave({ ingresoFijo: f, otros: Number(otros) || 0, plan: 'equilibrado' });
  }

  return (
    <div className="gate">
      <form className="box gate-box" onSubmit={enviar}>
        <h1 className="display gate-title">Prometheus</h1>
        <p className="lead">Cuéntanos tus ingresos y armamos tu plan de ahorro por porcentajes.</p>
        <label className="field">Ingreso fijo mensual (COP)
          <input className="input" type="number" min="1" value={fijo} onChange={(e) => setFijo(e.target.value)} required autoFocus />
        </label>
        <label className="field">Otros ingresos mensuales promedio, si tienes (COP)
          <input className="input" type="number" min="0" value={otros} onChange={(e) => setOtros(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit">Crear mi plan</button>
      </form>
    </div>
  );
}