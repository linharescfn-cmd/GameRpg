// useTokenCreation.js - coordena o fluxo de nome + upload do token
(function(){
  function create(options){
    var config = options || {};
    var pendingCreation = null;

    function clear(){
      pendingCreation = null;
    }

    function request(type){
      if (!type) {
        return;
      }

      if (!window.CreateTokenModal || typeof window.CreateTokenModal.open !== 'function') {
        var fallbackName = window.prompt('Nome do Token');
        var fallbackValidation = window.CreateTokenModal && typeof window.CreateTokenModal.validateTokenName === 'function'
          ? window.CreateTokenModal.validateTokenName(fallbackName)
          : { valid: !!String(fallbackName || '').trim(), value: String(fallbackName || '').trim() };

        if (!fallbackValidation.valid) {
          return;
        }

        pendingCreation = { type: type, name: fallbackValidation.value };
        if (typeof config.onRequestFileSelection === 'function') {
          config.onRequestFileSelection(type, fallbackValidation.value);
        }
        return;
      }

      window.CreateTokenModal.open({
        title: 'Nome do Token',
        onConfirm: function(name){
          pendingCreation = { type: type, name: name };
          if (typeof config.onNameConfirmed === 'function') {
            config.onNameConfirmed(type, name);
          }
          if (typeof config.onRequestFileSelection === 'function') {
            config.onRequestFileSelection(type, name);
          }
        },
        onCancel: function(){
          clear();
          if (typeof config.onCancel === 'function') {
            config.onCancel(type);
          }
        }
      });
    }

    function peek(type){
      if (!pendingCreation || pendingCreation.type !== type) {
        return null;
      }

      return pendingCreation.name;
    }

    function consume(type){
      var currentName = peek(type);
      if (!currentName) {
        return null;
      }

      clear();
      return currentName;
    }

    return {
      request: request,
      peek: peek,
      consume: consume,
      clear: clear
    };
  }

  window.UseTokenCreation = {
    create: create
  };
})();