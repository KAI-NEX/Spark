import type { Dimension } from './domain/types';
export const RELATION_WEIGHTS: Record<Dimension, number> = {
  intentFit: 0.35, complementarity: 0.30, audienceExpansion: 0.15,
  chemistry: 0.15, feasibility: 0.05,
};
export const GRAVITY_BANDS = { near: 72, mid: 50 } as const;
export const GRAVITY_CONFIG = {
  minDistance: 280, maxDistance: 1800, gamma: 1.65,
  nodeSpacingX: 180, nodeSpacingY: 150,
  angleCandidates: 360, collisionPasses: 12, goldenAngle: Math.PI * (3 - Math.sqrt(5)),
} as const;
export const VIEWPORT_LOD_CONFIG = {
  updateIntervalMs: 100,
  dormantMargin: 220,
  edgeInset: 32,
  detailHalfWidth: 80, detailHalfHeight: 94,
  markerOnlyZoom: 0.45,
  fullMinZoom: 0.6,
  referenceZoom: 0.8,
  fullPriority: 0.72,
  simplePriority: 0.58,
  importanceFloor: 0.55,
  edgeFalloff: 0.45,
  maxZoomFactor: 1.3,
} as const;
export const VIEW_CONFIG = {
  initialZoom: 0.8, narrowInitialZoom: 0.62, minZoom: 0.35, maxZoom: 2, zoomStep: 1.2,
  dragThreshold: 6,
  worldWidth: 4200, worldHeight: 3600, panPadding: 180,
} as const;
