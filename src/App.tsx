import { displayBrand } from './domain/chinese';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mockDataSource } from './data/source';
import { calculateGravityPositions } from './engines/gravity';
import { GravityWorld } from './components/GravityWorld';
import { RelationInspector } from './components/RelationInspector';
import { CharacterEntry } from './components/CharacterEntry';
import CanvasRedirect, { canvasUrl } from './collaboration/CanvasRedirect';
import { createProject } from './collaboration/api';
import { visualForBrand } from './collaboration/fixtures';
import { BrandIntakePage } from './components/BrandIntakePage';
import { DrawPage } from './components/DrawPage';
import { PartnerDetailPage } from './components/PartnerDetailPage';
import { Icon } from './components/Icon';
import './components/characters.css';
import './components/matching-flow.css';
import './components/invitation-flow.css';
import { missingMatchingFields } from './domain/brandIntake';
import { discoverRelations, gravityExplorationRelations } from './domain/discovery';
import { loadCustomBrands, saveCustomBrands } from './engines/characterGenome';
import type { Brand, Viewport, WorldDataSource } from './domain/types';

const BrandAtlas = lazy(()=>import('./components/BrandAtlas'));
const ProjectsPage = lazy(() => import('./collaboration/ProjectsPage'));
type AppPage = 'entry' | 'intake' | 'matching' | 'detail' | 'projects' | 'project';
function readRoute(): { page: AppPage; projectId: string; mode: 'draw' | 'gravity' } {
  const hash = window.location.hash.slice(1) || (new URLSearchParams(window.location.search).get('view') === 'cases' ? 'projects' : '');
  const id = new URLSearchParams(hash).get('project') || '';
  return { page: /^project-[a-f0-9-]{36}$/.test(id) ? 'project' : hash === 'projects' ? 'projects' : hash === 'intake' ? 'intake' : ['explore', 'draw'].includes(hash) ? 'matching' : 'entry', projectId: id, mode: hash === 'draw' ? 'draw' : 'gravity' };
}

