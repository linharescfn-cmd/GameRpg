// export-campaign-modal.component.js - modal centralizado para exportar a campanha em JSON
(function(){
  function open(options){
    var config = options || {};
    var jsonText = String(config.jsonText || '');
    var onCopy = typeof config.onCopy === 'function' ? config.onCopy : null;

    if (!window.ModalComponent || typeof window.ModalComponent.createModal !== 'function') {
      alert(jsonText);
      return null;
    }

    var content = document.createElement('div');
    content.className = 'export-campaign-modal-content';

    var text = document.createElement('p');
    text.className = 'export-campaign-modal-text';
    text.textContent = 'Crie um arquivo de texto com extensão .JSON e cole o código abaixo para salvar a campanha.';

    var textarea = document.createElement('textarea');
    textarea.className = 'export-campaign-modal-code';
    textarea.readOnly = true;
    textarea.spellcheck = false;
    textarea.value = jsonText;

    var actions = document.createElement('div');
    actions.className = 'export-campaign-modal-actions';

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-primary export-campaign-copy-btn';
    copyBtn.textContent = 'Copiar';

    var downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'btn btn-secondary export-campaign-download-btn';
    downloadBtn.textContent = 'Baixar JSON';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-secondary export-campaign-close-btn';
    closeBtn.textContent = 'Fechar';

    var feedback = document.createElement('p');
    feedback.className = 'export-campaign-modal-feedback';
    feedback.setAttribute('aria-live', 'polite');

    actions.appendChild(copyBtn);
  actions.appendChild(downloadBtn);
    actions.appendChild(closeBtn);

    content.appendChild(text);
    content.appendChild(textarea);
    content.appendChild(actions);
    content.appendChild(feedback);

    var modal = window.ModalComponent.createModal({
      title: 'Salvar Campanha',
      body: content,
      closeOnBackdrop: false
    });

    modal.getRoot().classList.add('export-campaign-modal-root');

    function closeModal(){
      modal.close();
      modal.destroy();
    }

    function buildDownloadFileName(){
      try {
        var parsed = JSON.parse(jsonText);
        var campaign = parsed && parsed.campaign ? parsed.campaign : {};
        var baseName = String(campaign.name || 'campanha').trim().toLowerCase();
        var safeName = baseName
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-_.]/g, '');
        var idPart = campaign.id ? '-' + String(campaign.id).toLowerCase() : '';
        return (safeName || 'campanha') + idPart + '.json';
      } catch (_) {
        return 'campanha.json';
      }
    }

    function downloadJson(){
      var blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = buildDownloadFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function(){
        URL.revokeObjectURL(url);
      }, 0);
    }

    copyBtn.addEventListener('click', function(){
      var copyPromise = onCopy
        ? Promise.resolve(onCopy(jsonText))
        : Promise.resolve(false);

      copyPromise.then(function(success){
        if (success) {
          feedback.classList.remove('is-error');
          feedback.textContent = 'Código copiado com sucesso';
          return;
        }

        feedback.classList.add('is-error');
        feedback.textContent = 'Não foi possível copiar o código.';
      }).catch(function(){
        feedback.classList.add('is-error');
        feedback.textContent = 'Não foi possível copiar o código.';
      });
    });

    downloadBtn.addEventListener('click', function(){
      downloadJson();
    });

    closeBtn.addEventListener('click', closeModal);
    textarea.addEventListener('click', function(){
      textarea.select();
    });

    modal.open();
    setTimeout(function(){
      textarea.focus();
      textarea.select();
    }, 0);

    return modal;
  }

  window.ExportCampaignModal = {
    open: open
  };
})();