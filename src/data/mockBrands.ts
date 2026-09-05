import type { Brand } from '../domain/types';
import { hash } from '../domain/hash';

// The natural-language snapshot is the boundary. No hidden pair-score table.
type Fixture = [string, string, string, string, string, string, string, string, string?];
const fixtures: Fixture[] = [
  ['memory-block', 'Memory Block', 'Experimental design studio', 'Concept development, product design, visual direction and prototyping.', 'Small-batch manufacturing, material development and distribution.', 'Create experimental physical products and limited object collections.', 'Designers, collectors and creative professionals.', 'Experimental, playful, curious, independent.'],
  ['form-works', 'Form Works', 'Small manufacturer', 'Small-batch manufacturing, production engineering and prototyping.', 'Product design and visual direction.', 'Co-create experimental physical products and limited object collections.', 'Makers, designers and independent retailers.', 'Practical, curious, precise, independent.'],
  ['matter-matter', 'Matter Matter', 'Material lab', 'Material development, sustainable materials and material research.', 'Product design and prototyping.', 'Turn material research into experimental physical products.', 'Designers, makers and environmentally conscious consumers.', 'Experimental, curious, sustainable.'],
  ['still-studio', 'Still Studio', 'Experimental design studio', 'Concept development, product design, visual direction and prototyping.', 'Small-batch manufacturing, material development and distribution.', 'Create experimental physical products and limited object collections.', 'Designers, collectors and creative professionals.', 'Experimental, playful, curious, independent.'],
  ['clay-county', 'Clay County', 'Traditional craft brand', 'Traditional craft, ceramics and cultural storytelling.', 'AI technology, digital interaction and distribution.', 'Build digital experiences and cultural exhibitions that reinterpret craft.', 'Collectors, culture lovers and craftspeople.', 'Traditional, careful, tactile, curious.'],
  ['latent-lab', 'Latent Lab', 'AI technology company', 'AI technology, software development and digital interaction.', 'Traditional craft and cultural storytelling.', 'Build digital experiences and cultural exhibitions connecting craft with AI.', 'Technologists, digital creatives and curious learners.', 'Futuristic, experimental, curious.'],
  ['fold-supply', 'Fold Supply', 'Packaging manufacturer', 'Packaging, small-batch manufacturing and sustainable materials.', 'Product design and visual direction.', 'Create experimental physical products with reusable packaging.', 'Independent retailers, makers and designers.', 'Precise, sustainable, playful.'],
  ['common-objects', 'Common Objects', 'Furniture brand', 'Small-batch manufacturing, furniture production and distribution.', 'Material development and product design.', 'Create limited physical products for everyday spaces.', 'Designers, home enthusiasts and collectors.', 'Tactile, warm, independent, curious.'],
  ['circuit-house', 'Circuit House', 'Large consumer electronics brand', 'Electronics, production engineering, manufacturing and distribution.', 'Product design, visual direction and cultural storytelling.', 'Prototype experimental physical products and playful digital experiences.', 'Technologists, designers and home enthusiasts.', 'Futuristic, playful, curious.'],
  ['open-room', 'Open Room', 'Retail space', 'Retail space, distribution and community building.', 'Product design, cultural storytelling and event production.', 'Host pop-up retail experiences and cultural exhibitions.', 'Designers, local communities and culture lovers.', 'Open, independent, curious.'],
  ['field-museum', 'Field Museum', 'Museum', 'Cultural storytelling, exhibition curation and retail space.', 'Digital interaction, spatial design and event production.', 'Create cultural exhibitions and digital experiences for new audiences.', 'Culture lovers, students and families.', 'Thoughtful, traditional, open.'],
  ['afterhours-press', 'Afterhours Press', 'Independent publisher', 'Content production, publishing and cultural storytelling.', 'Distribution and visual direction.', 'Publish editorial content and cultural projects with emerging voices.', 'Designers, readers and culture lovers.', 'Independent, experimental, thoughtful.'],
  ['signal-paper', 'Signal Paper', 'Media brand', 'Content production, publishing and distribution.', 'Cultural storytelling and visual direction.', 'Produce editorial content and campaigns about creative work.', 'Readers, digital creatives and designers.', 'Open, curious, playful.'],
  ['moss-tea', 'Moss Tea', 'Tea brand', 'Food development, tea sourcing and cultural storytelling.', 'Packaging, spatial design and event production.', 'Create food rituals and pop-up retail experiences.', 'Food lovers, culture lovers and local communities.', 'Traditional, tactile, thoughtful.'],
  ['daybreak-coffee', 'Daybreak Coffee', 'Coffee brand', 'Food development, coffee roasting and community building.', 'Packaging, content production and retail space.', 'Build food experiences and pop-up retail gatherings.', 'Food lovers, local communities and creative professionals.', 'Warm, independent, playful.'],
  ['soft-measure', 'Soft Measure', 'Fashion brand', 'Textile development, traditional craft and visual direction.', 'Material development and distribution.', 'Develop experimental physical products through limited wearable collections.', 'Fashion enthusiasts, designers and collectors.', 'Tactile, experimental, sustainable.'],
  ['strata-studio', 'Strata Studio', 'Spatial design studio', 'Spatial design, exhibition curation and prototyping.', 'Material development and manufacturing.', 'Create cultural exhibitions and pop-up retail spaces.', 'Designers, culture lovers and home enthusiasts.', 'Precise, experimental, thoughtful.'],
  ['little-myth', 'Little Myth', 'Cultural IP', 'Cultural storytelling, visual direction and content production.', 'Digital interaction, manufacturing and distribution.', 'Create playful digital experiences and cultural exhibitions around folklore.', 'Families, digital creatives and culture lovers.', 'Traditional, playful, curious.'],
  ['neighbourhood', 'Neighbourhood', 'Community brand', 'Community building, event production and cultural storytelling.', 'Retail space and content production.', 'Host pop-up retail gatherings and cultural projects.', 'Local communities, culture lovers and families.', 'Warm, open, independent.'],
  ['hearth-foods', 'Hearth Foods', 'Food brand', 'Food development, traditional craft and food sourcing.', 'Packaging and distribution.', 'Create food experiences through seasonal tasting menus.', 'Food lovers, families and local communities.', 'Traditional, warm, sustainable.'],
  ['tiny-assembly', 'Tiny Assembly', 'Experimental event studio', 'Event production, digital interaction and spatial design.', 'Retail space and cultural storytelling.', 'Create digital experiences and cultural exhibitions.', 'Digital creatives, culture lovers and technologists.', 'Experimental, playful, open.'],
  ['loop-fibre', 'Loop Fibre', 'Textile lab', 'Textile development, sustainable materials and material development.', 'Product design and manufacturing.', 'Create experimental physical products using circular textiles.', 'Fashion enthusiasts, environmentally conscious consumers and makers.', 'Sustainable, experimental, precise.'],
  ['point-practice', 'Point Practice', 'Digital experience studio', 'Digital interaction, software development and visual direction.', 'Cultural storytelling and community building.', 'Build digital experiences and editorial content.', 'Digital creatives, technologists and designers.', 'Futuristic, playful, experimental.'],
  ['line-of-work', 'Line of Work', 'Logistics company', 'Distribution, logistics and warehousing.', 'Software development and production engineering.', 'Optimize industrial procurement and enterprise freight operations.', 'Industrial buyers and freight operators.', 'Practical, precise, conventional.'],
  ['bulk-union', 'Bulk Union', 'Industrial manufacturer', 'Manufacturing, production engineering and material development.', 'Product design and software development.', 'Optimize industrial procurement for large-volume commodity components.', 'Industrial buyers and procurement teams.', 'Practical, conventional, precise.', 'Only accepts industrial orders above 100000 units; no prototypes or limited editions.'],
  ['clear-ledger', 'Clear Ledger', 'Accounting service', 'Tax reporting, audit preparation and payroll.', 'Compliance training and bookkeeping automation.', 'Improve tax compliance and statutory financial reporting.', 'Accountants and finance departments.', 'Conventional, formal, risk-averse.'],
  ['wild-north', 'Wild North', 'Outdoor community', 'Community building, event production and content production.', 'Textile development and distribution.', 'Host outdoor adventures and wilderness expeditions.', 'Hikers, outdoor athletes and nature lovers.', 'Adventurous, sustainable, independent.'],
  ['quiet-type', 'Quiet Type', 'Sound studio', 'Sound design, content production and digital interaction.', 'Spatial design and cultural storytelling.', 'Create cultural exhibitions and experimental digital experiences through sound.', 'Culture lovers, digital creatives and musicians.', 'Experimental, thoughtful, curious.'],
];

