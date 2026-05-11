/**
 * @fileoverview Grid Service
 * Gerencia cálculos de grid, posicionamento e snap-to-grid
 */

import type { GridPosition, PixelPosition, GridConfig } from '../types/index.js';

class GridService {
  /**
   * Converte posição de pixel para grid
   */
  gridFromPixel(
    pixel: PixelPosition,
    gridConfig: GridConfig,
    cameraX: number,
    cameraY: number,
    zoom: number
  ): GridPosition {
    const cellSize = gridConfig.cellSize * gridConfig.cellMultiplier;
    const worldX = (pixel.x / zoom + cameraX) / cellSize;
    const worldY = (pixel.y / zoom + cameraY) / cellSize;
    return {
      col: Math.floor(worldX),
      row: Math.floor(worldY),
    };
  }

  /**
   * Converte posição de grid para pixel
   */
  pixelFromGrid(
    grid: GridPosition,
    gridConfig: GridConfig,
    cameraX: number,
    cameraY: number,
    zoom: number
  ): PixelPosition {
    const cellSize = gridConfig.cellSize * gridConfig.cellMultiplier;
    const worldX = grid.col * cellSize - cameraX;
    const worldY = grid.row * cellSize - cameraY;
    return {
      x: worldX * zoom,
      y: worldY * zoom,
    };
  }

  /**
   * Snap to grid - arredonda para célula mais próxima
   */
  snapToGrid(grid: GridPosition): GridPosition {
    return {
      col: Math.round(grid.col),
      row: Math.round(grid.row),
    };
  }

  /**
   * Calcula distância em cells entre duas posições
   */
  distance(from: GridPosition, to: GridPosition): number {
    const dx = to.col - from.col;
    const dy = to.row - from.row;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calcula distância em metros
   */
  distanceInMeters(
    from: GridPosition,
    to: GridPosition,
    metersPerCell: number | null
  ): number {
    if (!metersPerCell) return 0;
    return this.distance(from, to) * metersPerCell;
  }

  /**
   * Encontra todas as células em um raio
   */
  getCellsInRadius(
    center: GridPosition,
    radius: number
  ): GridPosition[] {
    const cells: GridPosition[] = [];
    for (let col = center.col - radius; col <= center.col + radius; col++) {
      for (let row = center.row - radius; row <= center.row + radius; row++) {
        if (this.distance(center, { col, row }) <= radius) {
          cells.push({ col, row });
        }
      }
    }
    return cells;
  }

  /**
   * Encontra células em um retângulo
   */
  getCellsInRect(
    topLeft: GridPosition,
    bottomRight: GridPosition
  ): GridPosition[] {
    const cells: GridPosition[] = [];
    for (let col = topLeft.col; col <= bottomRight.col; col++) {
      for (let row = topLeft.row; row <= bottomRight.row; row++) {
        cells.push({ col, row });
      }
    }
    return cells;
  }

  /**
   * Valida se coordenada está dentro dos limites do mapa
   */
  isInBounds(
    pos: GridPosition,
    mapWidth: number,
    mapHeight: number
  ): boolean {
    return (
      pos.col >= 0 &&
      pos.col < mapWidth &&
      pos.row >= 0 &&
      pos.row < mapHeight
    );
  }
}

export const gridService = new GridService();
