/**
 * @fileoverview Guia de Migração - VTT Architecture
 * 
 * INSTRUÇÕES DE MIGRAÇÃO DO CÓDIGO LEGADO PARA A NOVA ARQUITETURA
 */

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                      GUIA DE REFATORAÇÃO - VTT PROFISSIONAL                   ║
║                                                                                ║
║ Versão: 1.0                                                                   ║
║ Data: 2025-05-11                                                              ║
║ Status: Estrutura base criada                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝


▓ OBJETIVO
═══════════════════════════════════════════════════════════════════════════════

Transformar aplicação monolítica em arquitetura profissional, escalável e pronta
para multiplayer, mantendo compatibilidade total com funcionalidades existentes.


▓ ESTRUTURA FINAL
═══════════════════════════════════════════════════════════════════════════════

src/
├── types/                           # Domain Models (tipos centralizados)
│   └── index.ts                     # Todas as interfaces e tipos da app
│
├── stores/                          # Global State Management
│   └── game.store.ts                # Store principal com padrão Observer
│
├── services/                        # Lógica de negócio
│   ├── persistence/
│   │   └── persistence.service.ts   # Carregar/salvar campanhas JSON
│   ├── websocket/
│   │   └── websocket.service.ts     # Comunicação em tempo real
│   └── campaign/
│       └── campaign.service.ts      # Gerenciar campanhas (TBD)
│
├── features/                        # Funcionalidades específicas
│   ├── grid/
│   │   └── grid.service.ts          # Cálculos de grid e snap
│   ├── tokens/
│   │   └── token.service.ts         # Operações com tokens
│   ├── maps/
│   │   └── map.service.ts           # Operações com mapas
│   └── fog/
│       └── fog.service.ts           # Névoa de guerra
│
├── engine/                          # Motor de renderização
│   ├── camera/
│   │   └── camera.service.ts        # Sistema de câmera e zoom
│   └── renderer/
│       └── renderer.service.ts      # Renderização do Canvas
│
├── components/                      # Componentes reutilizáveis
│   ├── canvas/
│   │   └── canvas.component.ts      # Componente do canvas principal
│   ├── sidebar/
│   │   └── sidebar.component.ts     # Sidebar com controles (TBD)
│   └── controls/
│       └── controls.component.ts    # Botões e controles (TBD)
│
├── utils/                           # Funções auxiliares
│   ├── math.utils.ts                # Cálculos matemáticos
│   ├── geometry.utils.ts            # Geometria
│   └── color.utils.ts               # Manipulação de cores
│
└── styles/                          # CSS modularizado
    ├── variables.css                # Variáveis globais
    ├── canvas.css                   # Estilos do canvas
    └── sidebar.css                  # Estilos da sidebar


▓ MIGRAÇÃO DE ARQUIVOS LEGADOS
═══════════════════════════════════════════════════════════════════════════════

LEGADO: projeto/js/vtt.js (2000+ linhas monolíticas)
├─ Movimento de câmera              → engine/camera/camera.service.ts
├─ Renderização de grid             → engine/renderer/renderer.service.ts
├─ Renderização de tokens           → engine/renderer/renderer.service.ts
├─ Renderização de fog              → engine/renderer/renderer.service.ts
├─ Manipulação de grid              → features/grid/grid.service.ts
├─ Operações com tokens             → features/tokens/token.service.ts
├─ Operações com mapas              → features/maps/map.service.ts
├─ Manipulação de névoa             → features/fog/fog.service.ts
├─ Event listeners                  → components/canvas/canvas.component.ts
├─ Atualização de DOM               → (será refatorado com componentes)
└─ State management                 → stores/game.store.ts

LEGADO: projeto/js/storage.js (50 linhas)
└─ Carregamento/salvamento          → services/persistence/persistence.service.ts


▓ PADRÕES IMPLEMENTADOS
═══════════════════════════════════════════════════════════════════════════════

1. PADRÃO OBSERVER (Reactive Store)
   ─────────────────────────────────
   - Subscribers se registram no gameStore
   - Quando estado muda, todos são notificados
   - Sem dependências externas

   Uso:
   ```typescript
   const unsubscribe = gameStore.subscribe((state) => {
     console.log('Estado atualizado:', state);
   });
   ```

2. PADRÃO SERVICE (Business Logic)
   ──────────────────────────────
   - Cada domínio tem seu service
   - Serviços são stateless (recebem estado)
   - Retornam novos objetos (imutável)

   Uso:
   ```typescript
   const newToken = tokenService.moveToken(token, newPosition);
   gameStore.addToken(newToken);
   ```