const alternateIntents: Record<string, string> = {
  'form-works': 'Develop pop-up retail installations and cultural exhibitions with small-batch manufacturing.',
  'matter-matter': 'Publish editorial content about material research and circular production.',
  'moss-tea': 'Create experimental physical products for contemporary tea rituals.',
  'daybreak-coffee': 'Create limited physical products and playful coffee objects.',
  'signal-paper': 'Create digital experiences and cultural exhibitions with emerging voices.',
  'soft-measure': 'Create pop-up retail experiences and editorial content for independent fashion.',
  'common-objects': 'Build cultural exhibitions and spatial experiences about everyday furniture.',
  'open-room': 'Launch limited physical products through experimental object collections.',
};

/** New seed varies selected project briefs + character appearance, never random scores. */
export function generateMockBrands(seed = 1): Brand[] {
  return fixtures.map(([id, name, category, offers, needs, intent, audience, identity, constraints]) => ({
    id, name, category,
    summary: `${name} is a ${category.toLowerCase()} exploring new forms of collaboration.`,
    offers, needs,
    intent: seed > 1 && hash(`${seed}:${id}`) % 2 === 0 ? alternateIntents[id] ?? intent : intent,
    audience, identity,
    constraints: constraints ?? 'Open to pilots and cross-border collaboration. No size or geographic restrictions.',
    characterSeed: hash(`${seed}:${id}`),
  }));
}
