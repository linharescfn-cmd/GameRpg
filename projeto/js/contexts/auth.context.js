// auth.context.js - login temporario com persistencia em localStorage
(function(){
  var AUTH_SESSION_KEY = 'gamerpg_auth_session';
  var CONNECTED_USERS_KEY = 'gamerpg_connected_users';
  var listeners = [];

  function safeParse(raw, fallback){
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function readSession(){
    return safeParse(localStorage.getItem(AUTH_SESSION_KEY), null);
  }

  function writeSession(session){
    if(session){
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  }

  function readConnectedUsers(){
    var users = safeParse(localStorage.getItem(CONNECTED_USERS_KEY), []);
    return Array.isArray(users) ? users : [];
  }

  function writeConnectedUsers(users){
    localStorage.setItem(CONNECTED_USERS_KEY, JSON.stringify(users));
  }

  function upsertConnectedUser(session){
    if(!session || !session.userId || !session.username){
      return;
    }

    var users = readConnectedUsers().filter(function(user){
      return user && user.userId !== session.userId;
    });

    users.unshift({
      userId: session.userId,
      username: session.username,
      role: session.role || null,
      lastSeen: Date.now()
    });

    writeConnectedUsers(users);
  }

  function removeConnectedUser(userId){
    if(!userId){
      return;
    }

    var users = readConnectedUsers().filter(function(user){
      return user && user.userId !== userId;
    });

    writeConnectedUsers(users);
  }

  function emit(){
    var current = readSession();
    listeners.forEach(function(listener){
      try {
        listener(current);
      } catch (_) {
        // ignora listener com erro
      }
    });
  }

  function validateUsername(username){
    var trimmed = String(username || '').trim();
    if(!trimmed){
      return { ok: false, message: 'Nome obrigatorio.' };
    }
    if(trimmed.length < 4){
      return { ok: false, message: 'Nome deve ter no minimo 4 caracteres.' };
    }
    return { ok: true, value: trimmed };
  }

  function loginTemporary(username){
    if(!window.IdGenerator){
      return { ok: false, message: 'Gerador de ID indisponivel.' };
    }

    var validation = validateUsername(username);
    if(!validation.ok){
      return { ok: false, message: validation.message };
    }

    var user = {
      userId: window.IdGenerator.generateUniqueId('USR', 'users'),
      username: validation.value,
      role: null,
      createdAt: Date.now()
    };

    writeSession(user);
    upsertConnectedUser(user);
    emit();

    return { ok: true, user: user };
  }

  function setRole(role){
    var session = readSession();
    if(!session){
      return { ok: false, message: 'Sessao nao encontrada.' };
    }

    if(role !== 'master' && role !== 'player'){
      return { ok: false, message: 'Perfil invalido.' };
    }

    session.role = role;
    writeSession(session);
    upsertConnectedUser(session);
    emit();
    return { ok: true, session: session };
  }

  function logout(){
    var session = readSession();
    if(session && session.userId){
      removeConnectedUser(session.userId);
    }
    writeSession(null);
    emit();
  }

  function isAuthenticated(){
    return !!readSession();
  }

  function subscribe(listener){
    listeners.push(listener);
    return function unsubscribe(){
      listeners = listeners.filter(function(fn){ return fn !== listener; });
    };
  }

  function getConnectedUsers(){
    return readConnectedUsers();
  }

  window.addEventListener('storage', function(event){
    if(event.key === AUTH_SESSION_KEY || event.key === CONNECTED_USERS_KEY){
      emit();
    }
  });

  var initialSession = readSession();
  if(initialSession){
    upsertConnectedUser(initialSession);
  }

  window.AuthContext = {
    validateUsername: validateUsername,
    loginTemporary: loginTemporary,
    setRole: setRole,
    logout: logout,
    isAuthenticated: isAuthenticated,
    getSession: readSession,
    subscribe: subscribe,
    getConnectedUsers: getConnectedUsers
  };
})();
