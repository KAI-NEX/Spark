import { useCallback, useMemo, useState } from 'react';
import { mockDataSource } from './data/source';
import { calculateGravityPositions } from './engines/gravity';
import { GravityWorld } from './components/GravityWorld';
import { RelationInspector } from './components/RelationInspector';
import { Icon } from './components/Icon';
import { BrandDiscovery } from './components/BrandDiscovery';
import { CharacterAtlas } from './components/CharacterPanel';
import type { CharacterStyle } from './engines/character';
import './components/characters.css';
import { CharacterStudio } from './components/CharacterStudio';
import { candidateBrand, loadCustomBrands, saveCustomBrands } from './engines/characterGenome';
import type { CharacterRecipe, CompanyBrief } from './domain/characterRecipe';
import type { WorldDataSource } from './domain/types';

export default function App({ dataSource = mockDataSource, homeBrandId = 'memory-block' }: { dataSource?: WorldDataSource; homeBrandId?: string }) {
  const originals = useMemo(() => dataSource.loadBrands(1), [dataSource]);
  const [customBrands, setCustomBrands] = useState(loadCustomBrands);
  const brands = useMemo(() => [...originals, ...customBrands.filter(brand => !originals.some(original => original.id === brand.id))], [originals, customBrands]);
  const home = brands.find(brand => brand.id === homeBrandId) ?? brands[0];
  const [focusId, setFocusId] = useState(home.id);
  const [selectedId, setSelectedId] = useState('form-works');
  const [resetKey, setResetKey] = useState(0);
  const [fieldRevision, setFieldRevision] = useState(0);
  const [discovering, setDiscovering] = useState(false);
  const [characterStyle, setCharacterStyle] = useState<CharacterStyle>('facet');
  const [showCharacters, setShowCharacters] = useState(false);
  const [studio, setStudio] = useState<{ id?: string } | null>(null);
  const focus = brands.find(brand => brand.id === focusId) ?? home;
  // Only focus, My Brand reload, or updated snapshots invalidate the relation field.
  const relations = useMemo(() => {
    void fieldRevision;
    return dataSource.getRelations(focus, brands);
  }, [dataSource, focus, brands, fieldRevision]);
  const positions = useMemo(() => calculateGravityPositions(focus.id, relations), [focus.id, relations]);
  const relationMap = useMemo(() => new Map(relations.map(relation => [relation.targetBrandId, relation])), [relations]);
  const selected = brands.find(brand => brand.id === selectedId) ?? focus;
  const onInspect = useCallback((id: string) => setSelectedId(id), []);
  const onSetFocus = useCallback((id: string) => {
    if (id === focus.id) return;
    setSelectedId(focus.id);
    setFocusId(id);
    setResetKey(key => key + 1);
  }, [focus.id]);
  const goHome = () => {
    if (focus.id !== home.id) { setSelectedId(focus.id); setFocusId(home.id); }
    setFieldRevision(revision => revision + 1);
    setResetKey(key => key + 1);
  };
  const applyCharacter = (brief: CompanyBrief, recipe: CharacterRecipe) => {
    const id = studio?.id ?? `company-${crypto.randomUUID()}`;
    const brand = candidateBrand(brief, recipe, id);
    const next = customBrands.some(item => item.id === id) ? customBrands.map(item => item.id === id ? brand : item) : [...customBrands, brand];
    if (next.length > 40) return '本地最多保存 40 个公司形象，请先调整已有形象。';
    try { saveCustomBrands(next); } catch { return '浏览器未能保存形象，请检查本地存储空间或浏览器设置后重试。'; }
    setCustomBrands(next); setFocusId(id); setSelectedId(id); setResetKey(key => key + 1); setCharacterStyle('facet'); setStudio(null);
  };
  return <div className="app-shell" data-character-style={characterStyle}>
    <header className="topbar">
      <a className="brand-lockup" href="/" aria-label="Brand Gravity home"><Icon name="orbit" /><span>Brand Gravity</span></a>
      <div className="current-focus"><span>Current focus</span><strong data-testid="current-focus">{focus.name}</strong></div>
      <div className="top-actions"><button className="quiet-button" onClick={() => setStudio({})}>创建品牌形象</button><button className="quiet-button discover-button" onClick={() => setDiscovering(true)}><span aria-hidden="true">✦</span><span>Discover</span></button><button className="quiet-button" onClick={goHome} title={`Return to ${home.name}`}><Icon name="home" /><span>My Brand</span></button><button className="quiet-button" onClick={() => setResetKey(key => key + 1)}><Icon name="reset" /><span>Center Focus</span></button></div>
    </header>
    <main className="workspace">
      <GravityWorld brands={brands} focus={focus} positions={positions} relations={relationMap} selectedId={selected.id} resetKey={resetKey} onInspect={onInspect} />
      <RelationInspector focus={focus} target={selected} relation={relationMap.get(selected.id)} count={brands.length} onSetFocus={onSetFocus} characterStyle={characterStyle} onStyleChange={setCharacterStyle} onShowAtlas={() => setShowCharacters(true)} onEditCharacter={selected.character ? () => setStudio({ id: selected.id }) : undefined} />
    </main>
    {discovering ? <BrandDiscovery brands={brands} relations={relations} focus={focus} onClose={() => setDiscovering(false)} onExplore={id => { setSelectedId(id); setDiscovering(false); setResetKey(key => key + 1); }} /> : null}
    {showCharacters ? <CharacterAtlas brands={brands} style={characterStyle} onStyleChange={setCharacterStyle} onClose={() => setShowCharacters(false)} onInspect={id => { setSelectedId(id); setShowCharacters(false); }} /> : null}
    {studio ? <CharacterStudio initial={customBrands.find(brand => brand.id === studio.id)} onClose={() => setStudio(null)} onApply={applyCharacter} /> : null}
    <span className="sr-only" role="status" aria-live="polite">Focus: {focus.name}. Selected: {selected.name}.</span>
  </div>;
}
