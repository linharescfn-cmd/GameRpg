/**
 * @fileoverview Global State Management
 * Padrão Observer para gerenciamento de estado reativo
 */

import type {
  GameState,
  UIState,
  GridConfig,
  Camera,
  Viewport,
  GameMap,
  Token,
  FogState,
} from '../types/index.js';

import {
  DEFAULT_GRID_CONFIG,
  DEFAULT_CAMERA,
  DEFAULT_VIEWPORT,
} from '../types/index.js';

type StateListener = (state: GameState) => void;

class GameStore {
  private state: GameState = {
    ui: {
      sidebarOpen: true,
      selectedTokenId: null,
      selectedMapId: null,
      activeDrawer: null,
      theme: 'dark',
    },
    grid: DEFAULT_GRID_CONFIG,
    camera: DEFAULT_CAMERA,
    viewport: DEFAULT_VIEWPORT,
    maps: [],
    tokens: [],
    enemyTokens: [],
    fog: {
      active: false,
      brushSize: 40,
      strokes: [],
    },
    currentMapId: null,
    isLoading: false,
    error: null,
  };

  private listeners: Set<StateListener> = new Set();

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  /**
   * Get current state
   */
  getState(): Readonly<GameState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Update UI state
   */
  setUI(ui: Partial<UIState>): void {
    this.state.ui = { ...this.state.ui, ...ui };
    this.notify();
  }

  /**
   * Update grid config
   */
  setGridConfig(config: Partial<GridConfig>): void {
    this.state.grid = { ...this.state.grid, ...config };
    this.notify();
  }

  /**
   * Update camera
   */
  setCamera(camera: Partial<Camera>): void {
    this.state.camera = { ...this.state.camera, ...camera };
    this.notify();
  }

  /**
   * Update viewport
   */
  setViewport(viewport: Partial<Viewport>): void {
    this.state.viewport = { ...this.state.viewport, ...viewport };
    this.notify();
  }

  /**
   * Add or update map
   */
  addMap(map: GameMap): void {
    const existingIndex = this.state.maps.findIndex((m) => m.id === map.id);
    if (existingIndex >= 0) {
      this.state.maps[existingIndex] = map;
    } else {
      this.state.maps.push(map);
    }
    if (!this.state.currentMapId) {
      this.state.currentMapId = map.id;
    }
    this.notify();
  }

  /**
   * Remove map
   */
  removeMap(mapId: string): void {
    this.state.maps = this.state.maps.filter((m) => m.id !== mapId);
    if (this.state.currentMapId === mapId) {
      this.state.currentMapId = this.state.maps[0]?.id || null;
    }
    this.notify();
  }

  /**
   * Get map by id
   */
  getMap(mapId: string): GameMap | undefined {
    return this.state.maps.find((m) => m.id === mapId);
  }

  /**
   * Add or update token
   */
  addToken(token: Token): void {
    const existingIndex = this.state.tokens.findIndex((t) => t.id === token.id);
    if (existingIndex >= 0) {
      this.state.tokens[existingIndex] = token;
    } else {
      this.state.tokens.push(token);
    }
    this.notify();
  }

  /**
   * Remove token
   */
  removeToken(tokenId: string): void {
    this.state.tokens = this.state.tokens.filter((t) => t.id !== tokenId);
    if (this.state.ui.selectedTokenId === tokenId) {
      this.state.ui.selectedTokenId = null;
    }
    this.notify();
  }

  /**
   * Get token by id
   */
  getToken(tokenId: string): Token | undefined {
    return this.state.tokens.find((t) => t.id === tokenId);
  }

  /**
   * Add or update enemy token
   */
  addEnemyToken(token: Token): void {
    const existingIndex = this.state.enemyTokens.findIndex(
      (t) => t.id === token.id
    );
    if (existingIndex >= 0) {
      this.state.enemyTokens[existingIndex] = token;
    } else {
      this.state.enemyTokens.push(token);
    }
    this.notify();
  }

  /**
   * Remove enemy token
   */
  removeEnemyToken(tokenId: string): void {
    this.state.enemyTokens = this.state.enemyTokens.filter(
      (t) => t.id !== tokenId
    );
    this.notify();
  }

  /**
   * Get enemy token by id
   */
  getEnemyToken(tokenId: string): Token | undefined {
    return this.state.enemyTokens.find((t) => t.id === tokenId);
  }

  /**
   * Update fog state
   */
  setFog(fog: Partial<FogState>): void {
    this.state.fog = { ...this.state.fog, ...fog };
    this.notify();
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean, error: string | null = null): void {
    this.state.isLoading = isLoading;
    this.state.error = error;
    this.notify();
  }

  /**
   * Reset entire state
   */
  reset(): void {
    this.state = {
      ui: {
        sidebarOpen: true,
        selectedTokenId: null,
        selectedMapId: null,
        activeDrawer: null,
        theme: 'dark',
      },
      grid: DEFAULT_GRID_CONFIG,
      camera: DEFAULT_CAMERA,
      viewport: DEFAULT_VIEWPORT,
      maps: [],
      tokens: [],
      enemyTokens: [],
      fog: {
        active: false,
        brushSize: 40,
        strokes: [],
      },
      currentMapId: null,
      isLoading: false,
      error: null,
    };
    this.notify();
  }

  /**
   * Hydrate state from saved data
   */
  hydrate(savedState: Partial<GameState>): void {
    this.state = { ...this.state, ...savedState };
    this.notify();
  }
}

// Singleton instance
export const gameStore = new GameStore();

// Export store type
export type { GameStore };
