// Carteira de contratos de TI do TCM-BA, extraída da Lista Consolidada de
// Contratos. Vem com o sistema em vez de depender de uma importação manual:
// abrir o painel em qualquer navegador já mostra a carteira.
//
// A semente é aplicada UMA vez por navegador e mesclada por id, de modo que
// editar ou apagar um contrato não é desfeito no carregamento seguinte. Ao
// acrescentar ou remover contratos desta lista, suba SAA_CONTRATOS_VERSAO
// para que a nova carteira alcance quem já abriu o sistema.
//
// A situação NÃO é gravada aqui como verdade: para tipo "contrato" ela é
// derivada da vigência a cada abertura da tela (vencido, em risco a 90 dias
// ou menos, em andamento). O valor abaixo é só o registro do lançamento.
//
// `fornecedor`, `unidades` e `responsavel` vieram das respostas das três
// Divisões ao levantamento da Presidência, de agosto de 2026: o fornecedor com
// o CNPJ onde o documento o traz, a unidade que responde pelo instrumento e o
// fiscal ou a comissão de fiscalização declarada. Três contratos são de
// fiscalização compartilhada e por isso trazem mais de uma unidade — o 65/2022
// é gerido pelas três Divisões, e o 25/2022 pela Infraestrutura e pelo Banco
// de Dados.
//
// Script clássico e não módulo de propósito: se este arquivo falhar ao
// carregar, o sistema continua de pé sem a carteira, em vez de quebrar.

