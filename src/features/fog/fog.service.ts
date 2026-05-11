/**
 * @fileoverview Fog of War Service
 * Gerencia névoa de guerra no mapa
 */

import type { FogState, FogStroke, PixelPosition } from '../types/index.js';

class FogService {
  /**
   * Inicializa canvas de névoa
   */
  initializeFogCanvas(
    width: number,
    height: number
  ): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Falha ao obter contexto 2D do canvas de névoa');
    }

    // Preenche com preto opaco (tudo oculto)
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, width, height);

    return { canvas, ctx };
  }

  /**
   * Limpa toda a névoa
   */
  clearFog(fog: FogState): FogState {
    if (fog.ctx) {
      fog.ctx.clearRect(0, 0, fog.canvas?.width || 0, fog.canvas?.height || 0);
    }
    return {
      ...fog,
      strokes: [],
    };
  }

  /**
   * Desenha stroke no canvas de névoa
   */
  drawStroke(
    fog: FogState,
    points: PixelPosition[],
    brushSize: number,
    type: 'brush' | 'eraser'
  ): FogStroke {
    if (!fog.ctx || !fog.canvas) {
      throw new Error('Canvas de névoa não inicializado');
    }

    const ctx = fog.ctx;
    const isEraser = type === 'eraser';

    ctx.globalCompositeOperation = isEraser
      ? 'destination-out'
      : 'destination-in';

    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (points.length === 0) return this.createEmptyStroke();

    // Desenha linha através dos pontos
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    return this.createStroke(type, points, brushSize);
  }

  /**
   * Cria objeto de stroke
   */
  private createStroke(
    type: 'brush' | 'eraser',
    points: PixelPosition[],
    brushSize: number
  ): FogStroke {
    return {
      type,
      points,
      brushSize,
      timestamp: Date.now(),
    };
  }

  /**
   * Cria stroke vazio
   */
  private createEmptyStroke(): FogStroke {
    return {
      type: 'brush',
      points: [],
      brushSize: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Desfaz último stroke
   */
  undoStroke(fog: FogState): FogState {
    if (fog.strokes.length === 0) return fog;

    const newStrokes = fog.strokes.slice(0, -1);
    const newFog = this.clearFog(fog);

    // Redesenha todos os strokes exceto o último
    for (const stroke of newStrokes) {
      this.drawStroke(newFog, stroke.points, stroke.brushSize, stroke.type);
    }

    return {
      ...newFog,
      strokes: newStrokes,
    };
  }

  /**
   * Exporta névoa como imagem
   */
  exportFogAsImage(fog: FogState): string | null {
    if (!fog.canvas) return null;
    return fog.canvas.toDataURL('image/png');
  }

  /**
   * Importa névoa de imagem
   */
  async importFogFromImage(
    imageUrl: string,
    fog: FogState
  ): Promise<FogState> {
    return new Promise((resolve, reject) => {
      if (!fog.ctx || !fog.canvas) {
        reject(new Error('Canvas de névoa não inicializado'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        fog.ctx?.drawImage(img, 0, 0);
        resolve(fog);
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem de névoa'));
      img.src = imageUrl;
    });
  }

  /**
   * Valida névoa
   */
  validateFog(fog: FogState): boolean {
    return (
      typeof fog.active === 'boolean' &&
      fog.brushSize > 0 &&
      Array.isArray(fog.strokes)
    );
  }
}

export const fogService = new FogService();
