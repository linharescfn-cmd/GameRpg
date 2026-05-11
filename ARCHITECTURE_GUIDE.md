/**
 * @fileoverview Architecture Guide
 * Documentação completa da nova arquitetura profissional
 */

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                  VTT PROFESSIONAL ARCHITECTURE GUIDE                       ║
║                                                                              ║
║ Uma aplicação VTT (Virtual Tabletop) profissional, escalável e pronta       ║
║ para multiplayer foi implementada com a seguinte arquitetura:               ║
╚════════════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════════════
1. CAMADA DE TIPOS (src/types/)
═══════════════════════════════════════════════════════════════════════════════

Define toda a estrutura de dados da aplicação de forma centralizada e type-safe.

Arquivos:
- index.ts: Todas as interfaces e tipos da aplicação

Principais tipos:
- Campaign: Estrutura completa de uma campanha
- GameMap: Definição de mapa com dimensões de grid
- Token: Criatura/personagem com posição, tamanho, cor
- GameState: Estado global da aplicação
- User: Informações de usuário (mestre/player)
- GameEvent: Eventos que ocorrem durante o jogo


═══════════════════════════════════════════════════════════════════════════════
2. CAMADA DE ESTADO (src/stores/)
═══════════════════════════════════════════════════════════════════════════════

Gerencia o estado global reativo usando padrão Observer.

Implementação: Padrão Observer (sem dependências externas)

Arquivo: game.store.ts

Características:
- Subscribers se registram para mudanças de estado
- Notificação automática quando estado muda
- Métodos específicos para cada domínio (UI, grid, câmera, etc)
- Imutabilidade: Cria novos objetos em vez de modificar

Exemplo:
```typescript
import { gameStore } from './stores/game.store.js';

// Subscribe para mudanças
const unsubscribe = gameStore.subscribe((state) => {
  console.log('Estado atualizado:', state);
});

// Atualizar estado
gameStore.setUI({ sidebarOpen: false });
gameStore.addToken(token);

// Desinscrever
unsubscribe();
```


═══════════════════════════════════════════════════════════════════════════════
3. CAMADA DE SERVIÇOS (src/services/ e src/features/)
═══════════════════════════════════════════════════════════════════════════════

Implementa a lógica de negócio do VTT. Serviços são stateless e imutáveis.

3.1 PERSISTÊNCIA (services/persistence/)
────────────────────────────────────────
persistenceService: Carrega/salva campanhas JSON

Métodos:
- loadCampaign(filename): Carrega campanha por arquivo
- listCampaigns(): Lista campanhas disponíveis
- saveCampaign(filename, campaign): Salva campanha
- saveGameSession(gameData): Salva em sessionStorage
- loadGameSession(): Carrega de sessionStorage
- exportCampaign(campaign): Exporta como JSON
- importCampaign(file): Importa de arquivo


3.2 WEBSOCKET (services/websocket/)
───────────────────────────────────
WebSocketService: Comunicação em tempo real para multiplayer

Características:
- Reconexão automática
- Handlers para diferentes tipos de mensagem
- Suporte a eventos do jogo
- Pronto para sincronizar estado entre clientes

Métodos:
- connect(): Conecta ao servidor
- disconnect(): Desconecta
- send(message): Envia mensagem
- sendGameEvent(event): Envia evento
- on(type, handler): Registra handler
- onGameEvent(handler): Registra handler de evento
- isConnected(): Verifica status


3.3 FEATURES - GRID (features/grid/)
───────────────────────────────────
gridService: Cálculos de grid e posicionamento

Métodos:
- gridFromPixel(): Converte pixel para coordenada de grid
- pixelFromGrid(): Converte grid para coordenada de tela
- snapToGrid(): Arredonda para célula mais próxima
- distance(): Calcula distância entre cells
- distanceInMeters(): Calcula distância em metros
- getCellsInRadius(): Encontra células em raio
- getCellsInRect(): Encontra células em retângulo
- isInBounds(): Valida coordenada


