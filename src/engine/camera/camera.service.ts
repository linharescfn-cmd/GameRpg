/**
 * @fileoverview Camera System
 * Gerencia câmera, zoom e viewport
 */

import type { Camera, Viewport, GridConfig } from '../types/index.js';

class CameraService {
  /**
   * Move câmera
   */
  moveCamera(
    camera: Camera,
    deltaX: number,
    deltaY: number
  ): Camera {
    return {
      ...camera,
      x: camera.x + deltaX,
      y: camera.y + deltaY,
    };
  }

  /**
   * Zoom in
   */
  zoomIn(camera: Camera, factor: number = 1.1): Camera {
    return {
      ...camera,
      zoom: Math.min(camera.zoom * factor, 5), // máximo 5x
    };
  }

  /**
   * Zoom out
   */
  zoomOut(camera: Camera, factor: number = 1.1): Camera {
    return {
      ...camera,
      zoom: Math.max(camera.zoom / factor, 0.2), // mínimo 0.2x
    };
  }

  /**
   * Reset câmera
   */
  resetCamera(): Camera {
    return { x: 0, y: 0, zoom: 1 };
  }

  /**
   * Centra câmera em ponto
   */
  focusOnPoint(
    camera: Camera,
    viewport: Viewport,
    pointX: number,
    pointY: number
  ): Camera {
    return {
      ...camera,
      x: pointX - viewport.width / 2,
      y: pointY - viewport.height / 2,
    };
  }

  /**
   * Ajusta câmera para mostrar retângulo
   */
  fitRectInViewport(
    viewport: Viewport,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
  ): Camera {
    const scaleX = viewport.width / rectWidth;
    const scaleY = viewport.height / rectHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% com margem

    return {
      x: rectX + rectWidth / 2 - viewport.width / (2 * scale),
      y: rectY + rectHeight / 2 - viewport.height / (2 * scale),
      zoom: scale,
    };
  }

  /**
   * Verifica se ponto está visível
   */
  isPointVisible(
    camera: Camera,
    viewport: Viewport,
    pointX: number,
    pointY: number,
    padding: number = 0
  ): boolean {
    const left = camera.x - padding;
    const right = camera.x + viewport.width / camera.zoom + padding;
    const top = camera.y - padding;
    const bottom = camera.y + viewport.height / camera.zoom + padding;

    return pointX >= left && pointX <= right && pointY >= top && pointY <= bottom;
  }

  /**
   * Obtém bounds visível no mundo
   */
  getVisibleBounds(
    camera: Camera,
    viewport: Viewport
  ): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    return {
      minX: camera.x,
      maxX: camera.x + viewport.width / camera.zoom,
      minY: camera.y,
      maxY: camera.y + viewport.height / camera.zoom,
    };
  }

  /**
   * Suaviza transição de câmera (lerp)
   */
  lerpCamera(
    camera: Camera,
    target: Camera,
    alpha: number
  ): Camera {
    alpha = Math.max(0, Math.min(1, alpha));
    return {
      x: camera.x + (target.x - camera.x) * alpha,
      y: camera.y + (target.y - camera.y) * alpha,
      zoom: camera.zoom + (target.zoom - camera.zoom) * alpha,
    };
  }
}

export const cameraService = new CameraService();
