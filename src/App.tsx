import { displayBrand } from './domain/chinese';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { mockDataSource } from './data/source';
import { calculateGravityPositions } from './engines/gravity';
import { GravityWorld } from './components/GravityWorld';
import { RelationInspector } from './components/RelationInspector';
import { CharacterEntry } from './components/CharacterEntry';
import { BrandIntakePage } from './components/BrandIntakePage';
import { DrawPage } from './components/DrawPage';
import { CollaborationInvitation } from './components/CollaborationInvitation';
import { invitationReducer } from './domain/invitation';
import type { Invitation, InvitationAction } from './domain/invitation';
import { PartnerDetailPage } from './components/PartnerDetailPage';
import { BrandCharacter } from './components/BrandCharacter';
import { Icon } from './components/Icon';
import './components/characters.css';
import './components/matching-flow.css';
import './components/invitation-flow.css';
import { missingMatchingFields } from './domain/brandIntake';
import { discoverRelations, gravityExplorationRelations } from './domain/discovery';
import { loadCustomBrands, saveCustomBrands } from './engines/characterGenome';
import type { Brand, WorldDataSource } from './domain/types';

export default function App({ dataSource = mockDataSource, homeBrandId = 'memory-block', initialPage = 'entry', demoBrand, localOnly = false }: { dataSource?: WorldDataSource; homeBrandId?: string; initialPage?: 'entry' | 'intake' | 'matching'; demoBrand?: Brand; localOnly?: boolean }) {
  const originals = useMemo(() => dataSource.loadBrands(1), [dataSource]);
  const [customBrands, setCustomBrands] = useState<Brand[]>(()=>localOnly?[]:loadCustomBrands());
  const brands = useMemo(() => [...originals.map(brand=>localOnly ? customBrands.find(item=>item.id===brand.id) ?? brand : brand), ...customBrands.filter(brand => !originals.some(original => original.id === brand.id))], [originals, customBrands, localOnly]);
  const [ownBrandId, setOwnBrandId] = useState(() => demoBrand?.id ?? customBrands.at(-1)?.id ?? homeBrandId);
  const home = brands.find(brand => brand.id === ownBrandId) ?? brands[0];
  const [editingBrand, setEditingBrand] = useState(false);
  const [page, setPage] = useState<'entry' | 'intake' | 'matching' | 'detail' | 'next'>(initialPage);
  const [mode, setMode] = useState<'gravity' | 'draw'>('gravity');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Record<string, Invitation>>({});
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [page, mode]);
  const [focusId, setFocusId] = useState(home.id);
  const [selectedId, setSelectedId] = useState('form-works');
  const [resetKey, setResetKey] = useState(0);
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
  const invitationKey = `${home.id}:${partnerId}`;
  const startInvitation = () => {
    if (!partner) return;
    setInvitations(previous => previous[invitationKey] ? previous : { ...previous, [invitationKey]: { status: 'draft', version: 1, feedback: '', draft: { title: `${home.name} × ${partner.name}`, concept: '', contribution: home.offers, ask: '', diagnostics: ['', '', ''] } } });
    setPage('next');
  };
  const dispatchInvitation = (action: InvitationAction) => setInvitations(previous => previous[invitationKey] ? { ...previous, [invitationKey]: invitationReducer(previous[invitationKey], action) } : previous);
  return <div className={`app-shell flow-shell page-${page} mode-${mode}`} data-character-style="facet">
    <header className="flow-header">
      <button className="brand-lockup flow-logo" onClick={() => setPage('entry')} aria-label="品牌联名 首页"><img src="/vi/mark-black.svg" alt="" /><span>品牌联名</span></button>
      {page === 'matching' ? <nav className="mode-switch" aria-label="匹配模式"><button title="引力匹配" aria-label="引力匹配" aria-pressed={mode === 'gravity'} onClick={() => setMode('gravity')}><Icon name="orbit" /></button><button title="抽卡匹配" aria-label="抽卡匹配" aria-pressed={mode === 'draw'} onClick={() => setMode('draw')}><Icon name="cards" /></button></nav> : null}
      {page !== 'entry' && page !== 'intake' ? <button className="my-character" aria-label="编辑角色" onClick={() => {setEditingBrand(true);setPage('intake');}}><BrandCharacter brand={home} /><span>编辑角色<strong>{home.name}</strong></span></button> : null}
    </header>
    {page === 'entry' ? <CharacterEntry brands={brands} example={home} onCreate={() => { setEditingBrand(Boolean(home.profile)); setPage('intake'); }} /> : page === 'intake' ? <BrandIntakePage localOnly={localOnly} initialBrand={editingBrand || localOnly ? home : undefined} onBack={() => setPage(editingBrand ? 'matching' : 'entry')} onEnter={enter} /> : page === 'detail' && partner ? <PartnerDetailPage home={displayBrand(home)} partner={displayBrand(partner)} relation={ownRelationMap.get(partner.id)} onClose={() => setPage('matching')} onContact={startInvitation} /> : page === 'next' && partner && invitations[invitationKey] ? <CollaborationInvitation localOnly={localOnly} key={invitationKey} home={displayBrand(home)} partner={displayBrand(partner)} invitation={invitations[invitationKey]} dispatch={dispatchInvitation} onBack={() => setPage('detail')} /> : mode === 'draw' ? <DrawPage key={home.id} brands={brands.map(displayBrand)} home={displayBrand(home)} relations={ownRelationMap} onChoose={choosePartner} /> : <>
    <div className="gravity-toolbar"><span>智能匹配 <strong data-testid="current-focus">{focus.name}</strong></span><div><button onClick={goHome}><Icon name="home" /><span>回到我的品牌</span></button><button disabled={selected.id === home.id && focus.id === home.id} onClick={() => selected.id !== focus.id ? onSetFocus(selected.id) : setResetKey(key => key + 1)}><Icon name="reset" /><span>{selected.id === focus.id ? '回到聚焦伙伴' : '聚焦这个伙伴'}</span></button></div></div>
    <main className="workspace">
      <GravityWorld brands={brands} focus={focus} positions={positions} relations={relationMap} selectedId={selected.id} resetKey={resetKey} onInspect={onInspect} />
      <RelationInspector focus={displayBrand(focus)} target={displayBrand(selected)} relation={relationMap.get(selected.id)} count={brands.length} onMatch={selected.id !== home.id ? () => choosePartner(selected.id) : undefined} />
    </main>
    <footer className="discovery-footer"><span>{focus.name} · {visibleRelations.length} 条连接线索{focus.id !== home.id ? ' · 当前查看伙伴的关系' : ''}</span>{missing.length ? <><p>建议上传{home.profile?.gaps.length ? home.profile.gaps.slice(0, 2).map(gap => gap.material).join('、') : missing.slice(0, 3).map(field => field.label).join('、')}，让连接更有依据。</p><button onClick={() => { setEditingBrand(true); setPage('intake'); }}>补充品牌信息<Icon name="arrow" /></button></> : <p>可聚焦其他品牌，探索它的智能连接。</p>}</footer>
    </>}
    <span className="sr-only" role="status" aria-live="polite">当前聚焦：{focus.name}。已选品牌：{selected.name}。</span>
  </div>;
}
