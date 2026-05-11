/**
 * @fileoverview Main Application Entry Point
 * Demonstra como integrar toda a arquitetura profissional do VTT
 */

import type { Campaign } from './types/index.js';

import { gameStore } from './stores/index.js';
import { CanvasComponent } from './components/canvas/index.js';
import { persistenceService } from './services/persistence/index.js';
import { mapService } from './features/maps/index.js';
import { tokenService } from './features/tokens/index.js';
import { gridService } from './features/grid/index.js';
import { cameraService } from './engine/camera/index.js';

/**
 * Inicializa aplicação VTT
 */
export async function initializeVTT(): Promise<void> {
  console.log('🎮 Inicializando VTT Professional...');

  try {
    // 1. Criar componente de canvas
    console.log('📐 Inicializando canvas...');
    const canvas = new CanvasComponent('canvas', 'topRuler', 'leftRuler');

    // 2. Subscribir para mudanças de estado
    console.log('👁️  Configurando listeners...');
    const unsubscribe = gameStore.subscribe((state) => {
      console.log('[State Updated]', {
        maps: state.maps.length,
        tokens: state.tokens.length + state.enemyTokens.length,
        zoom: state.camera.zoom.toFixed(2),
      });
    });

    // 3. Carregar campanha salva
    console.log('📂 Carregando campanha...');
    try {
      const campaign = await persistenceService.loadCampaign('campaign1.json');
      gameStore.hydrate(campaign.state);
      console.log('✅ Campanha carregada:', campaign.name);
    } catch (error) {
      console.warn('⚠️  Nenhuma campanha salva, criando nova...');
      // Criar campanha vazia
    }

    // 4. Criar mapa padrão se não existir
    const state = gameStore.getState();
    if (state.maps.length === 0) {
      console.log('🗺️  Criando mapa padrão...');
      const defaultMap = mapService.createMap(
        'Mapa Padrão',
        '/projeto/data/campaign1.json', // placeholder
        10,
        10,
        1
      );
      gameStore.addMap(defaultMap);
    }

    // 5. Setup event listeners para UI (compatibilidade com HTML existente)
    console.log('🔗 Configurando event listeners...');
    setupUIEventListeners(canvas);

    // 6. Iniciar loop de renderização
    console.log('🎬 Iniciando renderização...');
    canvas.startRenderLoop();

    console.log('✅ VTT Professional inicializado com sucesso!');
    console.log('📖 Documentação: veja ARCHITECTURE_GUIDE.md');
  } catch (error) {
    console.error('❌ Erro ao inicializar VTT:', error);
    throw error;
  }
}

/**
 * Configura event listeners da UI para compatibilidade
 */
function setupUIEventListeners(canvas: CanvasComponent): void {
  // Botão para adicionar mapa (compatibilidade com HTML)
  const applyMapBtn = document.getElementById('applyMap');
  if (applyMapBtn) {
    applyMapBtn.addEventListener('click', () => handleAddMap());
  }

  // Botão para adicionar token (compatibilidade com HTML)
  const addTokenBtn = document.getElementById('addTokenBtn');
  if (addTokenBtn) {
    addTokenBtn.addEventListener('click', () => handleAddToken('player'));
  }

  // Botão para adicionar inimigo (compatibilidade com HTML)
  const addEnemyTokenBtn = document.getElementById('addEnemyTokenBtn');
  if (addEnemyTokenBtn) {
    addEnemyTokenBtn.addEventListener('click', () => handleAddToken('enemy'));
  }

  // Zoom in
  const gridZoomIn = document.getElementById('gridZoomIn');
  if (gridZoomIn) {
    gridZoomIn.addEventListener('click', () => {
      const state = gameStore.getState();
      const newCamera = cameraService.zoomIn(state.camera);
      gameStore.setCamera(newCamera);
    });
  }

  // Zoom out
  const gridZoomOut = document.getElementById('gridZoomOut');
  if (gridZoomOut) {
    gridZoomOut.addEventListener('click', () => {
      const state = gameStore.getState();
      const newCamera = cameraService.zoomOut(state.camera);
      gameStore.setCamera(newCamera);
    });
  }

  // Toggle sidebar
  const toggleBtn = document.getElementById('toggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const state = gameStore.getState();
      gameStore.setUI({ sidebarOpen: !state.ui.sidebarOpen });
    });
  }
}

