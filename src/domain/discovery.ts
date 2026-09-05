import type { Brand, RelationResult } from './types';
import { missingMatchingFields } from './brandIntake';

/** Discovery confidence gates visibility, without changing the baseline score or weights. */
export function discoverRelations(focus: Brand, relations: readonly RelationResult[]) {
  const missing = missingMatchingFields(focus).length;
  const supported = relations.filter(relation => relation.collaborationFit >= 50 || relation.complementarity > 15)
    .sort((a, b) => b.collaborationFit - a.collaborationFit || a.targetBrandId.localeCompare(b.targetBrandId));
  const visible = missing ? supported.slice(0, Math.max(2, (6 - missing) * 2)) : supported;
  if (visible.length >= 2) return visible;
  const extra = relations.filter(item => !visible.some(found => found.targetBrandId === item.targetBrandId))
    .sort((a, b) => b.collaborationFit - a.collaborationFit || a.targetBrandId.localeCompare(b.targetBrandId))
    .slice(0, 2 - visible.length)
    .map(item => ({ ...item, exploratory: true, reason: '资料尚不足以确认合作方向。这是一条待验证的探索线索，可以先聚焦这个品牌，了解它与其他伙伴的关系。' }));
  return [...visible, ...extra];
}
