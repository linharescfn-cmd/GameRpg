// token.service.js - normalizacao, estatisticas e persistencia dos tokens
(function(){
  var STORAGE_KEY = 'gamerpg_token_stats_state';
  var NAME_STORAGE_KEY = 'gamerpg_token_names_state';

  function safeParse(raw, fallback){
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function readStore(){
    var data = safeParse(localStorage.getItem(STORAGE_KEY), {});
    return data && typeof data === 'object' ? data : {};
  }

  function writeStore(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function readNameStore(){
    var data = safeParse(localStorage.getItem(NAME_STORAGE_KEY), {});
    return data && typeof data === 'object' ? data : {};
  }

  function writeNameStore(data){
    localStorage.setItem(NAME_STORAGE_KEY, JSON.stringify(data));
  }

  function normalizeTokenName(value){
    return String(value == null ? '' : value).trim().slice(0, 20);
  }

  function clampMin(value, minValue){
    var numeric = parseInt(value, 10);
    if (Number.isNaN(numeric)) {
      numeric = 0;
    }
    return Math.max(minValue, numeric);
  }

  function toSignedInteger(value){
    var numeric = parseInt(value, 10);
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  function generateTokenId(){
    return 'token_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  function getDefaultStats(tokenType){
    return {
      hp: 0,
      maxHp: 0,
      ac: 0,
      distance: 0,
      linkedPlayerId: tokenType === 'enemy' ? null : null
    };
  }

  function normalizeStats(stats, tokenType, metadata){
    var base = getDefaultStats(tokenType);
    var source = stats && typeof stats === 'object' ? stats : {};
    var meta = metadata && typeof metadata === 'object' ? metadata : {};

    return {
      hp: toSignedInteger(source.hp != null ? source.hp : meta.hp),
      maxHp: clampMin(source.maxHp != null ? source.maxHp : meta.maxHp, 0),
      ac: clampMin(source.ac != null ? source.ac : meta.ac, 0),
      distance: clampMin(source.distance != null ? source.distance : meta.distance, 0),
      linkedPlayerId: tokenType === 'enemy'
        ? null
        : (source.linkedPlayerId != null ? String(source.linkedPlayerId) : (meta.linkedPlayerId != null ? String(meta.linkedPlayerId) : base.linkedPlayerId))
    };
  }

  function syncMetadata(token){
    var stats = token.stats || getDefaultStats(token.type);
    token.metadata = Object.assign({}, token.metadata || {}, {
      hp: stats.hp,
      maxHp: stats.maxHp,
      ac: stats.ac,
      distance: stats.distance,
      linkedPlayerId: stats.linkedPlayerId || null
    });
    return token;
  }

  function normalizeToken(token){
    if (!token || typeof token !== 'object') {
      return null;
    }

    var normalized = Object.assign({}, token);
    normalized.id = normalized.id || generateTokenId();
    normalized.type = normalized.type || 'player';
    normalized.visible = normalized.visible !== false;
    normalized.locked = !!normalized.locked;
    normalized.borderWidth = typeof normalized.borderWidth === 'number' ? normalized.borderWidth : (normalized.type === 'enemy' ? 4 : 2);
    normalized.stats = normalizeStats(normalized.stats, normalized.type, normalized.metadata);
    normalized = syncMetadata(normalized);
    return normalized;
  }

  function createToken(config){
    var tokenConfig = config && typeof config === 'object' ? config : {};
    var tokenType = tokenConfig.type || 'player';
    var finalName = normalizeTokenName(tokenConfig.name) || 'Token';

    var token = normalizeToken({
      id: tokenConfig.id || generateTokenId(),
      name: finalName,
      type: tokenType,
      src: tokenConfig.src || tokenConfig.imageUrl || '',
      imageObj: tokenConfig.imageObj || null,
      x: typeof tokenConfig.x === 'number' ? tokenConfig.x : 0,
      y: typeof tokenConfig.y === 'number' ? tokenConfig.y : 0,
      size: typeof tokenConfig.size === 'number' ? tokenConfig.size : 50,
      borderColor: tokenConfig.borderColor || (tokenType === 'enemy' ? '#ef4444' : '#3b82f6'),
      borderWidth: typeof tokenConfig.borderWidth === 'number' ? tokenConfig.borderWidth : (tokenType === 'enemy' ? 4 : 2),
      visible: tokenConfig.visible !== false,
      locked: !!tokenConfig.locked,
      stats: tokenConfig.stats || getDefaultStats(tokenType),
      metadata: tokenConfig.metadata || {},
      mapId: tokenConfig.mapId || null
    });

    persistToken(token);
    return token;
  }

  function persistToken(token){
    var normalized = normalizeToken(token);
    if (!normalized) {
      return null;
    }

    var store = readStore();
    store[normalized.id] = normalized.stats;
    writeStore(store);

    var nameStore = readNameStore();
    nameStore[normalized.id] = {
      name: normalizeTokenName(normalized.name),
      type: normalized.type,
      imageUrl: normalized.src || normalized.imageUrl || '',
      mapId: normalized.mapId || null,
      x: typeof normalized.x === 'number' ? normalized.x : null,
      y: typeof normalized.y === 'number' ? normalized.y : null,
      size: typeof normalized.size === 'number' ? normalized.size : null,
      borderColor: normalized.borderColor || null,
      borderWidth: typeof normalized.borderWidth === 'number' ? normalized.borderWidth : null,
      visible: normalized.visible !== false,
      locked: !!normalized.locked,
      metadata: normalized.metadata || null,
      updatedAt: Date.now()
    };
    writeNameStore(nameStore);

    return normalized;
  }

  function hydrateToken(token){
    var normalized = normalizeToken(token);
    if (!normalized) {
      return null;
    }

    var store = readStore();
    if (store[normalized.id]) {
      normalized.stats = normalizeStats(store[normalized.id], normalized.type, normalized.metadata);
      normalized = syncMetadata(normalized);
    } else {
      persistToken(normalized);
    }

    var nameStore = readNameStore();
    if (!String(normalized.name || '').trim() && nameStore[normalized.id] && nameStore[normalized.id].name) {
      normalized.name = normalizeTokenName(nameStore[normalized.id].name) || normalized.name;
    }

    return normalized;
  }

  function hydrateTokens(tokens){
    if (!Array.isArray(tokens)) {
      return [];
    }

    return tokens.map(function(token){
      return hydrateToken(token) || token;
    });
  }

  function removeToken(tokenId){
    if (!tokenId) {
      return;
    }

    var store = readStore();
    if (store[tokenId]) {
      delete store[tokenId];
      writeStore(store);
    }

    var nameStore = readNameStore();
    if (nameStore[tokenId]) {
      delete nameStore[tokenId];
      writeNameStore(nameStore);
    }
  }

  function updateTokenName(token, name){
    var normalized = normalizeToken(token);
    if (!normalized) {
      return null;
    }

    normalized.name = normalizeTokenName(name) || normalized.name;
    persistToken(normalized);
    return normalized;
  }

  function updateTokenStats(token, patch){
    var normalized = normalizeToken(token);
    if (!normalized) {
      return null;
    }

    var currentStats = normalizeStats(normalized.stats, normalized.type, normalized.metadata);
    var nextPatch = patch && typeof patch === 'object' ? patch : {};

    if (Object.prototype.hasOwnProperty.call(nextPatch, 'hp')) {
      currentStats.hp = toSignedInteger(nextPatch.hp);
    }
    if (Object.prototype.hasOwnProperty.call(nextPatch, 'maxHp')) {
      currentStats.maxHp = clampMin(nextPatch.maxHp, 0);
    }
    if (Object.prototype.hasOwnProperty.call(nextPatch, 'ac')) {
      currentStats.ac = clampMin(nextPatch.ac, 0);
    }
    if (Object.prototype.hasOwnProperty.call(nextPatch, 'distance')) {
      currentStats.distance = clampMin(nextPatch.distance, 0);
    }
    if (Object.prototype.hasOwnProperty.call(nextPatch, 'linkedPlayerId')) {
      currentStats.linkedPlayerId = normalized.type === 'enemy'
        ? null
        : (nextPatch.linkedPlayerId ? String(nextPatch.linkedPlayerId) : null);
    }

    normalized.stats = currentStats;
    normalized = syncMetadata(normalized);
    persistToken(normalized);
    return normalized;
  }

  function setLinkedPlayer(token, linkedPlayerId){
    return updateTokenStats(token, {
      linkedPlayerId: linkedPlayerId
    });
  }

  function changeHp(token, delta){
    var normalized = normalizeToken(token);
    if (!normalized) {
      return null;
    }

    return updateTokenStats(normalized, {
      hp: normalized.stats.hp + toSignedInteger(delta)
    });
  }

  function setHp(token, hp){
    return updateTokenStats(token, { hp: hp });
  }

  function setMaxHp(token, maxHp){
    return updateTokenStats(token, { maxHp: maxHp });
  }

  function setAc(token, ac){
    return updateTokenStats(token, { ac: ac });
  }

  function setDistance(token, distance){
    return updateTokenStats(token, { distance: distance });
  }

  function getTokenStats(tokenId, tokenType){
    var store = readStore();
    var fallbackType = tokenType || 'player';
    return store[tokenId] ? normalizeStats(store[tokenId], fallbackType, {}) : getDefaultStats(fallbackType);
  }

  function getAllStoredStats(){
    return readStore();
  }

  function getAllStoredTokenNames(){
    return readNameStore();
  }

  window.TokenService = {
    createToken: createToken,
    normalizeToken: normalizeToken,
    hydrateToken: hydrateToken,
    hydrateTokens: hydrateTokens,
    persistToken: persistToken,
    removeToken: removeToken,
    updateTokenName: updateTokenName,
    updateTokenStats: updateTokenStats,
    setLinkedPlayer: setLinkedPlayer,
    changeHp: changeHp,
    setHp: setHp,
    setMaxHp: setMaxHp,
    setAc: setAc,
    setDistance: setDistance,
    getTokenStats: getTokenStats,
    getAllStoredStats: getAllStoredStats,
    getAllStoredTokenNames: getAllStoredTokenNames,
    normalizeTokenName: normalizeTokenName,
    generateTokenId: generateTokenId
  };
})();