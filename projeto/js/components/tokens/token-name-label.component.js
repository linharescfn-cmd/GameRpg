// token-name-label.component.js - label compacto para exibir o nome do token
(function(){
  function create(token){
    var label = document.createElement('div');
    label.className = 'token-name-label';
    label.textContent = token && token.name ? String(token.name) : 'Token';
    label.title = label.textContent;
    return label;
  }

  function update(target, token){
    if (!target) {
      return target;
    }

    target.textContent = token && token.name ? String(token.name) : 'Token';
    target.title = target.textContent;
    return target;
  }

  window.TokenNameLabel = {
    create: create,
    update: update
  };
})();