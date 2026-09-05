import { memo } from 'react';
import type { LOD, SceneNode } from '../domain/types';
import { BrandCharacter } from './BrandCharacter';
import { describeBrandCharacter } from '../engines/character';

/** Rendering boundary. Dormant means an empty position container, not hidden SVG. */
export function renderNodeLOD(node: SceneNode, lod: LOD) {
  if (lod === 'dormant') return null;
  const detailed = lod === 'full' || lod === 'simple';
  const primary = detailed ? describeBrandCharacter(node.brand).primary : undefined;
  return <>
    {node.isFocus && detailed ? <span className="focus-halo" aria-hidden="true" /> : null}
    <BrandCharacter brand={node.brand} lod={lod} />
    {detailed ? <span className="brand-name">{node.brand.name}</span> : null}
    {detailed ? <span className="node-capability">{primary?.label ?? 'Capability not specified'}</span> : null}
    {node.isFocus && detailed ? <span className="brand-meta focus-label">CURRENT FOCUS</span> : lod === 'full' ? <span className="brand-meta"><strong>{node.fit}</strong><span> /100</span></span> : null}
  </>;
}

export const BrandNode = memo(function BrandNode({ node, lod, selected, onSelect }: {
  node: SceneNode; lod: LOD; selected: boolean; onSelect: (id: string) => void;
}) {
  const { brand, position, isFocus } = node;
  const primary = describeBrandCharacter(brand).primary?.label ?? 'capability not specified';
  return <div className="brand-position" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    data-node-id={brand.id} data-x={position.x} data-y={position.y} data-lod={lod} data-fit={node.fit} data-focus={isFocus}>
    {lod === 'dormant' ? null : <button className={`brand-node lod-${lod} ${isFocus ? 'is-focus' : ''} ${selected ? 'is-selected' : ''}`}
      data-brand-id={brand.id}
      aria-label={isFocus ? `${brand.name}, ${primary}, current focus. Inspect` : `${brand.name}, ${primary}, ${node.fit} collaboration fit. Inspect`}
      aria-pressed={selected}
      onClick={event => { if (event.detail === 0) onSelect(brand.id); }}>
      {renderNodeLOD(node, lod)}
    </button>}
  </div>;
});
