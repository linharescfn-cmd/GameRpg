// create-token-modal.component.js - modal para definir o nome do token antes do upload
(function(){
  function normalizeTokenName(value){
    return String(value == null ? '' : value).trim();
  }

  function validateTokenName(value){
    var name = normalizeTokenName(value);

    if (!name) {
      return { valid: false, message: 'Nome do token é obrigatório' };
    }

    if (name.length < 2) {
      return { valid: false, message: 'O nome deve ter pelo menos 2 caracteres' };
    }

    if (name.length > 20) {
      return { valid: false, message: 'O nome deve ter no máximo 20 caracteres' };
    }

    return { valid: true, value: name };
  }

  function open(options){
    var config = options || {};
    var onConfirm = typeof config.onConfirm === 'function' ? config.onConfirm : function(){};
    var onCancel = typeof config.onCancel === 'function' ? config.onCancel : function(){};
    var initialValue = normalizeTokenName(config.initialValue || '');

    if (!window.ModalComponent || typeof window.ModalComponent.createModal !== 'function') {
      var fallback = window.prompt(config.title || 'Nome do Token', initialValue);
      var fallbackValidation = validateTokenName(fallback);
      if (fallbackValidation.valid) {
        onConfirm(fallbackValidation.value);
      } else if (fallback !== null) {
        onCancel();
      }
      return null;
    }

    var content = document.createElement('div');
    content.className = 'create-token-modal-content';

    var label = document.createElement('label');
    label.className = 'create-token-modal-label';
    label.setAttribute('for', 'createTokenNameInput');
    label.textContent = 'Nome do Token';

    var input = document.createElement('input');
    input.id = 'createTokenNameInput';
    input.className = 'create-token-modal-input';
    input.type = 'text';
    input.placeholder = 'Ex.: Goblin 01';
    input.autocomplete = 'off';
    input.maxLength = 20;
    input.required = true;
    input.value = initialValue;

    var help = document.createElement('p');
    help.className = 'create-token-modal-help';
    help.textContent = 'Obrigatório, entre 2 e 20 caracteres.';

    var error = document.createElement('p');
    error.className = 'create-token-modal-error';
    error.setAttribute('aria-live', 'polite');

    content.appendChild(label);
    content.appendChild(input);
    content.appendChild(help);
    content.appendChild(error);

    var confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = 'Confirmar';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancelar';

    var modal = window.ModalComponent.createModal({
      title: config.title || 'Nome do Token',
      body: content,
      closeOnBackdrop: false
    });

    modal.setFooter([cancelBtn, confirmBtn]);

    function closeModal(){
      modal.close();
      modal.destroy();
    }

    function submit(){
      var validation = validateTokenName(input.value);
      if (!validation.valid) {
        error.textContent = validation.message;
        input.classList.add('input-error');
        input.focus();
        return;
      }

      error.textContent = '';
      input.classList.remove('input-error');
      closeModal();
      onConfirm(validation.value);
    }

    cancelBtn.addEventListener('click', function(){
      closeModal();
      onCancel();
    });

    confirmBtn.addEventListener('click', submit);
    input.addEventListener('input', function(){
      error.textContent = '';
      input.classList.remove('input-error');
    });
    input.addEventListener('keydown', function(evt){
      if (evt.key === 'Enter') {
        evt.preventDefault();
        submit();
        return;
      }

      if (evt.key === 'Escape') {
        evt.preventDefault();
        closeModal();
        onCancel();
      }
    });

    modal.open();
    setTimeout(function(){
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }, 0);

    return modal;
  }

  window.CreateTokenModal = {
    open: open,
    validateTokenName: validateTokenName,
    normalizeTokenName: normalizeTokenName
  };
})();