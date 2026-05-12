// jsonExporter.js - serializa objetos de forma segura para exportação
(function(){
  function sanitize(value, seen){
    if (value === null || value === undefined) {
      return value === undefined ? undefined : null;
    }

    var valueType = typeof value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map(function(item){
        return sanitize(item, seen);
      }).filter(function(item){
        return item !== undefined;
      });
    }

    if (valueType === 'object') {
      seen = seen || [];
      if (seen.indexOf(value) >= 0) {
        return undefined;
      }

      seen.push(value);
      var output = {};
      Object.keys(value).forEach(function(key){
        var next = sanitize(value[key], seen);
        if (next !== undefined) {
          output[key] = next;
        }
      });
      seen.pop();
      return output;
    }

    return undefined;
  }

  function stringify(value, space){
    return JSON.stringify(sanitize(value, []), null, typeof space === 'number' ? space : 2);
  }

  window.JsonExporter = {
    sanitize: sanitize,
    stringify: stringify
  };
})();