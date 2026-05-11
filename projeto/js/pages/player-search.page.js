// player-search.page.js - busca de campanhas ativas por nome
(function(){
  if(!window.RouteGuard || !window.CampaignContext || !window.AuthContext){
    return;
  }

  var session = window.RouteGuard.requireRole('player');
  if(!session){
    return;
  }

  var playerName = document.getElementById('playerName');
  var searchInput = document.getElementById('campaignSearchInput');
  var listRoot = document.getElementById('campaignList');
  var emptyState = document.getElementById('campaignEmptyState');
  var logoutBtn = document.getElementById('logoutPlayerBtn');

  playerName.textContent = session.username + ' (' + session.userId + ')';

  function openCampaign(campaign){
    if(campaign.source === 'file'){
      window.location.href = 'tool.html?campaign=' + encodeURIComponent(campaign.filename);
      return;
    }

    sessionStorage.setItem('loadedGameData', JSON.stringify({
      name: campaign.name,
      state: campaign.state,
      camera: { x: 0, y: 0 }
    }));
    window.location.href = 'tool.html?source=loaded';
  }

  function renderItems(campaigns){
    listRoot.innerHTML = '';

    if(!campaigns.length){
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    campaigns.forEach(function(campaign){
      var card = document.createElement('article');
      card.className = 'campaign-item-card';

      var title = document.createElement('h3');
      title.textContent = campaign.name;

      var meta = document.createElement('p');
      meta.className = 'campaign-subtitle';
      meta.textContent = campaign.source === 'file'
        ? 'Campanha ativa do sistema'
        : 'Campanha ativa criada por ' + (campaign.ownerName || 'Mestre');

      var enterBtn = document.createElement('button');
      enterBtn.className = 'btn btn-primary';
      enterBtn.type = 'button';
      enterBtn.textContent = 'Entrar';
      enterBtn.addEventListener('click', function(){
        openCampaign(campaign);
      });

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(enterBtn);
      listRoot.appendChild(card);
    });
  }

  async function loadCampaigns(){
    var campaigns = await window.CampaignContext.listCampaigns();
    var term = String(searchInput.value || '').trim().toLowerCase();

    if(term){
      campaigns = campaigns.filter(function(campaign){
        return String(campaign.name || '').toLowerCase().indexOf(term) >= 0;
      });
    }

    renderItems(campaigns);
  }

  searchInput.addEventListener('input', loadCampaigns);

  logoutBtn.addEventListener('click', function(){
    window.AuthContext.logout();
    window.location.href = 'auth.html';
  });

  loadCampaigns();
})();
