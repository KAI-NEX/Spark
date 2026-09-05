import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { VIEW_CONFIG, VIEWPORT_LOD_CONFIG } from '../config';
import type { Viewport, ViewportSize } from '../domain/types';
import { constrainViewport, zoomAt } from '../engines/viewport';
import { createThrottledUpdater } from './throttledUpdater';

const initialView = (): Viewport => ({ x: 0, y: 0, zoom: window.matchMedia('(max-width: 640px)').matches ? VIEW_CONFIG.narrowInitialZoom : VIEW_CONFIG.initialZoom });

export function useViewport(resetKey: number, onBrandSelect: (id: string) => void, overview = false) {
  const resetView = useCallback((): Viewport => ({ ...initialView(), ...(overview ? { zoom: VIEW_CONFIG.minZoom } : {}) }), [overview]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<{ view: Viewport; size: ViewportSize }>(() => ({ view: resetView(), size: { width: 1000, height: 800 } }));
  const liveView = useRef(snapshot.view);
  const liveSize = useRef(snapshot.size);
  const cameraFrame = useRef<number | null>(null);
  const cameraInitialized = useRef(false);
  const gesture = useRef<{ id: number; x: number; y: number; view: Viewport; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const updater = useMemo(() => createThrottledUpdater(() => {
    setSnapshot({ view: liveView.current, size: liveSize.current });
  }, VIEWPORT_LOD_CONFIG.updateIntervalMs), []);

  // The camera transform is imperative. Pointer moves do not render the React tree.
  const writeView = useCallback((next: Viewport) => {
    liveView.current = constrainViewport(next, liveSize.current);
    const { x, y, zoom } = liveView.current;
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
      worldRef.current.style.setProperty('--node-counter-scale', String(1 / zoom));
      worldRef.current.style.setProperty('--marker-scale', String(Math.max(1, 1 / zoom)));
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraFrame.current !== null) cancelAnimationFrame(cameraFrame.current);
    cameraFrame.current = null;
  }, []);

  useLayoutEffect(() => {
    stopCamera();
    gesture.current = null;
    setDragging(false);
    const destination = resetView();
    if (!cameraInitialized.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cameraInitialized.current = true;
      writeView(destination);
      updater.flush();
      return stopCamera;
    }
    const start = { ...liveView.current };
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 700);
      const eased = 1 - (1 - progress) ** 3;
      writeView({ x: start.x + (destination.x - start.x) * eased, y: start.y + (destination.y - start.y) * eased, zoom: start.zoom + (destination.zoom - start.zoom) * eased });
      if (progress < 1) { updater.schedule(); cameraFrame.current = requestAnimationFrame(tick); }
      else { cameraFrame.current = null; updater.flush(); }
    };
    cameraFrame.current = requestAnimationFrame(tick);
    return stopCamera;
  }, [resetKey, updater, writeView, stopCamera, resetView]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      // Measure the three existing canvas controls only on resize, never during pan.
      const canvasBounds = canvas.getBoundingClientRect();
      const overlays = canvas.parentElement?.querySelectorAll('.canvas-intro, .field-key, .zoom-controls') ?? [];
      const occlusions = [...overlays].map(overlay => {
        const bounds = overlay.getBoundingClientRect();
        return { left: bounds.left - canvasBounds.left, right: bounds.right - canvasBounds.left, top: bounds.top - canvasBounds.top, bottom: bounds.bottom - canvasBounds.top };
      });
      liveSize.current = { width: entry.contentRect.width, height: entry.contentRect.height, occlusions };
      writeView(liveView.current);
      updater.flush();
    });
    observer.observe(canvas);
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      stopCamera();
      const rect = canvas.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1);
      writeView(zoomAt(liveView.current, Math.exp(-Math.max(-300, Math.min(300, delta)) * 0.002), event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2));
      updater.schedule();
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); canvas.removeEventListener('wheel', wheel); updater.cancel(); };
  }, [updater, writeView, stopCamera]);

  const zoom = useCallback((factor: number) => {
    stopCamera();
    writeView(zoomAt(liveView.current, factor));
    updater.flush();
  }, [updater, writeView, stopCamera]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || gesture.current || (event.target as Element).closest('[data-no-pan]')) return;
    stopCamera();
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view: liveView.current, moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (start.moved || Math.hypot(dx, dy) > VIEW_CONFIG.dragThreshold) {
      if (!start.moved) { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }
      start.moved = true;
      writeView({ ...start.view, x: start.view.x + dx, y: start.view.y + dy });
      updater.schedule();
    }
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    if (start.moved) {
      writeView({ ...start.view, x: start.view.x + event.clientX - start.x, y: start.view.y + event.clientY - start.y });
    } else {
      const node = (event.target as Element).closest<HTMLElement>('[data-brand-id]');
      if (node?.dataset.brandId) onBrandSelect(node.dataset.brandId);
    }
    gesture.current = null;
    setDragging(false);
    updater.flush();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const cancelGesture = () => {
    if (!gesture.current) return;
    gesture.current = null;
    setDragging(false);
    updater.flush();
  };
  const onLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Ignore implicit touch capture transferring from a child to the canvas.
    if (event.target === event.currentTarget) cancelGesture();
  };
  return { canvasRef, worldRef, ...snapshot, dragging, zoom, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: cancelGesture, onLostPointerCapture } };
}
