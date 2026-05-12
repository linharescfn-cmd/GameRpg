// token-info-drawer.component.js - drawer lateral com stats avançados do token
(function(){
  var root = null;
  var currentToken = null;
  var currentOptions = {};

  function ensureRoot(){
    if (root) {
      return root;
    }

    root = document.getElementById('tokenInfoDrawer');
    if (!root) {
      root = document.createElement('aside');
      root.id = 'tokenInfoDrawer';
      root.className = 'token-info-drawer';
      root.setAttribute('aria-hidden', 'true');
      document.body.appendChild(root);
    }

    return root;
  }

  function getConnectedUsers(){
    if (window.TokenStatsContext && typeof window.TokenStatsContext.getConnectedUsers === 'function') {
      return window.TokenStatsContext.getConnectedUsers();
    }

    return [];
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

  function setHidden(hidden){
    ensureRoot().classList.toggle('open', !hidden);
    ensureRoot().setAttribute('aria-hidden', String(hidden));
  }

  function close(){
    currentToken = null;
    setHidden(true);
    if (window.TokenStatsContext && typeof window.TokenStatsContext.closeDrawer === 'function') {
      window.TokenStatsContext.closeDrawer();
    }
    if (currentOptions && typeof currentOptions.onClose === 'function') {
      currentOptions.onClose();
    }
  }

  function emitPatch(patch){
    if (!currentToken) {
      return;
    }

    if (currentOptions && typeof currentOptions.onPatch === 'function') {
      var updatedToken = currentOptions.onPatch(currentToken, patch);
      if (updatedToken) {
        currentToken = updatedToken;
      } else {
        currentToken = Object.assign({}, currentToken, patch, {
          stats: Object.assign({}, getTokenStats(currentToken), patch)
        });
      }
    } else {
      currentToken = Object.assign({}, currentToken, patch, {
        stats: Object.assign({}, getTokenStats(currentToken), patch)
      });
    }

    render();
  }

  function renderLinkedPlayerSelect(container, token, stats){
    var users = getConnectedUsers();
    var section = document.createElement('div');
    section.className = 'token-drawer-section';

    var label = document.createElement('label');
    label.textContent = 'Vincular jogador ao token';
    label.setAttribute('for', 'tokenLinkedPlayerSelect');

    if (token.type === 'enemy') {
      var note = document.createElement('div');
      note.className = 'token-drawer-note';
      note.textContent = 'Tokens inimigos não recebem vínculo com player, mas mantêm os mesmos campos de status.';
      section.appendChild(label);
      section.appendChild(note);
      container.appendChild(section);
      return;
    }

    var select = document.createElement('select');
    select.id = 'tokenLinkedPlayerSelect';
    select.className = 'token-drawer-input';

    var emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Sem vínculo';
    select.appendChild(emptyOption);

    users.forEach(function(user){
      var option = document.createElement('option');
      option.value = user.userId;
      option.textContent = user.username + (user.role ? ' (' + user.role + ')' : '');
      if (stats.linkedPlayerId && stats.linkedPlayerId === user.userId) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.value = stats.linkedPlayerId || '';
    select.addEventListener('change', function(){
      emitPatch({ linkedPlayerId: select.value || null });
    });

    section.appendChild(label);
    section.appendChild(select);
    container.appendChild(section);
  }

  function renderHpSection(container, stats){
    var section = document.createElement('div');
    section.className = 'token-drawer-section';

    var label = document.createElement('label');
    label.textContent = 'Sistema de HP';

    var row = document.createElement('div');
    row.className = 'token-hp-row';

    var minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'token-step-button';
    minusBtn.textContent = '-';
    minusBtn.addEventListener('click', function(){
      emitPatch({ hp: (stats.hp || 0) - 1 });
    });

    var input = document.createElement('input');
    input.type = 'number';
    input.className = 'token-drawer-input token-hp-input';
    input.value = String(stats.hp || 0);
    input.addEventListener('input', function(){
      emitPatch({ hp: input.value });
    });

    var plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'token-step-button';
    plusBtn.textContent = '+';
    plusBtn.addEventListener('click', function(){
      emitPatch({ hp: (stats.hp || 0) + 1 });
    });

    row.appendChild(minusBtn);
    row.appendChild(input);
    row.appendChild(plusBtn);

    var maxHpLabel = document.createElement('label');
    maxHpLabel.className = 'token-drawer-subtitle';
    maxHpLabel.textContent = 'HP máximo';

    var maxHpInput = document.createElement('input');
    maxHpInput.type = 'number';
    maxHpInput.min = '0';
    maxHpInput.className = 'token-drawer-input';
    maxHpInput.value = String(stats.maxHp || 0);
    maxHpInput.addEventListener('input', function(){
      emitPatch({ maxHp: maxHpInput.value });
    });

    section.appendChild(label);
    section.appendChild(row);
    section.appendChild(maxHpLabel);
    section.appendChild(maxHpInput);
    container.appendChild(section);
  }

  function renderNumericField(container, labelText, value, onChange){
    var section = document.createElement('div');
    section.className = 'token-drawer-section';

    var label = document.createElement('label');
    label.textContent = labelText;

    var input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.className = 'token-drawer-input';
    input.value = String(value || 0);
    input.addEventListener('input', function(){
      onChange(input.value);
    });

    section.appendChild(label);
    section.appendChild(input);
    container.appendChild(section);
  }

  function render(){
    var rootEl = ensureRoot();
    rootEl.innerHTML = '';

    if (!currentToken) {
      var empty = document.createElement('div');
      empty.className = 'token-drawer-empty';
      empty.textContent = 'Selecione um token para editar as informações avançadas.';
      rootEl.appendChild(empty);
      return;
    }

    var token = currentToken;
    var stats = getTokenStats(token);

    var header = document.createElement('div');
    header.className = 'token-drawer-header';

    var titleWrap = document.createElement('div');

    var title = document.createElement('h2');
    title.className = 'token-drawer-title';
    title.textContent = token.name || 'Token';

    var subtitle = document.createElement('p');
    subtitle.className = 'token-drawer-subtitle';
    subtitle.textContent = token.type === 'enemy' ? 'Token inimigo' : 'Token criado';

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'token-drawer-close';
    closeButton.textContent = 'Fechar';
    closeButton.addEventListener('click', close);

    header.appendChild(titleWrap);
    header.appendChild(closeButton);

    var body = document.createElement('div');
    body.className = 'token-drawer-body';

    renderLinkedPlayerSelect(body, token, stats);
    renderHpSection(body, stats);
    renderNumericField(body, 'Classe de Armadura (CA)', stats.ac, function(value){
      emitPatch({ ac: value });
    });
    renderNumericField(body, 'Deslocamento (D)', stats.distance, function(value){
      emitPatch({ distance: value });
    });

    rootEl.appendChild(header);
    rootEl.appendChild(body);
  }

  function open(token, options){
    if (!token) {
      return;
    }

    currentToken = token;
    currentOptions = options || {};

    if (window.TokenStatsContext && typeof window.TokenStatsContext.openDrawer === 'function') {
      window.TokenStatsContext.openDrawer(token.id);
    }

    setHidden(false);
    render();
  }

  window.TokenInfoDrawer = {
    ensureRoot: ensureRoot,
    open: open,
    close: close,
    render: render
  };
})();