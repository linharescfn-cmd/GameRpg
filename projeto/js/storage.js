// storage.js — gerencia campanhas JSON em /data
(function(){
  async function _load(path){
    const r = await fetch(path);
    if(!r.ok) throw new Error('Arquivo não encontrado: '+path);
    return r.json();
  }

  const Storage = {
    async listCampaigns(){
      const files = ['campaign1.json','campaign2.json'];
      const out = [];
      for(const f of files){
        try{
          const c = await _load('data/'+f);
          out.push({filename:f, name:c.name || f});
        }catch(e){ }
      }
      return out;
    },
    async loadCampaign(filename){
      return _load('data/'+filename);
    },
    async saveCampaign(filename, data){
      // Requisição PUT depende de servidor; stub retorna false por padrão
      try{
        const res = await fetch('data/'+filename, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(data, null, 2)
        });
        return res.ok;
      }catch(e){
        return false;
      }
    }
  };

  window.Storage = Storage;
})();
