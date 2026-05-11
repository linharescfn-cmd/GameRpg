// auth-form.component.js - formulario reutilizavel de login temporario
(function(){
  function renderTemporaryLogin(root, onSubmit){
    var form = document.createElement('form');
    form.className = 'auth-form';

    var field = document.createElement('div');
    field.className = 'field-group';

    var label = document.createElement('label');
    label.setAttribute('for', 'tempUsername');
    label.textContent = 'Nome de usuario';

    var input = document.createElement('input');
    input.id = 'tempUsername';
    input.type = 'text';
    input.placeholder = 'Digite seu nome';
    input.required = true;
    input.minLength = 4;

    var error = document.createElement('small');
    error.className = 'field-error';

    var submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn-primary';
    submit.textContent = 'Entrar';

    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(error);
    form.appendChild(field);
    form.appendChild(submit);

    form.addEventListener('submit', function(event){
      event.preventDefault();
      onSubmit({ username: input.value, input: input, error: error });
    });

    root.appendChild(form);

    return {
      setError: function(message){
        error.textContent = message || '';
        if(message){
          input.classList.add('input-error');
        } else {
          input.classList.remove('input-error');
        }
      }
    };
  }

  window.AuthFormComponent = {
    renderTemporaryLogin: renderTemporaryLogin
  };
})();
