// tokenStats.context.js - estado global dos stats e do drawer de tokens
(function(){
  var UI_STORAGE_KEY = 'gamerpg_token_stats_ui';
  var listeners = [];

  function safeParse(raw, fallback){
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function readUiState(){
    var ui = safeParse(localStorage.getItem(UI_STORAGE_KEY), null);
    if (!ui || typeof ui !== 'object') {
      return {
        drawerOpen: false,
        activeTokenId: null
      };
    }

    return {
      drawerOpen: !!ui.drawerOpen,
      activeTokenId: ui.activeTokenId || null
    };
  }

  function writeUiState(state){
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
  }

  var state = readUiState();

  function notify(){
    listeners.forEach(function(listener){
      try {
        listener(getState());
      } catch (_) {
        // ignora listeners quebrados
      }
    });
  }

  function getConnectedUsers(){
    if (window.AuthContext && typeof window.AuthContext.getConnectedUsers === 'function') {
      var connected = window.AuthContext.getConnectedUsers();
      return Array.isArray(connected) ? connected : [];
    }

    var session = window.AuthContext && typeof window.AuthContext.getSession === 'function'
      ? window.AuthContext.getSession()
      : null;

    return session ? [{
      userId: session.userId,
      username: session.username,
      role: session.role || null,
      lastSeen: Date.now()
    }] : [];
  }

  function getState(){
    return {
      drawerOpen: state.drawerOpen,
      activeTokenId: state.activeTokenId
    };
  }

  function setState(nextState){
    state = {
      drawerOpen: !!nextState.drawerOpen,
      activeTokenId: nextState.activeTokenId || null
    };
    writeUiState(state);
    notify();
  }

  function openDrawer(tokenId){
    setState({
      drawerOpen: true,
      activeTokenId: tokenId || null
    });
  }

  function closeDrawer(){
    setState({
      drawerOpen: false,
      activeTokenId: state.activeTokenId
    });
  }

  function setActiveToken(tokenId){
    setState({
      drawerOpen: state.drawerOpen,
      activeTokenId: tokenId || null
    });
  }

  function subscribe(listener){
    listeners.push(listener);
    return function unsubscribe(){
      listeners = listeners.filter(function(fn){ return fn !== listener; });
    };
  }

  function getTokenStats(tokenId, tokenType){
    if (!window.TokenService || typeof window.TokenService.getTokenStats !== 'function') {
      return {
        hp: 0,
        maxHp: 0,
        ac: 0,
        distance: 0,
        linkedPlayerId: null
      };
    }

    return window.TokenService.getTokenStats(tokenId, tokenType);
  }

  function updateTokenStats(tokenId, patch, tokenType){
    if (!window.TokenService || typeof window.TokenService.updateTokenStats !== 'function') {
      return null;
    }

    var currentToken = patch && patch.token ? patch.token : null;
    var updatedToken = window.TokenService.updateTokenStats(currentToken || { id: tokenId, type: tokenType || 'player', stats: getTokenStats(tokenId, tokenType) }, patch);
    notify();
    return updatedToken;
  }

  function setLinkedPlayer(tokenId, linkedPlayerId, tokenType){
    if (!window.TokenService || typeof window.TokenService.setLinkedPlayer !== 'function') {
      return null;
    }

    var updatedToken = window.TokenService.setLinkedPlayer({
      id: tokenId,
      type: tokenType || 'player',
      stats: getTokenStats(tokenId, tokenType)
    }, linkedPlayerId);
    notify();
    return updatedToken;
  }

  function changeHp(tokenId, delta, tokenType){
    if (!window.TokenService || typeof window.TokenService.changeHp !== 'function') {
      return null;
    }

    var updatedToken = window.TokenService.changeHp({
      id: tokenId,
      type: tokenType || 'player',
      stats: getTokenStats(tokenId, tokenType)
    }, delta);
    notify();
    return updatedToken;
  }

  function setHp(tokenId, hp, tokenType){
    if (!window.TokenService || typeof window.TokenService.setHp !== 'function') {
      return null;
    }

    var updatedToken = window.TokenService.setHp({
      id: tokenId,
      type: tokenType || 'player',
      stats: getTokenStats(tokenId, tokenType)
    }, hp);
    notify();
    return updatedToken;
  }

  function setMaxHp(tokenId, maxHp, tokenType){
    if (!window.TokenService || typeof window.TokenService.setMaxHp !== 'function') {
      return null;
    }

    var updatedToken = window.TokenService.setMaxHp({
      id: tokenId,
      type: tokenType || 'player',
      stats: getTokenStats(tokenId, tokenType)
    }, maxHp);
    notify();
    return updatedToken;
  }

  function setAc(tokenId, ac, tokenType){
    if (!window.TokenService || typeof window.TokenService.setAc !== 'function') {
      return null;
    }

    var updatedToken = window.TokenService.setAc({
      id: tokenId,
      type: tokenType || 'player',
      stats: getTokenStats(tokenId, tokenType)
    }, ac);
    notify();
    return updatedToken;
  }

  function setDistance(tokenId, distance, tokenType){
    if (!window.TokenService || typeof window.TokenService.setDistance !== 'function') {
      return null;
    }

    var updatedToken = window.TokenService.setDistance({
      id: tokenId,
      type: tokenType || 'player',
      stats: getTokenStats(tokenId, tokenType)
    }, distance);
    notify();
    return updatedToken;
  }

  window.addEventListener('storage', function(event){
    if (event.key === UI_STORAGE_KEY || event.key === 'gamerpg_token_stats_state' || event.key === 'gamerpg_connected_users') {
      state = readUiState();
      notify();
    }
  });

  window.TokenStatsContext = {
    getState: getState,
    setState: setState,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    setActiveToken: setActiveToken,
    subscribe: subscribe,
    getConnectedUsers: getConnectedUsers,
    getTokenStats: getTokenStats,
    updateTokenStats: updateTokenStats,
    setLinkedPlayer: setLinkedPlayer,
    changeHp: changeHp,
    setHp: setHp,
    setMaxHp: setMaxHp,
    setAc: setAc,
    setDistance: setDistance
  };
})();