/**
 * Adiciona novo mapa
 */
function handleAddMap(): void {
  const imgUpload = document.getElementById('imgUpload') as HTMLInputElement;
  const imgW = document.getElementById('imgW') as HTMLInputElement;
  const imgH = document.getElementById('imgH') as HTMLInputElement;

  if (!imgUpload.files?.[0]) {
    alert('Selecione uma imagem');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string;
    const widthCells = parseInt(imgW.value) || 10;
    const heightCells = parseInt(imgH.value) || 10;

    const state = gameStore.getState();
    const mapNumber = state.maps.length + 1;

    const newMap = mapService.createMap(
      `Mapa ${mapNumber}`,
      imageUrl,
      widthCells,
      heightCells,
      mapNumber
    );

    // Carregar imagem
    const img = new Image();
    img.onload = () => {
      newMap.imageObj = img;
      gameStore.addMap(newMap);
    };
    img.src = imageUrl;
  };
  reader.readAsDataURL(imgUpload.files[0]);
}

/**
 * Adiciona novo token
 */
function handleAddToken(type: 'player' | 'enemy'): void {
  const state = gameStore.getState();
  const mapId = state.currentMapId;

  if (!mapId) {
    alert('Selecione um mapa primeiro');
    return;
  }

  const tokenUpload = document.getElementById(
    type === 'player' ? 'tokenImageUpload' : 'enemyTokenImageUpload'
  ) as HTMLInputElement;

  if (!tokenUpload.files?.[0]) {
    alert('Selecione uma imagem de token');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string;
    const tokenName = prompt('Nome do token:', `${type === 'player' ? 'Jogador' : 'Inimigo'} ${Date.now()}`);

    if (!tokenName) return;

    const newToken = tokenService.createToken(
      tokenName,
      imageUrl,
      { col: 5, row: 5 },
      mapId,
      type
    );

    // Carregar imagem
    const img = new Image();
    img.onload = () => {
      newToken.imageObj = img;
      if (type === 'player') {
        gameStore.addToken(newToken);
      } else {
        gameStore.addEnemyToken(newToken);
      }
    };
    img.src = imageUrl;
  };
  reader.readAsDataURL(tokenUpload.files[0]);
}

/**
 * Salva campanha atual
 */
export async function saveCampaign(): Promise<void> {
  const state = gameStore.getState();
  const campaign: Campaign = {
    id: `campaign_${Date.now()}`,
    name: prompt('Nome da campanha:', 'Minha Campanha') || 'Campanha Sem Nome',
    description: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dungeonMasterId: 'master_1',
    players: [],
    maps: state.maps,
    tokens: [...state.tokens, ...state.enemyTokens],
    state,
    version: 1,
  };

  await persistenceService.saveCampaign('campaign1.json', campaign);
  alert('Campanha salva com sucesso!');
}

/**
 * Carrega campanha salva
 */
export async function loadCampaign(filename: string): Promise<void> {
  const campaign = await persistenceService.loadCampaign(filename);
  gameStore.hydrate(campaign.state);
  alert(`Campanha "${campaign.name}" carregada!`);
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initializeVTT().catch(console.error));
} else {
  initializeVTT().catch(console.error);
}

// Exportar para uso em consola
window.VTT_DEBUG = {
  gameStore,
  persistenceService,
  mapService,
  tokenService,
  gridService,
  cameraService,
  saveCampaign,
  loadCampaign,
};

export type { Campaign };
