import { memo, useMemo } from 'react';
import type { Brand, LOD, RelationResult, SceneNode, SpatialPosition } from '../domain/types';
import { GRAVITY_BANDS, VIEW_CONFIG } from '../config';
import { fitToDistance } from '../engines/gravity';
import { updateVisibleNodes } from '../engines/viewport';
import { useViewport } from '../hooks/useViewport';
import { BrandNode } from './BrandNode';
import { Icon } from './Icon';

interface Props {
  brands: readonly Brand[];
  focus: Brand;
  positions: readonly SpatialPosition[];
  relations: ReadonlyMap<string, RelationResult>;
  selectedId: string;
  resetKey: number;
  onInspect: (id: string) => void;
}
const DETAIL_LEVELS: LOD[] = ['full', 'simple', 'marker', 'dormant'];

export const GravityWorld = memo(function GravityWorld({ brands, focus, positions, relations, selectedId, resetKey, onInspect }: Props) {
  const { canvasRef, worldRef, view, size, dragging, zoom, handlers } = useViewport(resetKey, onInspect);
  const nodes = useMemo<SceneNode[]>(() => {
    const positionMap = new Map(positions.map(position => [position.brandId, position]));
    return brands.map(brand => ({
      brand,
      position: positionMap.get(brand.id) ?? { brandId: brand.id, x: 0, y: 0, radius: 0 },
      fit: relations.get(brand.id)?.collaborationFit ?? 100,
      isFocus: brand.id === focus.id,
    }));
  }, [brands, focus.id, positions, relations]);
  const nodeLOD = useMemo(() => updateVisibleNodes(nodes, view, size), [nodes, view, size]);
  const counts: Record<LOD, number> = { full: 0, simple: 0, marker: 0, dormant: 0 };
  for (const lod of nodeLOD.values()) counts[lod]++;
  const selectedPosition = positions.find(position => position.brandId === selectedId);
  const showConnection = selectedId !== focus.id && nodeLOD.get(selectedId) !== 'dormant' && selectedPosition;

  return <section className={`canvas-shell ${dragging ? 'is-dragging' : ''}`} aria-label="Brand gravity world" data-world-width={VIEW_CONFIG.worldWidth} data-world-height={VIEW_CONFIG.worldHeight}>
    <div className="canvas-intro"><h1>A world of possible collaborations.</h1><p>Closer means more potential. Not more alike.</p></div>
    <div ref={canvasRef} className="canvas" data-testid="canvas" {...handlers}>
      <div ref={worldRef} className="world" data-testid="world">
        <div className="axes" aria-hidden="true" />
        {[GRAVITY_BANDS.near, GRAVITY_BANDS.mid, 20].map((fit, index) => <div className={`orbit orbit-${index}`} key={fit} style={{ width: fitToDistance(fit) * 2, height: fitToDistance(fit) * 2 }} aria-hidden="true" />)}
        <div key={`${focus.id}-${resetKey}`} className="gravity-arrival" aria-hidden="true" />
        {showConnection ? <svg className="gravity-connection" width={VIEW_CONFIG.worldWidth} height={VIEW_CONFIG.worldHeight} viewBox={`${-VIEW_CONFIG.worldWidth / 2} ${-VIEW_CONFIG.worldHeight / 2} ${VIEW_CONFIG.worldWidth} ${VIEW_CONFIG.worldHeight}`} style={{ left: -VIEW_CONFIG.worldWidth / 2, top: -VIEW_CONFIG.worldHeight / 2 }} aria-hidden="true">
          <path key={`${focus.id}-${selectedId}`} d={`M0 0 Q${selectedPosition.x * .5 - selectedPosition.y * .12} ${selectedPosition.y * .5 + selectedPosition.x * .12} ${selectedPosition.x} ${selectedPosition.y}`} pathLength="1" />
        </svg> : null}
        {nodes.map(node => <BrandNode key={node.brand.id} node={node} lod={nodeLOD.get(node.brand.id)!} selected={selectedId === node.brand.id} onSelect={onInspect} />)}
      </div>
    </div>
    <div className="canvas-bottom">
      <div className="field-key" aria-label="Viewport detail levels">
        {DETAIL_LEVELS.map(lod => <div key={lod}><i className={`key-dot ${lod}`} /><strong>{lod}</strong><span data-testid={`count-${lod}`}>{counts[lod]}</span></div>)}
        <p>Drag to explore · Scroll to zoom<br />Click a brand to inspect</p>
      </div>
      <div className="zoom-controls" data-no-pan><button aria-label="Zoom out" disabled={view.zoom <= VIEW_CONFIG.minZoom} onClick={() => zoom(1 / VIEW_CONFIG.zoomStep)}><Icon name="minus" /></button><output aria-label="Zoom level">{Math.round(view.zoom * 100)}%</output><button aria-label="Zoom in" disabled={view.zoom >= VIEW_CONFIG.maxZoom} onClick={() => zoom(VIEW_CONFIG.zoomStep)}><Icon name="plus" /></button></div>
      <span className="canvas-note">{brands.length} BRANDS · EXPLORE BEYOND THE VIEW</span>
    </div>
  </section>;
});
