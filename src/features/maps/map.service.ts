/**
 * @fileoverview Map Service
 * Gerencia criação e manipulação de mapas
 */

import type { GameMap, GridPosition } from '../types/index.js';

class MapService {
  /**
   * Cria novo mapa
   */
  createMap(
    name: string,
    imageUrl: string,
    widthCells: number,
    heightCells: number,
    number: number
  ): GameMap {
    return {
      id: `map_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      number,
      src: imageUrl,
      widthCells,
      heightCells,
      anchor: { col: 3, row: 3 },
      fog: {
        active: false,
        brushSize: 40,
        strokes: [],
      },
    };
  }

  /**
   * Atualiza dimensões do mapa
   */
  updateMapDimensions(
    map: GameMap,
    widthCells: number,
    heightCells: number
  ): GameMap {
    return {
      ...map,
      widthCells: Math.max(1, widthCells),
      heightCells: Math.max(1, heightCells),
    };
  }

  /**
   * Atualiza posição de âncora do mapa
   */
  updateMapAnchor(map: GameMap, anchor: GridPosition): GameMap {
    return {
      ...map,
      anchor,
    };
  }

  /**
   * Carrega imagem do mapa
   */
  async loadMapImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Falha ao carregar imagem do mapa'));
      img.src = imageUrl;
    });
  }

  /**
   * Clona mapa
   */
  cloneMap(map: GameMap, number: number): GameMap {
    const newMap = { ...map };
    newMap.id = `map_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    newMap.number = number;
    return newMap;
  }

  /**
   * Valida mapa
   */
  validateMap(map: GameMap): boolean {
    return (
      typeof map.id === 'string' &&
      map.id.length > 0 &&
      typeof map.src === 'string' &&
      map.src.length > 0 &&
      map.widthCells > 0 &&
      map.heightCells > 0
    );
  }

  /**
   * Calcula escala de renderização
   */
  calculateRenderScale(
    mapImageWidth: number,
    mapImageHeight: number,
    mapWidthCells: number,
    mapHeightCells: number,
    cellSize: number
  ): number {
    const canvasWidth = mapWidthCells * cellSize;
    const canvasHeight = mapHeightCells * cellSize;
    const scaleX = canvasWidth / mapImageWidth;
    const scaleY = canvasHeight / mapImageHeight;
    return Math.min(scaleX, scaleY);
  }
}

export const mapService = new MapService();