window.SAA_CONTRATOS_VERSAO = "2026-09-14";
window.SAA_CONTRATOS = [
  {
    "id": "contrato-29-2021",
    "tipo": "contrato",
    "nome": "Contrato 29/2021 — Serviço de link secundário de acesso corporativo à internet, 300 Mbps",
    "fornecedor": "ITS Telecomunicações Ltda. · CNPJ 08.772.214/0001-98",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Serviço de link secundário de acesso corporativo à internet, 300 Mbps. Valor anual: R$ 13.936,08. Vigência até 04/10/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-10-04",
    "situacao": "em-risco",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-risco",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerra em 04/10/2026, em 24 dias — dentro da janela de 90 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-21-2021",
    "tipo": "contrato",
    "nome": "Contrato 21/2021 — Solução integrada de segurança da informação, incluindo hardware, software, instalação, configuração e suporte técnico",
    "fornecedor": "Oi S.A. · CNPJ 76.535.764/0001-43",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Solução integrada de segurança da informação, incluindo hardware, software, instalação, configuração e suporte técnico. Valor anual: R$ 74.636,56. Vigência até 15/11/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-11-15",
    "situacao": "em-risco",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-risco",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerra em 15/11/2026, em 66 dias — dentro da janela de 90 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-22-2021",
    "tipo": "contrato",
    "nome": "Contrato 22/2021 — Rede Governo, links de internet banda larga fixa para unidades regionais",
    "fornecedor": "Oi S.A. · CNPJ 76.535.764/0001-43",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Rede Governo, links de internet banda larga fixa para unidades regionais. Valor anual: R$ 31.938,84. Vigência até 16/11/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-11-16",
    "situacao": "em-risco",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-risco",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerra em 16/11/2026, em 67 dias — dentro da janela de 90 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-23-2021",
    "tipo": "contrato",
    "nome": "Contrato 23/2021 — Rede Governo, links de internet banda larga fixa, Lote 4",
    "fornecedor": "Tux Net Serviços de Informática Eireli · CNPJ 07.652.235/0001-07",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Rede Governo, links de internet banda larga fixa, Lote 4. Valor anual: R$ 6.242,40. Vigência até 17/11/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-11-17",
    "situacao": "em-risco",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-risco",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerra em 17/11/2026, em 68 dias — dentro da janela de 90 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-24-2021",
    "tipo": "contrato",
    "nome": "Contrato 24/2021 — Rede Governo, links de internet banda larga fixa, Lotes 2, 3, 5 e 7",
    "fornecedor": "Screen Saver Informática Ltda. · CNPJ 01.800.080/0001-22",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Rede Governo, links de internet banda larga fixa, Lotes 2, 3, 5 e 7. Valor anual: R$ 16.254,48. Vigência até 17/11/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-11-17",
    "situacao": "em-risco",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-risco",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerra em 17/11/2026, em 68 dias — dentro da janela de 90 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-25-2021",
    "tipo": "contrato",
    "nome": "Contrato 25/2021 — Rede Governo, links de internet banda larga fixa, Lote 6",
    "fornecedor": "GD Serviços Internet Ltda. · CNPJ 05.929.700/0001-89",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Rede Governo, links de internet banda larga fixa, Lote 6. Valor anual: R$ 3.048,00. Vigência até 15/11/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-11-15",
    "situacao": "em-risco",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-risco",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerra em 15/11/2026, em 66 dias — dentro da janela de 90 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-063-2021",
    "tipo": "contrato",
    "nome": "Contrato 063/2021 — Atualização da plataforma INFOX e-PP para versão mais atual, eTCM",
    "fornecedor": "Infox Tecnologia da Informação Ltda.",
    "unidades": [
      "DDES"
    ],
    "descricao": "Objeto: Atualização da plataforma INFOX e-PP para versão mais atual, eTCM. Valor anual: R$ 501.992,28. Vigência até 15/12/2026.",
    "responsavel": "Lucas Juan Nogueira Novaes",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-12-15",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 15/12/2026."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-25-2022",
    "tipo": "contrato",
    "nome": "Contrato 25/2022 — Serviços gerenciados de computação em nuvem, Cloud Broker multinuvem",
    "fornecedor": "Extreme Digital Consultoria e Representações Ltda. · CNPJ 14.139.773/0001-68",
    "unidades": [
      "DINT",
      "DBAD"
    ],
    "descricao": "Objeto: Serviços gerenciados de computação em nuvem, Cloud Broker multinuvem. Valor anual: R$ 2.239.969,92. Vigência até 25/04/2027.",
    "responsavel": "Comissão: Sérvulo Dourado Cruz Lino, Raul César Monferdini Dourado Lima e Rafael José Levita de Almeida",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-04-25",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 25/04/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-39-2022",
    "tipo": "contrato",
    "nome": "Contrato 39/2022 — Integração de processo de troca de informações entre TCM, TCE e MPBA",
    "fornecedor": "Tribunal de Contas do Estado da Bahia · CNPJ 14.674.303/0001-02 e Ministério Público do Estado da Bahia · CNPJ 04.142.491/0001-66",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Integração de processo de troca de informações entre TCM, TCE e MPBA. Valor anual: não informado na lista. Vigência até 31/08/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-08-31",
    "situacao": "vencido",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "vencido",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerrada em 31/08/2026, há 10 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-40-2022",
    "tipo": "contrato",
    "nome": "Contrato 40/2022 — Serviços TIC, processamento, armazenamento de dados, hospedagem, suporte, redes e comunicação de dados",
    "fornecedor": "PRODEB — Companhia de Processamento de Dados do Estado da Bahia · CNPJ 13.579.586/0001-32",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Serviços TIC, processamento, armazenamento de dados, hospedagem, suporte, redes e comunicação de dados. Valor anual: R$ 2.240.000,88. Vigência até 02/10/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-10-02",
    "situacao": "em-risco",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-risco",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerra em 02/10/2026, em 22 dias — dentro da janela de 90 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-65-2022",
    "tipo": "contrato",
    "nome": "Contrato 65/2022 — Serviços especializados de TI, desenvolvimento, banco de dados, infraestrutura, suporte e apoio tecnológico",
    "fornecedor": "Netra Tecnologia Ltda. · CNPJ 04.181.950/0001-10",
    "unidades": [
      "DDES",
      "DINT",
      "DBAD"
    ],
    "descricao": "Objeto: Serviços especializados de TI, desenvolvimento, banco de dados, infraestrutura, suporte e apoio tecnológico. Valor anual: R$ 9.406.911,92. Vigência até 01/01/2027.",
    "responsavel": "Comissão: Mauro de Castro Portugal, Raul César Monferdini Dourado Lima, Rafael José Levita de Almeida, José Roberto Alvarez e Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-01-01",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 01/01/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-23-2023",
    "tipo": "contrato",
    "nome": "Contrato 23/2023 — Aquisição de licenças Softwell Maker Studio Bootstrap, com suporte técnico",
    "fornecedor": "Sudoeste Informática e Consultoria Eireli · CNPJ 09.543.618/0001-72",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Aquisição de licenças Softwell Maker Studio Bootstrap, com suporte técnico. Valor anual: R$ 26.124,00. Vigência até 12/06/2027.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-06-12",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 12/06/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-33-2023",
    "tipo": "contrato",
    "nome": "Contrato 33/2023 — Subscrição Red Hat, 201 unidades",
    "fornecedor": "Extreme Digital Consultoria e Representações Ltda. · CNPJ 14.139.773/0001-68",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Subscrição Red Hat, 201 unidades. Valor anual: R$ 273.950,94. Vigência até 25/05/2027.",
    "responsavel": "Rafael José Levita de Almeida",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-05-25",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 25/05/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-50-2023",
    "tipo": "contrato",
    "nome": "Contrato 50/2023 — Manutenção de redes lógica e elétrica estabilizada nas dependências do TCM",
    "fornecedor": "SET Soluções Estratégicas e Tecnológicas Ltda. · CNPJ 02.324.429/0001-60",
    "unidades": [
      "DBAD"
    ],
    "descricao": "Objeto: Manutenção de redes lógica e elétrica estabilizada nas dependências do TCM. Valor anual: R$ 130.452,72. Vigência até 09/08/2026.",
    "responsavel": "Sérvulo Dourado Cruz Lino",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-08-09",
    "situacao": "vencido",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "vencido",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência encerrada em 09/08/2026, há 32 dias."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-21-2023",
    "tipo": "contrato",
    "nome": "Contrato 21/2023 — Locação de tablets",
    "fornecedor": "BR Mobile",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Locação de tablets. Valor anual: R$ 17.641,00. Vigência até 30/03/2027.",
    "responsavel": "Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-03-30",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 30/03/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-15-2024",
    "tipo": "contrato",
    "nome": "Contrato 15/2024 — Gestão de acesso privilegiado, PAM",
    "fornecedor": "X-Site — Centro de Pesquisas em Informática Ltda. · CNPJ 40.584.096/0001-05",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Gestão de acesso privilegiado, PAM. Valor anual: R$ 549.372,96. Vigência até 23/04/2028.",
    "responsavel": "Rafael José Levita de Almeida, com Raul César Monferdini Dourado Lima como co-fiscal",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2028-04-23",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 23/04/2028."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-16-2024",
    "tipo": "contrato",
    "nome": "Contrato 16/2024 — Gestão de vulnerabilidades, solução Tenable",
    "fornecedor": "X-Site — Centro de Pesquisas em Informática Ltda. · CNPJ 40.584.096/0001-05",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Gestão de vulnerabilidades, solução Tenable. Valor anual: R$ 541.478,52. Vigência até 23/04/2028.",
    "responsavel": "Rafael José Levita de Almeida, com Raul César Monferdini Dourado Lima como co-fiscal",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2028-04-23",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 23/04/2028."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-46-2024",
    "tipo": "contrato",
    "nome": "Contrato 46/2024 — Fornecimento de 80 computadores com dois monitores",
    "fornecedor": "VSP Solution",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Fornecimento de 80 computadores com dois monitores. Valor anual: R$ 666.400,00. Vigência até 06/08/2027.",
    "responsavel": "Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-08-06",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 06/08/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-16-2025",
    "tipo": "contrato",
    "nome": "Contrato 16/2025 — Licenciamento Microsoft 365, 760 licenças",
    "fornecedor": "PRODEB — Companhia de Processamento de Dados do Estado da Bahia",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Licenciamento Microsoft 365, 760 licenças. Valor anual: R$ 518.899,85. Vigência até 19/02/2027.",
    "responsavel": "Rafael José Levita de Almeida e Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-02-19",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 19/02/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-21-2025",
    "tipo": "contrato",
    "nome": "Contrato 21/2025 — Ampliação de soluções de segurança sob demanda",
    "fornecedor": "X-Site — Centro de Pesquisas em Informática Ltda. · CNPJ 40.584.096/0001-05",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Ampliação de soluções de segurança sob demanda. Valor anual: R$ 105.012,50. Vigência até 21/04/2028.",
    "responsavel": "Rafael José Levita de Almeida e Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2028-04-21",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 21/04/2028."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-26-2025",
    "tipo": "contrato",
    "nome": "Contrato 26/2025 — Certificados digitais ICP-Brasil A3 sob demanda",
    "fornecedor": "AR RP Certificação Digital",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Certificados digitais ICP-Brasil A3 sob demanda. Valor anual: R$ 34.250,00. Vigência até 02/06/2028.",
    "responsavel": "Rafael José Levita de Almeida, com Raul César Monferdini Dourado Lima como co-fiscal",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2028-06-02",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 02/06/2028."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-30-2025",
    "tipo": "contrato",
    "nome": "Contrato 30/2025 — Solução SIEM FortiSIEM",
    "fornecedor": "X-Site — Centro de Pesquisas em Informática Ltda. · CNPJ 40.584.096/0001-05",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Solução SIEM FortiSIEM. Valor anual: R$ 234.073,08. Vigência até 10/06/2027.",
    "responsavel": "Rafael José Levita de Almeida e Raul César Monferdini Dourado Lima, com designação formal a regularizar",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-06-10",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 10/06/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-35-2025",
    "tipo": "contrato",
    "nome": "Contrato 35/2025 — FortiClient EPP/APT, 29 unidades",
    "fornecedor": "Consórcio Cybersec Bahia",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: FortiClient EPP/APT, 29 unidades. Valor anual: R$ 66.120,00. Vigência até 15/07/2027.",
    "responsavel": "Gestor Cezar Marinho; fiscais Rafael José Levita de Almeida e Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-07-15",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 15/07/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-38-2025",
    "tipo": "contrato",
    "nome": "Contrato 38/2025 — Acesso à base de dados CPF e CNPJ da Receita Federal via blockchain",
    "fornecedor": "Dataprev — Empresa de Tecnologia e Informações da Previdência S.A.",
    "unidades": [
      "DDES"
    ],
    "descricao": "Objeto: Acesso à base de dados CPF e CNPJ da Receita Federal via blockchain. Valor anual: R$ 189.139,22. Vigência até 31/12/2026.",
    "responsavel": "Fabrício André de Souza Muniz",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-12-31",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 31/12/2026."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-48-2025",
    "tipo": "contrato",
    "nome": "Contrato 48/2025 — Computação em nuvem Multicloud de IA, OpenAI e Anthropic",
    "fornecedor": "PRODEB — Companhia de Processamento de Dados do Estado da Bahia",
    "unidades": [
      "DDES"
    ],
    "descricao": "Objeto: Computação em nuvem Multicloud de IA, OpenAI e Anthropic. Valor anual: R$ 396.370,68. Vigência até 04/02/2027.",
    "responsavel": "Fabrício André de Souza Muniz",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2027-02-04",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 04/02/2027."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-77-2025",
    "tipo": "contrato",
    "nome": "Contrato 77/2025 — Outsourcing de estações de trabalho",
    "fornecedor": "Simpress",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Outsourcing de estações de trabalho. Valor anual: R$ 287.184,00. Vigência até 16/12/2029.",
    "responsavel": "Rafael José Levita de Almeida e Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2029-12-16",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 16/12/2029."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-86-2025",
    "tipo": "contrato",
    "nome": "Contrato 86/2025 — Segurança de rede emergencial 24x7",
    "fornecedor": "X-Site — Centro de Pesquisas em Informática Ltda. · CNPJ 40.584.096/0001-05",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Segurança de rede emergencial 24x7. Valor anual: R$ 249.379,92. Vigência até 18/12/2026.",
    "responsavel": "Rafael José Levita de Almeida e Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2026-12-18",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 18/12/2026."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-11-2026",
    "tipo": "contrato",
    "nome": "Contrato 11/2026 — Manutenção de 10 equipamentos críticos de energia",
    "fornecedor": "MAG",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Manutenção de 10 equipamentos críticos de energia. Valor anual: R$ 141.300,00. Vigência até 31/03/2028.",
    "responsavel": "Rafael José Levita de Almeida e Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2028-03-31",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 31/03/2028."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-8-2026",
    "tipo": "contrato",
    "nome": "Contrato 8/2026 — Link primário de internet 2 Gbps com Anti-DDoS",
    "fornecedor": "Tux Net Serviços de Informática Eireli",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Link primário de internet 2 Gbps com Anti-DDoS. Valor anual: R$ 64.200,00. Vigência até 12/03/2031.",
    "responsavel": "Rafael José Levita de Almeida e Raul César Monferdini Dourado Lima",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2031-03-12",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 12/03/2031."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  },
  {
    "id": "contrato-10-2026",
    "tipo": "contrato",
    "nome": "Contrato 10/2026 — Link secundário de internet 1 Gbps com Anti-DDoS",
    "fornecedor": "Algar Telecom",
    "unidades": [
      "DINT"
    ],
    "descricao": "Objeto: Link secundário de internet 1 Gbps com Anti-DDoS. Valor anual: R$ 22.702,56. Vigência até 14/05/2031.",
    "responsavel": "Raul César Monferdini Dourado Lima e Rafael José Levita de Almeida",
    "area": "",
    "dataInicio": "",
    "prazoEntrega": "2031-05-14",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-09-10T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Lançado a partir da Lista Consolidada de Contratos. Vigência até 14/05/2031."
      }
    ],
    "criadoEm": "2026-09-10T12:00:00.000-03:00",
    "atualizadoEm": "2026-09-14T09:00:00.000-03:00"
  }
];
