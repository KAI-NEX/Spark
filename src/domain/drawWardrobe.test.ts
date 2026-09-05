import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { drawWearable } from './drawWardrobe';
import { brandWearable } from './wearables';
import { generateMockBrands } from '../data/mockBrands';
import { labBrands } from '../data/avatarLab';

describe('draw concept wardrobe', () => {
  it('offers multiple stable looks with real local files, without changing brand information', () => {
    const brands=generateMockBrands();
    const before=structuredClone(brands);
    const looks=brands.map(drawWearable);
    expect(new Set(looks.map(look=>look.url)).size).toBe(6);
    for(const look of looks) expect(existsSync(`public${look.url}`)).toBe(true);
    expect(brands).toEqual(before);
    for(const brand of labBrands.slice(1)) expect(drawWearable(brand).url).not.toBe(brand.avatarDataUrl);
  });
  it('does not invent wardrobe evidence for user-uploaded brands', () => {
    const brand={...generateMockBrands()[0],id:'company-test',offers:'服务设计'};
    expect(drawWearable(brand)).toEqual(brandWearable(brand));
  });
});
