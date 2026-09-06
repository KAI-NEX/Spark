import { useEffect, useRef, useState } from 'react';
import type { Brand } from '../domain/types';
import type { Project } from './model';
import { currentPreview, STATUS_LABELS } from './model';
import { createProject, projectApi } from './api';
import { DEMO_BRANDS, visualForBrand } from './fixtures';
import { Icon } from '../components/Icon';

export default function ProjectsPage({ brands, onOpen, onExplore }: { brands: readonly Brand[]; onOpen: (id: string) => void; onExplore: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [a, setA] = useState(DEMO_BRANDS[0].brand.id);
  const [b, setB] = useState(DEMO_BRANDS[1].brand.id);
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending' | 'accepted'>('all');
  const options = [...DEMO_BRANDS, ...brands.filter(brand => !DEMO_BRANDS.some(demo => demo.brand.id === brand.id)).map(brand => ({ brand, visual: visualForBrand(brand) }))];
  useEffect(() => { const abort = new AbortController(); void projectApi<Project[]>('', undefined, abort.signal).then(setProjects).catch(reason => { if (!abort.signal.aborted) setError(reason.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); }); return () => abort.abort(); }, []);
  const create = async (example = false) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try { const project = await createProject({ a: example ? DEMO_BRANDS[0] : options.find(item => item.brand.id === a)!, b: example ? DEMO_BRANDS[1] : options.find(item => item.brand.id === b)! }); onOpen(project.id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '创建失败，请重试。'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <main className="br-projects"><div className="br-page-heading"><div><h1>联名项目</h1><p>从一次想认识，到一份可以一起完成的合作。</p></div><button className="br-button primary" onClick={() => setCreating(value => !value)} aria-expanded={creating}><Icon name="plus" />新建一对一合作</button></div>
    {error ? <p className="br-notice" role="alert">{error}</p> : null}
    {creating ? <form className="br-create-project" onSubmit={e => { e.preventDefault(); void create(); }}><h2>选定彼此，先看看一起出现的样子。</h2><div><label>发起品牌<select value={a} onChange={e => setA(e.target.value)}>{options.map(item => <option key={item.brand.id} value={item.brand.id}>{item.brand.name}</option>)}</select></label><span>×</span><label>希望认识的品牌<select value={b} onChange={e => setB(e.target.value)}>{options.map(item => <option disabled={item.brand.id === a} key={item.brand.id} value={item.brand.id}>{item.brand.name}</option>)}</select></label><button className="br-button primary" disabled={busy || a === b}>{busy ? '正在准备预演…' : '创建并进入画板'}<Icon name="arrow" /></button></div><p>进入画板后，通过对话生成或调整双方渠道内容。当前为单方建联意向，尚未实际发送邀请。</p></form> : null}
    {!loading ? <div className="br-first-project"><div><span className="br-featured-label">主要案例 / 01 · 一对一品牌互荐</span><h2>把日常，<br />读慢一点。</h2><p>早八咖啡 × 留白书店。各自保留原 VI，在自己的渠道介绍对方，让熟悉的受众遇见一个新品牌。</p><button className="br-button primary" disabled={busy} onClick={() => void create(true)}>{busy ? '正在准备两张预演…' : '体验早八咖啡 × 留白书店'}<Icon name="arrow" /></button><button className="br-text-button" onClick={onExplore}>或先去发现合作伙伴 →</button></div><div className="br-example-duo"><article style={{ background: '#C94B32', color: '#FFF7E9' }}><strong>早八</strong><small>ZAOBA COFFEE</small><p>一杯咖啡，<br />一页日常。</p></article><article style={{ background: '#F3EBDD', color: '#274A3C' }}><strong>留白</strong><small>LIUBAI BOOKS</small><p>读到这里，<br />喝杯咖啡。</p></article></div></div> : null}
    <div className="br-project-list-toolbar"><div className="br-tabs">{([['all', '全部项目'], ['draft', '准备预演'], ['pending', '等待回应'], ['accepted', '正在共创']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><span>保存在这台电脑</span></div>
    {loading ? <p className="br-empty" role="status">正在读取项目…</p> : projects.length ? <div className="br-project-list">{projects.filter(project => filter === 'all' || project.invitation.status === filter).map(project => { const preview = currentPreview(project) ?? project.previews.at(-1); return <button className="br-project-row" key={project.id} onClick={() => onOpen(project.id)}><div className="br-project-thumb">{preview ? <><img src={preview.a} alt="" /><img src={preview.b} alt="" /></> : null}</div><div><span>{project.brands.a.brand.name} × {project.brands.b.brand.name}</span><h2>{project.invitation.draft.title}</h2><p>一对一受众互荐 · V{project.revision} · {new Date(project.updatedAt).toLocaleDateString('zh-CN')}</p></div><span className="br-row-status">{STATUS_LABELS[project.invitation.status]}</span><Icon name="arrow" /></button>; })}{!projects.some(project => filter === 'all' || project.invitation.status === filter) ? <p className="br-empty">这里还没有项目。切换分类或新建合作。</p> : null}</div> : null}
    <footer className="br-projects-footnote">虚构案例用于验证流程；原有品牌资料、历史预演和版本持续保留。</footer>
  </main>;
}
