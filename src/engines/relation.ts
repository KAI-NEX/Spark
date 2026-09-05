import { RELATION_WEIGHTS } from '../config';
import type { Brand, Dimension, RelationResult, RelationType } from '../domain/types';
import { hash } from '../domain/hash';

type Lexicon = Record<string, readonly string[]>;
const CAPABILITIES: Lexicon = {
  design: ['product design', 'concept development', '产品设计', '概念设计'], manufacturing: ['manufacturing', 'furniture production', '生产制造', '小批量生产', '制造'],
  material: ['material development', 'sustainable materials', 'material research', '材料研发', '可持续材料'],
  prototype: ['prototyping', 'production engineering', '原型制作', '打样'], distribution: ['distribution', 'logistics', '渠道分销', '分销', '物流'],
  visual: ['visual direction', '视觉设计', '视觉表达'], culture: ['cultural storytelling', 'exhibition curation', '文化叙事', '展览策划'],
  craft: ['traditional craft', 'ceramics', '传统工艺', '陶瓷'], technology: ['ai technology', 'software development', 'electronics', '人工智能', '软件开发', '电子技术'],
  experience: ['digital interaction', 'sound design', '数字交互', '体验设计', '声音设计'], space: ['retail space', 'spatial design', '零售空间', '空间设计'],
  content: ['content production', 'publishing', '内容制作', '出版'], community: ['community building', 'event production', '社群运营', '活动策划'],
  food: ['food development', 'tea sourcing', 'coffee roasting', '食品研发', '茶叶', '咖啡烘焙'], packaging: ['packaging', '包装'], textile: ['textile development', '纺织', '面料研发'],
  finance: ['tax reporting', 'audit preparation', 'payroll'], compliance: ['compliance training', 'bookkeeping'],
};
const PROJECTS: Lexicon = {
  physical: ['physical products', 'object collections', 'wearable collections', '实体产品', '用品', '收纳', '产品'],
  culture: ['cultural exhibitions', 'cultural projects', '文化展览', '文化项目'], digital: ['digital experiences', '数字体验'],
  retail: ['pop-up retail', '快闪零售', '零售'], content: ['editorial content', 'campaigns', '内容', '传播活动'],
  food: ['food experiences', 'food rituals', '食品体验', '饮食仪式'], industry: ['industrial procurement', 'freight', '工业采购', '货运'],
  finance: ['tax compliance', 'financial reporting'], outdoors: ['outdoor adventures', 'wilderness'],
};
const AUDIENCES: Lexicon = {
  design: ['designers', 'creative professionals', '设计师', '创意工作者'], maker: ['makers', 'craftspeople', '创客', '手工艺人'],
  collector: ['collectors', '收藏者'], culture: ['culture lovers', 'readers', 'musicians', '文化爱好者', '读者', '音乐人'],
  tech: ['technologists', 'digital creatives', '科技从业者', '数字创作者'], local: ['local communities', 'families', 'students', '本地社群', '家庭', '学生'],
  home: ['home enthusiasts', '家居', '小空间生活'], fashion: ['fashion enthusiasts', '时尚消费者'], retail: ['retailers', '零售商'],
  food: ['food lovers', '食品爱好者'], eco: ['environmentally conscious', 'nature lovers', '环保消费者', '自然爱好者'],
  industry: ['industrial buyers', 'freight operators', 'procurement'],
  finance: ['accountants', 'finance departments'], outdoors: ['hikers', 'outdoor athletes'],
};
const ADJACENT = new Set(['design:maker', 'collector:design', 'culture:design', 'design:tech', 'collector:culture', 'culture:tech', 'culture:local', 'food:local', 'design:fashion', 'design:home', 'maker:retail', 'eco:maker', 'eco:fashion', 'eco:outdoors', 'home:retail', 'design:retail']);
const PROJECT_BRIDGES: Record<string, number> = {
  'culture:physical': 0.58, 'digital:physical': 0.7, 'physical:retail': 0.67,
  'content:physical': 0.48, 'culture:digital': 0.85, 'culture:retail': 0.8,
  'content:culture': 0.75, 'food:retail': 0.85, 'content:digital': 0.75,
  'food:physical': 0.42, 'outdoors:physical': 0.35, 'content:outdoors': 0.4,
};
const LABELS: Record<string, string> = {
  design: 'concept and product design', manufacturing: 'small-batch manufacturing',
  material: 'material development', prototype: 'production knowledge and prototyping',
  distribution: 'distribution', visual: 'visual direction', culture: 'cultural storytelling',
  craft: 'traditional craft', technology: 'technology', experience: 'interactive experiences',
  space: 'spaces', content: 'content and publishing', community: 'community and events',
  food: 'food expertise', packaging: 'packaging', textile: 'textile development',
};
const OUTCOMES: Record<string, string> = {
  physical: 'An experimental limited-edition object collection.',
  culture: 'A participatory exhibition connecting different cultural practices.',
  digital: 'An interactive prototype that brings cultural stories into a digital experience.',
  retail: 'A small pop-up combining objects, stories and a shared audience.',
  content: 'An editorial series that introduces each practice to a new audience.',
  food: 'A tasting experience with a distinctive ritual and material identity.',
  industry: 'A pilot for a more efficient production and distribution workflow.',
  outdoors: 'A small community-led outdoor experience.',
  finance: 'A focused financial reporting workflow pilot.',
};
const pair = (a: string, b: string) => [a, b].sort().join(':');
const extract = (text: string, lexicon: Lexicon) => Object.keys(lexicon).filter(key => lexicon[key].some(word => text.toLowerCase().includes(word)));
const intersection = (a: string[], b: string[]) => a.filter(item => b.includes(item));
const overlap = (a: string[], b: string[]) => intersection(a, b).length / Math.max(1, new Set([...a, ...b]).size);
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/** Pure directional explanation with symmetric scoring. Only reads Brand snapshots. */
export function calculateMockRelation(focus: Brand, target: Brand): RelationResult {
  const a = extract(focus.offers, CAPABILITIES), b = extract(target.offers, CAPABILITIES);
  const aNeeds = extract(focus.needs, CAPABILITIES), bNeeds = extract(target.needs, CAPABILITIES);
  const supplied = intersection(a, bNeeds), received = intersection(b, aNeeds);
  const aGoals = extract(focus.intent, PROJECTS), bGoals = extract(target.intent, PROJECTS);
  const commonGoals = intersection(aGoals, bGoals);
  const bridges = aGoals.flatMap(x => bGoals.map(y => x === y ? 1 : PROJECT_BRIDGES[pair(x, y)] ?? 0));
  const projectAffinity = Math.max(0, ...bridges);
  // Natural fields, not character seed, drive the small deterministic variation.
  const fingerprints = [focus, target].map(brand => [brand.id, brand.offers, brand.needs, brand.intent, brand.identity].join('|')).sort();
  const jitter = hash(fingerprints.join('::')) % 7 - 3;
  const intentFit = clamp(12 + projectAffinity * 81 + jitter);
  const complementarity = clamp(15 + Math.min(supplied.length, 2) * 18 + Math.min(received.length, 2) * 18 + (supplied.length && received.length ? 8 : 0));
  const aAudience = extract(focus.audience, AUDIENCES), bAudience = extract(target.audience, AUDIENCES);
  const audienceSimilarity = overlap(aAudience, bAudience);
  const adjacent = aAudience.some(x => bAudience.some(y => ADJACENT.has(pair(x, y))));
  const audienceExpansion = clamp(audienceSimilarity > 0.8 ? 40 : adjacent ? 84 + jitter : audienceSimilarity > 0 ? 67 : 22);
  const tension = (a.includes('craft') && b.includes('technology')) || (b.includes('craft') && a.includes('technology'));
  const traits = ['experimental', 'playful', 'curious', 'traditional', 'practical', 'sustainable', 'independent', 'precise', 'warm', 'open', 'thoughtful'];
  const sharedTraits = traits.filter(trait => focus.identity.toLowerCase().includes(trait) && target.identity.toLowerCase().includes(trait));
  const chemistry = clamp(tension ? 94 + jitter : sharedTraits.length ? 65 + Math.min(3, sharedTraits.length) * 8 + jitter : 45 + jitter);
  const conflict = [focus, target].some((brand, i, both) => /no prototypes|no limited editions|above 100000/i.test(brand.constraints) && /experimental|limited|prototype/i.test(both[1 - i].intent));
  const feasibility = conflict ? 20 : 91;
  const dimensions = { intentFit, complementarity, audienceExpansion, chemistry, feasibility };
  const collaborationFit = clamp((Object.keys(RELATION_WEIGHTS) as Dimension[]).reduce((sum, key) => sum + dimensions[key] * RELATION_WEIGHTS[key], 0));
  const peer = overlap(a, b) > 0.72 && complementarity < 45;
  const relationType: RelationType = collaborationFit < 50 ? 'Weak Fit'
    : peer ? 'Peer / Same Tribe'
    : tension ? 'Productive Tension'
    : supplied.length > 0 && received.length > 0 ? 'Mutual Complement'
    : [...supplied, ...received].includes('manufacturing') ? 'Production Partner'
    : [...supplied, ...received].includes('distribution') ? 'Distribution Bridge'
    : [...supplied, ...received].includes('technology') ? 'Technology Transfer'
    : supplied.length + received.length > 0 ? 'Capability Complement'
    : a.includes('culture') && b.includes('culture') ? 'Cultural Exchange'
    : audienceExpansion >= 80 ? 'Audience Bridge' : 'Creative Chemistry';
  const describe = (items: string[]) => items.slice(0, 2).map(key => LABELS[key] ?? key).join(' and ');
  const evidence = [
    supplied.length ? `You bring ${describe(supplied)}, which ${target.name} is looking for.` : '',
    received.length ? `They bring ${describe(received)}, which supports ${focus.name}'s needs.` : '',
  ].filter(Boolean).join(' ');
  const reason = peer ? 'Your capabilities and audience overlap, but neither fills the other’s main capability gaps. Shared taste alone does not create the strongest collaboration.'
    : tension ? `Traditional craft and technology offer productive tension. ${evidence} ${projectAffinity >= 0.7 ? 'A shared project direction makes that contrast useful.' : 'A shared project still needs to be defined.'}`
    : `${evidence || 'There is no direct offers-to-needs match in these briefs.'} ${projectAffinity >= 0.7 ? 'Your project intentions can support a shared outcome.' : projectAffinity > 0 ? 'Your intentions are adjacent; a smaller shared brief would help.' : 'Your current project intentions point in different directions.'}`;
  const goal = commonGoals[0] ?? [...aGoals, ...bGoals].sort()[0];
  return {
    sourceBrandId: focus.id, targetBrandId: target.id,
    collaborationFit, relationType, ...dimensions, reason: !focus.intent.trim() || !target.intent.trim() ? `${evidence || '目前可用于判断的资料较少。'} 联名目标尚待补充，当前只显示已有能力线索。` : reason,
    possibleOutcome: collaborationFit < 50 ? 'No convincing shared project yet. Clarify a common intent before committing.' : OUTCOMES[goal] ?? 'A small joint prototype to test the shared opportunity.',
    caveat: conflict ? 'The industrial minimum order conflicts with a limited pilot.'
      : projectAffinity < 0.4 ? 'Capabilities alone cannot resolve the mismatch in current intent.'
      : !a.includes('distribution') && !b.includes('distribution') && goal === 'physical' ? 'Distribution capability remains unresolved.'
      : peer ? 'A third partner may be needed to supply the missing capabilities.' : undefined,
  };
}
