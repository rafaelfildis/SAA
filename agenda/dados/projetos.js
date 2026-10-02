// Plano 100 dias: entregas da DTI que vêm com o sistema — processos,
// soluções, contratos, pendência e continuidade estratégica. O grupo de cada
// registro vai em `area`, que a lista mostra e a busca alcança.
//
// Semente aplicada uma vez por navegador e mesclada por id, sem sobrescrever o
// que a pessoa já editou. Ao mudar esta lista, suba SAA_PROJETOS_VERSAO para
// que ela alcance quem já abriu o sistema.
//
// A situação de um projeto é digitada, não derivada — quem acompanha a entrega
// é que a lança no histórico. O progresso dos itens em curso é estimado pela
// etapa informada (tratativa final, tramitação, construção) e se corrige na
// própria tela.
//
// Script clássico e não módulo de propósito: se este arquivo falhar ao
// carregar, o sistema continua de pé sem estes projetos, em vez de quebrar.

window.SAA_PROJETOS_VERSAO = "2026-10-02";

// Próximo passo do plano, mostrado no topo do módulo.
window.SAA_PROJETOS_PROXIMOS_PASSOS =
  "Priorizar os pontos críticos, definir responsáveis e acompanhar a evolução semanalmente.";

// Registros que vieram com versões anteriores do plano — a carteira de
// contratos e o primeiro projeto — e que este plano substitui. São removidos
// do navegador na próxima abertura; o que a pessoa cadastrou à mão fica.
window.SAA_PROJETOS_RETIRADOS = [
  "contrato-29-2021",
  "contrato-21-2021",
  "contrato-22-2021",
  "contrato-23-2021",
  "contrato-24-2021",
  "contrato-25-2021",
  "contrato-063-2021",
  "contrato-25-2022",
  "contrato-39-2022",
  "contrato-40-2022",
  "contrato-65-2022",
  "contrato-23-2023",
  "contrato-33-2023",
  "contrato-50-2023",
  "contrato-21-2023",
  "contrato-15-2024",
  "contrato-16-2024",
  "contrato-46-2024",
  "contrato-16-2025",
  "contrato-21-2025",
  "contrato-26-2025",
  "contrato-30-2025",
  "contrato-35-2025",
  "contrato-38-2025",
  "contrato-48-2025",
  "contrato-77-2025",
  "contrato-86-2025",
  "contrato-11-2026",
  "contrato-8-2026",
  "contrato-10-2026",
  "projeto-portal-tcm-digital"
];

