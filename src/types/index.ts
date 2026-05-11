/**
 * @fileoverview Core Domain Types
 * Define toda a estrutura de dados da aplicação VTT
 */

// ============================================
// AUTENTICAÇÃO E USUÁRIO
// ============================================

export type UserRole = 'dungeon-master' | 'player';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  color?: string;
}

// ============================================
// CAMPANHAS
// ============================================

export interface Campaign {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  dungeonMasterId: string;
  players: User[];
  maps: GameMap[];
  tokens: Token[];
  state: GameState;
  version: number;
}

export interface CampaignMetadata {
  filename: string;
  name: string;
  lastModified: number;
}

// ============================================
// GRID E MAPA
// ============================================

export interface GridConfig {
  cellMultiplier: number;
  metersPerCell: number | null;
  cellSize: number;
  gridColor: string;
  gridOpacity: number;
}

export interface GameMap {
  id: string;
  name: string;
  number: number;
  src: string;
  imageObj?: HTMLImageElement;
  widthCells: number;
  heightCells: number;
  anchor: GridPosition;
  fog?: FogState;
  metadata?: Record<string, any>;
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

// ============================================
// TOKENS (Criaturas/Personagens)
// ============================================

export type TokenType = 'player' | 'enemy' | 'npc' | 'object';

export interface Token {
  id: string;
  name: string;
  type: TokenType;
  imageUrl: string;
  imageObj?: HTMLImageElement;
  position: GridPosition;
  size: number;
  color: string;
  mapId: string;
  rotation: number;
  visible: boolean;
  locked: boolean;
  metadata?: {
    hp?: number;
    maxHp?: number;
    ac?: number;
    initiativeBonus?: number;
    [key: string]: any;
  };
}

export interface TokenGroup {
  playable: Token[];
  enemies: Token[];
}

// ============================================
// CÂMERA E VIEWPORT
// ============================================

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

// ============================================
// FOG OF WAR (Névoa de Guerra)
// ============================================

export type FogToolMode = 'brush' | 'eraser' | null;

export interface FogState {
  active: boolean;
  brushSize: number;
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  imageData?: ImageData;
  strokes: FogStroke[];
}

export interface FogStroke {
  type: 'brush' | 'eraser';
  points: PixelPosition[];
  brushSize: number;
  timestamp: number;
}

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================

export interface UIState {
  sidebarOpen: boolean;
  selectedTokenId: string | null;
  selectedMapId: string | null;
  activeDrawer: 'tokens' | 'enemies' | 'tools' | null;
  theme: 'dark' | 'light';
}

export interface GameState {
  ui: UIState;
  grid: GridConfig;
  camera: Camera;
  viewport: Viewport;
  maps: GameMap[];
  tokens: Token[];
  enemyTokens: Token[];
  fog: FogState;
  currentMapId: string | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// EVENTOS E COMUNICAÇÃO
// ============================================

export type GameEventType =
  | 'token:move'
  | 'token:create'
  | 'token:delete'
  | 'token:update'
  | 'map:create'
  | 'map:update'
  | 'map:delete'
  | 'fog:stroke'
  | 'fog:clear'
  | 'camera:move'
  | 'campaign:update'
  | 'user:join'
  | 'user:leave';

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  userId: string;
  payload: any;
}

export interface WebSocketMessage {
  type: 'event' | 'sync' | 'auth' | 'error';
  data: GameEvent | Campaign | string;
}

// ============================================
// RESPOSTA DE API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// ============================================
// CONSTANTES
// ============================================

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cellMultiplier: 1,
  metersPerCell: null,
  cellSize: 80,
  gridColor: '#666',
  gridOpacity: 0.3,
};

export const DEFAULT_CAMERA: Camera = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const DEFAULT_VIEWPORT: Viewport = {
  width: 0,
  height: 0,
};

export const TOKEN_DEFAULT_SIZE = 50;

export const TOKEN_COLORS = [
  '#ef4444', '#3b82f6', '#fbbf24', '#10b981', '#f97316',
  '#a855f7', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b',
  '#8b5cf6', '#14b8a6', '#f43f5e', '#7c3aed', '#06b6d4'
];
