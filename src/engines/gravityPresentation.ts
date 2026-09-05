import type { SpatialPosition, ViewportSize } from '../domain/types';
import { VIEW_CONFIG } from '../config';

/** A single display scale preserves distance ordering and angles, without changing scores. */
export function gravityPresentationScale(positions: readonly SpatialPosition[], size: ViewportSize) {
  if (!positions.length) return 1;
  const radii = positions.map(position => position.radius).filter(radius => radius > 0).sort((a, b) => a - b);
  if (!radii.length) return 1;
  const sparse = positions.length <= 6;
  const reference = radii[sparse ? radii.length - 1 : Math.floor((radii.length - 1) * .65)];
  const initialZoom = size.width < 640 ? VIEW_CONFIG.narrowInitialZoom : VIEW_CONFIG.initialZoom;
  const extent = Math.min(size.width, size.height) * (sparse ? .32 : .58);
  return Math.min(1, extent / initialZoom / reference);
}
