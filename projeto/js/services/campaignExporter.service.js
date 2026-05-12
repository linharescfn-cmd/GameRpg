// campaignExporter.service.js - monta a exportação da campanha a partir do estado atual
(function(){
  function toNumber(value, fallback){
    var numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : (typeof fallback === 'number' ? fallback : 0);
  }

  function getCampaignInfo(){
    if (window.CampaignService && typeof window.CampaignService.getCampaignInfo === 'function') {
      return window.CampaignService.getCampaignInfo() || { id: null, name: null };
    }

    return { id: null, name: null };
  }

  function getViewport(){
    var camera = window.VTT && typeof window.VTT.getCamera === 'function'
      ? window.VTT.getCamera()
      : { x: 0, y: 0 };
    var zoom = window.VTT && typeof window.VTT.getZoom === 'function'
      ? window.VTT.getZoom()
      : 1;

    return {
      camera: {
        x: toNumber(camera && camera.x, 0),
        y: toNumber(camera && camera.y, 0)
      },
      zoom: toNumber(zoom, 1)
    };
  }

  function getRuntimeHistory(methodName){
    if (!window.CampaignRuntimeLog || typeof window.CampaignRuntimeLog[methodName] !== 'function') {
      return [];
    }

    var history = window.CampaignRuntimeLog[methodName]();
    return Array.isArray(history) ? history : [];
  }

  function getTokenStats(token){
    if (token && token.stats && typeof token.stats === 'object') {
      return token.stats;
    }

    if (window.TokenService && typeof window.TokenService.getTokenStats === 'function' && token && token.id) {
      return window.TokenService.getTokenStats(token.id, token.type) || {};
    }

    return { hp: 0, maxHp: 0, ac: 0, distance: 0 };
  }

  function normalizeMap(map, viewport, index, gridScale){
    var anchor = map && map.anchor ? map.anchor : { col: 0, row: 0 };

    return {
      id: map && map.id ? String(map.id) : 'map-' + (index + 1),
      name: map && map.number != null ? 'Mapa ' + map.number : 'Mapa ' + (index + 1),
      source: {
        path: map && map.src ? String(map.src) : ''
      },
      position: {
        col: toNumber(anchor.col, 0),
        row: toNumber(anchor.row, 0)
      },
      size: {
        widthCells: toNumber(map && map.widthCells, 0),
        heightCells: toNumber(map && map.heightCells, 0)
      },
      scale: toNumber(gridScale, 1),
      zoom: viewport.zoom,
      offsets: {
        x: viewport.camera.x,
        y: viewport.camera.y
      }
    };
  }

  function normalizeToken(token){
    var stats = getTokenStats(token);
    var size = toNumber(token && token.size, 50);
    var layer = token && token.type === 'enemy' ? 'enemyTokens' : 'tokens';

    return {
      id: token && token.id ? String(token.id) : null,
      name: token && token.name ? String(token.name) : 'Token',
      image: {
        path: token && token.src ? String(token.src) : ''
      },
      position: {
        x: toNumber(token && token.x, 0),
        y: toNumber(token && token.y, 0)
      },
      layer: layer,
      scale: size > 0 ? Number((size / 50).toFixed(3)) : 1,
      rotation: toNumber(token && token.rotation, 0),
      status: {
        hp: toNumber(stats.hp, 0),
        ca: toNumber(stats.ac, 0),
        d: toNumber(stats.distance, 0)
      }
    };
  }

  function normalizeChatEntry(entry){
    return {
      author: entry && entry.author ? String(entry.author) : 'Usuário',
      message: entry && entry.message ? String(entry.message) : '',
      channel: entry && entry.channel ? String(entry.channel) : 'general',
      timestamp: entry && entry.timestamp ? String(entry.timestamp) : new Date().toISOString()
    };
  }

  function normalizeRollEntry(entry){
    return {
      user: entry && entry.user ? String(entry.user) : 'Usuário',
      expression: entry && entry.expression ? String(entry.expression) : '',
      diceType: entry && entry.diceType ? String(entry.diceType) : null,
      result: toNumber(entry && entry.result, 0),
      rolls: Array.isArray(entry && entry.rolls) ? entry.rolls.slice() : [],
      kind: entry && entry.kind ? String(entry.kind) : 'player',
      timestamp: entry && entry.timestamp ? String(entry.timestamp) : new Date().toISOString()
    };
  }

  function buildExportData(){
    var campaign = getCampaignInfo();
    var state = window.VTT && typeof window.VTT.getState === 'function'
      ? window.VTT.getState()
      : { maps: [], tokens: [], enemyTokens: [], grid: { cellMultiplier: 1 } };
    var viewport = getViewport();
    var gridScale = state && state.grid ? state.grid.cellMultiplier : 1;
    var maps = Array.isArray(state.maps) ? state.maps.map(function(map, index){
      return normalizeMap(map, viewport, index, gridScale);
    }) : [];
    var tokens = [];

    if (Array.isArray(state.tokens)) {
      tokens = tokens.concat(state.tokens.map(normalizeToken));
    }

    if (Array.isArray(state.enemyTokens)) {
      tokens = tokens.concat(state.enemyTokens.map(normalizeToken));
    }

    return {
      campaign: {
        id: campaign.id || null,
        name: campaign.name || null
      },
      maps: maps,
      tokens: tokens,
      chat: getRuntimeHistory('getChatHistory').map(normalizeChatEntry),
      diceRolls: getRuntimeHistory('getRollHistory').map(normalizeRollEntry)
    };
  }

  function buildExportJson(){
    if (!window.JsonExporter || typeof window.JsonExporter.stringify !== 'function') {
      return JSON.stringify(buildExportData(), null, 2);
    }

    return window.JsonExporter.stringify(buildExportData(), 2);
  }

  function fallbackCopy(text){
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (_) {
      copied = false;
    }

    textarea.remove();
    return copied;
  }

  function copyToClipboard(text){
    var payload = String(text || '');

    if (window.navigator && window.navigator.clipboard && typeof window.navigator.clipboard.writeText === 'function') {
      return window.navigator.clipboard.writeText(payload).then(function(){
        return true;
      }).catch(function(){
        return fallbackCopy(payload);
      });
    }

    return Promise.resolve(fallbackCopy(payload));
  }

  window.CampaignExporterService = {
    buildExportData: buildExportData,
    buildExportJson: buildExportJson,
    copyToClipboard: copyToClipboard
  };
})();