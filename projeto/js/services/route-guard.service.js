// route-guard.service.js - rotas protegidas por sessao/perfil
(function(){
  function redirectByRole(session){
    if(session && session.role === 'master'){
      window.location.href = 'index.html';
      return;
    }
    if(session && session.role === 'player'){
      window.location.href = 'player-search.html';
      return;
    }
    window.location.href = 'auth.html';
  }

  function requireAuth(){
    if(!window.AuthContext || !window.AuthContext.isAuthenticated()){
      window.location.href = 'auth.html';
      return null;
    }
    return window.AuthContext.getSession();
  }

  function requireRole(role){
    var session = requireAuth();
    if(!session){
      return null;
    }

    if(session.role !== role){
      redirectByRole(session);
      return null;
    }

    return session;
  }

  window.RouteGuard = {
    requireAuth: requireAuth,
    requireRole: requireRole,
    redirectByRole: redirectByRole
  };
})();
