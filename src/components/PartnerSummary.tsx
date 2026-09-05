import type { Brand, Dimension, RelationResult } from '../domain/types';
import { BrandCharacter } from './BrandCharacter';
import { Icon } from './Icon';

const DIMENSIONS: [Dimension, string][] = [['intentFit', '目标契合'], ['complementarity', '能力互补'], ['audienceExpansion', '受众拓展'], ['chemistry', '创意化学反应'], ['feasibility', '落地可行性']];
export function PartnerSummary({ brand, relation, isOwner, onChoose }: { brand: Brand; relation?: RelationResult; isOwner: boolean; onChoose: () => void }) {
  return <aside className="inspector brief-inspector" aria-label="伙伴简评"><div className="inspector-content"><div className="summary-avatar"><BrandCharacter brand={brand} /></div><h1>{brand.name}</h1><p className="summary-description">{brand.summary}</p>{relation ? <><div className="fit-score" data-testid="fit-score"><strong>{relation.collaborationFit}</strong><span>/100</span></div><p className="score-caption">智能评价 · 演示评分</p><div className="dimensions">{DIMENSIONS.map(([key, label]) => <div className="dimension" key={key}><span>{label}</span><meter min={0} max={100} value={relation[key]} aria-label={label} /><span>{relation[key]}</span></div>)}</div><p className="summary-evaluation">{relation.reason}</p></> : <p className="summary-evaluation">{isOwner ? '从关系场中选一位伙伴。' : '以你的品牌为参照查看合作可能。'}</p>}{!isOwner ? <button className="flow-primary" onClick={onChoose}>选择伙伴<Icon name="arrow" /></button> : null}</div></aside>;
}