export default function App({ dataSource = mockDataSource, homeBrandId = 'memory-block', initialPage = 'entry', demoBrand, localOnly = false }: { dataSource?: WorldDataSource; homeBrandId?: string; initialPage?: 'entry' | 'intake' | 'matching'; demoBrand?: Brand; localOnly?: boolean }) {
  const originals = useMemo(() => dataSource.loadBrands(1), [dataSource]);
  const [customBrands, setCustomBrands] = useState<Brand[]>(()=>localOnly?[]:loadCustomBrands());
  const brands = useMemo(() => [...originals.map(brand=>localOnly ? customBrands.find(item=>item.id===brand.id) ?? brand : brand), ...customBrands.filter(brand => !originals.some(original => original.id === brand.id))], [originals, customBrands, localOnly]);
  const [ownBrandId, setOwnBrandId] = useState(() => demoBrand?.id ?? customBrands.at(-1)?.id ?? homeBrandId);
  const home = brands.find(brand => brand.id === ownBrandId) ?? brands[0];
  const [editingBrand, setEditingBrand] = useState(false);
  const [page, setCurrentPage] = useState<AppPage>(() => initialPage !== 'entry' ? initialPage : readRoute().page);
  const [projectId, setProjectId] = useState(() => readRoute().projectId);
  const [mode, setMode] = useState<'gravity' | 'draw'>(() => readRoute().mode);
  const [projectError, setProjectError] = useState('');
  const [openingProject, setOpeningProject] = useState(false);
  const projectOpening = useRef(false);
  const setPage = (next: AppPage) => {
    setCurrentPage(next);
    const hash = next === 'projects' ? 'projects' : next === 'intake' ? 'intake' : ['matching', 'detail'].includes(next) ? 'explore' : '';
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ''}`);
  };
  const openProject = (id: string) => { window.location.assign(canvasUrl(id)); };
  const explore = (next: 'gravity' | 'draw' = 'gravity') => { setMode(next); setCurrentPage('matching'); window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#${next === 'draw' ? 'draw' : 'explore'}`); };
  useEffect(() => { const pop = () => { const route = readRoute(); setCurrentPage(route.page); setProjectId(route.projectId); setMode(route.mode); }; window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop); }, []);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [page, mode]);
  const [focusId, setFocusId] = useState(home.id);
  const [selectedId, setSelectedId] = useState('form-works');
  const [resetKey, setResetKey] = useState(0);
  const [atlasOpen,setAtlasOpen] = useState(false);
  const [locateRequest,setLocateRequest] = useState<{id:string;revision:number}|null>(null);
  const cameraMemory = useRef<{view:Viewport;resetKey:number}|null>(null);
  const [fieldRevision, setFieldRevision] = useState(0);
  const focus = brands.find(brand => brand.id === focusId) ?? home;
  // Only focus, My Brand reload, or updated snapshots invalidate the relation field.
  const relations = useMemo(() => {
    void fieldRevision;
    return dataSource.getRelations(focus, brands);
  }, [dataSource, focus, brands, fieldRevision]);
  const visibleRelations = useMemo(() => discoverRelations(focus, relations), [focus, relations]);
  const explorationRelations = useMemo(() => gravityExplorationRelations(relations, visibleRelations), [relations, visibleRelations]);
  const missing = missingMatchingFields(home);
  const positions = useMemo(() => calculateGravityPositions(focus.id, explorationRelations), [focus.id, explorationRelations]);
  const relationMap = useMemo(() => new Map(explorationRelations.map(relation => [relation.targetBrandId, relation])), [explorationRelations]);
  const selected = brands.find(brand => brand.id === selectedId) ?? focus;
  const ownRelations = useMemo(() => dataSource.getRelations(home, brands), [dataSource, home, brands]);
  const ownRelationMap = useMemo(() => new Map(ownRelations.map(relation => [relation.targetBrandId, relation])), [ownRelations]);
  const partner = brands.find(brand => brand.id === partnerId);
  const onInspect = useCallback((id: string) => setSelectedId(id), []);
  const onSetFocus = useCallback((id: string) => {
    if (id === focus.id) return;
    setSelectedId(id);
    setFocusId(id);
    setResetKey(key => key + 1);
  }, [focus.id]);
  const goHome = () => {
    if (focus.id !== home.id) { setSelectedId(focus.id); setFocusId(home.id); }
    setFieldRevision(revision => revision + 1);
    setResetKey(key => key + 1);
  };
  const enter = (brand: Brand) => {
    if(localOnly) setCustomBrands(previous=>[...previous.filter(item=>item.id!==brand.id),brand]);
    if (!localOnly && brand.id.startsWith('company-')) {
      const next = [...customBrands.filter(item => item.id !== brand.id), brand];
      if (next.length > 40) return '本地最多保存 40 个品牌角色。';
      try { saveCustomBrands(next); } catch { return '浏览器存储空间不足，请精简上传资料后重试。'; }
      setCustomBrands(next);
    }
    setOwnBrandId(brand.id); setFocusId(brand.id); setSelectedId(discoverRelations(brand, dataSource.getRelations(brand, brands))[0]?.targetBrandId || brand.id); setMode('gravity'); setPage('matching'); setResetKey(key => key + 1);
  };
  const choosePartner = (id: string) => { if (id === home.id) return; setPartnerId(id); setPage('detail'); };
  const startInvitation = async () => {
    if (!partner || projectOpening.current) return;
    projectOpening.current = true; setOpeningProject(true); setProjectError('');
    try { const project = await createProject({ a: { brand: displayBrand(home), visual: visualForBrand(home) }, b: { brand: displayBrand(partner), visual: visualForBrand(partner) } }); openProject(project.id); }
    catch (reason) { setProjectError(reason instanceof Error ? reason.message : '创建项目失败，请重试。'); }
    finally { projectOpening.current = false; setOpeningProject(false); }
  };
  return <div className={`app-shell flow-shell page-${page} mode-${mode}`} data-character-style="facet">
    <header className="flow-header br-header">
      <button className="brand-lockup flow-logo br-lockup" onClick={() => setPage('entry')} aria-label="返回首页"><img src="/vi/mark-black.svg" alt="" /><span>Brand Relations</span></button>
      <nav className="br-nav" aria-label="主导航"><button aria-current={['matching', 'detail'].includes(page) ? 'page' : undefined} onClick={() => explore()}>探索品牌</button><button aria-current={['projects', 'project'].includes(page) ? 'page' : undefined} onClick={() => setPage('projects')}>联名项目</button><button aria-current={page === 'intake' ? 'page' : undefined} onClick={() => { setEditingBrand(true); setPage('intake'); }}>品牌资料</button></nav>
      <span className="br-local-label">本地演示</span>
    </header>
    {projectError ? <p className="br-notice" role="alert">{projectError}</p> : null}
    {openingProject ? <p className="br-loading-line" role="status">正在带入双方资料，打开渠道预演画板…</p> : null}

    {page === 'entry' ? <CharacterEntry brands={brands} example={home} onCreate={() => { setEditingBrand(Boolean(home.profile)); setPage('intake'); }} /> : page === 'intake' ? <BrandIntakePage localOnly={localOnly} initialBrand={editingBrand || localOnly ? home : undefined} onBack={() => setPage('entry')} onEnter={enter} /> : page === 'detail' && partner ? <PartnerDetailPage home={displayBrand(home)} partner={displayBrand(partner)} relation={ownRelationMap.get(partner.id)} onClose={() => setPage('matching')} onContact={startInvitation} /> : page === 'projects' ? <Suspense fallback={<p className="br-empty">正在打开项目…</p>}><ProjectsPage brands={brands} onOpen={openProject} onExplore={() => explore()} /></Suspense> : page === 'project' && projectId ? <Suspense fallback={<p className="br-empty">正在打开共创工作台…</p>}><CanvasRedirect id={projectId} /></Suspense> : mode === 'draw' ? <><div className="br-draw-nav"><button className="br-text-button" onClick={() => explore()}>← 返回 Gravity</button><span>抽卡 · 给意外一次机会</span></div><DrawPage key={home.id} brands={brands.map(displayBrand)} home={displayBrand(home)} relations={ownRelationMap} onChoose={choosePartner} /></> : <>
    <div className="gravity-toolbar"><div className="br-discovery-modes"><button aria-pressed={true} onClick={() => explore('gravity')}>Gravity</button><button aria-pressed={false} onClick={() => explore('draw')}>抽卡</button></div><span>智能匹配 <strong data-testid="current-focus">{focus.name}</strong></span><div><button onClick={()=>setAtlasOpen(true)} aria-label="打开品牌图鉴">品牌图鉴 <span>{brands.length}</span></button><button onClick={goHome}><Icon name="home" /><span>回到我的品牌</span></button><button disabled={selected.id === home.id && focus.id === home.id} onClick={() => selected.id !== focus.id ? onSetFocus(selected.id) : setResetKey(key => key + 1)}><Icon name="reset" /><span>{selected.id === focus.id ? '回到聚焦伙伴' : '聚焦这个伙伴'}</span></button></div></div>
    <main className="workspace">
      <GravityWorld brands={brands} focus={focus} positions={positions} relations={relationMap} selectedId={selected.id} resetKey={resetKey} onInspect={onInspect} locateRequest={locateRequest} cameraMemory={cameraMemory}/>
      <RelationInspector focus={displayBrand(focus)} target={displayBrand(selected)} relation={relationMap.get(selected.id)} count={brands.length} onMatch={selected.id !== home.id ? () => choosePartner(selected.id) : undefined} />
    </main>
    <footer className="discovery-footer"><span>{focus.name} · {visibleRelations.length} 条连接线索{focus.id !== home.id ? ' · 当前查看伙伴的关系' : ''}</span>{missing.length ? <><p>建议上传{home.profile?.gaps.length ? home.profile.gaps.slice(0, 2).map(gap => gap.material).join('、') : missing.slice(0, 3).map(field => field.label).join('、')}，让连接更有依据。</p><button onClick={() => { setEditingBrand(true); setPage('intake'); }}>补充品牌信息<Icon name="arrow" /></button></> : <p>可聚焦其他品牌，探索它的智能连接。</p>}</footer>
    </>}
    {atlasOpen?<Suspense fallback={null}><BrandAtlas brands={brands} onClose={()=>setAtlasOpen(false)} onLocate={id=>{setSelectedId(id);setLocateRequest(previous=>({id,revision:(previous?.revision??0)+1}));setAtlasOpen(false);}}/></Suspense>:null}
    <span className="sr-only" role="status" aria-live="polite">当前聚焦：{focus.name}。已选品牌：{selected.name}。</span>
  </div>;
}
