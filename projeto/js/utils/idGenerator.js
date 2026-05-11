// idGenerator.js - gera IDs aleatorios com controle de unicidade em localStorage
(function(){
  var REGISTRY_KEY = 'gamerpg_unique_id_registry';

  function safeParse(raw, fallback){
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function readRegistry(){
    var registry = safeParse(localStorage.getItem(REGISTRY_KEY), {});
    return registry && typeof registry === 'object' ? registry : {};
  }

  function writeRegistry(registry){
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  }

  function randomChar(){
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return chars[array[0] % chars.length];
  }

  function randomSegment(length){
    var out = '';
    for(var i = 0; i < length; i++){
      out += randomChar();
    }
    return out;
  }

  function generateUniqueId(prefix, namespace){
    var idPrefix = String(prefix || 'ID').toUpperCase();
    var scope = String(namespace || 'global').toLowerCase();
    var registry = readRegistry();

    for(var attempt = 0; attempt < 100; attempt++){
      var candidate = idPrefix + '-' + randomSegment(7);
      var key = scope + ':' + candidate;

      if(!registry[key]){
        registry[key] = Date.now();
        writeRegistry(registry);
        return candidate;
      }
    }

    throw new Error('Falha ao gerar ID unico para ' + scope);
  }

  window.IdGenerator = {
    generateUniqueId: generateUniqueId
  };
})();
