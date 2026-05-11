/**
 * @fileoverview Token Service
 * Gerencia criação, atualização e manipulação de tokens
 */

import type { Token, GridPosition, TokenType } from '../types/index.js';
import { TOKEN_COLORS, TOKEN_DEFAULT_SIZE, gameStore } from '../stores/game.store.js';

class TokenService {
  /**
   * Cria novo token
   */
  createToken(
    name: string,
    imageUrl: string,
    position: GridPosition,
    mapId: string,
    type: TokenType = 'player',
    color?: string
  ): Token {
    const token: Token = {
      id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      type,
      imageUrl,
      position,
      size: TOKEN_DEFAULT_SIZE,
      color: color || this.getNextColor(),
      mapId,
      rotation: 0,
      visible: true,
      locked: false,
    };
    return token;
  }

  /**
   * Obtém próxima cor disponível
   */
  private getNextColor(): string {
    const state = gameStore.getState();
    const usedColors = [
      ...state.tokens,
      ...state.enemyTokens,
    ].map((t) => t.color);

    for (const color of TOKEN_COLORS) {
      if (!usedColors.includes(color)) {
        return color;
      }
    }

    return TOKEN_COLORS[Math.floor(Math.random() * TOKEN_COLORS.length)];
  }

  /**
   * Move token para nova posição
   */
  moveToken(token: Token, newPosition: GridPosition): Token {
    return {
      ...token,
      position: newPosition,
    };
  }

  /**
   * Redimensiona token
   */
  resizeToken(token: Token, size: number): Token {
    return {
      ...token,
      size: Math.max(10, size),
    };
  }

  /**
   * Rotaciona token
   */
  rotateToken(token: Token, angle: number): Token {
    return {
      ...token,
      rotation: angle % 360,
    };
  }

  /**
   * Alterna visibilidade do token
   */
  toggleTokenVisibility(token: Token): Token {
    return {
      ...token,
      visible: !token.visible,
    };
  }

  /**
   * Alterna se token está bloqueado
   */
  toggleTokenLocked(token: Token): Token {
    return {
      ...token,
      locked: !token.locked,
    };
  }

  /**
   * Atualiza metadados do token
   */
  updateTokenMetadata(
    token: Token,
    metadata: Record<string, any>
  ): Token {
    return {
      ...token,
      metadata: { ...token.metadata, ...metadata },
    };
  }

  /**
   * Clona token
   */
  cloneToken(token: Token, offset: GridPosition = { col: 1, row: 1 }): Token {
    return {
      ...token,
      id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      position: {
        col: token.position.col + offset.col,
        row: token.position.row + offset.row,
      },
    };
  }

  /**
   * Filtra tokens por mapa
   */
  getTokensByMap(mapId: string): Token[] {
    const state = gameStore.getState();
    return [
      ...state.tokens,
      ...state.enemyTokens,
    ].filter((t) => t.mapId === mapId);
  }

  /**
   * Encontra token na posição
   */
  getTokenAtPosition(
    position: GridPosition,
    mapId: string
  ): Token | undefined {
    return this.getTokensByMap(mapId).find(
      (t) =>
        t.position.col === position.col && t.position.row === position.row
    );
  }

  /**
   * Encontra token por ID em qualquer grupo
   */
  findTokenById(tokenId: string): Token | undefined {
    const state = gameStore.getState();
    return (
      state.tokens.find((t) => t.id === tokenId) ||
      state.enemyTokens.find((t) => t.id === tokenId)
    );
  }

  /**
   * Valida token
   */
  validateToken(token: Token): boolean {
    return (
      typeof token.id === 'string' &&
      typeof token.name === 'string' &&
      token.name.length > 0 &&
      typeof token.position === 'object' &&
      typeof token.mapId === 'string' &&
      token.mapId.length > 0
    );
  }
}

export const tokenService = new TokenService();
