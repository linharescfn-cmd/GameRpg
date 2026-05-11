# Documentação de Refatoração - VTT Architecture

## 🎯 Objetivo

Transformar o código monolítico `projeto/js/vtt.js` em uma arquitetura profissional, escalável e pronta para multiplayer.

---

## 📊 Análise do Código Legado

### projeto/js/vtt.js (2000+ linhas)
- **Responsabilidades**: 12+ funcionalidades misturadas
- **Problemas**: 
  - Tudo em um único escopo global
  - Difícil de testar
  - Difícil de estender
  - Acoplamento alto
  - Sem type safety

### projeto/js/storage.js (50 linhas)
- **Responsabilidade**: Carregar/salvar campanhas JSON
- **Facilmente refatorável**: ✅

---

## 🏗️ Nova Arquitetura Implementada

### Estrutura Base Criada

```
src/
├── types/
│   └── index.ts                    # Domain models (400+ linhas de tipos)
├── stores/
│   └── game.store.ts               # State management com Observer
├── services/
│   ├── persistence/
│   │   └── persistence.service.ts  # ✅ Refactored storage.js
│   └── websocket/
│       └── websocket.service.ts    # Multiplayer ready
├── features/
│   ├── grid/
│   │   └── grid.service.ts         # ✅ Grid calculations from vtt.js
│   ├── tokens/
│   │   └── token.service.ts        # ✅ Token operations from vtt.js
│   ├── maps/
│   │   └── map.service.ts          # ✅ Map operations from vtt.js
│   └── fog/
│       └── fog.service.ts          # ✅ Fog of War from vtt.js
├── engine/
│   ├── camera/
│   │   └── camera.service.ts       # ✅ Camera system from vtt.js
│   └── renderer/
│       └── renderer.service.ts     # ✅ Rendering engine from vtt.js
├── components/
│   └── canvas/
│       └── canvas.component.ts     # ✅ Canvas interaction wrapper
└── MIGRATION_GUIDE.ts              # Documentação detalhada
```

---

## 🔄 Mapeamento de Migração

### Código Legado → Nova Arquitetura

#### 1. **Estado Global (vtt.js - `const state = {...}`)**

**De:**
```javascript
const state = {
  ui: { sidebarOpen: true },
  grid: { cellMultiplier: 1, metersPerCell: null },
  maps: [],
  tokens: [],
  enemyTokens: [],
  fog: { active: false, brushSize: 40, strokes: [] }
};
```

**Para:** `src/stores/game.store.ts`
```typescript
import { gameStore } from './stores/game.store.js';

// Ler estado
const state = gameStore.getState();

// Atualizar estado
gameStore.setUI({ sidebarOpen: false });
gameStore.addToken(token);

// Subscribe para mudanças
gameStore.subscribe((state) => console.log('Updated!'));
```

---

#### 2. **Camera System (vtt.js - `let camera = { x: 0, y: 0 }`)**

**De:**
```javascript
// Movimentação manual
camera.x -= deltaX / zoom;
camera.y -= deltaY / zoom;
zoom *= 1.1; // zoom in
```

**Para:** `src/engine/camera/camera.service.ts`
```typescript
import { cameraService } from './engine/camera/camera.service.js';
import { gameStore } from './stores/game.store.js';

const state = gameStore.getState();

// Move camera
const newCamera = cameraService.moveCamera(
  state.camera, 
  -deltaX / zoom, 
  -deltaY / zoom
);
gameStore.setCamera(newCamera);

// Zoom
const zoomedCamera = cameraService.zoomIn(state.camera, 1.1);
gameStore.setCamera(zoomedCamera);
```

---

#### 3. **Grid Calculations (vtt.js - `BASE = 80, cellSize`)**

**De:**
```javascript
const BASE = 80;
let zoom = 1;

function convertPixelToGrid(pixelX, pixelY) {
  const cellSize = BASE * cellMultiplier;
  const col = Math.floor((pixelX / zoom + camera.x) / cellSize);
  const row = Math.floor((pixelY / zoom + camera.y) / cellSize);
  return { col, row };
}
```

