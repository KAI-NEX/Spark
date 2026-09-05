import { describe, expect, it } from 'vitest';
import { generateMockBrands } from '../data/mockBrands';
import { mockDataSource } from '../data/source';
import type { LOD, SceneNode } from '../domain/types';
import { calculateGravityPositions } from './gravity';
import { calculateViewportLOD, constrainViewport, getNodeScreenPosition, getViewportBounds, updateVisibleNodes } from './viewport';

const view = { x: 0, y: 0, zoom: 0.8 };
const size = { width: 1171, height: 938 };
const center = { x: size.width / 2, y: size.height / 2 };
const lodRank: Record<LOD, number> = { full: 0, blurred: 1, simple: 1, portrait: 2, signature: 3, marker: 4, dormant: 5 };

describe('Viewport-driven LOD', () => {
  it('converts between world bounds and screen coordinates', () => {
    const camera = { x: 120, y: -80, zoom: 1.2 };
    const bounds = getViewportBounds(camera, size);
    const topLeft = getNodeScreenPosition({ x: bounds.left, y: bounds.top }, camera, size);
    expect(topLeft.x).toBeCloseTo(0); expect(topLeft.y).toBeCloseTo(0);
    const bottomRight = getNodeScreenPosition({ x: bounds.right, y: bounds.bottom }, camera, size);
    expect(bottomRight.x).toBeCloseTo(size.width); expect(bottomRight.y).toBeCloseTo(size.height);
  });
  it('downgrades high-fit nodes and even the focus when they leave the viewport', () => {
    for (const isFocus of [true, false]) {
      expect(calculateViewportLOD(center, 95, view, size, isFocus)).toBe('blurred');
      expect(calculateViewportLOD({ x: 5, y: 300 }, 95, view, size, isFocus)).toBe('marker');
      expect(calculateViewportLOD({ x: -100, y: 300 }, 95, view, size, isFocus)).toBe('marker');
      expect(calculateViewportLOD({ x: -300, y: 300 }, 95, view, size, isFocus)).toBe('dormant');
    }
  });
  it('wakes a low-fit node when exploring its region, without modifying its gravity position', () => {
    const position = { x: 1400, y: 200 };
    expect(calculateViewportLOD(getNodeScreenPosition(position, view, size), 22, view, size)).toBe('dormant');
    const camera = { ...view, x: -position.x * view.zoom, y: -position.y * view.zoom };
    expect(calculateViewportLOD(getNodeScreenPosition(position, camera, size), 22, camera, size)).toBe('blurred');
    const zoomed = { x: -position.x * 1.2, y: -position.y * 1.2, zoom: 1.2 };
    expect(calculateViewportLOD(getNodeScreenPosition(position, zoomed, size), 22, zoomed, size)).toBe('full');
    expect(position).toEqual({ x: 1400, y: 200 });
  });
  it('does not render detailed labels underneath the existing canvas controls', () => {
    const occludedSize = { ...size, occlusions: [{ left: center.x - 30, right: center.x + 30, top: center.y - 30, bottom: center.y + 30 }] };
    expect(calculateViewportLOD(center, 95, view, occludedSize)).toBe('marker');
    expect(calculateViewportLOD(center, 95, view, size)).toBe('blurred');
  });
  it('zooming out limits detail even when all brands fit on screen', () => {
    for (const fit of [0, 22, 50, 72, 95, 100]) {
      expect(calculateViewportLOD(center, fit, { ...view, zoom: 0.35 }, size)).toBe('marker');
      const detailed = calculateViewportLOD(center, fit, { ...view, zoom: 1.2 }, size);
      expect(lodRank[detailed]).toBeLessThan(2);
    }
  });
  it('opens a partial world, then trades old detail for newly visible nodes', () => {
    const brands = generateMockBrands();
    const relations = mockDataSource.getRelations(brands[0], brands);
    const positions = calculateGravityPositions(brands[0].id, relations);
    const nodes: SceneNode[] = brands.map(brand => ({ brand,
      position: positions.find(position => position.brandId === brand.id) ?? { brandId: brand.id, x: 0, y: 0, radius: 0 },
      fit: relations.find(relation => relation.targetBrandId === brand.id)?.collaborationFit ?? 100,
      isFocus: brand.id === brands[0].id,
    }));
    const before = JSON.stringify(nodes);
    const initial = updateVisibleNodes(nodes, view, size);
    const primary = [...initial.values()].filter(lod => lod === 'full' || lod === 'blurred' || lod === 'portrait');
    expect(primary.length).toBeGreaterThanOrEqual(8);
    expect(primary.length).toBeLessThan(nodes.length);
    expect([...initial.values()].filter(lod => lod === 'full' || lod === 'blurred').length).toBeLessThanOrEqual(15);
    expect([...initial.values()]).toContain('dormant');
    const farNode = nodes.find(node => initial.get(node.brand.id) === 'dormant')!;
    const explored = updateVisibleNodes(nodes, { ...view, x: -farNode.position.x * view.zoom, y: -farNode.position.y * view.zoom }, size);
    expect(['portrait', 'blurred', 'full']).toContain(explored.get(farNode.brand.id));
    expect(lodRank[explored.get(brands[0].id)!]).toBeGreaterThan(lodRank[initial.get(brands[0].id)!]);
    expect(JSON.stringify(nodes)).toBe(before);
  });
  it('exposes every intermediate stage in both zoom directions regardless of fit or focus', () => {
    const stages = [[0.35, 'marker'], [0.48, 'portrait'], [0.9, 'blurred'], [1.2, 'full']] as const;
    for (const fit of [0, 30, 100]) for (const focus of [false, true]) {
      for (const [zoom, expected] of [...stages, ...[...stages].reverse()]) {
        expect(calculateViewportLOD(center, fit, { ...view, zoom }, size, focus)).toBe(expected);
      }
    }
  });
  it('keeps low detail in sparse worlds and never mutates source nodes', () => {
    const brand = generateMockBrands()[0];
    const nodes: SceneNode[] = [{ brand, isFocus: true, fit: 100, position: {brandId: brand.id, x: 0, y: 0, radius: 0} }];
    expect(updateVisibleNodes(nodes, {...view, zoom: 0.48}, size).get(brand.id)).toBe('portrait');
    expect(updateVisibleNodes(nodes, {...view, zoom: 0.66}, size).get(brand.id)).toBe('portrait');
    expect(nodes[0].fit).toBe(100);
  });
  it('allows broad exploration, while limiting travel beyond the finite virtual world', () => {
    expect(constrainViewport({ ...view, x: 800, y: -600 }, size)).toEqual({ ...view, x: 800, y: -600 });
    const constrained = constrainViewport({ ...view, x: 99999, y: -99999 }, size);
    expect(constrained.x).toBeGreaterThan(size.width / 2);
    expect(constrained.x).toBeLessThan(2000);
    expect(constrained.y).toBeGreaterThan(-2000);
  });
});
