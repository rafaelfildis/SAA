// Projetos institucionais que vêm com o sistema, ao lado da carteira de
// contratos (dados/contratos.js). Mesma mecânica de semente: aplicada uma vez
// por navegador, mesclada por id, sem sobrescrever o que já estiver gravado.
//
// Ao acrescentar um projeto aqui, suba SAA_PROJETOS_VERSAO para que ele
// alcance quem já abriu o sistema.
//
// Diferente de um contrato, a situação de um projeto é digitada, não derivada
// da vigência — quem acompanha a entrega é que a lança no histórico.
//
// Script clássico e não módulo de propósito: se este arquivo falhar ao
// carregar, o sistema continua de pé sem estes projetos, em vez de quebrar.

window.SAA_PROJETOS_VERSAO = "2026-09-10.2";
window.SAA_PROJETOS = [
  {
    "id": "projeto-portal-tcm-digital",
    "nome": "PORTAL TCM DIGITAL",
    "descricao": "Plataforma de sistemas e painéis de Business Intelligence para governança digital do TCM.",
    "responsavel": "",
    "area": "",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "nao-iniciado",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "nao-iniciado",
        "progresso": 0,
        "nota": "Projeto lançado com prazo de 100 dias, para entrega em 19/12/2026."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-10T15:10:00.000-03:00"
  }
];
