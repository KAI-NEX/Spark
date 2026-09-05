import { useEffect, useState } from 'react';
import type { Brand } from '../domain/types';
import { BrandCharacter } from './BrandCharacter';
import { Icon } from './Icon';

export function CharacterEntry({ brands, example, onCreate }: { brands: readonly Brand[]; example: Brand; onCreate: () => void }) {
  const possibilities = brands.filter(brand => brand.id !== example.id).slice(0, 9);
  const [index, setIndex] = useState(0);
  const mystery = possibilities[index % Math.max(1, possibilities.length)] ?? example;
  useEffect(() => {
    if (possibilities.length < 2) return;
    const timer = window.setInterval(() => setIndex(value => value + 1), 2200);
    return () => window.clearInterval(timer);
  }, [possibilities.length]);
  return <main className="character-entry">
    <section className="entry-copy">
      <h1>让你的品牌<br />遇见新的可能。</h1>
      <p className="entry-subtitle">先让我们理解你的品牌，再开始寻找联名伙伴。</p>
      <div className="entry-actions">
        <button className="brand-info-entry" type="button" onClick={onCreate}><Icon name="upload" /><span><strong>上传你的品牌信息</strong><small>自动生成专属角色</small></span><Icon name="arrow" /></button>
      </div>
    </section>
    <section className="entry-stage mystery-stage" aria-label="正在出现的品牌角色">
      <div className="entry-avatar mystery-character" key={`${mystery.id}-${index}`}><BrandCharacter brand={mystery} /></div>
      <span className="mystery-mark" aria-hidden="true">?</span>
      <div className="entry-avatar-caption" role="status"><strong>下一个遇见的，会是谁？</strong><span>未确定的品牌正在经过。</span></div>
    </section>
    <footer className="entry-footer"><span>01 / 品牌理解</span><span>品牌 → 角色 → 匹配 → 合作</span><a href="?view=lab">形象实验室 ↗</a></footer>
  </main>;
}