**Para:** `src/features/grid/grid.service.ts`
```typescript
import { gridService } from './features/grid/grid.service.js';

const gridPos = gridService.gridFromPixel(
  { x: pixelX, y: pixelY },
  gridConfig,
  camera.x,
  camera.y,
  camera.zoom
);
```

---

#### 4. **Token Operations (vtt.js - `state.tokens.push(...)`)**

**De:**
```javascript
// Criar token
const token = {
  id: generateId(),
  name: 'Goblin',
  position: { col: 5, row: 5 },
  color: TOKEN_COLORS[0],
  size: TOKEN_DEFAULT_SIZE,
  // ... mais 10 propriedades
};
state.tokens.push(token);
updateTokenList();
```

**Para:** `src/features/tokens/token.service.ts`
```typescript
import { tokenService } from './features/tokens/token.service.js';
import { gameStore } from './stores/game.store.js';

const token = tokenService.createToken(
  'Goblin',
  '/images/goblin.png',
  { col: 5, row: 5 },
  mapId,
  'enemy'
);

gameStore.addToken(token);
// Store automaticamente notifica listeners (renderer)
```

---

#### 5. **Map Operations (vtt.js - `state.maps.push(...)`)**

**De:**
```javascript
const newMap = {
  id: mapId,
  src: imageUrl,
  widthCells: 10,
  heightCells: 10,
  anchor: { col: 3, row: 3 },
  number: mapNumber
};
state.maps.push(newMap);
```

**Para:** `src/features/maps/map.service.ts`
```typescript
import { mapService } from './features/maps/map.service.js';

const map = mapService.createMap(
  'Taverna',
  imageUrl,
  10,
  10,
  1
);

gameStore.addMap(map);
```

---

#### 6. **Rendering (vtt.js - `function draw()`)**

**De:**
```javascript
function draw() {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);
  
  // Renderiza mapa
  if (currentMap?.imageObj) {
    ctx.drawImage(currentMap.imageObj, screenX, screenY, ...);
  }
  
  // Renderiza grid
  for (let x = startX; x < endX; x += cellSize) {
    ctx.strokeLine(...);
  }
  
  // Renderiza tokens
  for (const token of state.tokens) {
    ctx.fillCircle(...);
  }
  
  requestAnimationFrame(draw);
}
```

**Para:** `src/engine/renderer/renderer.service.ts` + `src/components/canvas/canvas.component.ts`

```typescript
// Renderer apenas renderiza
import { rendererService } from './engine/renderer/renderer.service.js';

rendererService.render(renderContext, state, topRuler, leftRuler);

// Component gerencia loop
import { CanvasComponent } from './components/canvas/canvas.component.js';

const canvas = new CanvasComponent('canvas', 'topRuler', 'leftRuler');
canvas.startRenderLoop(); // Internamente usa RAF
```

---

#### 7. **Storage/Persistence (projeto/js/storage.js)**

**De:**
```javascript
const Storage = {
  async listCampaigns() {
    const files = ['campaign1.json', 'campaign2.json'];
    const out = [];
    for (const f of files) {
      try {
        const c = await fetch('data/' + f).then(r => r.json());
        out.push({ filename: f, name: c.name });
      } catch(e) { }
    }
    return out;
  },
  
  async loadCampaign(filename) {
    return fetch('data/' + filename).then(r => r.json());
  }
};
```

**Para:** `src/services/persistence/persistence.service.ts`

```typescript
import { persistenceService } from './services/persistence/persistence.service.js';

// Listar campanhas
const campaigns = await persistenceService.listCampaigns();

// Carregar campanha
const campaign = await persistenceService.loadCampaign('campaign1.json');
gameStore.hydrate(campaign.state);

// Salvar campanha
await persistenceService.saveCampaign('campaign1.json', campaign);
```

