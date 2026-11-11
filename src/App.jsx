import { useState } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import Onboarding from './components/Onboarding';
import Resumen from './components/Resumen';
import Gastos from './components/Gastos';
import Inversion from './components/Inversion';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'deudas', label: 'Deudas' },
  { id: 'ahorro', label: 'Inversión' },
];

export default function App() {
  const [tab, setTab] = useState('resumen');
  const [perfil, setPerfil] = useLocalStorage('prometheus:perfil', null);
  const [gastos, setGastos] = useLocalStorage('prometheus:gastos', []);

  if (!perfil) return <Onboarding onSave={setPerfil} />;

  return (
    <div className="shell">
      <aside className="side">
        <h1 className="display brand">Prometheus</h1>
        <nav className="nav" aria-label="Secciones">
          {TABS.map((t) => (
            <button key={t.id} className={`navbtn ${tab === t.id ? 'on' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <p className="side-foot muted xs">Datos guardados en este dispositivo</p>
      </aside>
      <main className="main">
        {tab === 'resumen' && <Resumen perfil={perfil} setPerfil={setPerfil} gastos={gastos} onReset={() => setPerfil(null)} />}
        {tab === 'gastos' && <Gastos gastos={gastos} setGastos={setGastos} />}
        {tab === 'ahorro' && <Inversion perfil={perfil} gastos={gastos} />}
        {(tab === 'deudas' || tab === 'ahorro') && (
          <>
            <header className="page-head"><h2 className="display page-title">{TABS.find((t) => t.id === tab).label}</h2></header>
            <section className="box">
              <p className="muted">Esta sección se construye en el siguiente paso.</p></section>
          </>
        )}
      </main>
    </div>
  );
}