3.4 FEATURES - TOKENS (features/tokens/)
───────────────────────────────────────
tokenService: Operações com tokens

Métodos:
- createToken(): Cria novo token
- moveToken(): Move token
- resizeToken(): Redimensiona
- rotateToken(): Rotaciona
- toggleTokenVisibility(): Mostra/oculta
- toggleTokenLocked(): Bloqueia/desbloqueia
- updateTokenMetadata(): Atualiza dados (HP, AC, etc)
- cloneToken(): Clona com offset
- getTokensByMap(): Filtra por mapa
- getTokenAtPosition(): Encontra na posição
- findTokenById(): Busca por ID


3.5 FEATURES - MAPS (features/maps/)
────────────────────────────────────
mapService: Operações com mapas

Métodos:
- createMap(): Cria novo mapa
- updateMapDimensions(): Altera tamanho
- updateMapAnchor(): Altera ponto de âncora
- loadMapImage(): Carrega imagem
- cloneMap(): Clona mapa
- validateMap(): Valida estrutura
- calculateRenderScale(): Calcula escala


3.6 FEATURES - FOG OF WAR (features/fog/)
──────────────────────────────────────────
fogService: Névoa de guerra

Métodos:
- initializeFogCanvas(): Cria canvas de névoa
- clearFog(): Limpa toda névoa
- drawStroke(): Desenha stroke (brush ou eraser)
- undoStroke(): Desfaz último stroke
- exportFogAsImage(): Exporta como PNG
- importFogFromImage(): Importa de imagem


═══════════════════════════════════════════════════════════════════════════════
4. CAMADA DE ENGINE (src/engine/)
═══════════════════════════════════════════════════════════════════════════════

Renderização e câmera.

4.1 CAMERA (engine/camera/)
───────────────────────────
cameraService: Sistema de câmera com zoom e pan

Métodos:
- moveCamera(): Pan (deslocar)
- zoomIn(): Aumentar zoom
- zoomOut(): Diminuir zoom
- resetCamera(): Resetar para origem
- focusOnPoint(): Centraliza em ponto
- fitRectInViewport(): Ajusta para mostrar retângulo
- isPointVisible(): Testa visibilidade
- getVisibleBounds(): Obtém área visível
- lerpCamera(): Suaviza transição


4.2 RENDERER (engine/renderer/)
───────────────────────────────
rendererService: Renderização principal do canvas

Implementação: RequestAnimationFrame para 60fps

Métodos:
- initialize(): Setup do contexto 2D
- render(): Renderiza um frame
  - Renderiza mapa
  - Renderiza grid
  - Renderiza tokens
  - Renderiza névoa
  - Renderiza rulers
- onFrame(): Registra callback por frame


═══════════════════════════════════════════════════════════════════════════════
5. CAMADA DE COMPONENTES (src/components/)
═══════════════════════════════════════════════════════════════════════════════

Componentes reutilizáveis que encapsulam interatividade.

5.1 CANVAS COMPONENT (components/canvas/)
──────────────────────────────────────────
CanvasComponent: Gerencia canvas principal

Responsabilidades:
- Gerenciar resize do canvas
- Capturar eventos (mouse, touch)
- Iniciar loop de renderização
- Converter coordenadas screen→world

Métodos:
- constructor(canvasId, topRulerId?, leftRulerId?): Inicializa
- startRenderLoop(): Inicia RAF
- stopRenderLoop(): Para RAF
- getWorldCoordinates(e): Converte mouse event
- destroy(): Limpeza


═══════════════════════════════════════════════════════════════════════════════
6. FLUXO DE DADOS COMPLETO
═══════════════════════════════════════════════════════════════════════════════

Quando usuário clica para criar token:

1. CanvasComponent capta evento mousedown
2. Calcula posição em coordenadas mundo
3. Converte para grid usando gridService.gridFromPixel()
4. Cria token usando tokenService.createToken()
5. Adiciona ao store: gameStore.addToken(token)
6. Store notifica subscribers (incluindo renderer)
7. Renderer renderiza novo frame com token
8. Canvas atualizado na tela


