import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Brand, RelationResult } from '../domain/types';
import { BrandCharacter } from './BrandCharacter';
import { Icon } from './Icon';

export function shuffleBrands(brands: readonly Brand[], ownId: string): Brand[] {
  const pool = brands.filter(brand => brand.id !== ownId);
  for (let i = pool.length - 1; i > 0; i--) { const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296; const j = Math.floor(random * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, 3);
}

export function DrawPage({ brands, home, relations, onChoose, onClose }: { brands: readonly Brand[]; home: Brand; relations: ReadonlyMap<string, RelationResult>; onChoose: (id: string) => void; onClose: () => void }) {
  const [deck, setDeck] = useState(() => shuffleBrands(brands, home.id));
  const [selected, setSelected] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const [round, setRound] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const chosen = deck.find(brand => brand.id === selected);
  const relation = selected ? relations.get(selected) : undefined;
  const reveal = (id: string) => { if (closing || selected === id) return; setSelected(id); };
  useLayoutEffect(() => {
    if (!selected || !dialog.current) return;
    const modal = dialog.current;
    if (!modal.open) modal.showModal();
    const source = cardRefs.current.get(selected)?.getBoundingClientRect();
    const target = modal.getBoundingClientRect();
    if (source) {
      modal.style.setProperty('--card-dx', `${source.x + source.width / 2 - target.x - target.width / 2}px`);
      modal.style.setProperty('--card-dy', `${source.y + source.height / 2 - target.y - target.height / 2}px`);
      modal.style.setProperty('--card-sx', String(source.width / target.width));
      modal.style.setProperty('--card-sy', String(source.height / target.height));
    }
  }, [selected]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const dismiss = () => {
    if (closing) return;
    const motion=dialog.current?.querySelector<HTMLElement>('.draw-dialog-motion');
    if(motion) motion.style.setProperty('--close-transform',getComputedStyle(motion).transform);
    setClosing(true);
    closeTimer.current = setTimeout(() => { dialog.current?.close(); setSelected(null); setClosing(false); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 560);
  };
  return <main className="draw-page" aria-label="抽卡匹配页面">
    <button className="page-close" onClick={onClose} aria-label="退出抽卡"><Icon name="close" /></button>
    <div className="draw-heading"><h1>下一位伙伴，会是谁？</h1><p>每张都可以翻开，慢慢找到你的伙伴。</p></div>
    <div className="draw-table" key={round}>
      {deck.map((brand, index) => <button key={brand.id} style={{ '--deal-index': index } as CSSProperties} ref={element => { if (element) cardRefs.current.set(brand.id, element); else cardRefs.current.delete(brand.id); }} className={`draw-card ${selected === brand.id ? 'is-revealing' : ''}`} onClick={() => reveal(brand.id)} aria-label={`翻开第 ${index + 1} 张卡`}>
        <span className="draw-card-body"><span className="draw-face draw-back" aria-hidden="true"><span className="draw-card-number">0{index + 1} / POSSIBILITY</span><BrandCharacter brand={brand} /><span className="draw-card-caption">有趣的相遇，等你翻开。</span></span>
        <span className="draw-face draw-front" aria-hidden="true"><span className="draw-card-number">BRAND / 0{index + 1}</span><strong>{brand.name}</strong><span>{brand.category}</span><span className="draw-front-summary">{brand.summary}</span><span>查看品牌资料 ↗</span></span></span>
      </button>)}
    </div>
    <p className="draw-prompt" role="status">{selected ? '正在翻开品牌资料…' : deck.length ? '每张都能翻开，关闭后回到角色面。' : '还没有可抽取的伙伴。'}</p>
    <button className="flow-secondary draw-again" onClick={() => { setDeck(shuffleBrands(brands, home.id)); setSelected(null); setRound(value => value + 1); }}>重新洗牌</button>
    <p className="draw-note">随机探索 · 评价仅供参考</p>
    <dialog ref={dialog} className={`draw-dialog ${closing ? 'is-closing' : ''}`} aria-labelledby="draw-dialog-title" onCancel={event => { event.preventDefault(); dismiss(); }} onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
      {chosen ? <div className="draw-dialog-motion" key={chosen.id}><div className="draw-dialog-back" aria-hidden="true"><span>YOUR NEXT CONNECTION</span><BrandCharacter brand={chosen} /><span>有趣的相遇，等你翻开。</span></div><div className="draw-dialog-content">
        <button className="page-close" autoFocus onClick={dismiss} aria-label="关闭卡牌详情"><Icon name="close" /></button>
        <nav className="draw-dialog-deck" aria-label="切换卡牌">{deck.map((brand, index) => <button key={brand.id} aria-label={`查看第 ${index + 1} 张卡`} aria-pressed={selected === brand.id} onClick={() => reveal(brand.id)}>0{index + 1}<small>{selected === brand.id ? brand.name : '翻开看看'}</small></button>)}</nav>
        <div className="draw-dialog-scroll"><p className="mono">YOUR NEXT CONNECTION</p><h2 id="draw-dialog-title">{chosen.name}</h2><p>{chosen.category}</p><p className="draw-dialog-score">{relation ? `${relation.collaborationFit} / 100 · 智能评价` : '资料待补充'}</p>
        <dl>{([['品牌介绍', chosen.summary], ['已有能力', chosen.offers], ['寻找什么', chosen.needs], ['联名目标', chosen.intent], ['目标消费者', chosen.audience], ['品牌气质', chosen.identity], ['合作边界', chosen.constraints], ['案例与依据', chosen.supportingEvidence], ['合作可能', relation?.reason]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '待补充'}</dd></div>)}</dl></div>
        <button className="flow-primary" onClick={() => { dialog.current?.close(); onChoose(chosen.id); }}>选择这个伙伴<Icon name="arrow" /></button>
      </div></div> : null}
    </dialog>
  </main>;
}
