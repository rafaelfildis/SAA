// Ramais da DTI. Vêm com o sistema, como a carteira de contratos: é uma lista
// de consulta, igual para todo mundo, sem nada a gravar por navegador.
//
// O prefixo fica fora de cada ramal porque é o mesmo para todos — repetir
// "71 3115-" vinte e cinco vezes só faria o número de quatro dígitos, que é o
// que se disca internamente, ficar mais difícil de achar.

window.SAA_RAMAIS = {
  prefixo: "71 3115-",
  ddd: "71",

  // A regra de entrada vem antes da lista de propósito: o texto oficial diz
  // que rotina entra pelo 4631, e os ramais diretos são para quando já há
  // tratativa em curso. Uma lista sem essa regra convida a furar a fila.
  portaDeEntrada: {
    titulo: "Infra e Suporte",
    rotulo: "Porta de entrada — operação",
    ramal: "4631",
    nota: "Chamado, incidente e solicitação de rotina entram por aqui. Os ramais abaixo são para acionamento direto quando já houver tratativa em curso.",
  },

  atalhos: [
    { rotulo: "Sessão do Plenário", ramal: "4665" },
    { rotulo: "Sistema e-TCM", ramal: "5670" },
  ],

  grupos: [
    {
      nome: "Atendimento SEATU/SST",
      itens: [
        { nome: "Ramal geral", ramal: "4631", geral: true },
        { nome: "Raul", ramal: "5667" },
        { nome: "Vinicius Matias", ramal: "5607" },
        { nome: "Eduardo", ramal: "5604" },
        { nome: "Caique", ramal: "5684" },
        { nome: "Ian / Ivan", ramal: "5613" },
        { nome: "Estagiários", ramais: ["5661", "5665"] },
        { nome: "Plenário", ramal: "4665" },
      ],
    },
    {
      nome: "Atendimento Infra",
      itens: [
        { nome: "Rafael", ramal: "4535" },
        { nome: "Diego", ramal: "4629" },
        { nome: "Edvaldo", ramal: "5615" },
        { nome: "Adson", ramal: "5617" },
      ],
    },
    {
      nome: "Atendimento e-TCM",
      itens: [
        { nome: "Ramal geral", ramal: "5670", geral: true },
        { nome: "Aislã", ramal: "5663" },
        { nome: "Paula", ramal: "5659" },
        { nome: "Lucas", ramal: "5666" },
      ],
    },
    {
      nome: "DTI",
      itens: [
        { nome: "Diego Daltro", ramal: "5651" },
        { nome: "Mauro", ramal: "5624" },
        { nome: "Sérvulo", ramal: "5656" },
        { nome: "Fabrício", ramal: "4550" },
        { nome: "Fabiana", ramal: "5609" },
      ],
    },
  ],
};