---

## 📋 Próximas Etapas de Refatoração

### Fase 1: Integração com HTML (Compatibilidade)

Manter `projeto/index.html` funcionando:

```html
<!-- Importar novos módulos -->
<script type="module" src="/src/index.js"></script>

<!-- index.js -->
import { CanvasComponent } from './components/canvas/canvas.component.js';
import { gameStore } from './stores/game.store.js';
import { persistenceService } from './services/persistence/persistence.service.js';

// Inicializar aplicação
const canvas = new CanvasComponent('canvas', 'topRuler', 'leftRuler');
canvas.startRenderLoop();
```

### Fase 2: Refatorar vtt.js Logicamente

1. **Identificar event listeners** → Mover para `CanvasComponent`
2. **Identificar cálculos** → Usar `gridService`, `tokenService`, etc
3. **Identificar DOM updates** → Usar `gameStore.subscribe()`
4. **Testar compatibilidade** com HTML/CSS existente

### Fase 3: TypeScript Completo

Converter JavaScript para TypeScript:
- Type checking em desenvolvmento
- Auto-completion em IDE
- Catch bugs em compile time

### Fase 4: Multiplayer (WebSocket)

Integrar `WebSocketService`:
- Sincronizar estado entre clientes
- Broadcast de eventos
- Sistema de permissões (mestre/player)

---

## ✅ Checklist de Implementação

### Infraestrutura
- ✅ Estrutura de diretórios criada
- ✅ Tipos TypeScript definidos
- ✅ Store global implementado
- ✅ Services de core implementados
- ✅ Componentes CanvasComponent criado
- ❌ Refatoração completa do vtt.js
- ❌ HTML integration testing
- ❌ TypeScript build process
- ❌ WebSocket multiplayer

---

## 🚀 Como Usar Agora

Exemplo de uso completo com a nova arquitetura:

```typescript
// ============================================
// index.ts - Inicialização da aplicação
// ============================================

import { gameStore } from './stores/game.store.js';
import { CanvasComponent } from './components/canvas/canvas.component.js';
import { persistenceService } from './services/persistence/persistence.service.js';
import { mapService } from './features/maps/map.service.js';
import { tokenService } from './features/tokens/token.service.js';
import { gridService } from './features/grid/grid.service.js';

// 1. Subscribir para mudanças de estado
gameStore.subscribe((state) => {
  console.log('Game state updated:', state);
  // Aqui as mudanças dispara re-render automaticamente
});

// 2. Carregar campanha salva
const campaign = await persistenceService.loadCampaign('campaign1.json');
gameStore.hydrate(campaign.state);

// 3. Inicializar Canvas
const canvas = new CanvasComponent('canvas', 'topRuler', 'leftRuler');
canvas.startRenderLoop();

// 4. Setup event listeners para UI
document.getElementById('addMapBtn').addEventListener('click', async (e) => {
  const imageUrl = '/images/mapa.png';
  const map = mapService.createMap('Nova Mapa', imageUrl, 20, 20, 1);
  gameStore.addMap(map);
});

document.getElementById('addTokenBtn').addEventListener('click', () => {
  const state = gameStore.getState();
  const mapId = state.currentMapId;
  if (!mapId) return alert('Selecione um mapa primeiro');
  
  const token = tokenService.createToken(
    'Novo Token',
    '/images/token.png',
    { col: 5, row: 5 },
    mapId,
    'player'
  );
  gameStore.addToken(token);
});
```

---

## 📚 Recursos Adicionais

- [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) - Documentação completa
- [src/MIGRATION_GUIDE.ts](./src/MIGRATION_GUIDE.ts) - Guia de migração
- [src/types/index.ts](./src/types/index.ts) - Definições de tipos
- [src/stores/game.store.ts](./src/stores/game.store.ts) - State management

---

**Status:** ✅ Arquitetura base completa e pronta para integração
