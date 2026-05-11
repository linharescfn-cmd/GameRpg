// modal.component.js - modal reutilizavel com fechamento controlado
(function(){
  function createModal(options){
    var config = options || {};
    var closeOnBackdrop = !!config.closeOnBackdrop;

    var root = document.createElement('div');
    root.className = 'reusable-modal';
    root.setAttribute('aria-hidden', 'true');

    var dialog = document.createElement('div');
    dialog.className = 'reusable-modal-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    var header = document.createElement('div');
    header.className = 'reusable-modal-header';

    var title = document.createElement('h2');
    title.className = 'reusable-modal-title';
    title.textContent = config.title || 'Modal';

    var body = document.createElement('div');
    body.className = 'reusable-modal-body';
    if(config.body){
      if(typeof config.body === 'string'){
        body.innerHTML = config.body;
      } else {
        body.appendChild(config.body);
      }
    }

    var footer = document.createElement('div');
    footer.className = 'reusable-modal-footer';

    header.appendChild(title);
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    root.appendChild(dialog);

    root.addEventListener('click', function(evt){
      if(closeOnBackdrop && evt.target === root){
        close();
      }
    });

    document.body.appendChild(root);

    function open(){
      root.classList.add('open');
      root.setAttribute('aria-hidden', 'false');
    }

    function close(){
      root.classList.remove('open');
      root.setAttribute('aria-hidden', 'true');
    }

    function destroy(){
      root.remove();
    }

    return {
      open: open,
      close: close,
      destroy: destroy,
      setTitle: function(nextTitle){ title.textContent = nextTitle; },
      setBody: function(nextBody){
        body.innerHTML = '';
        if(typeof nextBody === 'string'){
          body.innerHTML = nextBody;
        } else if(nextBody){
          body.appendChild(nextBody);
        }
      },
      setFooter: function(nodes){
        footer.innerHTML = '';
        (nodes || []).forEach(function(node){ footer.appendChild(node); });
      },
      getRoot: function(){ return root; }
    };
  }

  window.ModalComponent = {
    createModal: createModal
  };
})();
