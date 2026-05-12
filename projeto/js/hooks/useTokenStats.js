// useTokenStats.js - adaptador leve para o contexto global de tokens
(function(){
  function useTokenStats(){
    if (!window.TokenStatsContext) {
      throw new Error('TokenStatsContext indisponivel.');
    }

    return window.TokenStatsContext;
  }

  window.useTokenStats = useTokenStats;
})();