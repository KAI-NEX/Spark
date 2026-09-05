import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
const CaseStudio = lazy(() => import('./cases/CaseStudio'));
const showCases = new URLSearchParams(window.location.search).get('view') === 'cases';
if (showCases) document.title = 'Memory Block · 合作参考案例';
createRoot(document.getElementById('root')!).render(<StrictMode>{showCases ? <Suspense fallback={<p style={{ padding: 32 }}>正在打开 Memory Block 的合作案例…</p>}><CaseStudio /></Suspense> : <App />}</StrictMode>);
