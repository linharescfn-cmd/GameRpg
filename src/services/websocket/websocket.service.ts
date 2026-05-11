/**
 * @fileoverview WebSocket Service
 * Gerencia comunicação em tempo real para multiplayer
 */

import type { GameEvent, WebSocketMessage } from '../types/index.js';

type MessageHandler = (data: any) => void;
type EventHandler = (event: GameEvent) => void;

interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private eventHandlers: Set<EventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.maxReconnectAttempts = config.reconnectAttempts || 5;
    this.reconnectInterval = config.reconnectInterval || 3000;
  }

  /**
   * Conecta ao servidor WebSocket
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) return;
      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('[WebSocketService] Conectado');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocketService] Erro:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocketService] Desconectado');
          this.isConnecting = false;
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Tenta reconectar
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[WebSocketService] Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(() => this.connect().catch(console.error), this.reconnectInterval);
    } else {
      console.error('[WebSocketService] Máximo de tentativas de reconexão atingido');
    }
  }

  /**
   * Desconecta do servidor
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Envia mensagem
   */
  public send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocketService] WebSocket não está conectado');
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Envia evento do jogo
   */
  public sendGameEvent(event: GameEvent): void {
    this.send({
      type: 'event',
      data: event,
    });
  }

  /**
   * Processa mensagem recebida
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      // Notifica handlers genéricos
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => handler(message.data));
      }

      // Notifica handlers de eventos
      if (message.type === 'event' && typeof message.data === 'object') {
        const event = message.data as GameEvent;
        this.eventHandlers.forEach((handler) => handler(event));
      }
    } catch (error) {
      console.error('[WebSocketService] Erro ao processar mensagem:', error);
    }
  }

  /**
   * Registra handler para tipo de mensagem
   */
  public on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Retorna função para remover listener
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * Registra handler para eventos do jogo
   */
  public onGameEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  /**
   * Verifica status de conexão
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export { WebSocketService };

/**
 * Factory para criar instância do serviço
 */
export function createWebSocketService(url: string): WebSocketService {
  return new WebSocketService({ url });
}
