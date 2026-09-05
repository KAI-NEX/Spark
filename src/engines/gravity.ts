import { GRAVITY_CONFIG } from '../config';
import { hash } from '../domain/hash';
import type { RelationResult, SpatialPosition } from '../domain/types';
export function fitToDistance(fit: number): number {
  const { minDistance, maxDistance, gamma } = GRAVITY_CONFIG;
  return minDistance + Math.pow(1 - Math.min(100, Math.max(0, fit)) / 100, gamma) * (maxDistance - minDistance);
}
function clearance(a: SpatialPosition, b: SpatialPosition) {
  return Math.max(Math.abs(a.x - b.x) / GRAVITY_CONFIG.nodeSpacingX, Math.abs(a.y - b.y) / GRAVITY_CONFIG.nodeSpacingY);
}

/** Fit alone controls radius. An angle-only greedy search reduces label collisions. */
export function calculateGravityPositions(focusId: string, relations: readonly RelationResult[]): SpatialPosition[] {
  const placed: SpatialPosition[] = [];
  const sorted = [...relations].sort((a, b) => b.collaborationFit - a.collaborationFit || a.targetBrandId.localeCompare(b.targetBrandId));
  for (const [index, relation] of sorted.entries()) {
    const radius = fitToDistance(relation.collaborationFit);
    const base = hash(`${focusId}:${relation.targetBrandId}`) / 2 ** 32 * Math.PI * 2 + index * GRAVITY_CONFIG.goldenAngle;
    let best = { x: 0, y: 0, clearance: -Infinity };
    for (let candidate = 0; candidate < GRAVITY_CONFIG.angleCandidates; candidate++) {
      const angle = base + candidate * GRAVITY_CONFIG.goldenAngle;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      const space = Math.min(...placed.map(other => clearance({ brandId: relation.targetBrandId, x, y, radius }, other)));
      if (space > best.clearance) best = { x, y, clearance: space };
      // Keep first stable candidate with sufficient whitespace.
      if (space >= 1.1) break;
    }
    placed.push({ brandId: relation.targetBrandId, x: best.x, y: best.y, radius });
  }
  // Bounded angle-only cleanup. Runs once per focus, never as a frame simulation.
  for (let pass = 0; pass < GRAVITY_CONFIG.collisionPasses; pass++) {
    let changed = false;
    for (const node of placed) {
      const others = placed.filter(other => other !== node);
      const penalty = (candidate: SpatialPosition) => others.reduce((sum, other) => sum + Math.pow(Math.max(0, 1.02 - clearance(candidate, other)), 2), 0);
      let bestPenalty = penalty(node);
      if (bestPenalty === 0) continue;
      let bestX = node.x, bestY = node.y;
      const base = Math.atan2(node.y, node.x);
      for (let attempt = 1; attempt < GRAVITY_CONFIG.angleCandidates; attempt++) {
        const angle = base + attempt * GRAVITY_CONFIG.goldenAngle;
        const candidate = { ...node, x: Math.cos(angle) * node.radius, y: Math.sin(angle) * node.radius };
        const value = penalty(candidate);
        if (value < bestPenalty) { bestPenalty = value; bestX = candidate.x; bestY = candidate.y; changed = true; }
        if (value === 0) break;
      }
      node.x = bestX; node.y = bestY;
    }
    if (!changed) break;
  }
  return placed;
}
