/**
 * @fileoverview Renderer Service
 * Gerencia renderização do canvas principal
 */

import type {
  GameState,
  GameMap,
  Token,
  Camera,
  Viewport,
} from '../types/index.js';

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
}

class RendererService {
  private lastRenderTime = 0;
  private frameCallbacks: Set<() => void> = new Set();

  /**
   * Inicializa renderer
   */
  initialize(canvas: HTMLCanvasElement): RenderContext {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Falha ao obter contexto 2D do canvas');
    }
    return { ctx, canvas };
  }

  /**
   * Renderiza frame completo
   */
  render(
    rc: RenderContext,
    state: GameState,
    topRuler?: CanvasRenderingContext2D,
    leftRuler?: CanvasRenderingContext2D
  ): number {
    const now = performance.now();
    const deltaTime = now - this.lastRenderTime;
    this.lastRenderTime = now;

    const { ctx, canvas } = rc;

    // Limpa canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderiza mapa
    const currentMap = state.maps.find((m) => m.id === state.currentMapId);
    if (currentMap) {
      this.renderMap(ctx, currentMap, state.camera, state.grid, canvas);
    }

    // Renderiza grid
    this.renderGrid(ctx, state, canvas);

    // Renderiza tokens
    this.renderTokens(ctx, state, canvas);

    // Renderiza névoa de guerra
    if (state.fog.active && state.fog.canvas) {
      this.renderFog(ctx, state.fog.canvas, state.camera, canvas);
    }

    // Renderiza rulers
    if (topRuler) {
      this.renderTopRuler(topRuler, state, canvas);
    }
    if (leftRuler) {
      this.renderLeftRuler(leftRuler, state, canvas);
    }

    // Executa callbacks
    this.frameCallbacks.forEach((cb) => cb());

    return deltaTime;
  }

  /**
   * Renderiza mapa
   */
  private renderMap(
    ctx: CanvasRenderingContext2D,
    map: GameMap,
    camera: Camera,
    gridConfig: any,
    canvas: HTMLCanvasElement
  ): void {
    if (!map.imageObj) return;

    const cellSize = gridConfig.cellSize * gridConfig.cellMultiplier;
    const targetWidth = map.widthCells * cellSize;
    const targetHeight = map.heightCells * cellSize;

    const screenX = -camera.x * camera.zoom;
    const screenY = -camera.y * camera.zoom;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(
      map.imageObj,
      screenX,
      screenY,
      targetWidth * camera.zoom,
      targetHeight * camera.zoom
    );
    ctx.restore();
  }

  /**
   * Renderiza grid
   */
  private renderGrid(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvas: HTMLCanvasElement
  ): void {
    const cellSize = state.grid.cellSize * state.grid.cellMultiplier;
    const gridColor = state.grid.gridColor;
    const gridOpacity = state.grid.gridOpacity;

    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.globalAlpha = gridOpacity;
    ctx.lineWidth = 1;

    const startX = Math.floor(state.camera.x / cellSize) * cellSize;
    const startY = Math.floor(state.camera.y / cellSize) * cellSize;
    const endX = Math.ceil(
      (state.camera.x + canvas.width / state.camera.zoom) / cellSize
    ) * cellSize;
    const endY = Math.ceil(
      (state.camera.y + canvas.height / state.camera.zoom) / cellSize
    ) * cellSize;

    // Linhas verticais
    for (let x = startX; x <= endX; x += cellSize) {
      const screenX = (x - state.camera.x) * state.camera.zoom;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvas.height);
      ctx.stroke();
    }

    // Linhas horizontais
    for (let y = startY; y <= endY; y += cellSize) {
      const screenY = (y - state.camera.y) * state.camera.zoom;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvas.width, screenY);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renderiza tokens
   */
  private renderTokens(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvas: HTMLCanvasElement
  ): void {
    const cellSize = state.grid.cellSize * state.grid.cellMultiplier;
    const allTokens = [...state.tokens, ...state.enemyTokens];

    for (const token of allTokens) {
      if (!token.visible) continue;

      const x = (token.position.col * cellSize - state.camera.x) * state.camera.zoom;
      const y = (token.position.row * cellSize - state.camera.y) * state.camera.zoom;
      const size = (token.size * state.camera.zoom) / cellSize;

      // Draw token circle
      ctx.save();
      ctx.fillStyle = token.color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw image if available
      if (token.imageObj) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(token.imageObj, x, y, size, size);
        ctx.restore();
      }
    }
  }

  /**
   * Renderiza névoa de guerra
   */
  private renderFog(
    ctx: CanvasRenderingContext2D,
    fogCanvas: HTMLCanvasElement,
    camera: Camera,
    canvas: HTMLCanvasElement
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.drawImage(
      fogCanvas,
      (-camera.x) * camera.zoom,
      (-camera.y) * camera.zoom,
      fogCanvas.width * camera.zoom,
      fogCanvas.height * camera.zoom
    );
    ctx.restore();
  }

  /**
   * Renderiza ruler do topo
   */
  private renderTopRuler(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvas: HTMLCanvasElement
  ): void {
    const cellSize = state.grid.cellSize * state.grid.cellMultiplier;
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    for (
      let col = Math.floor(state.camera.x / cellSize);
      col < Math.ceil((state.camera.x + canvas.width / state.camera.zoom) / cellSize);
      col++
    ) {
      const x = (col * cellSize - state.camera.x) * state.camera.zoom;
      ctx.fillText(String(col), x + cellSize / 2, 15);
    }
  }

  /**
   * Renderiza ruler da esquerda
   */
  private renderLeftRuler(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvas: HTMLCanvasElement
  ): void {
    const cellSize = state.grid.cellSize * state.grid.cellMultiplier;
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 30, canvas.height);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    for (
      let row = Math.floor(state.camera.y / cellSize);
      row < Math.ceil((state.camera.y + canvas.height / state.camera.zoom) / cellSize);
      row++
    ) {
      const y = (row * cellSize - state.camera.y) * state.camera.zoom;
      ctx.fillText(String(row), 25, y + cellSize / 2 + 3);
    }
  }

  /**
   * Registra callback para cada frame
   */
  onFrame(callback: () => void): () => void {
    this.frameCallbacks.add(callback);
    return () => this.frameCallbacks.delete(callback);
  }

  /**
   * Limpa todos os callbacks
   */
  clearCallbacks(): void {
    this.frameCallbacks.clear();
  }
}

export const rendererService = new RendererService();
export type { RenderContext };
