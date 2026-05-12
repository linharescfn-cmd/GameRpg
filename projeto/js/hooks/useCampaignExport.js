// useCampaignExport.js - orquestra a abertura do modal de exportação
(function(){
  function create(){
    function getExportJson(){
      if (window.CampaignExporterService && typeof window.CampaignExporterService.buildExportJson === 'function') {
        return window.CampaignExporterService.buildExportJson();
      }

      return JSON.stringify({ campaign: { id: null, name: null }, maps: [], tokens: [], chat: [], diceRolls: [] }, null, 2);
    }

    function open(){
      if (!window.ExportCampaignModal || typeof window.ExportCampaignModal.open !== 'function') {
        alert('Sistema de exportação indisponível.');
        return;
      }

      window.ExportCampaignModal.open({
        jsonText: getExportJson(),
        onCopy: function(text){
          if (window.CampaignExporterService && typeof window.CampaignExporterService.copyToClipboard === 'function') {
            return window.CampaignExporterService.copyToClipboard(text);
          }

          return Promise.resolve(false);
        }
      });
    }

    return {
      open: open,
      getExportJson: getExportJson
    };
  }

  window.UseCampaignExport = {
    create: create
  };
})();