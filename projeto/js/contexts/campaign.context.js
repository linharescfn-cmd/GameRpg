// campaign.context.js - gerencia campanhas ativas para mestre e player
(function(){
  var ACTIVE_CAMPAIGNS_KEY = 'gamerpg_active_campaigns';

  function safeParse(raw, fallback){
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function readLocalCampaigns(){
    var campaigns = safeParse(localStorage.getItem(ACTIVE_CAMPAIGNS_KEY), []);
    return Array.isArray(campaigns) ? campaigns : [];
  }

  function writeLocalCampaigns(campaigns){
    localStorage.setItem(ACTIVE_CAMPAIGNS_KEY, JSON.stringify(campaigns));
  }

  function validateCampaignName(name){
    var cleaned = String(name || '').trim();
    if(!cleaned){
      return { ok: false, message: 'Nome da campanha obrigatorio.' };
    }
    if(cleaned.length < 3){
      return { ok: false, message: 'Nome da campanha deve ter no minimo 3 caracteres.' };
    }
    return { ok: true, value: cleaned };
  }

  function createCampaign(name, session){
    if(!window.IdGenerator){
      return { ok: false, message: 'Gerador de ID indisponivel.' };
    }

    var validation = validateCampaignName(name);
    if(!validation.ok){
      return { ok: false, message: validation.message };
    }

    var ownerId = session && session.userId ? session.userId : 'anonymous';
    var ownerName = session && session.username ? session.username : 'unknown';

    var campaign = {
      id: window.IdGenerator.generateUniqueId('CMP', 'campaigns'),
      name: validation.value,
      ownerId: ownerId,
      ownerName: ownerName,
      createdAt: Date.now(),
      source: 'local',
      state: {
        ui: { sidebarOpen: true },
        grid: { cellMultiplier: 1, metersPerCell: null },
        maps: [],
        tokens: [],
        enemyTokens: [],
        fog: { active: false, brushSize: 40, strokes: [] }
      }
    };

    var campaigns = readLocalCampaigns();
    campaigns.unshift(campaign);
    writeLocalCampaigns(campaigns);

    return { ok: true, campaign: campaign };
  }

  async function listCampaigns(){
    var fromFiles = [];

    if(window.Storage && typeof window.Storage.listCampaigns === 'function'){
      try {
        var staticCampaigns = await window.Storage.listCampaigns();
        fromFiles = staticCampaigns.map(function(item){
          return {
            id: 'FILE-' + item.filename,
            filename: item.filename,
            name: item.name,
            source: 'file',
            createdAt: Date.now()
          };
        });
      } catch (_) {
        fromFiles = [];
      }
    }

    var fromLocal = readLocalCampaigns();
    return fromLocal.concat(fromFiles);
  }

  function getLocalCampaignById(campaignId){
    var campaigns = readLocalCampaigns();
    return campaigns.find(function(c){ return c.id === campaignId; }) || null;
  }

  window.CampaignContext = {
    validateCampaignName: validateCampaignName,
    createCampaign: createCampaign,
    listCampaigns: listCampaigns,
    getLocalCampaignById: getLocalCampaignById
  };
})();
