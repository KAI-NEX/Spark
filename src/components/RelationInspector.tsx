import type { Brand, Dimension, RelationResult } from '../domain/types';
import { RELATION_WEIGHTS } from '../config';
import { Icon } from './Icon';
import { CharacterPanel } from './CharacterPanel';
import type { CharacterStyle } from '../engines/character';
const DIMENSIONS: [Dimension, string][] = [
  ['intentFit', 'Intent fit'], ['complementarity', 'Complementarity'],
  ['audienceExpansion', 'Audience expansion'], ['chemistry', 'Chemistry'], ['feasibility', 'Feasibility'],
];
export function RelationInspector({ focus, target, relation, count, onSetFocus, characterStyle, onStyleChange, onShowAtlas, onEditCharacter }: {
  focus: Brand; target: Brand; relation?: RelationResult; count: number; onSetFocus: (id: string) => void;
  characterStyle: CharacterStyle; onStyleChange: (style: CharacterStyle) => void; onShowAtlas: () => void;
  onEditCharacter?: () => void;
}) {
  const isCurrent = target.id === focus.id;
  return <aside className="inspector" aria-label="Relation explorer" data-selected-id={target.id}>
    <div className="inspector-content">
      <p className="mono inspector-label">RELATION EXPLORER</p>
      <div className="relation-pair">{!isCurrent ? <><span>{focus.name}</span><Icon name="arrow" /></> : null}<strong>{target.name}</strong></div>
      <CharacterPanel brand={target} style={characterStyle} onStyleChange={onStyleChange} count={count} onShowAtlas={onShowAtlas} />
      {onEditCharacter ? <button className="character-atlas-link" onClick={onEditCharacter}>调整公司资料与形象 <span>↗</span></button> : null}
      {relation ? <>
        <div className="fit-score" data-testid="fit-score"><strong>{relation.collaborationFit}</strong><span>/100</span></div>
        <p className="score-caption">Collaboration fit</p>
        <p className="relation-type">{relation.relationType}</p>
        <section className="explanation"><h2>Why this works</h2><p>{relation.reason}</p></section>
        <div className="dimensions" aria-label="Collaboration fit dimensions">
          {DIMENSIONS.map(([key, label]) => <div className="dimension" key={key} title={`${label}: ${relation[key]}/100 · ${RELATION_WEIGHTS[key] * 100}% weight`}><span>{label}</span><meter min="0" max="100" value={relation[key]} aria-label={label} /><span className="dimension-value">{relation[key]}</span></div>)}
        </div>
        <section className="outcome"><h2>Potential outcome</h2><p>{relation.possibleOutcome}</p>{relation.caveat ? <p className="caveat"><span>Open question</span>{relation.caveat}</p> : null}</section>
      </> : <section className="explanation"><h2>Current focus</h2><p>This brand defines the current collaboration world. Select another brand to explore its relation.</p></section>}
      <button className="primary-button" disabled={isCurrent} onClick={() => onSetFocus(target.id)}>Set as Focus<Icon name="arrow" /></button>
      <details className="snapshot"><summary>Brand brief</summary><p>{target.summary}</p><dl>{(['offers', 'needs', 'intent', 'audience', 'identity', 'constraints'] as const).map(key => <div key={key}><dt>{key}</dt><dd>{target[key]}</dd></div>)}</dl></details>
    </div>
    <p className="world-meta mono">Demo world · {count} brands · Illustrative relation scores</p>
  </aside>;
}
