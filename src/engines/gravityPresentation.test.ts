import { describe, it, expect } from 'vitest';
import { gravityPresentationScale } from './gravityPresentation';
import { calculateGravityPositions } from './gravity';
import { mockDataSource } from '../data/source';

describe('gravity presentation density', () => {
  it('brings sparse, distant partners into the initial canvas without changing raw placement', () => {
    const positions = [{brandId:'a',x:0,y:1200,radius:1200},{brandId:'b',x:0,y:-1800,radius:1800}];
    const before = structuredClone(positions);
    for (const size of [{width:940,height:650},{width:390,height:590}]) {
      const scale = gravityPresentationScale(positions,size);
      const zoom = size.width < 640 ? .62 : .8;
      expect(1800*scale*zoom).toBeLessThanOrEqual(Math.min(size.width,size.height)*(size.width <= 640 ? .47 : .33));
      expect(scale).toBeGreaterThan(0);
    }
    expect(positions).toEqual(before);
  });
  it('preserves ranking and direction for the full fixture population', () => {
    const brands = mockDataSource.loadBrands(1);
    const positions = calculateGravityPositions(brands[0].id,mockDataSource.getRelations(brands[0],brands));
    const scale = gravityPresentationScale(positions,{width:940,height:650});
    const sorted = [...positions].sort((a,b)=>a.radius-b.radius);
    for (let i=1;i<sorted.length;i++) expect(sorted[i].radius*scale).toBeGreaterThanOrEqual(sorted[i-1].radius*scale);
    for (const p of positions) expect(Math.atan2(p.y*scale,p.x*scale)).toBeCloseTo(Math.atan2(p.y,p.x));
    expect(gravityPresentationScale([],{width:390,height:590})).toBe(1);
  });
});