═══════════════════════════════════════════════════════════════════════════════
7. EXEMPLO DE USO COMPLETO
═══════════════════════════════════════════════════════════════════════════════

// Inicializar aplicação
import { gameStore } from './stores/game.store.js';
import { CanvasComponent } from './components/canvas/index.js';
import { persistenceService } from './services/persistence/index.js';
import { mapService } from './features/maps/index.js';
import { tokenService } from './features/tokens/index.js';

// 1. Carregar campanha salva
const campaign = await persistenceService.loadCampaign('campaign1.json');
gameStore.hydrate(campaign.state);

// 2. Criar mapa
const map = mapService.createMap(
  'Taverna',
  '/images/taverna.png',
  10,
  10,
  1
);
gameStore.addMap(map);

// 3. Criar token de jogador
const playerToken = tokenService.createToken(
  'Aragorn',
  '/images/aragorn.png',
  { col: 5, row: 5 },
  map.id,
  'player'
);
gameStore.addToken(playerToken);

// 4. Inicializar canvas
const canvas = new CanvasComponent('canvas', 'topRuler', 'leftRuler');

// 5. Subscribir para mudanças
gameStore.subscribe((state) => {
  console.log('Estado atualizado:', state);
});

// 6. Iniciar renderização
canvas.startRenderLoop();

// 7. Mover token (exemplo)
const movedToken = tokenService.moveToken(playerToken, { col: 6, row: 6 });
gameStore.addToken(movedToken);


═══════════════════════════════════════════════════════════════════════════════
8. PREPARAÇÃO PARA MULTIPLAYER
═══════════════════════════════════════════════════════════════════════════════

A arquitetura está pronta para multiplayer:

1. WebSocketService para comunicação em tempo real
2. GameEvent para sincronizar ações entre clientes
3. User/Role para system de permissões (mestre/player)
4. Campaign.dungeonMasterId para controle de quem pode editar
5. Subscribers automáticos para sincronizar estado localmente


═══════════════════════════════════════════════════════════════════════════════
9. VANTAGENS DA ARQUITETURA
═══════════════════════════════════════════════════════════════════════════════

✓ Separação de responsabilidades bem definida
✓ Fácil de testar (serviços são puros)
✓ Fácil de estender (novo feature = novo service)
✓ Performance otimizada (RAF, rerendering apenas quando necessário)
✓ Type-safe com TypeScript
✓ Sem dependências externas (puro vanilla JS)
✓ Pronto para multiplayer
✓ Modular e reutilizável


═══════════════════════════════════════════════════════════════════════════════
10. PRÓXIMAS FASES DE DESENVOLVIMENTO
═══════════════════════════════════════════════════════════════════════════════

Fase 1: Refatoração completa do vtt.js
- Converter para componentes modulares
- Integrar todos os e

vent listeners com CanvasComponent
- Testar compatibilidade com HTML existente

Fase 2: Componentes adicionais
- SidebarComponent
- ToolPanelComponent
- MapSelectorComponent
- TokenPaletteComponent

Fase 3: Multiplayer
- Integrar WebSocketService
- Sistema de sync de estado
- Auth mestre/player
- Broadcast de eventos

Fase 4: Build process
- TypeScript compiler
- Bundler (esbuild/vite)
- Source maps
- Tree shaking

Fase 5: Testes
- Testes unitários
- Testes de integração
- E2E com Cypress


*/

export const ARCHITECTURE_INFO = {
  version: '1.0',
  layers: [
    'Types (Shared Domain)',
    'Stores (State Management)',
    'Services (Business Logic)',
    'Engine (Rendering)',
    'Components (UI & Interaction)',
  ],
  patterns: [
    'Observer Pattern (Reactive Store)',
    'Service Pattern (Stateless Logic)',
    'Component Pattern (Encapsulation)',
    'Dependency Injection (Services)',
  ],
};
