import type { Brand, Dimension, RelationResult } from '../domain/types';
import { RELATION_WEIGHTS } from '../config';
import { missingMatchingFields } from '../domain/brandIntake';
import { Icon } from './Icon';
const DIMENSIONS: [Dimension, string][] = [
  ['intentFit', 'Intent fit'], ['complementarity', 'Complementarity'],
  ['audienceExpansion', 'Audience expansion'], ['chemistry', 'Chemistry'], ['feasibility', 'Feasibility'],
];
export function RelationInspector({ focus, target, relation, count, onMatch }: {
  focus: Brand; target: Brand; relation?: RelationResult; count: number;
  onMatch?: () => void;
}) {
  const limited = missingMatchingFields(focus).length > 0 || missingMatchingFields(target).length > 0;
  const isCurrent = target.id === focus.id;
  return <aside className="inspector" aria-label="Relation explorer" data-selected-id={target.id}>
    <div className="inspector-content">
      <p className="mono inspector-label">SMART EVALUATION</p>
      <div className="relation-pair">{!isCurrent ? <><span>{focus.name}</span><Icon name="arrow" /></> : null}<strong>{target.name}</strong></div>
      {relation ? <>
        <div className="fit-score" data-testid="fit-score"><strong>{relation.collaborationFit}</strong><span>/100</span></div>
        <p className="score-caption">{relation.exploratory ? '探索线索 · 尚待验证 · 基线参考' : limited ? '资料待补充 · 基线参考' : '智能合作评价'}</p>
        <p className="relation-type">{relation.exploratory ? '先认识，再判断' : relation.relationType}</p>
        <section className="explanation compact-summary"><h2>品牌概括</h2><p>{target.summary}</p></section>
        <section className="explanation compact-summary"><h2>关系判断</h2><p>{relation.reason}</p></section>
        <div className="dimensions" aria-label="Collaboration fit dimensions">
          {DIMENSIONS.map(([key, label]) => <div className="dimension" key={key} title={`${label}: ${relation[key]}/100 · ${RELATION_WEIGHTS[key] * 100}% weight`}><span>{label}</span><meter min="0" max="100" value={relation[key]} aria-label={label} /><span className="dimension-value">{relation[key]}</span></div>)}
        </div>
        {onMatch ? <button className="flow-primary inspector-match" onClick={onMatch}>选择这个伙伴<Icon name="arrow" /></button> : null}
      </> : <section className="explanation"><h2>{onMatch ? '已聚焦这个伙伴' : '当前品牌'}</h2><p>{target.summary}</p>{onMatch ? <button className="flow-primary inspector-match" onClick={onMatch}>选择这个伙伴<Icon name="arrow" /></button> : null}</section>}
    </div>
    <p className="world-meta mono">Demo world · {count} brands · Illustrative relation scores</p>
  </aside>;
}