3. PADRÃO COMPONENT (Encapsulamento)
   ──────────────────────────────
   - Componentes encapsulam interatividade
   - Se subscrevem ao store
   - Chamam serviços quando ações ocorrem

   Uso:
   ```typescript
   const canvas = new CanvasComponent('canvas', 'topRuler', 'leftRuler');
   canvas.startRenderLoop();
   ```

4. SEPARAÇÃO DE RESPONSABILIDADES
   ───────────────────────────────
   - Types: Definem estrutura de dados
   - Store: Gerencia estado global reativo
   - Services: Implementam lógica de negócio
   - Renderer: Responsável apenas por desenhar
   - Components: Interagem com usuário


▓ FLUXO DE DADOS
═══════════════════════════════════════════════════════════════════════════════

Usuário clica em mapa
         ↓
Canvas.component detecta evento
         ↓
Calcula posição usando gridService
         ↓
tokenService cria/modifica token
         ↓
gameStore.addToken() atualiza estado
         ↓
Store notifica subscribers
         ↓
Renderer.service renderiza nova frame
         ↓
Canvas atualizado


▓ PRÓXIMOS PASSOS (TBD)
═══════════════════════════════════════════════════════════════════════════════

Fase 1: Componentes Refatorados
───────────────────────────────
□ Criar sidebar.component.ts
□ Criar tool-panel.component.ts
□ Criar map-selector.component.ts
□ Criar token-palette.component.ts

Fase 2: Integração com HTML
──────────────────────────
□ Atualizar HTML para usar novos componentes
□ Manter compatibilidade com CSS existente
□ Testar todas as funcionalidades

Fase 3: WebSocket Multiplayer (Futuro)
──────────────────────────────────────
□ Implementar WebSocketService
□ Sincronizar estado entre clientes
□ Sistema de auth mestre/player
□ Broadcast de eventos

Fase 4: TypeScript Completo
───────────────────────────
□ Converter vtt.js para TypeScript
□ Build process com bundler
□ Type checking em CI/CD

Fase 5: Testes
──────────────
□ Testes unitários para serviços
□ Testes de integração para componentes
□ Testes end-to-end com Cypress


▓ COMO USAR A NOVA ARQUITETURA
═══════════════════════════════════════════════════════════════════════════════

1. CARREGAR CAMPANHA
   ─────────────────
   import { persistenceService } from './services/persistence/index.js';
   const campaign = await persistenceService.loadCampaign('campaign1.json');
   gameStore.hydrate(campaign.state);

2. CRIAR TOKEN
   ──────────
   import { tokenService } from './features/tokens/index.js';
   import { gameStore } from './stores/game.store.js';
   
   const token = tokenService.createToken(
     'Goblin',
     '/images/goblin.png',
     { col: 5, row: 5 },
     'map_123'
   );
   gameStore.addToken(token);

3. MOVER CÂMERA
   ────────────
   import { cameraService } from './engine/camera/index.js';
   import { gameStore } from './stores/game.store.js';
   
   const state = gameStore.getState();
   const newCamera = cameraService.moveCamera(state.camera, -10, -10);
   gameStore.setCamera(newCamera);

4. RENDERIZAR
   ────────
   import { CanvasComponent } from './components/canvas/index.js';
   
   const canvas = new CanvasComponent('canvas', 'topRuler', 'leftRuler');
   canvas.startRenderLoop();


▓ BENEFÍCIOS DA NOVA ARQUITETURA
═══════════════════════════════════════════════════════════════════════════════

✓ Modularidade: Código dividido logicamente
✓ Testabilidade: Cada serviço pode ser testado isoladamente
✓ Escalabilidade: Fácil adicionar novas funcionalidades
✓ Reusabilidade: Componentes e serviços reutilizáveis
✓ Manutenibilidade: Alterações localizadas
✓ TypeScript: Type safety em toda a aplicação
✓ Multiplayer Ready: Estrutura pronta para sync em tempo real
✓ Performance: Rendering otimizado com RAF


▓ CHECKLIST DE MIGRAÇÃO
═══════════════════════════════════════════════════════════════════════════════

□ Criar estrutura de diretórios (✓ FEITO)
□ Definir tipos TypeScript (✓ FEITO)
□ Implementar Global Store (✓ FEITO)
□ Implementar Services básicos (✓ FEITO)
□ Refatorar vtt.js em componentes
□ Atualizar index.html para usar novos componentes
□ Testes de funcionalidade
□ Otimizações de performance
□ Documentação de API
□ Build process e bundler
□ Deploy com CI/CD


*/

export const MIGRATION_GUIDE = {
  version: '1.0',
  date: '2025-05-11',
  status: 'Architecture foundation complete',
};