window.SAA_PROJETOS = [
  {
    "id": "plano-processo-tcm-tceba-ia",
    "nome": "Termo de Cooperação TCM × TCE-BA — Inteligência Artificial",
    "descricao": "Termo de cooperação técnica entre o TCM-BA e o TCE-BA para soluções de Inteligência Artificial.",
    "responsavel": "",
    "area": "Processos",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Entregue."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-processo-tcm-saeb-sei",
    "nome": "Ofício de Cooperação TCM × SAEB — SEI",
    "descricao": "Ofício de cooperação com a SAEB para o Sistema Eletrônico de Informações (SEI).",
    "responsavel": "",
    "area": "Processos",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Entregue."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-processo-tcm-saeb-simpas",
    "nome": "Ofício de Cooperação TCM × SAEB — SIMPAS",
    "descricao": "Ofício de cooperação com a SAEB para o SIMPAS.",
    "responsavel": "",
    "area": "Processos",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Entregue."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-processo-tcm-tcerr-modulos-sei",
    "nome": "Ofício de Cooperação TCM × TCE-RR — Módulos SEI",
    "descricao": "Ofício de cooperação com o TCE-RR para cessão dos módulos do SEI.",
    "responsavel": "",
    "area": "Processos",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Entregue."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-processo-tcm-defensoria-rh",
    "nome": "Ofício de Cooperação TCM × Defensoria — Sistema de RH",
    "descricao": "Ofício de cooperação com a Defensoria Pública para o sistema de Recursos Humanos.",
    "responsavel": "",
    "area": "Processos",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Entregue."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-agenda-presidencia",
    "nome": "Agenda Presidência/Gabinetes",
    "descricao": "Agenda institucional da Presidência e dos Gabinetes.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Em produção."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-sicco-novo",
    "nome": "SICCO NOVO",
    "descricao": "Nova versão do SICCO.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Em produção."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-gestao-financeira",
    "nome": "Sistema de Gestão Financeira",
    "descricao": "Sistema de gestão financeira.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Em produção."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-emenda-pix",
    "nome": "Sistema Emenda PIX",
    "descricao": "Sistema de acompanhamento das Emendas PIX.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Entregue; novas modificações em desenvolvimento."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-radar-previdencia",
    "nome": "Sistema Radar Previdência",
    "descricao": "Sistema Radar Previdência.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Entregue; novas modificações em desenvolvimento."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-desidratacao-etcm",
    "nome": "Desidratação do e-TCM",
    "descricao": "Desidratação da base do e-TCM.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "em-andamento",
    "progresso": 90,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 90,
        "nota": "Em tratativa final."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-sei",
    "nome": "SEI",
    "descricao": "Implantação do Sistema Eletrônico de Informações (SEI) no TCM-BA.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "em-andamento",
    "progresso": 50,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 50,
        "nota": "Em tramitação."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-modulos-sei-finalisticos",
    "nome": "Módulos SEI Finalísticos",
    "descricao": "Módulos finalísticos do SEI para os processos de controle externo.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "em-andamento",
    "progresso": 30,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 30,
        "nota": "Em construção."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-tcm-digital",
    "nome": "TCM DIGITAL",
    "descricao": "Plataforma de sistemas e painéis de Business Intelligence para governança digital do TCM.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "em-andamento",
    "progresso": 30,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 30,
        "nota": "Em construção."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-solucao-gabinete-digital",
    "nome": "GABINETE DIGITAL",
    "descricao": "Gabinete Digital.",
    "responsavel": "",
    "area": "Soluções",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "em-andamento",
    "progresso": 30,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 30,
        "nota": "Em construção."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-contrato-prodeb-1",
    "nome": "PRODEB — Contrato 1",
    "descricao": "Renovação do contrato 1 com a PRODEB, com cláusula resolutiva.",
    "fornecedor": "PRODEB",
    "responsavel": "",
    "area": "Contratos",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Renovado com cláusula resolutiva."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-contrato-simpress-reequilibrio",
    "nome": "SIMPRESS — Reequilíbrio",
    "descricao": "Pedido de reequilíbrio econômico-financeiro do contrato SIMPRESS.",
    "fornecedor": "SIMPRESS",
    "responsavel": "",
    "area": "Contratos",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "concluido",
    "progresso": 100,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "concluido",
        "progresso": 100,
        "nota": "Reequilíbrio reduzido; processo em tramitação."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-pendencia-wifi-presidencia",
    "nome": "Intervenção Wi-Fi — Presidência/Chefia de Gabinete",
    "descricao": "Instalar 1 antena de Wi-Fi no meio da sala do Presidente e validar 1 para o Chefe de Gabinete com sinal máximo, com acompanhamento por turno de disponibilidade e banda.",
    "responsavel": "",
    "area": "Pendência",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "nao-iniciado",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "nao-iniciado",
        "progresso": 0,
        "nota": "Pendência: 1 antena no meio da sala do PR e 1 validada para o Chefe de Gabinete, com sinal máximo e acompanhamento por turno de disponibilidade e banda."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-continuidade-simpress",
    "nome": "Contrato SIMPRESS — Validação final e negociação do reequilíbrio",
    "descricao": "Validação final do processo e negociação imediata para redução do acréscimo de preço (reequilíbrio) dos componentes que estão em alta no mercado.",
    "fornecedor": "SIMPRESS",
    "responsavel": "",
    "area": "Continuidade estratégica",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Validação final do processo e negociação imediata para reduzir o reequilíbrio."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-continuidade-netra",
    "nome": "Contrato NETRA — Renovação com cláusula resolutiva",
    "descricao": "Renovação com cláusula resolutiva de cancelamento imediato do contrato ao ser substituído por nova licitação.",
    "fornecedor": "NETRA",
    "responsavel": "",
    "area": "Continuidade estratégica",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Renovação com cláusula resolutiva de cancelamento imediato ao substituirmos por nova licitação."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  },
  {
    "id": "plano-continuidade-prodeb",
    "nome": "Contrato PRODEB — Rede de segurança operacional",
    "descricao": "Funciona como importante rede de segurança operacional para contingências e apoio em incidentes.",
    "fornecedor": "PRODEB",
    "responsavel": "",
    "area": "Continuidade estratégica",
    "dataInicio": "2026-09-10",
    "prazoEntrega": "2026-12-19",
    "situacao": "em-andamento",
    "progresso": 0,
    "historico": [
      {
        "em": "2026-10-02T12:00:00.000-03:00",
        "situacao": "em-andamento",
        "progresso": 0,
        "nota": "Rede de segurança operacional para contingências e apoio em incidentes."
      }
    ],
    "criadoEm": "2026-10-02T12:00:00.000-03:00",
    "atualizadoEm": "2026-10-02T12:00:00.000-03:00"
  }
];
