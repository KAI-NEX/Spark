import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { generateMockBrands } from '../data/mockBrands';
import { BrandCharacter } from '../components/BrandCharacter';
import { describeBrandCharacter, extractCapabilities, CHARACTER_PALETTES } from './character';
import { calculateMockRelation } from './relation';

const brands = generateMockBrands();
const brand = (id: string) => brands.find(item => item.id === id)!;

describe('Evidence-based character capabilities', () => {
  it('distinguishes design, manufacturing, materials and logistics without borrowing needs', () => {
    const expected = { 'memory-block': 'design', 'form-works': 'manufacturing', 'matter-matter': 'materials', 'fold-supply': 'packaging', 'line-of-work': 'distribution', 'clear-ledger': 'finance', 'quiet-type': 'sound', 'clay-county': 'craft' };
    for (const [id, primary] of Object.entries(expected)) expect(describeBrandCharacter(brand(id)).primary?.id).toBe(primary);
    const model = describeBrandCharacter(brand('memory-block'));
    expect(model.capabilities.map(item => item.id)).not.toContain('manufacturing');
    expect(model.needs.map(item => item.id)).toContain('manufacturing');
  });
  it('returns no invented tool for missing, unsupported, negated or aspirational capabilities', () => {
    for (const offers of ['', 'Consulting.', 'No manufacturing and logistics.', 'We are looking for product design.', 'We plan software development.', '不提供制造和物流。']) {
      expect(extractCapabilities(offers), offers).toEqual([]);
    }
    expect(extractCapabilities('No manufacturing, but product design.').map(item => item.id)).toEqual(['design']);
    expect(extractCapabilities('Redistribution analysis. Manufacturingly.')).toEqual([]);
    expect(describeBrandCharacter({ ...brand('memory-block'), offers: '' }).primary).toBeUndefined();
  });
  it('keeps source phrases and handles capitalization, Chinese and repeated matches', () => {
    expect(extractCapabilities('PRODUCT DESIGN, Product design.')).toEqual([{ id: 'design', label: 'Design', evidence: 'PRODUCT DESIGN' }]);
    expect(extractCapabilities('材料研发，陶瓷，软件开发。').map(item => item.id)).toEqual(['materials', 'craft', 'technology']);
    for (const item of brands) {
      const model = describeBrandCharacter(item);
      expect(model.primary, item.name).toBeDefined();
      for (const capability of model.capabilities) expect(item.offers).toContain(capability.evidence);
    }
  });
  it('preserves the visual identity and actual capabilities across focus, seed and need changes', () => {
    const source = brand('memory-block');
    const original = describeBrandCharacter(source);
    const changed = describeBrandCharacter({ ...source, characterSeed: -999, needs: 'Manufacturing and logistics.', intent: 'Become a finance company.' });
    expect(changed.palette).toEqual(original.palette);
    expect(changed.capabilities).toEqual(original.capabilities);
    for (const item of brands) expect(CHARACTER_PALETTES).toContain(describeBrandCharacter(item).palette);
    expect(calculateMockRelation(source, brand('form-works'))).toEqual(calculateMockRelation({ ...source, characterSeed: 999999 }, brand('form-works')));
  });
  it('unmounts dormant artwork, uses one span at marker LOD and removes texture at simple LOD', () => {
    const render = (lod: 'full' | 'simple' | 'marker' | 'dormant') => renderToStaticMarkup(createElement(BrandCharacter, { brand: brands[0], lod }));
    expect(render('dormant')).toBe('');
    expect(render('marker')).not.toContain('<svg');
    expect(render('marker').match(/<span/g)).toHaveLength(1);
    expect(render('simple')).not.toContain('<pattern');
    expect(render('full')).toContain('<pattern');
    expect(render('simple').length).toBeLessThan(render('full').length);
    for (const lod of ['full', 'simple'] as const) {
      expect(render(lod)).toContain('data-capability="design"');
      expect(render(lod)).not.toMatch(/<filter|<image|<foreignObject|<animate/);
    }
  });
});
