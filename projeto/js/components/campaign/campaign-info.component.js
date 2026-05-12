// campaign-info.component.js - painel compacto para exibir nome e id da campanha
(function(){
  function createPanel(){
    var root = document.createElement('div');
    root.className = 'campaign-info-panel';

    var title = document.createElement('div');
    title.className = 'campaign-info-title';
    title.textContent = 'Campanha:';

    var name = document.createElement('div');
    name.className = 'campaign-info-name';
    name.textContent = '-';

    var idTitle = document.createElement('div');
    idTitle.className = 'campaign-info-idtitle';
    idTitle.textContent = 'ID:';

    var id = document.createElement('div');
    id.className = 'campaign-info-id';
    id.textContent = '-';

    root.appendChild(title);
    root.appendChild(name);
    root.appendChild(idTitle);
    root.appendChild(id);

    return {
      el: root,
      set: function(info){
        if (!info) info = { name: null, id: null };
        name.textContent = info.name || '-';
        id.textContent = info.id || '-';
        name.title = name.textContent;
        id.title = id.textContent;
      }
    };
  }

  window.CampaignInfoPanel = { createPanel: createPanel };
})();