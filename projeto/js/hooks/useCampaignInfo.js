// useCampaignInfo.js - hook minimalista para consumir CampaignService
(function(){
  function create(){
    var current = window.CampaignService && typeof window.CampaignService.getCampaignInfo === 'function'
      ? window.CampaignService.getCampaignInfo()
      : { id: null, name: null };

    var listeners = [];
    var unsubscribeService = null;

    function onChange(fn){
      if (typeof fn !== 'function') return function(){};
      listeners.push(fn);
      fn(current);
      return function(){
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    }

    if (window.CampaignService && typeof window.CampaignService.subscribe === 'function'){
      unsubscribeService = window.CampaignService.subscribe(function(next){
        current = next || { id: null, name: null };
        listeners.forEach(function(fn){ try{ fn(current); }catch(_){} });
      });
    }

    function destroy(){
      listeners = [];
      if (typeof unsubscribeService === 'function') {
        unsubscribeService();
        unsubscribeService = null;
      }
    }

    function get(){ return Object.assign({}, current); }

    return { onChange: onChange, get: get, destroy: destroy };
  }

  window.UseCampaignInfo = { create: create };
})();