import { describe, it, expect } from 'vitest';
import { mockDataSource } from '../data/source';
import { discoverRelations } from './discovery';
describe('evidence-aware discovery', () => {
  it('shows fewer connections for a sparse profile and expands when focusing a complete brand', () => {
    const brands = mockDataSource.loadBrands(1);
    const complete = brands[0];
    const sparse = { ...complete, needs: '', intent: '', audience: '', identity: '', constraints: '' };
    const partial = discoverRelations(sparse, mockDataSource.getRelations(sparse, brands));
    const full = discoverRelations(complete, mockDataSource.getRelations(complete, brands));
    expect(partial.length).toBeLessThanOrEqual(2);
    expect(full.length).toBeGreaterThan(partial.length);
    expect(complete.needs).not.toBe('');
  });
});
