import { useEffect, useMemo, useState } from 'react';
import type { Brand } from '../domain/types';
import { WearableCharacter } from './WearableCharacter';
import { drawWearable } from '../domain/drawWardrobe';
import { Icon } from './Icon';

export function CharacterEntry({ brands, example, onCreate }: { brands: readonly Brand[]; example: Brand; onCreate: () => void }) {
  const possibilities = useMemo(() => [...new Map(brands.map(brand => [drawWearable(brand).url, brand])).values()], [brands]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (possibilities.length < 2) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timer = window.setInterval(() => { if (!document.hidden && !reduced.matches) setIndex(value => value + 1); }, 3200);
    return () => window.clearInterval(timer);
  }, [possibilities.length]);
  return <main className="character-entry">
    <section className="entry-copy">
      <h1>先理解你的品牌，<br />再开始寻找联名伙伴。</h1>
      <div className="entry-actions">
        <button className="brand-info-entry" type="button" onClick={onCreate}><Icon name="upload" /><span><strong>上传你的品牌信息</strong><small>自动生成专属角色</small></span><Icon name="arrow" /></button>
      </div>
    </section>
    <section className="entry-stage mystery-stage" aria-label="正在出现的品牌角色">
      <div className="entry-avatar mystery-character" aria-hidden="true">{(possibilities.length ? possibilities : [example]).map((brand, position) => <div className="mystery-variant" data-active={position === index % Math.max(1, possibilities.length)} key={brand.id}><WearableCharacter brand={brand} look={drawWearable(brand)} /></div>)}</div>
      <span className="mystery-mark" aria-hidden="true">?</span>
    </section>
    <footer className="entry-footer"><span>01 / 品牌理解</span><span>品牌 → 角色 → 匹配 → 合作</span><a href="?view=lab">形象实验室 ↗</a></footer>
  </main>;
}
