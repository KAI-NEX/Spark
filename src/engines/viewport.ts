import { VIEW_CONFIG, VIEWPORT_LOD_CONFIG as LOD_CONFIG } from '../config';
import type { Bounds, LOD, SceneNode, Viewport, ViewportSize } from '../domain/types';

/** World-space bounds for the current camera, with optional screen-pixel overscan. */
export function getViewportBounds(view: Viewport, size: ViewportSize, margin = 0): Bounds {
  return {
    left: (-size.width / 2 - view.x - margin) / view.zoom,
    right: (size.width / 2 - view.x + margin) / view.zoom,
    top: (-size.height / 2 - view.y - margin) / view.zoom,
    bottom: (size.height / 2 - view.y + margin) / view.zoom,
  };
}

export function getNodeScreenPosition(position: { x: number; y: number }, view: Viewport, size: ViewportSize) {
  return { x: size.width / 2 + view.x + position.x * view.zoom, y: size.height / 2 + view.y + position.y * view.zoom };
}

/** Visual priority is independent of placement. Even weak-fit nodes can wake up. */
export function calculateViewportLOD(screen: { x: number; y: number }, _fit: number, view: Viewport, size: ViewportSize, _isFocus?: boolean): LOD {
  // Retain the caller contract; identity and relation fit never gate visual access.
  void _fit; void _isFocus;
  const dx = Math.max(0, -screen.x, screen.x - size.width);
  const dy = Math.max(0, -screen.y, screen.y - size.height);
  if (Math.hypot(dx, dy) > LOD_CONFIG.dormantMargin) return 'dormant';
  if (screen.x < LOD_CONFIG.edgeInset || screen.y < LOD_CONFIG.edgeInset || screen.x > size.width - LOD_CONFIG.edgeInset || screen.y > size.height - LOD_CONFIG.edgeInset) return 'marker';
  const halfWidth = LOD_CONFIG.detailHalfWidth, halfHeight = LOD_CONFIG.detailHalfHeight;
  if (size.occlusions?.some(bounds => screen.x + halfWidth > bounds.left && screen.x - halfWidth < bounds.right && screen.y + halfHeight > bounds.top && screen.y - halfHeight < bounds.bottom)) return 'marker';

  const distanceFromCenter = Math.max(Math.abs(screen.x - size.width / 2) / (size.width / 2), Math.abs(screen.y - size.height / 2) / (size.height / 2));
  // Screen scale controls disclosure; relation scores do not decide who is readable.
  const effectiveZoom = view.zoom * (1 - LOD_CONFIG.edgeFalloff * distanceFromCenter ** 2);
  if (effectiveZoom >= LOD_CONFIG.fullMinZoom) return 'full';
  if (effectiveZoom >= LOD_CONFIG.blurredMinZoom) return 'blurred';
  if (effectiveZoom >= LOD_CONFIG.portraitMinZoom) return 'portrait';
  return 'marker';
}

export function updateVisibleNodes(nodes: readonly SceneNode[], view: Viewport, size: ViewportSize): ReadonlyMap<string, LOD> {
  const bounds = getViewportBounds(view, size, LOD_CONFIG.dormantMargin);
  return new Map(nodes.map(node => {
    const { x, y } = node.position;
    const outside = x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
    return [node.brand.id, outside ? 'dormant' : calculateViewportLOD(getNodeScreenPosition(node.position, view, size), node.fit, view, size, node.isFocus)];
  }));
}

export function zoomAt(view: Viewport, factor: number, anchorX = 0, anchorY = 0): Viewport {
  const zoom = Math.min(VIEW_CONFIG.maxZoom, Math.max(VIEW_CONFIG.minZoom, view.zoom * factor));
  const ratio = zoom / view.zoom;
  return { x: anchorX - (anchorX - view.x) * ratio, y: anchorY - (anchorY - view.y) * ratio, zoom };
}

/** Loose camera bounds; no hard wall at the edge of the initial viewport. */
export function constrainViewport(view: Viewport, size: ViewportSize): Viewport {
  const limitX = Math.max(0, VIEW_CONFIG.worldWidth * view.zoom / 2 - size.width / 2 + VIEW_CONFIG.panPadding);
  const limitY = Math.max(0, VIEW_CONFIG.worldHeight * view.zoom / 2 - size.height / 2 + VIEW_CONFIG.panPadding);
  return { ...view, x: Math.max(-limitX, Math.min(limitX, view.x)), y: Math.max(-limitY, Math.min(limitY, view.y)) };
}
