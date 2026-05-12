// campaign.service.js - serviço simples para expor informações da campanha e persistência local
(function(){
  var STORAGE_KEY = 'gamerpg_campaign_info';

  function safeParse(raw, fallback){
    try { return JSON.parse(raw); } catch (_) { return fallback; }
  }

  function readStore(){
    return safeParse(localStorage.getItem(STORAGE_KEY), null);
  }

  function writeStore(data){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
  }

  var current = readStore() || { id: null, name: null };
  var listeners = [];

  function notify(){
    listeners.forEach(function(fn){ try { fn(current); } catch(_){} });
  }

  function setCampaignInfo(info){
    if (!info || typeof info !== 'object') return;
    var next = { id: info.id || null, name: info.name || null };
    current = next;
    writeStore(current);
    notify();
  }

  function getCampaignInfo(){
    return Object.assign({}, current);
  }

  function subscribe(fn){
    if (typeof fn !== 'function') return function(){};
    listeners.push(fn);
    // emit current immediately
    try { fn(current); } catch(_){}
    return function(){
      var idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  window.CampaignService = {
    setCampaignInfo: setCampaignInfo,
    getCampaignInfo: getCampaignInfo,
    subscribe: subscribe
  };
})();