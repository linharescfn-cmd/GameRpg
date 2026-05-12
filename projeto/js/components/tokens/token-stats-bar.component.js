// token-stats-bar.component.js - overlay visual dos stats do token
(function(){
  var root = null;
  var config = {
    projectToken: null,
    onOpenToken: null
  };

  function ensureRoot(){
    if (root) {
      return root;
    }

    root = document.getElementById('tokenOverlayLayer');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tokenOverlayLayer';
      root.className = 'token-overlay-layer';

      var container = document.querySelector('.rulers-container') || document.body;
      if (container && container.style && getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      container.appendChild(root);
    }

    return root;
  }

  function getTokenStats(token){
    if (window.TokenStatsContext && typeof window.TokenStatsContext.getTokenStats === 'function') {
      return window.TokenStatsContext.getTokenStats(token.id);
    }

    return token.stats || {
      hp: 0,
      maxHp: 0,
      ac: 0,
      distance: 0,
      linkedPlayerId: null
    };
  }

  function formatStats(token){
    var stats = getTokenStats(token);
    return 'HP:' + stats.hp + ' | CA:' + stats.ac + ' | D:' + stats.distance;
  }

  function configure(nextConfig){
    config = Object.assign({}, config, nextConfig || {});
  }

  function clear(){
    ensureRoot().innerHTML = '';
  }

  function render(tokens){
    var projectToken = config.projectToken;
    var onOpenToken = config.onOpenToken;

    if (typeof projectToken !== 'function') {
      clear();
      return;
    }

    var activeTokenId = window.TokenStatsContext && typeof window.TokenStatsContext.getState === 'function'
      ? window.TokenStatsContext.getState().activeTokenId
      : null;

    var layer = ensureRoot();
    layer.innerHTML = '';

    (tokens || []).forEach(function(token){
      if (!token || token.visible === false) {
        return;
      }

      var projection = projectToken(token);
      if (!projection) {
        return;
      }

      var overlay = document.createElement('div');
      overlay.className = 'token-overlay' + (token.id === activeTokenId ? ' is-active' : '');
      overlay.style.left = projection.left + 'px';
      overlay.style.top = projection.top + 'px';
      overlay.style.width = projection.width + 'px';
      overlay.style.height = projection.height + 'px';

      var statsBar = document.createElement('div');
      statsBar.className = 'token-stats-bar';
      statsBar.textContent = formatStats(token);

      var plusButton = document.createElement('button');
      plusButton.type = 'button';
      plusButton.className = 'token-plus-button';
      plusButton.setAttribute('aria-label', 'Abrir informações do token ' + token.name);
      plusButton.textContent = '+';
      plusButton.addEventListener('click', function(event){
        event.preventDefault();
        event.stopPropagation();
        if (typeof onOpenToken === 'function') {
          onOpenToken(token);
        }
      });

      overlay.appendChild(statsBar);
      overlay.appendChild(plusButton);
      layer.appendChild(overlay);
    });
  }

  window.TokenStatsBar = {
    configure: configure,
    render: render,
    clear: clear,
    ensureRoot: ensureRoot
  };
})();