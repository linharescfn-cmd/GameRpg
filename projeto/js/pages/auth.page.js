// auth.page.js - fluxo de login temporario e escolha obrigatoria de perfil
(function(){
  if(!window.AuthContext || !window.AuthFormComponent || !window.ModalComponent){
    return;
  }

  var loginRoot = document.getElementById('temporaryLoginRoot');
  var globalNotice = document.getElementById('authGlobalNotice');

  function setNotice(message, type){
    globalNotice.textContent = message || '';
    globalNotice.className = 'form-notice ' + (type || '');
  }

  function openRoleSelectionModal(){
    var body = document.createElement('div');
    body.className = 'role-choice-body';

    var text = document.createElement('p');
    text.className = 'role-choice-text';
    text.textContent = 'Como deseja entrar?';

    var actions = document.createElement('div');
    actions.className = 'role-choice-actions';

    var masterBtn = document.createElement('button');
    masterBtn.type = 'button';
    masterBtn.className = 'btn btn-primary';
    masterBtn.textContent = 'Mestre';

    var playerBtn = document.createElement('button');
    playerBtn.type = 'button';
    playerBtn.className = 'btn btn-secondary';
    playerBtn.textContent = 'Player';

    actions.appendChild(masterBtn);
    actions.appendChild(playerBtn);
    body.appendChild(text);
    body.appendChild(actions);

    var modal = window.ModalComponent.createModal({
      title: 'Acesso ao Sistema',
      body: body,
      closeOnBackdrop: false
    });

    masterBtn.addEventListener('click', function(){
      var result = window.AuthContext.setRole('master');
      if(!result.ok){
        setNotice(result.message, 'error');
        return;
      }
      modal.close();
      modal.destroy();
      window.location.href = 'index.html';
    });

    playerBtn.addEventListener('click', function(){
      var result = window.AuthContext.setRole('player');
      if(!result.ok){
        setNotice(result.message, 'error');
        return;
      }
      modal.close();
      modal.destroy();
      window.location.href = 'player-search.html';
    });

    modal.open();
  }

  var currentSession = window.AuthContext.getSession();
  if(currentSession){
    if(currentSession.role){
      if(window.RouteGuard){
        window.RouteGuard.redirectByRole(currentSession);
      }
      return;
    }
    openRoleSelectionModal();
    return;
  }

  var formApi = window.AuthFormComponent.renderTemporaryLogin(loginRoot, function(payload){
    setNotice('', '');
    formApi.setError('');

    var validation = window.AuthContext.validateUsername(payload.username);
    if(!validation.ok){
      formApi.setError(validation.message);
      return;
    }

    var result = window.AuthContext.loginTemporary(validation.value);
    if(!result.ok){
      setNotice(result.message, 'error');
      return;
    }

    setNotice('Login realizado. Escolha seu perfil para continuar.', 'success');
    openRoleSelectionModal();
  });
})();
