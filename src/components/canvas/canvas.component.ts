/**
 * @fileoverview Canvas Component
 * Encapsula a lógica de interação com o canvas principal
 */

import type { GameState } from '../types/index.js';
import { gameStore } from '../stores/game.store.js';
import { rendererService, type RenderContext } from '../engine/renderer/renderer.service.js';
import { cameraService } from '../engine/camera/camera.service.js';

class CanvasComponent {
  private canvas: HTMLCanvasElement;
  private renderContext: RenderContext | null = null;
  private topRuler: CanvasRenderingContext2D | null = null;
  private leftRuler: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private isDragging = false;
  private lastMouse = { x: 0, y: 0 };

  constructor(canvasId: string, topRulerId?: string, leftRulerId?: string) {
    const el = document.getElementById(canvasId);
    if (!el || !(el instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas com ID "${canvasId}" não encontrado`);
    }
    this.canvas = el;

    if (topRulerId) {
      const ruler = document.getElementById(topRulerId);
      if (ruler instanceof HTMLCanvasElement) {
        this.topRuler = ruler.getContext('2d');
      }
    }

    if (leftRulerId) {
      const ruler = document.getElementById(leftRulerId);
      if (ruler instanceof HTMLCanvasElement) {
        this.leftRuler = ruler.getContext('2d');
      }
    }

    this.setupCanvas();
    this.setupEventListeners();
  }

  /**
   * Configura canvas
   */
  private setupCanvas(): void {
    this.renderContext = rendererService.initialize(this.canvas);
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Redimensiona canvas para preencher container
   */
  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    const state = gameStore.getState();
    gameStore.setViewport({
      width: rect.width,
      height: rect.height,
    });
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

    // Context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Mouse down
   */
  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMouse = { x: e.clientX, y: e.clientY };
  }

  /**
   * Mouse move
   */
  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastMouse.x;
    const deltaY = e.clientY - this.lastMouse.y;

    const state = gameStore.getState();
    const newCamera = cameraService.moveCamera(
      state.camera,
      -deltaX / state.camera.zoom,
      -deltaY / state.camera.zoom
    );

    gameStore.setCamera(newCamera);
    this.lastMouse = { x: e.clientX, y: e.clientY };
  }

  /**
   * Mouse up
   */
  private onMouseUp(): void {
    this.isDragging = false;
  }

  /**
   * Wheel zoom
   */
  private onWheel(e: WheelEvent): void {
    e.preventDefault();

    const state = gameStore.getState();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    const newCamera =
      delta > 1
        ? cameraService.zoomOut(state.camera, delta)
        : cameraService.zoomIn(state.camera, 1 / delta);

    gameStore.setCamera(newCamera);
  }

  /**
   * Touch start
   */
  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  /**
   * Touch move
   */
  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - this.lastMouse.x;
    const deltaY = e.touches[0].clientY - this.lastMouse.y;

    const state = gameStore.getState();
    const newCamera = cameraService.moveCamera(
      state.camera,
      -deltaX / state.camera.zoom,
      -deltaY / state.camera.zoom
    );

    gameStore.setCamera(newCamera);
    this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  /**
   * Touch end
   */
  private onTouchEnd(): void {
    this.isDragging = false;
  }

  /**
   * Inicia loop de renderização
   */
  public startRenderLoop(): void {
    if (this.animationFrameId !== null) return;

    const render = () => {
      if (!this.renderContext) return;

      const state = gameStore.getState();
      rendererService.render(
        this.renderContext,
        state,
        this.topRuler || undefined,
        this.leftRuler || undefined
      );

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  /**
   * Para loop de renderização
   */
  public stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Obtém mundo coordinates de evento mouse
   */
  public getWorldCoordinates(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const state = gameStore.getState();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    return {
      x: screenX / state.camera.zoom + state.camera.x,
      y: screenY / state.camera.zoom + state.camera.y,
    };
  }

  /**
   * Destrói componente
   */
  public destroy(): void {
    this.stopRenderLoop();
    rendererService.clearCallbacks();
  }
}

export { CanvasComponent };
