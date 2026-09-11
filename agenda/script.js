"use strict";

// ical.js v2 é distribuído como módulo ES (sem global `window.ICAL`),
// por isso este arquivo é carregado como <script type="module"> e importa
// a biblioteca diretamente do CDN.
import ICAL from "https://cdn.jsdelivr.net/npm/ical.js@2.1.0/dist/ical.min.js";

/* ==========================================================================
   CONFIGURAÇÃO CENTRAL
   ========================================================================== */

// Endereço do calendário ICS consumido diretamente pelo navegador.
// PERMANECE VAZIA por dois motivos independentes, e ambos continuam valendo
// mesmo com a agenda pública:
//   1. O feed iCal do Google não envia cabeçalhos CORS — um fetch direto do
//      navegador seria bloqueado de qualquer forma.
//   2. Se um dia a agenda voltar a ser privada, a implantação aponta para o
//      endereço secreto por variável de ambiente; deixar esta constante vazia
//      garante que esse endereço jamais chegue ao código servido ao navegador.
// O endereço em uso fica em CALENDAR_ICS_URL do servidor (/api/calendar).
const CALENDAR_ICS_URL = "";

// Link "humano" do calendário, usado apenas no botão "Abrir no Google Agenda"
// — nunca como fonte de dados. É a interface web do próprio Google, que exige
// a sessão autenticada do usuário e portanto não expõe nada.
const CALENDAR_HTML_URL = "https://calendar.google.com/calendar/r";

// Endpoint intermediário (server.js / função serverless) que busca o ICS no
// servidor. É o caminho normal de leitura: o Google não envia cabeçalhos CORS
// no feed iCal, então o fetch direto pelo navegador seria bloqueado.
const CALENDAR_API_URL = "/api/calendar";

// Dados fictícios de demonstração. Desligado: a agenda real é lida do Google
// Agenda via /api/calendar. Religar apenas para desenvolvimento sem rede.
const USE_DEMO_DATA = false;

const DISPLAY_TIMEZONE = "America/Bahia";
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos
const STORAGE_KEY = "saaTcm.cache.v1";

// Janela de expansão de eventos recorrentes (evita gerar ocorrências infinitas).
const JANELA_MESES_PASSADO = 1;
const JANELA_MESES_FUTURO = 6;
const MAX_OCORRENCIAS_POR_EVENTO = 300;

/* ==========================================================================
   ESTADO DA APLICAÇÃO
   ========================================================================== */

const state = {
  eventos: [],
  usandoCache: false,
  ultimaAtualizacao: null,
  carregando: false,
  filtros: {
    periodo: "dia", // todos | dia | semana | mes — sem filtro explícito, mostra a agenda de hoje
    categorias: new Set(),
    busca: "",
    mostrarConcluidos: true,
    dataInicio: null, // "YYYY-MM-DD" ou null
    dataFim: null, // "YYYY-MM-DD" ou null
  },
  exportacao: {
    formato: "mobile", // mobile (card JPEG) | a4 (extrato PDF)
    proporcao: "story", // story 9:16 | feed 4:5 — só no card mobile
    densidade: "completo", // completo | compromissos | resumo — só no extrato A4
  },
  ui: {
    vista: "timeline", // timeline | tabela
    tabelaOrdenarPor: "data",
    tabelaOrdemAsc: true,
    tabelaPagina: 1,
    tabelaPorPagina: 15,
    sidebarAberta: false, // drawer mobile
    sidebarRecolhida: false, // colapso desktop
  },
};

// Horizonte de entrega, em dias. "Todas" é sem teto de data — existe, e é o
// padrão, porque a base guarda contratos que correm até 2031: abrir cortando
// em 100 dias esconderia a maior parte do que está cadastrado.
const HORIZONTE_PADRAO = 100;
const HORIZONTE_TODAS = 0;

// Estado do portal e do módulo Plano 100 dias. Fica junto do resto para que
// haja um só lugar onde olhar quando a tela não corresponde ao esperado.
state.modulo = "portal"; // portal | agenda | projetos
state.projetos = [];
state.projetoAberto = null;
// Busca do módulo Ramal DTI, separada da busca da agenda e da do plano.
state.filtroRamais = "";
state.projetoEditando = null;
state.filtrosProjeto = {
  horizonte: HORIZONTE_TODAS,
  situacoes: new Set(),
  busca: "",
  // Intervalo explícito de prazo de entrega. Quando preenchido, manda no que
  // é exibido e o horizonte em dias sai de cena — os dois não devem disputar
  // a mesma janela.
  prazoInicio: null,
  prazoFim: null,
};

const SIDEBAR_RECOLHIDA_STORAGE_KEY = "saaTcm.sidebarRecolhida";

/* ==========================================================================
   DEMO (somente para desenvolvimento local, quando USE_DEMO_DATA = true)
   ========================================================================== */

// Conjunto de demonstração — dados FICTÍCIOS, sem qualquer relação com a
// agenda real de autoridade do Tribunal. O ICS é montado em torno da data de
// hoje para que a tela sempre abra com um dia cheio: cinco compromissos, um
// cancelado, uma sobreposição real (14:00–15:30 × 15:00–16:00) e três janelas
// livres. Gerar ICS de verdade — em vez de injetar objetos prontos — mantém o
// caminho de parsing, recorrência e classificação exercitado igual à produção.
//
// Fuso fixo America/Bahia (UTC−03:00, sem horário de verão): o horário local
// é convertido para UTC somando três horas.
function icsData(deslocamentoDias, hhmm) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + deslocamentoDias);
  const iso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
    base.getDate()
  ).padStart(2, "0")}T${hhmm}:00-03:00`;
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function icsDataSimples(deslocamentoDias) {
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + deslocamentoDias);
  return `${base.getFullYear()}${String(base.getMonth() + 1).padStart(2, "0")}${String(base.getDate()).padStart(2, "0")}`;
}

function veventDemo(campos) {
  const linhas = ["BEGIN:VEVENT", `UID:${campos.uid}@saa-demo.tcm.ba.gov.br`, `DTSTAMP:${icsData(-30, "12:00")}`];
  if (campos.diaInteiro) {
    linhas.push(`DTSTART;VALUE=DATE:${icsDataSimples(campos.dia)}`);
    linhas.push(`DTEND;VALUE=DATE:${icsDataSimples(campos.diaFim)}`);
  } else {
    linhas.push(`DTSTART:${icsData(campos.dia, campos.ini)}`);
    linhas.push(`DTEND:${icsData(campos.dia, campos.fim)}`);
  }
  linhas.push(`SUMMARY:${campos.titulo}`);
  if (campos.descricao) linhas.push(`DESCRIPTION:${campos.descricao}`);
  if (campos.local) linhas.push(`LOCATION:${campos.local}`);
  if (campos.categoria) linhas.push(`CATEGORIES:${campos.categoria}`);
  if (campos.url) linhas.push(`URL:${campos.url}`);
  if (campos.cancelado) linhas.push("STATUS:CANCELLED");
  (campos.participantes || []).forEach((nome, i) => {
    // Acentos viram a letra base antes do slug, senão "Ministério" produz
    // "minist.rio" no endereço fictício.
    const conta = nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "");
    linhas.push(`ATTENDEE;CN=${nome}:mailto:${conta || "convidado" + i}@exemplo.tcm.ba.gov.br`);
  });
  if (campos.rrule) linhas.push(`RRULE:${campos.rrule}`);
  linhas.push("END:VEVENT");
  return linhas.join("\n");
}

function construirIcsDemo() {
  const eventos = [
    // ----- Hoje: o dia desenhado, com conflito e janelas livres -----
    {
      uid: "demo-hoje-1", dia: 0, ini: "08:00", fim: "08:45", categoria: "Presencial",
      titulo: "Audiência com o Prefeito de Ilhéus",
      local: "Gabinete da Presidência", cancelado: true,
      descricao: "Reagendada a pedido do jurisdicionado.",
      participantes: ["Gabinete"],
    },
    {
      uid: "demo-hoje-2", dia: 0, ini: "09:00", fim: "12:30", categoria: "Presencial",
      titulo: "Sessão Ordinária do Tribunal Pleno",
      local: "Plenário do TCM-BA — Av. 4, nº 495, Centro Administrativo da Bahia, Salvador",
      descricao: "Pauta: contas de governo, consultas e uniformização de jurisprudência.",
      participantes: ["Tribunal Pleno", "Ministério Público de Contas", "Corpo Técnico"],
    },
    {
      uid: "demo-hoje-3", dia: 0, ini: "14:00", fim: "15:30", categoria: "Online",
      titulo: "Reunião com a Diretoria de Assistência aos Municípios",
      local: "Microsoft Teams",
      url: "https://teams.microsoft.com/l/meetup-join/demo-saa-tcm",
      descricao: "Balanço dos atendimentos da DAM e calendário de obrigações do próximo trimestre.",
      participantes: ["DAM", "Assessoria Técnica", "Diretoria de Controle Externo"],
    },
    {
      uid: "demo-hoje-4", dia: 0, ini: "15:00", fim: "16:00", categoria: "Presencial",
      titulo: "Entrevista à Assessoria de Comunicação",
      local: "Estúdio — Ascom",
      descricao: "Pauta sobre o balanço semestral de fiscalizações.",
      participantes: ["Ascom"],
    },
    {
      uid: "demo-hoje-5", dia: 0, ini: "16:30", fim: "17:30", categoria: "Presencial",
      titulo: "Despacho com a Assessoria Jurídica",
      local: "Gabinete da Presidência",
      descricao: "Análise de recursos de reconsideração protocolados na semana.",
      participantes: ["Assessoria Jurídica"],
    },
    // ----- Próximos dias: semana e mês não abrem vazios -----
    {
      uid: "demo-amanha-1", dia: 1, ini: "09:00", fim: "12:00", categoria: "Presencial",
      titulo: "Sessão Ordinária da 2ª Câmara",
      local: "Plenário do TCM-BA — Av. 4, nº 495, Salvador",
      descricao: "Julgamento de prestações de contas de gestão do exercício anterior.",
      participantes: ["2ª Câmara", "Ministério Público de Contas"],
    },
    {
      uid: "demo-amanha-2", dia: 1, ini: "14:30", fim: "16:00", categoria: "Presencial",
      titulo: "Abertura do curso de capacitação de jurisdicionados",
      local: "Escola de Contas Conselheiro Joaquim Bahia — Auditório",
      descricao: "Módulo de licitações e contratos administrativos.",
      participantes: ["Escola de Contas", "Controladores municipais"],
    },
    {
      uid: "demo-d2-1", dia: 2, ini: "10:00", fim: "11:30", categoria: "Online",
      titulo: "Videoconferência com a Rede de Controle da Gestão Pública",
      local: "Microsoft Teams",
      url: "https://teams.microsoft.com/l/meetup-join/demo-rede-controle",
      descricao: "Alinhamento de ações conjuntas de fiscalização.",
      participantes: ["TCE-BA", "CGU", "Ministério Público Federal"],
    },
    {
      uid: "demo-d3-1", dia: 3, ini: "08:30", fim: "10:00", categoria: "Presencial",
      titulo: "Reunião do Comitê de Governança e Gestão Estratégica",
      local: "Sala de reuniões da Presidência",
      descricao: "Acompanhamento das metas do planejamento estratégico institucional.",
      participantes: ["Presidência", "Diretoria Geral", "Assessoria de Planejamento"],
    },
    {
      uid: "demo-viagem", dia: 5, diaFim: 8, diaInteiro: true, categoria: "Viagem",
      titulo: "Encontro Nacional dos Tribunais de Contas — Brasília",
      local: "Brasília — Distrito Federal",
      descricao: "Representação institucional do TCM-BA no encontro do IRB.",
      participantes: ["Presidência", "Assessoria Institucional"],
    },
    {
      uid: "demo-semanal", dia: 7, ini: "09:00", fim: "12:30", categoria: "Presencial",
      titulo: "Sessão Ordinária do Tribunal Pleno",
      local: "Plenário do TCM-BA — Av. 4, nº 495, Salvador",
      descricao: "Sessão semanal do Pleno.",
      participantes: ["Tribunal Pleno"],
      rrule: "FREQ=WEEKLY;COUNT=6",
    },
    {
      uid: "demo-mes-1", dia: 14, ini: "15:00", fim: "17:00", categoria: "Presencial",
      titulo: "Seminário de Prestação de Contas Municipais",
      local: "Escola de Contas Conselheiro Joaquim Bahia — Auditório",
      descricao: "Orientações sobre o e-TCM e o envio de dados do exercício.",
      participantes: ["Escola de Contas", "Prefeituras jurisdicionadas"],
    },
    {
      uid: "demo-mes-2", dia: 21, ini: "10:00", fim: "11:00", categoria: "Online",
      titulo: "Reunião de acompanhamento do Plano Anual de Fiscalização",
      local: "Microsoft Teams",
      url: "https://teams.microsoft.com/l/meetup-join/demo-paf",
      descricao: "Revisão do cronograma de auditorias operacionais.",
      participantes: ["Diretoria de Controle Externo"],
    },
  ];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TCM-BA//SAA Agenda Institucional//PT-BR",
    "CALSCALE:GREGORIAN",
    ...eventos.map(veventDemo),
    "END:VCALENDAR",
  ].join("\n");
}

/* ==========================================================================
   UTILITÁRIOS DE TEXTO E DATA
   ========================================================================== */

function normalizarTexto(txt) {
  return (txt || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function extrairPrimeiraUrl(texto) {
  if (!texto) return "";
  const match = texto.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : "";
}

function formatarDataHora(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatarHora(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatarDataLonga(date) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
  return texto;
}

// Chave "YYYY-MM-DD" do evento no fuso de exibição — usada para agrupar por dia.
function chaveDia(date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const obj = {};
  partes.forEach((p) => (obj[p.type] = p.value));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

function inicioDoDia(date) {
  const chave = chaveDia(date);
  return new Date(`${chave}T00:00:00${offsetBahia()}`);
}

function fimDoDia(date) {
  const chave = chaveDia(date);
  return new Date(`${chave}T23:59:59.999${offsetBahia()}`);
}

// America/Bahia não observa horário de verão desde 2019: offset fixo -03:00.
function offsetBahia() {
  return "-03:00";
}

function segundaDaSemana(date) {
  const chave = chaveDia(date);
  const d = new Date(`${chave}T12:00:00${offsetBahia()}`);
  const diaSemana = d.getUTCDay(); // 0 = domingo
  const distanciaSegunda = (diaSemana + 6) % 7;
  d.setUTCDate(d.getUTCDate() - distanciaSegunda);
  return inicioDoDia(d);
}

function domingoDaSemana(date) {
  const seg = segundaDaSemana(date);
  const dom = new Date(seg);
  dom.setUTCDate(dom.getUTCDate() + 6);
  return fimDoDia(dom);
}

function inicioDoMes(date) {
  const chave = chaveDia(date);
  const [ano, mes] = chave.split("-");
  return new Date(`${ano}-${mes}-01T00:00:00${offsetBahia()}`);
}

function fimDoMes(date) {
  const inicio = inicioDoMes(date);
  const proximo = new Date(inicio);
  proximo.setUTCMonth(proximo.getUTCMonth() + 1);
  proximo.setUTCMilliseconds(proximo.getUTCMilliseconds() - 1);
  return proximo;
}

// Último instante REALMENTE ocupado por um compromisso.
//
// Em eventos de dia inteiro, o DTEND do ICS é EXCLUSIVO (RFC 5545): um evento
// que ocupa 22, 23, 24 e 25 é publicado com DTEND = dia 26 ("até, sem
// incluir, o dia 26"). Usar esse `fim` cru faz o app contar um dia a mais
// (aparece no dia 26, badge "22–26"). Aqui recuamos para o fim do dia
// anterior ao DTEND, obtendo o último dia de fato ocupado (25).
//
// Para eventos com horário, o DTEND já é o instante real de término e é
// devolvido sem ajuste.
function dataFimInclusivo(evento) {
  const fim = new Date(evento.fim);
  if (!evento.diaInteiro) return fim;

  const inicio = new Date(evento.inicio);
  // Último milissegundo do dia anterior ao DTEND, no fuso de exibição.
  const candidato = new Date(inicioDoDia(fim).getTime() - 1);
  // Nunca antes do dia de início — protege eventos de dia inteiro sem DTEND
  // ou com DTEND == DTSTART (um único dia).
  return candidato.getTime() < inicio.getTime() ? inicio : candidato;
}

/* ==========================================================================
   CLASSIFICAÇÃO AUTOMÁTICA
   ========================================================================== */

const PALAVRAS_VIAGEM = [
  "viagem", "voo", "aeroporto", "hotel", "embarque", "desembarque",
  "deslocamento", "passagem aerea", "passagem",
];

// Cidades que caracterizam deslocamento. Salvador NÃO entra: é a sede do
// Tribunal, então um endereço em Salvador é compromisso local, não viagem —
// listá-la fazia toda reunião no próprio município ser marcada como viagem
// (ex.: "Apresentação SEI" na Secretaria de Saúde, no Centro Administrativo,
// vinha classificada como deslocamento).
const CIDADES_REFERENCIA = [
  "brasilia", "sao paulo", "rio de janeiro", "feira de santana",
  "vitoria da conquista", "ilheus", "porto seguro", "juazeiro",
  "barreiras", "itabuna", "camacari", "belo horizonte", "recife",
  "fortaleza", "curitiba", "porto alegre", "goiania", "manaus", "belem",
];

const PALAVRAS_ONLINE = [
  "online", "virtual", "teams", "microsoft teams", "google meet",
  "meet", "zoom", "videoconferencia", "webex",
];

const PALAVRAS_PRESENCIAL = [
  "presencial", "forum", "tribunal", "audiencia", "escritorio",
  "sala", "secretaria", "auditorio",
];

const REGEX_LINK_REUNIAO = /https?:\/\/(teams\.microsoft\.com|meet\.google\.com|zoom\.us|webex\.com)/i;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Correspondência por palavra/frase inteira (com \b), não por substring solta.
// Evita falsos positivos como "aula" dentro de "Paula" ou "sala" dentro de
// outra palavra maior.
function contemPalavraChave(texto, palavra) {
  const regex = new RegExp("\\b" + escapeRegex(palavra) + "\\b", "i");
  return regex.test(texto);
}

function contemAlgumaPalavra(texto, lista) {
  return lista.some((p) => contemPalavraChave(texto, p));
}

// Rubrica declarada em CATEGORIES no próprio evento do calendário, mapeada
// para as categorias da tela. Aceita as variantes usadas na prática pelo
// gabinete ("Presencial", "Pauta presencial", "Reunião online"...).
const CATEGORIA_ICS_EXPLICITA = {
  presencial: "pauta-presencial",
  "pauta presencial": "pauta-presencial",
  "reuniao presencial": "pauta-presencial",
  online: "pauta-online",
  "pauta online": "pauta-online",
  "reuniao online": "pauta-online",
  remoto: "pauta-online",
  viagem: "viagem",
  deslocamento: "viagem",
};

function categoriaDeclarada(evento) {
  const declaradas = evento.categoriasIcs || [];
  for (const bruta of declaradas) {
    const chave = normalizarTexto(bruta).trim();
    if (CATEGORIA_ICS_EXPLICITA[chave]) return CATEGORIA_ICS_EXPLICITA[chave];
  }
  return null;
}

function classificarEvento(evento) {
  // Rubrica explícita do calendário vence a heurística: "Audiência com o
  // Prefeito de Ilhéus" marcada como Presencial é uma audiência no gabinete,
  // não uma viagem a Ilhéus.
  const declarada = categoriaDeclarada(evento);
  if (declarada) return declarada;

  const textoCompleto = normalizarTexto(
    [
      evento.titulo,
      evento.descricao,
      evento.local,
      evento.link,
      (evento.categoriasIcs || []).join(" "),
    ].join(" ")
  );

  // Nomes de cidade só são considerados em título/local: a descrição de
  // reuniões frequentemente carrega rodapés/assinaturas de e-mail que citam
  // cidades (ex.: endereço institucional do organizador) sem relação alguma
  // com deslocamento, o que geraria falsos positivos de "viagem".
  const textoCidade = normalizarTexto([evento.titulo, evento.local].join(" "));

  const temViagem =
    contemAlgumaPalavra(textoCompleto, PALAVRAS_VIAGEM) ||
    contemAlgumaPalavra(textoCidade, CIDADES_REFERENCIA);
  if (temViagem) return "viagem";

  const temLinkReuniao = REGEX_LINK_REUNIAO.test(evento.link || "");
  if (contemAlgumaPalavra(textoCompleto, PALAVRAS_ONLINE) || temLinkReuniao) {
    return "pauta-online";
  }

  if (contemAlgumaPalavra(textoCompleto, PALAVRAS_PRESENCIAL)) return "pauta-presencial";

  // Sem link de reunião e sem palavras-chave identificáveis: assume presencial.
  return "pauta-presencial";
}

/* ==========================================================================
   PARSING ICS (ical.js) — VEVENT, RRULE, EXDATE, RECURRENCE-ID, VTIMEZONE
   ========================================================================== */

function mapStatus(raw) {
  switch ((raw || "").toUpperCase()) {
    case "CANCELLED":
      return "cancelado";
    case "TENTATIVE":
      return "tentativo";
    case "CONFIRMED":
    default:
      return "confirmado";
  }
}

function lerCategoriasIcs(icalEvent) {
  try {
    const prop = icalEvent.component.getFirstProperty("categories");
    if (!prop) return [];
    const valor = icalEvent.component.getFirstPropertyValue("categories");
    return valor
      ? valor
          .toString()
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
  } catch (e) {
    return [];
  }
}

function lerUrl(icalEvent, descricao, local) {
  try {
    const valor = icalEvent.component.getFirstPropertyValue("url");
    if (valor) return String(valor);
  } catch (e) {
    /* ignora */
  }
  return extrairPrimeiraUrl(descricao) || extrairPrimeiraUrl(local) || "";
}

// Lê os participantes (ATTENDEE) e o organizador (ORGANIZER) do evento.
// Prioriza o nome amigável (parâmetro CN); na ausência, usa a parte local do
// e-mail (antes do @). O feed iCal do Google só traz ATTENDEE/ORGANIZER em
// compromissos que têm convidados — nos demais a lista volta vazia e a
// interface simplesmente não mostra a linha de participantes.
function lerParticipantes(icalEvent) {
  const nomes = [];
  const vistos = new Set();

  function nomeDe(prop) {
    if (!prop) return "";
    let cn = "";
    try {
      cn = prop.getParameter("cn") || "";
    } catch (e) {
      /* ignora */
    }
    if (cn) return String(cn).trim();
    // Sem CN: extrai a parte local de "mailto:fulano@dominio".
    let valor = "";
    try {
      valor = String(prop.getFirstValue() || "");
    } catch (e) {
      valor = "";
    }
    const semMailto = valor.replace(/^mailto:/i, "");
    const local = semMailto.split("@")[0];
    return local ? local.replace(/[._]+/g, " ").trim() : "";
  }

  function adicionar(nome) {
    const limpo = (nome || "").trim();
    if (!limpo) return;
    const chave = normalizarTexto(limpo);
    if (vistos.has(chave)) return;
    vistos.add(chave);
    nomes.push(limpo);
  }

  try {
    const organizador = icalEvent.component.getFirstProperty("organizer");
    adicionar(nomeDe(organizador));
  } catch (e) {
    /* ignora */
  }

  try {
    icalEvent.component.getAllProperties("attendee").forEach((prop) => adicionar(nomeDe(prop)));
  } catch (e) {
    /* ignora */
  }

  return nomes;
}

function construirOcorrencia(icalEvent, startTime, endTime, recorrente) {
  const diaInteiro = !!startTime.isDate;
  const inicioJS = startTime.toJSDate();
  const fimJS = endTime ? endTime.toJSDate() : inicioJS;

  const titulo = icalEvent.summary || "(Sem título)";
  const descricao = icalEvent.description || "";
  const local = icalEvent.location || "";
  const link = lerUrl(icalEvent, descricao, local);
  const participantes = lerParticipantes(icalEvent);

  let statusRaw = "";
  try {
    statusRaw = icalEvent.component.getFirstPropertyValue("status") || "";
  } catch (e) {
    /* ignora */
  }

  const categoriasIcs = lerCategoriasIcs(icalEvent);

  const idBase = icalEvent.uid || Math.random().toString(36).slice(2);
  const id = recorrente ? `${idBase}::${startTime.toString()}` : idBase;

  const evento = {
    id,
    titulo,
    descricao,
    inicio: inicioJS.toISOString(),
    fim: fimJS.toISOString(),
    diaInteiro,
    local,
    link,
    participantes,
    categoria: null,
    categoriasIcs,
    status: mapStatus(statusRaw),
    recorrente: !!recorrente,
  };

  evento.categoria = classificarEvento(evento);
  // Cancelamento real (STATUS:CANCELLED) ou "manual" — muitos organizadores
  // apenas prefixam o título ("Cancelado: ...", "Evento cancelado...") sem
  // atualizar o STATUS do ICS, então o título também é considerado.
  evento.cancelado =
    evento.status === "cancelado" ||
    contemAlgumaPalavra(normalizarTexto(titulo), ["cancelado", "cancelada"]);
  return evento;
}

function parseICSParaEventos(icsTexto) {
  const jcalData = ICAL.parse(icsTexto);
  const comp = new ICAL.Component(jcalData);

  // Registra os fusos horários (VTIMEZONE) definidos no calendário para que
  // ICAL.Time resolva corretamente horários locais antes de converter para UTC.
  comp.getAllSubcomponents("vtimezone").forEach((vt) => {
    try {
      ICAL.TimezoneService.register(vt);
    } catch (e) {
      console.warn("Falha ao registrar VTIMEZONE:", e);
    }
  });

  const veventComponents = comp.getAllSubcomponents("vevent");
  const todosEventos = veventComponents.map((vc) => new ICAL.Event(vc));

  // Separa eventos "mestre" de exceções (RECURRENCE-ID) e religa cada
  // exceção ao seu mestre via relateException — isso faz o iterator()
  // aplicar automaticamente os overrides (inclusive cancelamentos pontuais).
  const mestres = new Map();
  const excecoesOrfas = [];

  todosEventos.forEach((ev) => {
    if (ev.isRecurrenceException()) {
      return;
    }
    mestres.set(ev.uid, ev);
  });

  todosEventos.forEach((ev) => {
    if (!ev.isRecurrenceException()) return;
    const mestre = mestres.get(ev.uid);
    if (mestre) {
      try {
        mestre.relateException(ev.component);
      } catch (e) {
        console.warn("Falha ao relacionar exceção de recorrência:", e);
        excecoesOrfas.push(ev);
      }
    } else {
      excecoesOrfas.push(ev);
    }
  });

  const agora = new Date();
  const janelaInicio = new Date(agora);
  janelaInicio.setMonth(janelaInicio.getMonth() - JANELA_MESES_PASSADO);
  const janelaFim = new Date(agora);
  janelaFim.setMonth(janelaFim.getMonth() + JANELA_MESES_FUTURO);

  const ocorrencias = [];

  mestres.forEach((event) => {
    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next;
      let contagem = 0;
      // eslint-disable-next-line no-cond-assign
      while ((next = iterator.next()) && contagem < MAX_OCORRENCIAS_POR_EVENTO) {
        contagem++;
        const dataOcorrencia = next.toJSDate();
        if (dataOcorrencia > janelaFim) break;
        if (dataOcorrencia < janelaInicio) continue;

        const detalhes = event.getOccurrenceDetails(next);
        ocorrencias.push(
          construirOcorrencia(detalhes.item, detalhes.startDate, detalhes.endDate, true)
        );
      }
    } else {
      const inicioJS = event.startDate.toJSDate();
      const fimJS = (event.endDate || event.startDate).toJSDate();
      if (fimJS >= janelaInicio && inicioJS <= janelaFim) {
        ocorrencias.push(construirOcorrencia(event, event.startDate, event.endDate, false));
      }
    }
  });

  excecoesOrfas.forEach((ev) => {
    const inicioJS = ev.startDate.toJSDate();
    const fimJS = (ev.endDate || ev.startDate).toJSDate();
    if (fimJS >= janelaInicio && inicioJS <= janelaFim) {
      ocorrencias.push(construirOcorrencia(ev, ev.startDate, ev.endDate, true));
    }
  });

  ocorrencias.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  return ocorrencias;
}

/* ==========================================================================
   BUSCA DOS DADOS (fetch direto → fallback via proxy) + CACHE LOCAL
   ========================================================================== */

async function buscarIcsTexto() {
  if (USE_DEMO_DATA) {
    return construirIcsDemo();
  }

  // Só tenta o fetch direto quando há uma URL configurada no cliente; caso
  // contrário vai direto ao endpoint intermediário.
  if (CALENDAR_ICS_URL) {
    try {
      const resposta = await fetch(CALENDAR_ICS_URL, { mode: "cors", cache: "no-store" });
      if (!resposta.ok) throw new Error("HTTP " + resposta.status);
      return await resposta.text();
    } catch (erroDireto) {
      console.warn("Fetch direto ao calendário falhou (provável bloqueio de CORS):", erroDireto);
    }
  }

  const respostaProxy = await fetch(CALENDAR_API_URL, { cache: "no-store" });
  if (!respostaProxy.ok) {
    // O proxy responde erro como JSON {"erro": "..."} com uma mensagem que
    // diz exatamente o que falta (variável de ambiente ausente, calendário
    // fora do ar). Descartá-la e mostrar só "HTTP 500" transforma um
    // problema de configuração de dois minutos em uma investigação.
    throw new Error(await mensagemDeErroDoProxy(respostaProxy));
  }
  return await respostaProxy.text();
}

// Extrai a mensagem do corpo de erro do proxy, caindo para o código HTTP
// quando o corpo não é o JSON esperado (ex.: página de erro da hospedagem).
async function mensagemDeErroDoProxy(resposta) {
  const generico = "HTTP " + resposta.status + " ao buscar via " + CALENDAR_API_URL;
  try {
    const corpo = await resposta.text();
    if (!corpo) return generico;
    const dados = JSON.parse(corpo);
    return dados && dados.erro ? dados.erro : generico;
  } catch (e) {
    return generico;
  }
}

function salvarCache(eventos) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), events: eventos })
    );
  } catch (e) {
    console.warn("Não foi possível salvar o cache local:", e);
  }
}

function carregarCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.events)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

/* ==========================================================================
   CONFLITOS, STATUS DE TEMPO (em andamento / concluído)
   ========================================================================== */

function marcarConflitos(eventos) {
  eventos.forEach((e) => (e.conflito = false));

  const comHorario = eventos.filter((e) => !e.diaInteiro);
  const porDia = new Map();
  comHorario.forEach((e) => {
    const chave = chaveDia(new Date(e.inicio));
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave).push(e);
  });

  porDia.forEach((lista) => {
    lista.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i];
        const b = lista[j];
        const inicioA = new Date(a.inicio).getTime();
        const fimA = new Date(a.fim).getTime();
        const inicioB = new Date(b.inicio).getTime();
        if (inicioB >= fimA) break;
        if (inicioB < fimA && inicioA < new Date(b.fim).getTime()) {
          a.conflito = true;
          b.conflito = true;
        }
      }
    }
  });
}

function situacaoTemporal(evento) {
  const agora = Date.now();
  const inicio = new Date(evento.inicio).getTime();
  const fim = new Date(evento.fim).getTime();
  if (fim < agora) return "concluido";
  if (inicio <= agora && agora <= fim) return "andamento";
  return "futuro";
}

/* ==========================================================================
   FILTROS
   ========================================================================== */

// Intervalo [início, fim] correspondente ao período selecionado, ou null
// para "todos" (sem restrição). Centralizado aqui para ser reaproveitado
// tanto na decisão de inclusão do evento quanto no recorte dos dias
// exibidos de compromissos de vários dias (ver agruparPorDia).
function janelaDoPeriodo(periodo) {
  if (periodo === "todos") return null;

  const agora = new Date();
  if (periodo === "dia") return { inicio: inicioDoDia(agora), fim: fimDoDia(agora) };
  if (periodo === "semana") return { inicio: segundaDaSemana(agora), fim: domingoDaSemana(agora) };
  if (periodo === "mes") return { inicio: inicioDoMes(agora), fim: fimDoMes(agora) };
  return null;
}

function eventoNoPeriodo(evento, periodo) {
  const janela = janelaDoPeriodo(periodo);
  if (!janela) return true;

  const inicioEvento = new Date(evento.inicio).getTime();
  const fimEvento = dataFimInclusivo(evento).getTime();

  // Interseção de intervalos — cobre eventos que atravessam mais de um dia.
  return inicioEvento <= janela.fim.getTime() && fimEvento >= janela.inicio.getTime();
}

// Um intervalo de datas explícito vence o filtro de período. Os dois controles
// recortam a mesma coisa — uma janela de tempo — e aplicá-los em conjunto
// produzia lista vazia sempre que a data escolhida não caísse dentro do
// período marcado. O caso comum era escolher outro dia com "Hoje" ainda
// ativo: a interseção das duas janelas nunca existia, e a tela respondia
// "Nenhum compromisso encontrado" para um dia que tinha compromissos.
function filtroDeDataAtivo() {
  return Boolean(state.filtros.dataInicio || state.filtros.dataFim);
}

function eventoNoIntervaloDeData(evento, dataInicio, dataFim) {
  if (!dataInicio && !dataFim) return true;

  const inicioEvento = new Date(evento.inicio).getTime();
  const fimEvento = dataFimInclusivo(evento).getTime();

  const inicioFiltro = dataInicio
    ? new Date(`${dataInicio}T00:00:00${offsetBahia()}`).getTime()
    : -Infinity;
  const fimFiltro = dataFim
    ? new Date(`${dataFim}T23:59:59.999${offsetBahia()}`).getTime()
    : Infinity;

  return inicioEvento <= fimFiltro && fimEvento >= inicioFiltro;
}

// Verifica se o evento passa no termo de busca (título, descrição, local e
// participantes). Termo vazio passa sempre.
function passaBusca(evento) {
  const buscaNormalizada = normalizarTexto(state.filtros.busca);
  if (!buscaNormalizada) return true;
  const alvo = normalizarTexto(
    `${evento.titulo} ${evento.descricao} ${evento.local} ${(evento.participantes || []).join(" ")}`
  );
  return alvo.includes(buscaNormalizada);
}

function obterEventosFiltrados() {
  const { periodo, categorias, mostrarConcluidos, dataInicio, dataFim } = state.filtros;

  return state.eventos.filter((evento) => {
    // Nenhuma categoria marcada = nenhum filtro de categoria ativo (mostra tudo).
    if (categorias.size > 0 && !categorias.has(evento.categoria)) return false;
    if (!filtroDeDataAtivo() && !eventoNoPeriodo(evento, periodo)) return false;
    if (!eventoNoIntervaloDeData(evento, dataInicio, dataFim)) return false;
    if (!mostrarConcluidos && situacaoTemporal(evento) === "concluido") return false;
    if (!passaBusca(evento)) return false;
    return true;
  });
}

/* ==========================================================================
   RENDERIZAÇÃO
   ========================================================================== */

const CATEGORIA_LABEL = {
  viagem: "Viagem",
  "pauta-online": "Online",
  "pauta-presencial": "Presencial",
};

// Todas as chaves "YYYY-MM-DD" que um compromisso atravessa (do dia de
// início ao dia de fim, inclusive). Compromissos de um único dia retornam
// apenas uma chave — usado para que compromissos de vários dias (viagens,
// cursos de vários dias etc.) apareçam na agenda de cada dia que ocupam, não
// somente no dia em que começam.
const LIMITE_DIAS_ABRANGIDOS = 90; // proteção contra datas malformadas no ICS

function diasQueEventoAbrange(evento) {
  const inicioChave = chaveDia(new Date(evento.inicio));
  const fimChave = chaveDia(dataFimInclusivo(evento));
  if (inicioChave === fimChave) return [inicioChave];

  const dias = [];
  let cursor = inicioDoDia(new Date(evento.inicio));
  const fimCursor = inicioDoDia(dataFimInclusivo(evento)).getTime();
  let contador = 0;
  while (cursor.getTime() <= fimCursor && contador < LIMITE_DIAS_ABRANGIDOS) {
    dias.push(chaveDia(cursor));
    const proximo = new Date(cursor);
    proximo.setUTCDate(proximo.getUTCDate() + 1);
    cursor = proximo;
    contador++;
  }
  return dias;
}

function eventoEhContinuo(evento) {
  return chaveDia(new Date(evento.inicio)) !== chaveDia(dataFimInclusivo(evento));
}

// Janela de dias atualmente visível na tela (interseção do período
// selecionado com o filtro manual de datas "De"/"Até"), como chaves
// "YYYY-MM-DD". Retorna null nos limites em que não há restrição (ex.:
// período "Todos" sem filtro de data manual). Usada para recortar quais
// dias de um compromisso de vários dias devem ser exibidos — sem isso, um
// compromisso que só passa perto do período filtrado (ex.: começa antes do
// intervalo "De"/"Até" escolhido) reapareceria em dias fora do filtro.
function janelaDeExibicaoAtual() {
  const { periodo, dataInicio, dataFim } = state.filtros;
  const janelaPeriodo = filtroDeDataAtivo() ? null : janelaDoPeriodo(periodo);

  let inicioChave = janelaPeriodo ? chaveDia(janelaPeriodo.inicio) : null;
  let fimChave = janelaPeriodo ? chaveDia(janelaPeriodo.fim) : null;

  if (dataInicio && (!inicioChave || dataInicio > inicioChave)) inicioChave = dataInicio;
  if (dataFim && (!fimChave || dataFim < fimChave)) fimChave = dataFim;

  return { inicioChave, fimChave };
}

function agruparPorDia(eventos) {
  const { inicioChave, fimChave } = janelaDeExibicaoAtual();
  const grupos = new Map();
  eventos.forEach((evento) => {
    diasQueEventoAbrange(evento)
      .filter((chave) => (!inicioChave || chave >= inicioChave) && (!fimChave || chave <= fimChave))
      .forEach((chave) => {
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push({ evento, diaChave: chave });
      });
  });

  return Array.from(grupos.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([chave, lista]) => ({
      chave,
      rotulo: formatarDataLonga(new Date(`${chave}T12:00:00${offsetBahia()}`)),
      eventos: lista.sort((a, b) => new Date(a.evento.inicio) - new Date(b.evento.inicio)),
    }));
}

function duracaoLegivel(evento) {
  const ms = new Date(evento.fim) - new Date(evento.inicio);
  const minutos = Math.round(ms / 60000);
  if (evento.diaInteiro) {
    const dias = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
    return dias > 1 ? `${dias} dias` : "dia inteiro";
  }
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h${String(resto).padStart(2, "0")}` : `${horas}h`;
}

function formatarDataCurta(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

// Resumo curto da lista de participantes: até 2 nomes por extenso; a partir
// de 3, mostra os dois primeiros e "+N".
function participantesResumo(evento) {
  const p = evento.participantes || [];
  if (p.length === 0) return "";
  if (p.length <= 2) return p.join(", ");
  return `${p[0]}, ${p[1]} +${p.length - 2}`;
}

// Horário exibido no bloco de tempo do cartão (linha do tempo), ajustado ao
// dia específico dentro do intervalo — nos dias intermediários e no dia
// final de um compromisso de vários dias, o horário "bruto" de início/fim
// do evento não faz sentido isolado, então cada dia mostra a informação
// relevante para si.
function tempoCartaoPorDia(evento, diaChave) {
  if (evento.diaInteiro) {
    return { horaInicio: "Dia inteiro", horaFim: duracaoLegivel(evento) };
  }
  if (!eventoEhContinuo(evento)) {
    return {
      horaInicio: formatarHora(new Date(evento.inicio)),
      horaFim: `até ${formatarHora(new Date(evento.fim))}`,
    };
  }

  const diaInicioChave = chaveDia(new Date(evento.inicio));
  const diaFimChave = chaveDia(new Date(evento.fim));
  if (diaChave === diaInicioChave) {
    return { horaInicio: formatarHora(new Date(evento.inicio)), horaFim: "continua no(s) dia(s) seguinte(s)" };
  }
  if (diaChave === diaFimChave) {
    return { horaInicio: "Continuação", horaFim: `até ${formatarHora(new Date(evento.fim))}` };
  }
  return { horaInicio: "Dia inteiro", horaFim: "compromisso contínuo" };
}

// Equivalente resumido em uma linha só, usado nas exportações (PDF/JPEG/texto).
function horarioResumoPorDia(evento, diaChave) {
  if (evento.diaInteiro) return "Dia inteiro";
  if (!eventoEhContinuo(evento)) {
    return `${formatarHora(new Date(evento.inicio))} – ${formatarHora(new Date(evento.fim))}`;
  }

  const diaInicioChave = chaveDia(new Date(evento.inicio));
  const diaFimChave = chaveDia(new Date(evento.fim));
  if (diaChave === diaInicioChave) return `A partir das ${formatarHora(new Date(evento.inicio))}`;
  if (diaChave === diaFimChave) return `Até às ${formatarHora(new Date(evento.fim))}`;
  return "Dia inteiro (contínuo)";
}

function criarCardElemento(evento, diaChave) {
  const situacao = situacaoTemporal(evento);
  const card = document.createElement("article");
  card.className = `card card--${evento.categoria}`;
  card.dataset.eventoId = evento.id;
  if (situacao === "andamento") card.classList.add("card--em-andamento");
  if (situacao === "concluido") card.classList.add("card--concluido");
  if (evento.cancelado) card.classList.add("card--cancelado");
  if (evento.conflito && situacao !== "concluido") card.classList.add("card--conflito");

  const continuo = eventoEhContinuo(evento);
  const { horaInicio, horaFim } = tempoCartaoPorDia(evento, diaChave);

  const badges = [];
  if (situacao === "andamento") badges.push(`<span class="badge badge--agora">Em andamento</span>`);
  badges.push(`<span class="badge badge--${evento.categoria}">${CATEGORIA_LABEL[evento.categoria]}</span>`);
  if (continuo) {
    badges.push(
      `<span class="badge badge--continuo">${formatarDataCurta(new Date(evento.inicio))}–${formatarDataCurta(dataFimInclusivo(evento))}</span>`
    );
  }
  if (evento.recorrente) badges.push(`<span class="badge badge--recorrente">Recorrente</span>`);
  if (situacao === "concluido") badges.push(`<span class="badge badge--concluido">Concluído</span>`);
  if (evento.conflito && situacao !== "concluido") {
    badges.push(`<span class="badge badge--conflito">⚠ Sobreposição</span>`);
  }

  const resumoPart = participantesResumo(evento);

  card.innerHTML = `
    ${evento.cancelado ? `<div class="card__banner-cancelado">⚠ Compromisso cancelado</div>` : ""}
    <div class="card__linha">
      <div class="card__tempo">
        <span class="card__hora-inicio">${horaInicio}</span>
        <span class="card__hora-fim">${horaFim}</span>
        <span class="card__duracao">${duracaoLegivel(evento)}</span>
      </div>
      <div class="card__conteudo">
        <div class="card__titulo-linha">
          <h3 class="card__titulo">${escapeHtml(evento.titulo)}</h3>
          <span class="card__badges">${badges.join("")}</span>
        </div>
        <div class="card__meta">
          ${evento.local ? `<span>${ICONE_LOCAL}${escapeHtml(evento.local)}</span>` : ""}
          ${resumoPart ? `<span>${ICONE_PESSOAS}${escapeHtml(resumoPart)}</span>` : ""}
        </div>
        ${evento.descricao ? `<p class="card__descricao">${escapeHtml(evento.descricao)}</p>` : ""}
        <div class="card__rodape">
          ${evento.link ? `<a class="card__link" href="${escapeAttr(evento.link)}" target="_blank" rel="noopener">${ICONE_LINK}Entrar na reunião</a>` : ""}
          <button class="card__detalhes-btn" type="button" data-abrir-detalhes="${escapeAttr(evento.id)}">Ver detalhes</button>
        </div>
      </div>
    </div>
  `;

  return card;
}

function escapeHtml(str) {
  return (str || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

function preencherTimeline(filtrados) {
  const container = document.getElementById("timeline");
  const vazio = document.getElementById("timeline-vazio");

  container.innerHTML = "";

  if (filtrados.length === 0) {
    vazio.hidden = false;
    return;
  }
  vazio.hidden = true;

  const grupos = agruparPorDia(filtrados);
  grupos.forEach((grupo) => {
    const grupoEl = document.createElement("div");
    grupoEl.className = "timeline__grupo";

    const dataEl = document.createElement("div");
    dataEl.className = "timeline__data";
    dataEl.textContent = grupo.rotulo;
    grupoEl.appendChild(dataEl);

    const listaEl = document.createElement("div");
    listaEl.className = "timeline__lista";
    grupo.eventos.forEach(({ evento, diaChave }) => listaEl.appendChild(criarCardElemento(evento, diaChave)));
    grupoEl.appendChild(listaEl);

    container.appendChild(grupoEl);
  });
}

// Placeholders animados exibidos apenas na primeira carga (sem cache local
// disponível ainda) para reduzir a sensação de espera enquanto o ICS é buscado.
function mostrarEsqueletos(quantidade) {
  const container = document.getElementById("timeline");
  const vazio = document.getElementById("timeline-vazio");
  vazio.hidden = true;
  container.innerHTML = "";

  for (let i = 0; i < quantidade; i++) {
    const card = document.createElement("div");
    card.className = "skeleton-card";
    card.innerHTML = `
      <div class="skeleton-linha skeleton-card__tempo"></div>
      <div class="skeleton-card__conteudo">
        <div class="skeleton-linha skeleton-card__titulo"></div>
        <div class="skeleton-linha skeleton-card__meta"></div>
        <div class="skeleton-linha skeleton-card__descricao"></div>
      </div>
    `;
    container.appendChild(card);
  }
}

/* ==========================================================================
   AGENDA DO DIA — ANÁLISE DERIVADA (ocupação, janelas livres, sobreposições)

   Tudo o que a tela mostra em número — quantos compromissos ainda faltam,
   ocupação sobre a jornada útil, total livre, sobreposições — é derivado
   desta análise em tempo de render. Nenhum desses valores está escrito à mão
   em lugar nenhum, e a exportação em PDF e o card JPEG leem exatamente a
   mesma função que a tela.
   ========================================================================== */

// Jornada útil de referência para ocupação e janelas livres.
const JORNADA_INI = 8 * 60; // 08:00
const JORNADA_FIM = 18 * 60; // 18:00

// Faixa mínima desenhada na pista; estende-se conforme os compromissos do dia.
const PISTA_INI_PADRAO = 7 * 60 + 30; // 07:30
const PISTA_FIM_PADRAO = 18 * 60 + 30; // 18:30

// Escala real: 96px por hora. Um compromisso de 3h30 ocupa três vezes e meia
// a altura de um de 1h — é o que separa uma linha do tempo de uma lista.
const PISTA_PX_HORA = 96;

// Vão mínimo para que um intervalo vazio valha ser anunciado como janela.
const JANELA_MINIMA_MIN = 30;

function minutosDoDia(date) {
  const [h, m] = formatarHora(date).split(":").map(Number);
  return h * 60 + m;
}

function hhmmDeMinutos(min) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// "3h30", "45 min", "2h" — sempre em monoespaçada na tela.
function duracaoCurta(minutos) {
  const total = Math.max(0, Math.round(minutos));
  const h = Math.floor(total / 60);
  const r = total % 60;
  if (h && r) return `${h}h${String(r).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${r} min`;
}

// Une intervalos [ini, fim] que se tocam ou se sobrepõem.
function unirIntervalos(intervalos) {
  const ordenados = intervalos.slice().sort((a, b) => a[0] - b[0]);
  const unidos = [];
  ordenados.forEach((iv) => {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && iv[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], iv[1]);
    else unidos.push(iv.slice());
  });
  return unidos;
}

// Chave "YYYY-MM-DD" quando a janela de exibição cobre um único dia; null
// caso contrário. Só nesse caso a pista em escala real e o resumo do dia
// fazem sentido — em uma semana inteira a régua de horas não tem significado.
function diaUnicoVisivel() {
  const { inicioChave, fimChave } = janelaDeExibicaoAtual();
  if (inicioChave && fimChave && inicioChave === fimChave) return inicioChave;
  return null;
}

// Recorte de um compromisso dentro de um dia específico, em minutos desde a
// meia-noite. Compromissos que atravessam a virada do dia são cortados nas
// bordas, para que a pista não tente desenhar um bloco de altura negativa.
function recorteNoDia(evento, diaChave) {
  const inicio = new Date(evento.inicio);
  const fim = new Date(evento.fim);
  const chaveInicio = chaveDia(inicio);
  const chaveFim = chaveDia(fim);
  const ini = chaveInicio === diaChave ? minutosDoDia(inicio) : 0;
  const fimMin = chaveFim === diaChave ? minutosDoDia(fim) : 1440;
  return { ini, fim: Math.max(fimMin, ini + 5) };
}

/**
 * Análise completa de um dia da agenda.
 *
 * @param {Array<{evento: Object, diaChave: string}>} itens compromissos já
 *        filtrados e recortados para o dia.
 * @param {string} diaChave dia analisado, "YYYY-MM-DD".
 */
function analisarDia(itens, diaChave) {
  const blocos = [];
  const contínuos = [];

  itens.forEach((item) => {
    const { evento } = item;
    if (evento.diaInteiro) {
      contínuos.push(item);
      return;
    }
    const { ini, fim } = recorteNoDia(evento, diaChave);
    blocos.push({ ...item, ini, fim, dur: fim - ini });
  });

  blocos.sort((a, b) => a.ini - b.ini || a.fim - b.fim);

  // --- Sobreposições: agrupa em clusters e divide a pista em colunas -------
  const ativos = blocos.filter((b) => !b.evento.cancelado);
  const colunaDe = new Map();
  let cluster = [];
  let limite = -1;
  const fecharCluster = () => {
    cluster.forEach((b, i) => colunaDe.set(b.evento.id, { col: i, total: cluster.length }));
    cluster = [];
  };
  ativos.forEach((b) => {
    if (cluster.length && b.ini >= limite) fecharCluster();
    cluster.push(b);
    limite = Math.max(limite, b.fim);
  });
  fecharCluster();

  const idsConflito = new Set();
  const paresConflito = [];
  for (let i = 0; i < ativos.length; i++) {
    for (let j = i + 1; j < ativos.length; j++) {
      if (ativos[j].ini < ativos[i].fim && ativos[i].ini < ativos[j].fim) {
        paresConflito.push([ativos[i], ativos[j]]);
        idsConflito.add(ativos[i].evento.id);
        idsConflito.add(ativos[j].evento.id);
      }
    }
  }

  // --- Ocupação sobre a jornada útil --------------------------------------
  const ocupadoMin = unirIntervalos(ativos.map((b) => [b.ini, b.fim])).reduce(
    (acc, iv) => acc + Math.max(0, Math.min(iv[1], JORNADA_FIM) - Math.max(iv[0], JORNADA_INI)),
    0
  );

  // --- Janelas livres: o que sobra depois de tudo que está em tela --------
  // (inclui os cancelados exibidos: com o cancelado à vista, o vão dele não
  // é uma janela livre nova — é o horário do compromisso que caiu.)
  const ocupacaoVisivel = unirIntervalos(blocos.map((b) => [b.ini, b.fim]));
  const janelas = [];
  let cursor = JORNADA_INI;
  ocupacaoVisivel.forEach((iv) => {
    if (iv[0] - cursor >= JANELA_MINIMA_MIN) janelas.push([cursor, iv[0]]);
    cursor = Math.max(cursor, iv[1]);
  });
  if (JORNADA_FIM - cursor >= JANELA_MINIMA_MIN) janelas.push([cursor, JORNADA_FIM]);
  const livreMin = janelas.reduce((acc, j) => acc + (j[1] - j[0]), 0);

  // --- Agora / a seguir ---------------------------------------------------
  const agora = new Date();
  const ehHoje = chaveDia(agora) === diaChave;
  const minutosAgora = ehHoje ? minutosDoDia(agora) : null;

  let emAndamento = null;
  let proximo = null;
  if (ehHoje) {
    emAndamento = ativos.find((b) => b.ini <= minutosAgora && minutosAgora < b.fim) || null;
    proximo = ativos.find((b) => b.ini > minutosAgora) || null;
  } else {
    proximo = ativos[0] || null;
  }
  const restam = ehHoje
    ? ativos.filter((b) => b.fim > minutosAgora).length
    : ativos.length;

  // --- Extremos desenhados na pista ---------------------------------------
  let t0 = PISTA_INI_PADRAO;
  let t1 = PISTA_FIM_PADRAO;
  blocos.forEach((b) => {
    t0 = Math.min(t0, Math.floor(b.ini / 60) * 60);
    t1 = Math.max(t1, Math.ceil(b.fim / 60) * 60);
  });
  if (ehHoje && minutosAgora !== null) {
    t0 = Math.min(t0, Math.floor(minutosAgora / 60) * 60);
    t1 = Math.max(t1, Math.ceil(minutosAgora / 60) * 60);
  }

  return {
    diaChave,
    ehHoje,
    minutosAgora,
    blocos,
    contínuos,
    colunaDe,
    idsConflito,
    paresConflito,
    ocupadoMin,
    janelas,
    livreMin,
    emAndamento,
    proximo,
    restam,
    t0,
    t1,
  };
}

// Análise do dia atualmente em tela, ou null quando a janela de exibição
// cobre mais de um dia (semana, mês, "todos" ou intervalo manual).
function analiseDoDiaVisivel(filtrados) {
  const diaChave = diaUnicoVisivel();
  if (!diaChave) return null;
  const grupo = agruparPorDia(filtrados).find((g) => g.chave === diaChave);
  return analisarDia(grupo ? grupo.eventos : [], diaChave);
}

// "Agora" e "a seguir" respondem sobre o instante presente, não sobre a janela
// escolhida: numa visão de semana ou mês eles continuam válidos, desde que o
// dia de hoje esteja dentro do que está filtrado.
function analiseDeHoje(filtrados) {
  const hoje = chaveDia(new Date());
  const grupo = agruparPorDia(filtrados).find((g) => g.chave === hoje);
  if (!grupo) return null;
  return analisarDia(grupo.eventos, hoje);
}

/* ==========================================================================
   AGORA / A SEGUIR + RESUMO DO DIA
   ========================================================================== */

const ICONE_LOCAL =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex:0 0 auto;opacity:.75"><path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z"></path><circle cx="12" cy="10" r="2.4"></circle></svg>';
const ICONE_RELOGIO =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex:0 0 auto;opacity:.75"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 1.8"></path></svg>';
const ICONE_PESSOAS =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex:0 0 auto;opacity:.75"><circle cx="9" cy="8.5" r="3.2"></circle><path d="M3.5 19c.6-3.1 2.8-4.6 5.5-4.6S14 15.9 14.6 19"></path><path d="M16 6.2a3.2 3.2 0 010 5.6M18.4 14.6c1.6.7 2.6 2.1 3 4.4"></path></svg>';
const ICONE_LINK =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M10 13a3.5 3.5 0 005 0l3-3a3.5 3.5 0 10-5-5l-1 1"></path><path d="M14 11a3.5 3.5 0 00-5 0l-3 3a3.5 3.5 0 105 5l1-1"></path></svg>';

// Contagem legível até um horário do próprio dia ("em 1h20", "em 12 min").
function contagemAte(minutos) {
  if (minutos <= 0) return "agora";
  if (minutos < 60) return `em ${minutos} min`;
  return `em ${duracaoCurta(minutos)}`;
}

function renderizarBriefDoDia(analise) {
  const secao = document.getElementById("day-brief");
  const boxAgora = document.getElementById("brief-agora");
  const boxProximo = document.getElementById("brief-proximo");
  if (!secao) return;

  if (!analise || analise.blocos.length === 0) {
    secao.hidden = true;
    return;
  }
  secao.hidden = false;

  // --- Em andamento -------------------------------------------------------
  const atual = analise.emAndamento;
  boxAgora.classList.toggle("is-ativo", !!atual);
  if (atual) {
    const decorrido = analise.minutosAgora - atual.ini;
    const restante = atual.fim - analise.minutosAgora;
    const progresso = Math.round((decorrido / atual.dur) * 100);
    boxAgora.innerHTML = `
      <div class="brief-card__topo">
        <span class="brief-card__ponto"></span>
        <span class="brief-card__rotulo">Em andamento</span>
        <span class="brief-card__contagem">termina em ${duracaoCurta(restante)}</span>
      </div>
      <div class="brief-card__titulo">${escapeHtml(atual.evento.titulo)}</div>
      <div class="brief-card__meta">
        ${atual.evento.local ? `<span>${ICONE_LOCAL}${escapeHtml(atual.evento.local)}</span>` : ""}
        <span class="mono">${ICONE_RELOGIO}${hhmmDeMinutos(atual.ini)} – ${hhmmDeMinutos(atual.fim)}</span>
      </div>
      <div class="brief-card__progresso">
        <div class="brief-card__barra"><i style="width:${Math.min(100, Math.max(0, progresso))}%"></i></div>
        <div class="brief-card__nota">${progresso}% decorrido · ${duracaoCurta(atual.dur)} no total</div>
      </div>
    `;
  } else {
    const rotulo = analise.ehHoje ? "Nenhum compromisso em andamento" : "Dia sem compromisso em curso";
    boxAgora.innerHTML = `
      <div class="brief-card__topo">
        <span class="brief-card__ponto"></span>
        <span class="brief-card__rotulo">Agora</span>
        <span class="brief-card__contagem">${analise.ehHoje ? hhmmDeMinutos(analise.minutosAgora) : hhmmDeMinutos(JORNADA_INI)}</span>
      </div>
      <div class="brief-card__titulo">${rotulo}</div>
      <div class="brief-card__nota">Agenda livre neste instante.</div>
    `;
  }

  // --- A seguir -----------------------------------------------------------
  const prox = analise.proximo;
  if (prox) {
    const quando = analise.ehHoje ? contagemAte(prox.ini - analise.minutosAgora) : "no dia exibido";
    boxProximo.innerHTML = `
      <div class="brief-card__topo">
        <span class="brief-card__rotulo">A seguir</span>
        <span class="brief-card__contagem">${quando}</span>
      </div>
      <div class="brief-card__titulo">${escapeHtml(prox.evento.titulo)}</div>
      <div class="brief-card__meta">
        <span class="badge badge--${prox.evento.categoria}">${CATEGORIA_LABEL[prox.evento.categoria]}</span>
        <span class="mono">${hhmmDeMinutos(prox.ini)} – ${hhmmDeMinutos(prox.fim)}</span>
      </div>
      ${prox.evento.local ? `<div class="brief-card__meta"><span>${ICONE_LOCAL}${escapeHtml(prox.evento.local)}</span></div>` : ""}
    `;
  } else {
    boxProximo.innerHTML = `
      <div class="brief-card__topo"><span class="brief-card__rotulo">A seguir</span></div>
      <div class="brief-card__titulo">Sem mais compromissos no dia</div>
      <div class="brief-card__nota">A agenda do dia está encerrada.</div>
    `;
  }
}

// A faixa de quatro números troca de leitura conforme a janela: no dia é o
// resumo derivado do redesenho; em semana/mês/todos volta a ser a contagem
// de compromissos por situação, que é o que faz sentido ali.
function renderizarResumoDoDia(analise, filtrados) {
  const secao = document.getElementById("day-stats");
  if (!secao) return;
  secao.hidden = false;

  const cel = (id) => document.getElementById(id);
  const celConflito = document.getElementById("stat-cel-conflito");

  if (analise) {
    const restam = analise.restam;
    cel("stat-restam").textContent = restam;
    cel("stat-restam-rotulo").textContent = restam === 1 ? "compromisso" : "compromissos";
    secao.querySelectorAll(".day-stats__rotulo")[0].textContent = analise.ehHoje ? "Ainda hoje" : "No dia";

    cel("stat-ocupacao").textContent = duracaoCurta(analise.ocupadoMin);
    const pct = Math.min(100, Math.round((analise.ocupadoMin / (JORNADA_FIM - JORNADA_INI)) * 100));
    cel("stat-ocupacao-barra").style.width = `${pct}%`;
    secao.querySelectorAll(".day-stats__rotulo")[1].textContent = "Ocupação";
    secao.querySelectorAll(".day-stats__unidade")[1].textContent = "de 10h úteis";

    cel("stat-livre").textContent = duracaoCurta(analise.livreMin);
    const nj = analise.janelas.length;
    cel("stat-livre-rotulo").textContent = nj === 0 ? "nenhuma janela" : nj === 1 ? "em 1 janela" : `em ${nj} janelas`;
    secao.querySelectorAll(".day-stats__rotulo")[2].textContent = "Janelas livres";

    const nc = analise.paresConflito.length;
    cel("stat-conflitos").textContent = nc;
    cel("stat-conflitos-rotulo").textContent = nc === 0 ? "nenhuma" : nc === 1 ? "sobreposição" : "sobreposições";
    secao.querySelectorAll(".day-stats__rotulo")[3].textContent = "Sobreposições";
    celConflito.classList.toggle("is-ativo", nc > 0);
    return;
  }

  // Janela de vários dias: contagem por situação.
  let andamento = 0;
  let futuros = 0;
  let concluidos = 0;
  filtrados.forEach((evento) => {
    const situacao = situacaoTemporal(evento);
    if (situacao === "andamento") andamento++;
    else if (situacao === "futuro") futuros++;
    else concluidos++;
  });

  secao.querySelectorAll(".day-stats__rotulo")[0].textContent = "Compromissos";
  cel("stat-restam").textContent = filtrados.length;
  cel("stat-restam-rotulo").textContent = "no período";

  secao.querySelectorAll(".day-stats__rotulo")[1].textContent = "Em andamento";
  cel("stat-ocupacao").textContent = andamento;
  cel("stat-ocupacao-barra").style.width = filtrados.length ? `${Math.round((andamento / filtrados.length) * 100)}%` : "0%";
  secao.querySelectorAll(".day-stats__unidade")[1].textContent = "agora";

  secao.querySelectorAll(".day-stats__rotulo")[2].textContent = "Próximos";
  cel("stat-livre").textContent = futuros;
  cel("stat-livre-rotulo").textContent = "por vir";

  secao.querySelectorAll(".day-stats__rotulo")[3].textContent = "Concluídos";
  cel("stat-conflitos").textContent = concluidos;
  cel("stat-conflitos-rotulo").textContent = "encerrados";
  celConflito.classList.remove("is-ativo");
}

/* ==========================================================================
   ROTA DO DIA (sidebar) — "onde eu preciso estar"
   ========================================================================== */

function renderizarRotaDoDia(analise) {
  const grupo = document.getElementById("rota-grupo");
  const lista = document.getElementById("rota-lista");
  if (!grupo || !lista) return;

  if (!analise) {
    grupo.hidden = true;
    return;
  }

  // Sequência cronológica de locais, sem repetir o mesmo local duas vezes
  // seguidas — quem lê quer o deslocamento, não a lista de compromissos.
  const paradas = [];
  analise.blocos
    .filter((b) => !b.evento.cancelado && b.evento.local)
    .forEach((b) => {
      const ultimo = paradas[paradas.length - 1];
      if (ultimo && ultimo.local === b.evento.local) return;
      paradas.push({ hora: hhmmDeMinutos(b.ini), local: b.evento.local, categoria: b.evento.categoria });
    });

  grupo.hidden = false;
  if (paradas.length === 0) {
    lista.innerHTML = `<li class="rota-vazia">Nenhum local informado nos compromissos do dia.</li>`;
    return;
  }

  lista.innerHTML = paradas
    .map(
      (p) => `
      <li class="rota__item">
        <span class="rota__trilho">
          <span class="rota__ponto" style="color:${CATEGORIA_COR[p.categoria]};background:${CATEGORIA_COR[p.categoria]}"></span>
          <span class="rota__linha"></span>
        </span>
        <span class="rota__corpo">
          <span class="rota__cabeca">
            <span class="rota__hora">${p.hora}</span>
            <span class="badge badge--${p.categoria}">${CATEGORIA_LABEL[p.categoria]}</span>
          </span>
          <span class="rota__local">${escapeHtml(p.local)}</span>
        </span>
      </li>`
    )
    .join("");
}

/* ==========================================================================
   LINHA DO TEMPO EM ESCALA REAL DE HORAS
   ========================================================================== */

function rotuloStatusDoBloco(bloco) {
  if (bloco.evento.cancelado) return { texto: "Cancelado", classe: "cancelado" };
  const situacao = situacaoTemporal(bloco.evento);
  if (situacao === "concluido") return { texto: "Concluído", classe: "concluido" };
  if (situacao === "andamento") return { texto: "Em andamento", classe: "andamento" };
  return { texto: "Agendado", classe: "agendado" };
}

function preencherPista(analise) {
  const cartao = document.getElementById("pista-card");
  const pista = document.getElementById("pista");
  if (!cartao || !pista) return;

  if (!analise || analise.blocos.length === 0) {
    cartao.hidden = true;
    return;
  }
  cartao.hidden = false;

  const { t0, t1 } = analise;
  const y = (min) => ((min - t0) / 60) * PISTA_PX_HORA;
  const alturaPista = y(t1);

  const partes = [];
  partes.push('<div class="pista__regua"></div>');

  // Régua de horas: o rótulo some perto do "agora" para não colidir com a
  // etiqueta vermelha, que ocupa o mesmo trecho da régua.
  for (let m = Math.ceil(t0 / 60) * 60; m <= t1; m += 60) {
    const esconder = analise.ehHoje && Math.abs(m - analise.minutosAgora) <= 16;
    partes.push(`<div class="pista__hora-linha" style="top:${y(m)}px"></div>`);
    partes.push(
      `<div class="pista__hora-rotulo" style="top:${y(m) - 7}px${esconder ? ";visibility:hidden" : ""}">${hhmmDeMinutos(m)}</div>`
    );
  }

  const trilho = [];

  // Janelas livres: o vazio ganha lugar e tamanho reais.
  analise.janelas.forEach((j) => {
    const altura = ((j[1] - j[0]) / 60) * PISTA_PX_HORA - 4;
    if (altura < 18) return;
    trilho.push(
      `<div class="pista__janela" style="top:${y(j[0]) + 2}px;height:${altura}px">
         <span>${duracaoCurta(j[1] - j[0])} livre</span>
       </div>`
    );
  });

  analise.blocos.forEach((bloco) => {
    const { evento } = bloco;
    const coluna = analise.colunaDe.get(evento.id) || { col: 0, total: 1 };
    const estreito = coluna.total > 1;
    const largura = 100 / coluna.total;
    const alturaPx = Math.max((bloco.dur / 60) * PISTA_PX_HORA - 4, 50);

    // O nível de detalhe é decidido pela altura disponível em px, não pela
    // duração em minutos: 1h em coluna dividida cabe menos que 1h em coluna
    // cheia, porque tem menos espaço.
    const detalhado = !estreito && alturaPx >= 84;
    const longo = !estreito && alturaPx >= 132;
    const mostrarLink = !!evento.link && alturaPx >= (estreito ? 118 : 100);

    const status = rotuloStatusDoBloco(bloco);
    const temConflito = analise.idsConflito.has(evento.id);
    const classes = ["pista__evento"];
    if (estreito) classes.push("is-estreito");
    if (evento.cancelado) classes.push("is-cancelado");
    else if (status.classe === "andamento") classes.push("is-andamento");

    const estilo = [
      `top:${y(bloco.ini) + 2}px`,
      `height:${alturaPx}px`,
      `left:${coluna.col * largura}%`,
      coluna.total > 1 ? `width:calc(${largura}% - 6px)` : "width:100%",
    ].join(";");

    const selos = [
      `<span class="badge badge--${evento.categoria}">${CATEGORIA_LABEL[evento.categoria]}</span>`,
      `<span class="badge badge--${status.classe}">${status.texto}</span>`,
      temConflito ? `<span class="badge badge--conflito">⚠ Sobreposição</span>` : "",
    ].join("");

    const corpo = estreito
      ? `
        <div class="pista__evento-corpo">
          <div class="pista__titulo">${escapeHtml(evento.titulo)}</div>
          <div class="pista__linha">
            <span class="pista__hora">${hhmmDeMinutos(bloco.ini)}–${hhmmDeMinutos(bloco.fim)}</span>
            ${temConflito ? `<span class="badge badge--conflito">⚠ Conflito</span>` : ""}
            <span class="badge badge--${status.classe}">${status.texto}</span>
          </div>
          ${evento.local ? `<div class="pista__meta"><span class="elipse">${ICONE_LOCAL}${escapeHtml(evento.local)}</span></div>` : ""}
          ${mostrarLink ? `<div class="pista__link">${ICONE_LINK}Entrar na reunião</div>` : ""}
        </div>`
      : `
        <div class="pista__evento-corpo">
          <div class="pista__linha pista__linha--titulo">
            <span class="pista__hora">${hhmmDeMinutos(bloco.ini)} – ${hhmmDeMinutos(bloco.fim)}</span>
            <span class="pista__titulo">${escapeHtml(evento.titulo)}</span>
          </div>
          <div class="pista__linha">${selos}</div>
          ${
            detalhado
              ? `<div class="pista__meta">
                   ${evento.local ? `<span>${ICONE_LOCAL}${escapeHtml(evento.local)}</span>` : ""}
                   ${participantesResumo(evento) ? `<span>${ICONE_PESSOAS}${escapeHtml(participantesResumo(evento))}</span>` : ""}
                 </div>`
              : ""
          }
          ${mostrarLink ? `<div class="pista__link">${ICONE_LINK}Entrar na reunião</div>` : ""}
          ${longo && evento.descricao ? `<div class="pista__nota">${escapeHtml(evento.descricao)}</div>` : ""}
        </div>`;

    trilho.push(
      `<button type="button" class="${classes.join(" ")}" style="${estilo}" id="pista-${escapeAttr(evento.id)}"
               data-abrir-detalhes="${escapeAttr(evento.id)}"
               aria-label="${escapeAttr(`${hhmmDeMinutos(bloco.ini)} às ${hhmmDeMinutos(bloco.fim)} — ${evento.titulo} — ${status.texto}`)}">
         <span class="pista__faixa" style="background:${evento.cancelado ? "#D80425" : CATEGORIA_COR[evento.categoria]}"></span>
         ${corpo}
       </button>`
    );
  });

  partes.push(`<div class="pista__trilho" style="height:${alturaPista}px">${trilho.join("")}</div>`);

  // Linha vermelha do "agora" — só existe quando o dia em tela é hoje.
  if (analise.ehHoje && analise.minutosAgora >= t0 && analise.minutosAgora <= t1) {
    partes.push(
      `<div class="pista__agora" style="top:${y(analise.minutosAgora) + 14 - 8}px;left:16px;right:16px">
         <b>${hhmmDeMinutos(analise.minutosAgora)}</b><i></i>
       </div>`
    );
  }

  pista.style.height = `${alturaPista + 32}px`;
  pista.innerHTML = partes.join("");

  // Cabeçalho da pista: contagem e legenda das modalidades presentes.
  const visiveis = analise.blocos.length;
  document.getElementById("pista-contagem").textContent =
    `${visiveis} compromisso${visiveis === 1 ? "" : "s"} · ${duracaoCurta(analise.ocupadoMin)} ocupados`;

  const categoriasPresentes = Array.from(new Set(analise.blocos.map((b) => b.evento.categoria)));
  document.getElementById("pista-legenda").innerHTML = categoriasPresentes
    .map(
      (c) =>
        `<span class="pista-legenda__item"><span class="pista-legenda__ponto" style="background:${CATEGORIA_COR[c]}"></span>${CATEGORIA_LABEL[c]}</span>`
    )
    .join("");
}

/* ==========================================================================
   DASHBOARD (INDICADORES)
   ========================================================================== */

function renderizarDashboard(filtrados) {
  const analise = analiseDoDiaVisivel(filtrados);

  renderizarBriefDoDia(analise || analiseDeHoje(filtrados));
  renderizarResumoDoDia(analise, filtrados);
  renderizarRotaDoDia(analise);
  preencherPista(analise);

  const temPista = !document.getElementById("pista-card").hidden;
  document.getElementById("vista-timeline").classList.toggle("tem-pista", temPista);

  document.getElementById("page-title").textContent = tituloDaPagina();
  document.getElementById("page-subtitle").textContent = subtituloDaPagina();
  document.getElementById("page-eyebrow").textContent =
    ehAgendaDeUmDiaSo() ? "Agenda do dia" : "Agenda institucional";

  // Alerta de sobreposição: no dia, aponta o par exato e leva à posição na
  // linha do tempo; em janelas de vários dias, conta os compromissos
  // sobrepostos detectados em toda a agenda.
  const alerta = document.getElementById("conflict-alert");
  const detalhe = document.getElementById("conflict-alert-detalhe");
  const link = document.getElementById("conflict-alert-link");

  if (analise && analise.paresConflito.length > 0) {
    const [a, b] = analise.paresConflito[0];
    const sobreposicao = Math.min(a.fim, b.fim) - Math.max(a.ini, b.ini);
    detalhe.textContent =
      `${a.evento.titulo} (${hhmmDeMinutos(a.ini)}–${hhmmDeMinutos(a.fim)}) sobrepõe ` +
      `${b.evento.titulo} (${hhmmDeMinutos(b.ini)}–${hhmmDeMinutos(b.fim)}) em ${duracaoCurta(sobreposicao)}.`;
    link.href = `#pista-${a.evento.id}`;
    link.hidden = document.getElementById("pista-card").hidden;
    alerta.hidden = false;
    return;
  }

  const conflitosAtivos = filtrados.filter(
    (evento) => evento.conflito && situacaoTemporal(evento) !== "concluido"
  ).length;

  if (conflitosAtivos > 0) {
    detalhe.textContent = `${conflitosAtivos} compromisso${conflitosAtivos === 1 ? "" : "s"} sobreposto${
      conflitosAtivos === 1 ? "" : "s"
    } no período exibido.`;
    link.hidden = true;
    alerta.hidden = false;
  } else {
    alerta.hidden = true;
  }
}

/* ==========================================================================
   FILTROS ATIVOS REMOVÍVEIS
   ========================================================================== */

const PERIODO_LABEL = { todos: "Todos", dia: "Hoje", semana: "Esta semana", mes: "Este mês" };
const PERIODO_TITULO = { todos: "Agenda — todos os compromissos", dia: "Agenda de Hoje", semana: "Agenda da Semana", mes: "Agenda do Mês" };

// Pontos coloridos por categoria (mesmas cores dos badges), usados na lista
// de categorias da sidebar.
const CATEGORIA_COR = {
  viagem: "#A65A05",
  "pauta-online": "#2C63B0",
  "pauta-presencial": "#0B3163",
};

// Verdadeiro quando a tela mostra um único dia — seja por "Hoje", seja por um
// intervalo digitado que começa e termina no mesmo dia.
function ehAgendaDeUmDiaSo() {
  const { periodo, dataInicio, dataFim } = state.filtros;
  if (filtroDeDataAtivo()) return Boolean(dataInicio && dataFim && dataInicio === dataFim);
  return periodo === "dia";
}

// Com um intervalo digitado, o título passa a nomear a data escolhida. Dizer
// "todos os compromissos" ali seria enganoso: o período foi devolvido para
// "Todos" justamente porque quem manda agora é a data.
function tituloDaPagina() {
  const { dataInicio, dataFim } = state.filtros;

  if (filtroDeDataAtivo()) {
    if (dataInicio && dataFim && dataInicio === dataFim) {
      return `Agenda de ${formatarDataCurta(new Date(`${dataInicio}T12:00:00${offsetBahia()}`))}`;
    }
    return "Agenda do período escolhido";
  }

  return PERIODO_TITULO[state.filtros.periodo] || "Agenda";
}

function subtituloDaPagina() {
  const { periodo, dataInicio, dataFim } = state.filtros;
  if (dataInicio || dataFim) {
    const ini = dataInicio ? formatarDataLonga(new Date(`${dataInicio}T12:00:00${offsetBahia()}`)) : "início";
    const fim = dataFim ? formatarDataLonga(new Date(`${dataFim}T12:00:00${offsetBahia()}`)) : "hoje";
    return `De ${ini} até ${fim}`;
  }
  const agora = new Date();
  if (periodo === "dia") return capitalizar(formatarDataLonga(agora));
  if (periodo === "semana") {
    return `${formatarDataCurta(segundaDaSemana(agora))} a ${formatarDataCurta(domingoDaSemana(agora))} · semana atual`;
  }
  if (periodo === "mes") {
    return capitalizar(
      new Intl.DateTimeFormat("pt-BR", { timeZone: DISPLAY_TIMEZONE, month: "long", year: "numeric" }).format(agora)
    );
  }
  return "Todos os compromissos sincronizados do Google Agenda";
}

function capitalizar(txt) {
  return txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : txt;
}

// Renderiza a lista de categorias na sidebar com um ponto colorido, o rótulo
// e a contagem de compromissos daquela categoria (respeitando os demais
// filtros ativos, exceto o próprio filtro de categoria — assim os números
// indicam quantos há disponíveis em cada uma).
function renderizarCategorias() {
  const container = document.getElementById("categoria-lista");
  if (!container) return;

  const baseContagem = state.eventos.filter(
    (evento) =>
      (filtroDeDataAtivo() || eventoNoPeriodo(evento, state.filtros.periodo)) &&
      eventoNoIntervaloDeData(evento, state.filtros.dataInicio, state.filtros.dataFim) &&
      (state.filtros.mostrarConcluidos || situacaoTemporal(evento) !== "concluido") &&
      passaBusca(evento)
  );

  const contar = (cat) => baseContagem.filter((e) => e.categoria === cat).length;

  container.innerHTML = "";
  Object.keys(CATEGORIA_LABEL).forEach((cat) => {
    const ativo = state.filtros.categorias.has(cat);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-list__item" + (ativo ? " is-active" : "");
    btn.dataset.categoria = cat;
    btn.setAttribute("aria-pressed", String(ativo));
    btn.innerHTML = `
      <span class="cat-list__dot" style="background:${CATEGORIA_COR[cat]};"></span>
      <span class="cat-list__label">${CATEGORIA_LABEL[cat]}</span>
      <span class="cat-list__count">${contar(cat)}</span>
    `;
    container.appendChild(btn);
  });
}

// Reflete no DOM o período em vigor. Necessário porque o período passou a
// mudar também por caminhos que não são o clique no próprio chip.
// No escopo do módulo porque o recorte vindo da URL também precisa dele, antes
// de inicializarInterface terminar de montar seus próprios manipuladores.
function atualizarVisibilidadeBtnLimparDatas() {
  const btn = document.getElementById("btn-limpar-datas");
  if (btn) btn.hidden = !state.filtros.dataInicio && !state.filtros.dataFim;
}

function sincronizarChipsPeriodo() {
  document.querySelectorAll("#periodo-group .chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.periodo === state.filtros.periodo);
  });
}

function limparFiltroDeData() {
  state.filtros.dataInicio = null;
  state.filtros.dataFim = null;
  document.getElementById("filtro-data-inicio").value = "";
  document.getElementById("filtro-data-fim").value = "";
  document.getElementById("btn-limpar-datas").hidden = true;
  esconderErroData();
}

function mostrarErroData(mensagem) {
  const erroEl = document.getElementById("erro-data");
  erroEl.textContent = mensagem;
  erroEl.hidden = false;
  document.getElementById("filtro-data-inicio").setAttribute("aria-invalid", "true");
  document.getElementById("filtro-data-fim").setAttribute("aria-invalid", "true");
}

function esconderErroData() {
  document.getElementById("erro-data").hidden = true;
  document.getElementById("filtro-data-inicio").removeAttribute("aria-invalid");
  document.getElementById("filtro-data-fim").removeAttribute("aria-invalid");
}

function limparTodosFiltros() {
  state.filtros.periodo = "dia";
  state.filtros.categorias = new Set();
  state.filtros.busca = "";
  state.filtros.mostrarConcluidos = true;
  document.getElementById("busca").value = "";
  document.getElementById("mostrar-concluidos").checked = true;
  limparFiltroDeData();
  sincronizarChipsPeriodo();
  renderizarConteudo();
}

function renderizarFiltrosAtivos() {
  const { periodo, categorias, busca, dataInicio, dataFim, mostrarConcluidos } = state.filtros;
  const container = document.getElementById("active-filters");
  const lista = document.getElementById("active-filters-lista");
  const tags = [];

  if (periodo !== "dia") {
    tags.push({
      label: `Período: ${PERIODO_LABEL[periodo]}`,
      remover: () => {
        state.filtros.periodo = "dia";
        sincronizarChipsPeriodo();
      },
    });
  }

  categorias.forEach((categoria) => {
    tags.push({
      label: CATEGORIA_LABEL[categoria],
      remover: () => {
        state.filtros.categorias.delete(categoria);
      },
    });
  });

  if (dataInicio || dataFim) {
    tags.push({
      label: `Data: ${dataInicio || "…"} a ${dataFim || "…"}`,
      remover: () => limparFiltroDeData(),
    });
  }

  if (busca) {
    tags.push({
      label: `Busca: "${busca}"`,
      remover: () => {
        state.filtros.busca = "";
        document.getElementById("busca").value = "";
      },
    });
  }

  if (!mostrarConcluidos) {
    tags.push({
      label: "Ocultando concluídos",
      remover: () => {
        state.filtros.mostrarConcluidos = true;
        document.getElementById("mostrar-concluidos").checked = true;
      },
    });
  }

  container.hidden = tags.length === 0;
  lista.innerHTML = "";
  tags.forEach((tag) => {
    const el = document.createElement("span");
    el.className = "filter-tag";
    el.innerHTML = `<span>${escapeHtml(tag.label)}</span> <button type="button" aria-label="Remover filtro: ${escapeAttr(tag.label)}">×</button>`;
    el.querySelector("button").addEventListener("click", () => {
      tag.remover();
      renderizarConteudo();
    });
    lista.appendChild(el);
  });
}

/* ==========================================================================
   VISÃO EM TABELA (ordenação e paginação)
   ========================================================================== */

function compararEventosTabela(a, b, campo) {
  switch (campo) {
    case "titulo":
      return a.titulo.localeCompare(b.titulo, "pt-BR");
    case "categoria":
      return CATEGORIA_LABEL[a.categoria].localeCompare(CATEGORIA_LABEL[b.categoria], "pt-BR");
    case "local":
      return (a.local || "").localeCompare(b.local || "", "pt-BR");
    case "status":
      return situacaoTemporal(a).localeCompare(situacaoTemporal(b), "pt-BR");
    case "horario":
    case "data":
    default:
      return new Date(a.inicio) - new Date(b.inicio);
  }
}

function rotuloStatus(evento) {
  if (evento.cancelado) return "Cancelado";
  const situacao = situacaoTemporal(evento);
  if (situacao === "andamento") return "Em andamento";
  if (situacao === "concluido") return "Concluído";
  return "Agendado";
}

function preencherTabela(filtrados) {
  const corpo = document.getElementById("tabela-corpo");
  const infoPagina = document.getElementById("pagina-info");
  const btnAnterior = document.getElementById("btn-pagina-anterior");
  const btnProxima = document.getElementById("btn-pagina-proxima");

  document.querySelectorAll(".th-sort").forEach((btn) => {
    const ativo = btn.dataset.sort === state.ui.tabelaOrdenarPor;
    btn.classList.toggle("is-ativo", ativo);
    const icone = btn.querySelector(".th-sort__icon");
    icone.textContent = ativo ? (state.ui.tabelaOrdemAsc ? "↑" : "↓") : "↕";
  });

  const ordenados = [...filtrados].sort((a, b) => {
    const resultado = compararEventosTabela(a, b, state.ui.tabelaOrdenarPor);
    return state.ui.tabelaOrdemAsc ? resultado : -resultado;
  });

  const porPagina = state.ui.tabelaPorPagina;
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina));
  if (state.ui.tabelaPagina > totalPaginas) state.ui.tabelaPagina = totalPaginas;
  if (state.ui.tabelaPagina < 1) state.ui.tabelaPagina = 1;

  const inicioIdx = (state.ui.tabelaPagina - 1) * porPagina;
  const pagina = ordenados.slice(inicioIdx, inicioIdx + porPagina);

  corpo.innerHTML = "";

  if (pagina.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="8" style="text-align:center;color:var(--color-text-secondary);padding:24px;">Nenhum compromisso encontrado para os filtros selecionados.</td>`;
    corpo.appendChild(tr);
  }

  pagina.forEach((evento) => {
    const tr = document.createElement("tr");
    const horario = evento.diaInteiro
      ? "Dia inteiro"
      : `${formatarHora(new Date(evento.inicio))} – ${formatarHora(new Date(evento.fim))}`;
    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
      timeZone: DISPLAY_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(evento.inicio));

    tr.innerHTML = `
      <td>${dataFormatada}</td>
      <td>${horario}</td>
      <td class="td-titulo">${escapeHtml(evento.titulo)}</td>
      <td><span class="badge badge--${evento.categoria}">${CATEGORIA_LABEL[evento.categoria]}</span></td>
      <td class="td-local">${escapeHtml(evento.local || "—")}</td>
      <td class="td-participantes">${escapeHtml(participantesResumo(evento) || "—")}</td>
      <td>${rotuloStatus(evento)}</td>
      <td><button class="btn btn--tiny-outline" type="button" data-abrir-detalhes="${escapeAttr(evento.id)}">Detalhes</button></td>
    `;
    corpo.appendChild(tr);
  });

  infoPagina.textContent = `Página ${state.ui.tabelaPagina} de ${totalPaginas} (${ordenados.length} compromisso${ordenados.length === 1 ? "" : "s"})`;
  btnAnterior.disabled = state.ui.tabelaPagina <= 1;
  btnProxima.disabled = state.ui.tabelaPagina >= totalPaginas;
}

function atualizarVisibilidadeVista() {
  const timelineEl = document.getElementById("vista-timeline");
  const tabelaEl = document.getElementById("vista-tabela");
  const btnTimeline = document.getElementById("btn-vista-timeline");
  const btnTabela = document.getElementById("btn-vista-tabela");
  const emTabela = state.ui.vista === "tabela";

  timelineEl.hidden = emTabela;
  tabelaEl.hidden = !emTabela;
  btnTimeline.classList.toggle("is-active", !emTabela);
  btnTabela.classList.toggle("is-active", emTabela);
}

/* ==========================================================================
   DISPARADOR CENTRAL DE RENDERIZAÇÃO
   ========================================================================== */

function renderizarConteudo() {
  const filtrados = obterEventosFiltrados();
  const resumo = `${filtrados.length} compromisso${filtrados.length === 1 ? "" : "s"}`;
  document.getElementById("filtros-resumo").textContent = resumo;
  const resumoExport = document.getElementById("export-resumo-contagem");
  if (resumoExport) resumoExport.textContent = resumo;

  preencherTimeline(filtrados);
  preencherTabela(filtrados);
  renderizarDashboard(filtrados);
  renderizarCategorias();
  renderizarFiltrosAtivos();
  atualizarVisibilidadeVista();

  // Mantém a pré-visualização de exportação sincronizada quando o overlay
  // estiver aberto (os filtros afetam o que será exportado).
  if (!document.getElementById("export-backdrop").hidden) {
    renderizarPreviewExport(filtrados);
  }
}

/* ==========================================================================
   PAINEL LATERAL DE DETALHES
   ========================================================================== */

let elementoComFocoAntesDoPainel = null;

function abrirPainelDetalhes(eventoId) {
  const evento = state.eventos.find((e) => e.id === eventoId);
  if (!evento) return;

  elementoComFocoAntesDoPainel = document.activeElement;

  const situacao = situacaoTemporal(evento);
  const continuo = eventoEhContinuo(evento);
  const horario = evento.diaInteiro
    ? "Dia inteiro"
    : `${formatarHora(new Date(evento.inicio))} – ${formatarHora(new Date(evento.fim))}`;
  let dataHorarioTexto;
  if (!continuo) {
    dataHorarioTexto = `${formatarDataLonga(new Date(evento.inicio))} — ${horario}`;
  } else if (evento.diaInteiro) {
    // Dia inteiro contínuo: só datas, sem "(00:00)" que não agrega nada.
    dataHorarioTexto = `${formatarDataLonga(new Date(evento.inicio))} até ${formatarDataLonga(dataFimInclusivo(evento))}`;
  } else {
    dataHorarioTexto = `${formatarDataLonga(new Date(evento.inicio))} (${formatarHora(new Date(evento.inicio))}) até ${formatarDataLonga(new Date(evento.fim))} (${formatarHora(new Date(evento.fim))})`;
  }

  const badges = [];
  if (situacao === "andamento") badges.push(`<span class="badge badge--agora">● Agora</span>`);
  badges.push(`<span class="badge badge--${evento.categoria}">${CATEGORIA_LABEL[evento.categoria]}</span>`);
  if (continuo) {
    badges.push(
      `<span class="badge badge--continuo">${formatarDataCurta(new Date(evento.inicio))}–${formatarDataCurta(dataFimInclusivo(evento))}</span>`
    );
  }
  if (evento.recorrente) badges.push(`<span class="badge badge--recorrente">Recorrente</span>`);
  if (evento.cancelado) badges.push(`<span class="badge badge--cancelado">Cancelado</span>`);
  if (situacao === "concluido") badges.push(`<span class="badge badge--concluido">Concluído</span>`);
  if (evento.conflito && situacao !== "concluido") {
    badges.push(`<span class="badge badge--conflito">⚠ Sobreposição</span>`);
  }

  document.getElementById("detail-panel-titulo").textContent = evento.titulo;
  document.getElementById("detail-panel-corpo").innerHTML = `
    <div class="detail-panel__badges">${badges.join("")}</div>
    <div class="detail-panel__linha">
      <span class="detail-panel__linha-rotulo">Data e horário</span>
      <span class="detail-panel__linha-valor">${dataHorarioTexto} (${duracaoLegivel(evento)})</span>
    </div>
    ${evento.local ? `<div class="detail-panel__linha"><span class="detail-panel__linha-rotulo">Local</span><span class="detail-panel__linha-valor">${escapeHtml(evento.local)}</span></div>` : ""}
    ${(evento.participantes || []).length ? `<div class="detail-panel__linha"><span class="detail-panel__linha-rotulo">Participantes</span><span class="detail-panel__linha-valor">${escapeHtml(evento.participantes.join(", "))}</span></div>` : ""}
    ${evento.descricao ? `<div class="detail-panel__linha"><span class="detail-panel__linha-rotulo">Descrição</span><span class="detail-panel__linha-valor">${escapeHtml(evento.descricao)}</span></div>` : ""}
    ${evento.link ? `<a class="detail-panel__link" href="${escapeAttr(evento.link)}" target="_blank" rel="noopener">${ICONE_LINK}Entrar na reunião</a>` : ""}
  `;

  const painel = document.getElementById("detail-panel");
  const backdrop = document.getElementById("panel-backdrop");
  painel.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  setTimeout(() => painel.classList.add("is-aberto"), 0);
  document.getElementById("btn-fechar-painel").focus();
}

function fecharPainelDetalhes() {
  const painel = document.getElementById("detail-panel");
  const backdrop = document.getElementById("panel-backdrop");
  if (painel.getAttribute("aria-hidden") === "true") return;

  painel.classList.remove("is-aberto");
  backdrop.hidden = true;
  setTimeout(() => painel.setAttribute("aria-hidden", "true"), 200);

  if (elementoComFocoAntesDoPainel && document.contains(elementoComFocoAntesDoPainel)) {
    elementoComFocoAntesDoPainel.focus();
  }
}

/* ==========================================================================
   MODAL DE CONFIRMAÇÃO (ações críticas / exportações grandes)
   ========================================================================== */

function confirmarAcao(mensagem, titulo) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const backdrop = document.getElementById("confirm-backdrop");
    document.getElementById("confirm-titulo").textContent = titulo || "Confirmar ação";
    document.getElementById("confirm-mensagem").textContent = mensagem;

    const elementoAnterior = document.activeElement;
    modal.hidden = false;
    backdrop.hidden = false;

    const btnCancelar = document.getElementById("confirm-cancelar");
    const btnContinuar = document.getElementById("confirm-continuar");
    btnContinuar.focus();

    function limpar(resultado) {
      modal.hidden = true;
      backdrop.hidden = true;
      btnCancelar.removeEventListener("click", aoCancelar);
      btnContinuar.removeEventListener("click", aoContinuar);
      if (elementoAnterior && document.contains(elementoAnterior)) elementoAnterior.focus();
      resolve(resultado);
    }
    function aoCancelar() {
      limpar(false);
    }
    function aoContinuar() {
      limpar(true);
    }

    btnCancelar.addEventListener("click", aoCancelar);
    btnContinuar.addEventListener("click", aoContinuar);
  });
}

/* ==========================================================================
   TEMA CLARO/ESCURO
   ========================================================================== */

const TEMA_STORAGE_KEY = "saaTcm.tema";

function sistemaPrefereTemaEscuro() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// tema: "dark" | "light" | null (null = segue a preferência do sistema).
function aplicarTema(tema) {
  if (tema === "dark" || tema === "light") {
    document.documentElement.setAttribute("data-theme", tema);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  const efetivoEscuro = tema ? tema === "dark" : sistemaPrefereTemaEscuro();

  const btn = document.getElementById("btn-tema");
  if (btn) btn.setAttribute("aria-pressed", String(efetivoEscuro));

  const metaTema = document.getElementById("meta-theme-color");
  if (metaTema) metaTema.setAttribute("content", efetivoEscuro ? "#0B2A4E" : "#0A3165");
}

function alternarTema() {
  const efetivoEscuro = document.documentElement.getAttribute("data-theme")
    ? document.documentElement.getAttribute("data-theme") === "dark"
    : sistemaPrefereTemaEscuro();
  const novoTema = efetivoEscuro ? "light" : "dark";

  aplicarTema(novoTema);
  try {
    localStorage.setItem(TEMA_STORAGE_KEY, novoTema);
  } catch (e) {
    /* ignora */
  }
}

function inicializarTema() {
  let salvo = null;
  try {
    salvo = localStorage.getItem(TEMA_STORAGE_KEY);
  } catch (e) {
    /* ignora */
  }
  aplicarTema(salvo);

  // Sem preferência salva, acompanha mudanças ao vivo na preferência do
  // sistema (ex.: o SO alterna para modo escuro ao anoitecer).
  if (!salvo && window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      let aindaSemPreferencia = true;
      try {
        aindaSemPreferencia = !localStorage.getItem(TEMA_STORAGE_KEY);
      } catch (e) {
        /* ignora */
      }
      if (aindaSemPreferencia) aplicarTema(null);
    });
  }
}

/* ==========================================================================
   SIDEBAR: DRAWER MOBILE E COLAPSO NO DESKTOP
   ========================================================================== */

function abrirSidebarMobile() {
  state.ui.sidebarAberta = true;
  document.getElementById("app-shell").classList.add("is-sidebar-aberta");
  document.getElementById("sidebar-backdrop").hidden = false;
  document.getElementById("btn-menu").setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function fecharSidebarMobile() {
  state.ui.sidebarAberta = false;
  document.getElementById("app-shell").classList.remove("is-sidebar-aberta");
  document.getElementById("sidebar-backdrop").hidden = true;
  document.getElementById("btn-menu").setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

function alternarSidebarDesktop() {
  state.ui.sidebarRecolhida = !state.ui.sidebarRecolhida;
  document.getElementById("app-shell").classList.toggle("is-sidebar-recolhida", state.ui.sidebarRecolhida);
  document.getElementById("btn-recolher-sidebar").setAttribute("aria-expanded", String(!state.ui.sidebarRecolhida));
  try {
    localStorage.setItem(SIDEBAR_RECOLHIDA_STORAGE_KEY, state.ui.sidebarRecolhida ? "1" : "0");
  } catch (e) {
    /* ignora */
  }
}

function renderizarUltimaAtualizacao() {
  const el = document.getElementById("ultima-atualizacao");
  el.textContent = state.ultimaAtualizacao ? formatarDataHora(state.ultimaAtualizacao) : "—";
}

function definirCarregando(valor) {
  state.carregando = valor;
  document.getElementById("status-loading").hidden = !valor;
  document.getElementById("btn-atualizar").disabled = valor;
}

function limparMensagens() {
  document.getElementById("status-success").hidden = true;
  document.getElementById("status-error").hidden = true;
  document.getElementById("status-cache").hidden = true;
}

function mostrarSucesso() {
  limparMensagens();
  document.getElementById("status-success").hidden = false;
  setTimeout(() => {
    document.getElementById("status-success").hidden = true;
  }, 4000);
}

function mostrarErro(erro) {
  limparMensagens();
  document.getElementById("status-error-msg").textContent =
    "Não foi possível atualizar a agenda: " + (erro && erro.message ? erro.message : "erro desconhecido");
  document.getElementById("status-error").hidden = false;
}

function mostrarAvisoCache() {
  document.getElementById("status-cache").hidden = false;
}

function renderizarTudo() {
  renderizarConteudo();
  renderizarUltimaAtualizacao();

  // O portal resume os mesmos dados; sem isto ele ficaria com os números
  // do carregamento anterior depois de cada sincronização.
  if (state.modulo === "portal") renderizarPortal();
}

/* ==========================================================================
   CICLO DE ATUALIZAÇÃO
   ========================================================================== */

async function atualizarAgenda() {
  definirCarregando(true);
  limparMensagens();
  // Só mostra o esqueleto na carga inicial (sem nada em tela ainda) — em
  // atualizações seguintes é melhor manter os dados já exibidos até a
  // resposta chegar, em vez de "piscar" a tela.
  if (state.eventos.length === 0) mostrarEsqueletos(3);

  try {
    const icsTexto = await buscarIcsTexto();
    const eventos = parseICSParaEventos(icsTexto);
    marcarConflitos(eventos);

    state.eventos = eventos;
    state.usandoCache = false;
    state.ultimaAtualizacao = new Date();

    salvarCache(eventos);
    renderizarTudo();
    mostrarSucesso();
  } catch (erro) {
    console.error("Erro ao atualizar agenda:", erro);
    mostrarErro(erro);

    const cache = carregarCache();
    if (cache) {
      marcarConflitos(cache.events);
      state.eventos = cache.events;
      state.usandoCache = true;
      state.ultimaAtualizacao = new Date(cache.savedAt);
      renderizarTudo();
      mostrarAvisoCache();
    } else {
      // Sem cache para exibir: substitui os esqueletos de carregamento pelo
      // estado vazio real, em vez de deixá-los "girando" indefinidamente.
      renderizarTudo();
    }
  } finally {
    definirCarregando(false);
  }
}

/* ==========================================================================
   DOCUMENTOS DE EXTRAÇÃO — EXTRATO A4 (PDF) E CARD MOBILE (JPEG)

   Os dois artefatos são construídos aqui em HTML institucional puro, sempre
   em tema claro (independentemente do modo escuro da interface), e depois
   rasterizados por html2canvas. Ambos leem `analisarDia` — a mesma função
   que alimenta a tela —, de modo que ocupação, janelas livres e
   sobreposições impressas são exatamente os números exibidos, e não uma
   segunda contagem que pode divergir.
   ========================================================================== */

// Paleta amostrada da logomarca, repetida aqui em literais porque o papel de
// exportação não herda as variáveis CSS da interface (e não pode herdar: o
// documento é sempre claro, mesmo com a tela em modo escuro).
const EXP = {
  navy: "#0B3163",
  navyMid: "#0A2A55",
  navyEscuro: "#071C38",
  vermelho: "#D80425",
  vermelhoForte: "#B00320",
  vermelhoTexto: "#7C0518",
  link: "#14448A",
  tinta: "#12203A",
  texto2: "#5F6E88",
  texto3: "#64718E",
  textoForte: "#3A4A66",
  borda: "#DCE3EE",
  bordaSuave: "#EDF1F7",
  painel: "#F4F7FB",
  verde: "#2E7A62",
  cancelTitulo: "#616A7E",
};

const EXP_CAT = {
  "pauta-presencial": { label: "Presencial", cor: "#0B3163", bg: "#EAF0F9", borda: "#CBDAEE" },
  "pauta-online": { label: "Online", cor: "#2C63B0", bg: "#EAF2FC", borda: "#C9DCF4" },
  viagem: { label: "Viagem", cor: "#A65A05", bg: "#FDF1E3", borda: "#F0DCBE" },
};

function expCat(categoria) {
  return EXP_CAT[categoria] || EXP_CAT["pauta-presencial"];
}

// Marcas institucionais em data URL: o html2canvas só rasteriza imagens que
// não dependem de uma nova requisição de rede durante a captura.
const marcasCache = {};
async function obterMarcaDataUrl(arquivo) {
  if (marcasCache[arquivo] !== undefined) return marcasCache[arquivo];
  try {
    const resposta = await fetch(`img/${arquivo}`);
    const blob = await resposta.blob();
    marcasCache[arquivo] = await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`Não foi possível carregar img/${arquivo} para a exportação:`, e);
    marcasCache[arquivo] = null;
  }
  return marcasCache[arquivo];
}

function precarregarMarcas() {
  return Promise.all([
    obterMarcaDataUrl("tcm-lockup.png"),
    obterMarcaDataUrl("tcm-55.png"),
    obterMarcaDataUrl("tcm-mark.png"),
  ]);
}

function marcaImg(arquivo, altura, alt) {
  const src = marcasCache[arquivo];
  if (!src) return "";
  return `<img src="${src}" alt="${escapeAttr(alt)}" style="height:${altura}px;width:auto;display:block" />`;
}

// Data por extenso e data curta, sempre no fuso de exibição.
function dataLongaDaChave(chave) {
  return capitalizar(formatarDataLonga(new Date(`${chave}T12:00:00${offsetBahia()}`)));
}

/* --------------------------------------------------------------------------
   EXTRATO DIÁRIO EM A4 (PDF)
   -------------------------------------------------------------------------- */

// Uma linha da tabela horário × compromisso.
function linhaExtratoA4(bloco, analise, densidade) {
  const { evento } = bloco;
  const cat = expCat(evento.categoria);
  const cancelado = !!evento.cancelado;
  const temConflito = analise ? analise.idsConflito.has(evento.id) : !!evento.conflito;
  const fundo = temConflito && !cancelado ? "background:#FDFAFB;" : "";

  const selos = [
    `<span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.06em;color:${cat.cor};border:1px solid ${cat.borda};background:${cat.bg};border-radius:4px;padding:3px 7px;text-transform:uppercase">${cat.label}</span>`,
  ];
  if (cancelado) {
    selos.push(
      `<span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.06em;color:${EXP.vermelhoForte};border:1px solid #F6C4CE;background:#FDECEF;border-radius:4px;padding:3px 7px">CANCELADO</span>`
    );
  } else if (temConflito) {
    selos.push(
      `<span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.06em;color:${EXP.vermelhoForte};border:1px solid #F6C4CE;background:#FDECEF;border-radius:4px;padding:3px 7px">SOBREPOSIÇÃO</span>`
    );
  }

  const linhaLocal = [evento.local, participantesResumo(evento)].filter(Boolean).join(" · ");
  const mostrarPauta = densidade === "completo" && evento.descricao;
  const mostrarApoio = densidade !== "resumo" && linhaLocal;

  const horaIni = evento.diaInteiro ? "Dia inteiro" : hhmmDeMinutos(bloco.ini);
  const horaFim = evento.diaInteiro ? duracaoLegivel(evento) : `até ${hhmmDeMinutos(bloco.fim)}`;
  const duracao = evento.diaInteiro ? "" : duracaoCurta(bloco.dur);

  return `
    <div style="display:grid;grid-template-columns:96px 1fr;gap:18px;padding:14px 0;border-bottom:1px solid ${EXP.bordaSuave};${fundo}break-inside:avoid">
      <div style="display:flex;flex-direction:column;gap:3px;border-left:3px solid ${cancelado ? EXP.vermelho : cat.cor};padding-left:11px">
        <span style="font:600 14px/1.2 'IBM Plex Mono',monospace;color:${cancelado ? EXP.vermelhoForte : EXP.navy}${cancelado ? ";text-decoration:line-through" : ""}">${horaIni}</span>
        <span style="font:400 11px/1.2 'IBM Plex Mono',monospace;color:${EXP.texto3}">${horaFim}</span>
        ${duracao ? `<span style="font:400 11px/1.2 'IBM Plex Mono',monospace;color:${EXP.texto3}">${duracao}</span>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;min-width:0">
        <div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap">
          <span style="font:600 15px/1.35 'IBM Plex Sans',sans-serif;color:${cancelado ? EXP.cancelTitulo : EXP.tinta}${cancelado ? ";text-decoration:line-through" : ""};text-wrap:pretty">${escapeHtml(evento.titulo)}</span>
          ${selos.join("")}
        </div>
        ${mostrarApoio ? `<div style="font:400 11.5px/1.5 'IBM Plex Sans',sans-serif;color:${EXP.texto2};text-wrap:pretty">${escapeHtml(linhaLocal)}</div>` : ""}
        ${mostrarPauta ? `<div style="font:400 11.5px/1.5 'IBM Plex Sans',sans-serif;color:${EXP.textoForte};text-wrap:pretty">${escapeHtml(evento.descricao)}</div>` : ""}
      </div>
    </div>`;
}

// Faixa de quatro indicadores do dia (ou do período, quando há vários dias).
function indicadoresExtrato(indicadores) {
  const celulas = indicadores
    .map(
      (ind, i) => `
      <div style="padding:12px 16px;${i < indicadores.length - 1 ? `border-right:1px solid ${EXP.bordaSuave};` : ""}display:flex;flex-direction:column;gap:4px;${ind.destaque ? "background:#FDF3F5;" : ""}">
        <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">${ind.rotulo}</span>
        <span style="font:600 19px/1 'IBM Plex Mono',monospace;color:${ind.cor || EXP.navy}">${ind.valor}</span>
      </div>`
    )
    .join("");
  return `<div style="display:grid;grid-template-columns:repeat(${indicadores.length},1fr);border:1px solid ${EXP.borda};border-radius:8px;overflow:hidden;margin-bottom:26px">${celulas}</div>`;
}

function blocoJanelasLivres(janelas) {
  if (!janelas.length) return "";
  const chips = janelas
    .map(
      (j) =>
        `<span style="font:500 11.5px/1 'IBM Plex Mono',monospace;color:${EXP.verde};border:1px dashed #C9DED6;background:#F4F8F6;border-radius:999px;padding:6px 12px">${hhmmDeMinutos(j[0])} – ${hhmmDeMinutos(j[1])} · ${duracaoCurta(j[1] - j[0])}</span>`
    )
    .join("");
  return `
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:6px;break-inside:avoid">
      <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">JANELAS LIVRES</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${chips}</div>
    </div>`;
}

function avisoSobreposicao(analise) {
  if (!analise || !analise.paresConflito.length) return "";
  const [a, b] = analise.paresConflito[0];
  const minutos = Math.min(a.fim, b.fim) - Math.max(a.ini, b.ini);
  const extras =
    analise.paresConflito.length > 1
      ? ` Há ainda ${analise.paresConflito.length - 1} outra${analise.paresConflito.length - 1 === 1 ? "" : "s"} sobreposição${analise.paresConflito.length - 1 === 1 ? "" : "ões"} no dia.`
      : "";
  return `
    <div style="display:flex;align-items:flex-start;gap:10px;margin-top:18px;padding:11px 14px;border-radius:7px;background:#FDECEF;border:1px solid #F6C4CE;break-inside:avoid">
      <span style="font:600 11.5px/1.45 'IBM Plex Sans',sans-serif;color:${EXP.vermelhoTexto};flex:0 0 auto">Atenção:</span>
      <span style="font:400 11.5px/1.45 'IBM Plex Sans',sans-serif;color:${EXP.vermelhoTexto};text-wrap:pretty">a ${escapeHtml(
        a.evento.titulo
      )} (${hhmmDeMinutos(a.ini)}–${hhmmDeMinutos(a.fim)}) sobrepõe a ${escapeHtml(b.evento.titulo)} (${hhmmDeMinutos(
    b.ini
  )}–${hhmmDeMinutos(b.fim)}) em ${duracaoCurta(minutos)}.${extras}</span>
    </div>`;
}

/**
 * Extrato diário em A4 retrato (794 × 1123 px a 96dpi), pronto para imprimir
 * ou salvar em PDF. Um único dia cabe em uma página; períodos maiores
 * repetem o bloco de dia com um subtítulo por data.
 */
function construirExtratoA4(grupos, totalFiltrados, opcoes) {
  const { densidade } = state.exportacao;
  const { incluirCancelados, incluirJanelas, linhaAssinatura } = opcoes;

  const gruposVisiveis = grupos
    .map((g) => ({
      ...g,
      eventos: incluirCancelados ? g.eventos : g.eventos.filter((it) => !it.evento.cancelado),
    }))
    .filter((g) => g.eventos.length > 0);

  const diaUnico = gruposVisiveis.length === 1;
  const analiseUnica = diaUnico ? analisarDia(gruposVisiveis[0].eventos, gruposVisiveis[0].chave) : null;

  // Indicadores: no dia, os quatro do redesenho; no período, totais.
  let indicadores;
  if (analiseUnica) {
    indicadores = [
      { rotulo: "COMPROMISSOS", valor: analiseUnica.blocos.length + analiseUnica.contínuos.length },
      { rotulo: "OCUPAÇÃO", valor: duracaoCurta(analiseUnica.ocupadoMin) },
      { rotulo: "JANELAS LIVRES", valor: duracaoCurta(analiseUnica.livreMin), cor: EXP.verde },
      {
        rotulo: "SOBREPOSIÇÕES",
        valor: analiseUnica.paresConflito.length,
        cor: analiseUnica.paresConflito.length ? EXP.vermelho : EXP.navy,
        destaque: analiseUnica.paresConflito.length > 0,
      },
    ];
  } else {
    const totalDias = gruposVisiveis.length;
    const totalItens = gruposVisiveis.reduce((a, g) => a + g.eventos.length, 0);
    const cancelados = gruposVisiveis.reduce(
      (a, g) => a + g.eventos.filter((it) => it.evento.cancelado).length,
      0
    );
    const sobrepostos = gruposVisiveis.reduce(
      (a, g) => a + analisarDia(g.eventos, g.chave).paresConflito.length,
      0
    );
    indicadores = [
      { rotulo: "COMPROMISSOS", valor: totalItens },
      { rotulo: "DIAS COM AGENDA", valor: totalDias },
      { rotulo: "CANCELADOS", valor: cancelados },
      {
        rotulo: "SOBREPOSIÇÕES",
        valor: sobrepostos,
        cor: sobrepostos ? EXP.vermelho : EXP.navy,
        destaque: sobrepostos > 0,
      },
    ];
  }

  const tituloDocumento = diaUnico
    ? dataLongaDaChave(gruposVisiveis[0].chave)
    : subtituloDaPagina();

  let corpo = "";
  if (gruposVisiveis.length === 0) {
    corpo = `<div style="padding:40px 0;text-align:center;font:400 12px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">Nenhum compromisso encontrado para os filtros selecionados.</div>`;
  } else {
    gruposVisiveis.forEach((grupo) => {
      const analise = analisarDia(grupo.eventos, grupo.chave);
      const linhas = analise.contínuos
        .map((it) => linhaExtratoA4({ ...it, ini: 0, fim: 1440, dur: 1440 }, analise, densidade))
        .concat(analise.blocos.map((bloco) => linhaExtratoA4(bloco, analise, densidade)))
        .join("");

      corpo += `
        <div style="break-inside:avoid">
          ${
            diaUnico
              ? ""
              : `<div style="display:flex;align-items:center;gap:10px;margin:20px 0 6px;break-after:avoid">
                   <span style="font:600 12px/1 'IBM Plex Sans',sans-serif;color:${EXP.navy}">${escapeHtml(dataLongaDaChave(grupo.chave))}</span>
                   <span style="flex:1;height:1px;background:${EXP.borda}"></span>
                   <span style="font:400 10px/1 'IBM Plex Mono',monospace;color:${EXP.texto3}">${grupo.eventos.length} compromisso${grupo.eventos.length === 1 ? "" : "s"}</span>
                 </div>`
          }
          <div style="display:grid;grid-template-columns:96px 1fr;gap:18px;padding:0 0 9px;border-bottom:1px solid ${EXP.borda}">
            <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">HORÁRIO</span>
            <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">COMPROMISSO</span>
          </div>
          ${linhas}
          ${diaUnico ? avisoSobreposicao(analise) : ""}
          ${diaUnico && incluirJanelas ? blocoJanelasLivres(analise.janelas) : ""}
        </div>`;
    });
  }

  const assinatura = linhaAssinatura
    ? `<div style="margin-top:38px;display:flex;justify-content:flex-end;break-inside:avoid">
         <div style="width:280px;display:flex;flex-direction:column;align-items:center;gap:7px">
           <span style="width:100%;height:1px;background:${EXP.tinta}"></span>
           <span style="font:500 11px/1.4 'IBM Plex Sans',sans-serif;color:${EXP.textoForte};text-align:center">Chefia de Gabinete</span>
         </div>
       </div>`
    : "";

  const paper = document.createElement("div");
  paper.className = "export-paper";
  paper.style.cssText =
    "width:794px;min-height:1123px;background:#fff;padding:52px 56px 44px;display:flex;flex-direction:column;" +
    "font-family:'IBM Plex Sans',system-ui,Arial,sans-serif;color:" + EXP.tinta + ";box-sizing:border-box;";

  paper.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px">
      <div style="display:flex;align-items:center;gap:14px">
        ${marcaImg("tcm-lockup.png", 46, "Tribunal de Contas dos Municípios do Estado da Bahia")}
        ${marcaImg("tcm-55.png", 46, "55 anos de serviços prestados à sociedade")}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;padding-top:2px;text-align:right">
        <span style="font:700 13px/1 'IBM Plex Sans',sans-serif;letter-spacing:.02em;color:${EXP.navy}">AGENDA INSTITUCIONAL</span>
        <span style="font:400 11.5px/1 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">Gabinete da Presidência</span>
        <span style="font:400 11px/1 'IBM Plex Mono',monospace;color:${EXP.texto3}">SAA · Sistema de Agenda Automatizada</span>
      </div>
    </div>

    <div style="display:flex;margin:16px 0 26px">
      <span style="width:64px;height:3px;background:${EXP.vermelho}"></span>
      <span style="flex:1;height:3px;background:${EXP.navy}"></span>
    </div>

    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:22px">
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <span style="font:600 10px/1 'IBM Plex Sans',sans-serif;letter-spacing:.13em;color:${EXP.texto2}">${diaUnico ? "EXTRATO DIÁRIO" : "EXTRATO DE PERÍODO"}</span>
        <h1 style="margin:0;font:700 27px/1.15 Bitter,Georgia,serif;color:${EXP.navy};letter-spacing:-.015em;text-wrap:pretty">${escapeHtml(tituloDocumento)}</h1>
      </div>
      <div style="flex:0 0 auto;text-align:right;font:400 10.5px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">
        Emitido em <span style="font-family:'IBM Plex Mono',monospace;color:${EXP.tinta}">${formatarDataHora(new Date())}</span><br>
        Fuso horário America/Bahia
      </div>
    </div>

    ${indicadoresExtrato(indicadores)}

    <div style="display:flex;flex-direction:column;flex:1">
      ${corpo}
      ${assinatura}
    </div>

    <div style="margin-top:auto;padding-top:16px;border-top:1px solid ${EXP.borda};display:flex;align-items:flex-end;justify-content:space-between;gap:20px">
      <div style="font:400 10px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto3};max-width:460px;text-wrap:pretty">
        Documento gerado automaticamente pelo SAA a partir do Google Agenda. Alterações devem ser feitas no calendário de origem.${USE_DEMO_DATA ? " Dados fictícios de demonstração." : ""}
      </div>
      <div style="font:400 10px/1.6 'IBM Plex Mono',monospace;color:${EXP.texto3};text-align:right;flex:0 0 auto">
        TCM-BA · SAA<br>${totalFiltrados} compromisso${totalFiltrados === 1 ? "" : "s"}
      </div>
    </div>
  `;
  return paper;
}

/* --------------------------------------------------------------------------
   CARD DE COMPARTILHAMENTO EM JPEG (mobile)
   -------------------------------------------------------------------------- */

// Um compromisso no card: faixa de cor à esquerda, horário em coluna
// monoespaçada e título com o local abaixo.
function cartaoMobile(bloco, analise, escala) {
  const { evento } = bloco;
  const cat = expCat(evento.categoria);
  const cancelado = !!evento.cancelado;
  const emAndamento = analise.emAndamento && analise.emAndamento.evento.id === evento.id;
  const temConflito = analise.idsConflito.has(evento.id);
  const px = (v) => `${Math.round(v * escala)}px`;

  const fundo = cancelado ? "#FEF7F8" : emAndamento ? "#F2FAF7" : "#fff";
  const borda = cancelado ? "2px solid #F6C4CE" : emAndamento ? "2px solid #C4E3D9" : `1px solid ${EXP.borda}`;
  const corFaixa = cancelado ? EXP.vermelho : cat.cor;

  const marcadores = [];
  if (emAndamento) {
    marcadores.push(
      `<span style="font:600 ${px(15)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.07em;color:#0F7B5F;background:#fff;border:1px solid #C4E3D9;border-radius:${px(7)};padding:${px(6)} ${px(10)}">AGORA</span>`
    );
  }
  if (temConflito && !cancelado) {
    marcadores.push(
      `<span style="font:600 ${px(15)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.07em;color:${EXP.vermelhoForte};background:#FDECEF;border:1px solid #F6C4CE;border-radius:${px(7)};padding:${px(6)} ${px(10)}">CONFLITO</span>`
    );
  }

  const modalidade = `${evento.local ? escapeHtml(evento.local) + " · " : ""}${cat.label}`;

  return `
    <div style="position:relative;display:grid;grid-template-columns:${px(150)} 1fr;gap:${px(24)};padding:${px(24)} ${px(26)} ${px(24)} ${px(30)};background:${fundo};border:${borda};border-radius:${px(18)};flex:0 0 auto;box-shadow:0 ${px(2)} ${px(8)} rgba(11,49,99,.05)">
      <span style="position:absolute;left:0;top:0;bottom:0;width:${px(8)};background:${corFaixa};border-radius:${px(18)} 0 0 ${px(18)}"></span>
      <div style="display:flex;flex-direction:column;gap:${px(4)}">
        <span style="font:600 ${px(34)}/1.1 'IBM Plex Mono',monospace;color:${cancelado ? EXP.vermelhoForte : emAndamento ? "#0F7B5F" : EXP.navy}${cancelado ? ";text-decoration:line-through" : ""}">${evento.diaInteiro ? "Dia" : hhmmDeMinutos(bloco.ini)}</span>
        <span style="font:400 ${px(20)}/1.2 'IBM Plex Mono',monospace;color:${EXP.texto3}">${evento.diaInteiro ? "inteiro" : duracaoCurta(bloco.dur)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:${px(9)};min-width:0">
        <div style="display:flex;align-items:center;gap:${px(10)};flex-wrap:wrap">
          <span style="font:700 ${px(30)}/1.3 'IBM Plex Sans',sans-serif;color:${cancelado ? EXP.cancelTitulo : EXP.tinta}${cancelado ? ";text-decoration:line-through" : ""};text-wrap:pretty">${escapeHtml(evento.titulo)}</span>
          ${marcadores.join("")}
        </div>
        ${
          cancelado
            ? `<span style="font:600 ${px(17)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.08em;color:${EXP.vermelhoForte}">CANCELADO</span>`
            : `<span style="font:400 ${px(22)}/1.35 'IBM Plex Sans',sans-serif;color:${EXP.texto2};text-wrap:pretty">${modalidade}</span>`
        }
      </div>
    </div>`;
}

/**
 * Card de compartilhamento em JPEG, 1080 × 1920 (story 9:16) ou 1080 × 1350
 * (feed 4:5).
 *
 * O dia é desenhado como LINHA DO TEMPO EM ESCALA, não como lista de cartões.
 * A lista desperdiçava a imagem: com quatro compromissos de uma hora, dois
 * terços do card ficavam em branco e os vazios da agenda — que são a
 * informação mais útil de quem olha o card para marcar algo — não apareciam.
 * Na pista, cada hora ocupa a mesma altura, um compromisso de 3h ocupa o
 * triplo de um de 1h, e as janelas livres aparecem no lugar e no tamanho
 * reais, hachuradas e rotuladas.
 *
 * A pista cobre 08:00–18:00 e se estende quando há compromisso fora dessa
 * faixa — senão um compromisso às 19h simplesmente sumiria do card.
 *
 * Períodos de vários dias não têm pista: uma escala de horas só significa
 * alguma coisa dentro de um dia. Nesse caso o card cai para a lista, que
 * continua sendo a leitura correta para semana e mês.
 */

const CARD_PISTA_INI = 8 * 60; // 08:00
const CARD_PISTA_FIM = 18 * 60; // 18:00

// Alturas fixas do card, em px do artefato final (1080 de largura).
const CARD_HERO_STORY = 500;
const CARD_HERO_FEED = 400;
const CARD_RODAPE = 123;
const CARD_PISTA_PAD = 68; // padding vertical da área da pista (36 + 32)

// Abaixo desta altura o compromisso não comporta local e modalidade, e colapsa
// para uma linha só — decidido em pixels disponíveis, não em minutos, porque
// um compromisso de 1h em coluna dividida tem menos espaço que um em coluna
// cheia.
const CARD_ALTURA_COLAPSO = 100;
const CARD_ALTURA_MINIMA = 56;

function cardFaixaDoDia(blocos) {
  if (!blocos.length) return "—";
  const ini = Math.min(...blocos.map((b) => b.ini));
  const fim = Math.max(...blocos.map((b) => b.fim));
  return `${hhmmDeMinutos(ini)} – ${hhmmDeMinutos(fim)}`;
}

// Régua de horas: uma linha e um rótulo por hora cheia da pista.
function cardReguaHoras(t0, t1, y, px) {
  let saida = "";
  for (let m = t0; m <= t1; m += 60) {
    saida += `<div style="position:absolute;left:${px(96)};right:0;top:${px(y(m))};height:1px;background:${EXP.borda}"></div>`;
    saida += `<div style="position:absolute;left:0;width:${px(84)};top:${px(y(m) - 11)};text-align:right;font:500 ${px(19)}/1 'IBM Plex Mono',monospace;color:${EXP.texto3}">${hhmmDeMinutos(m)}</div>`;
  }
  return saida;
}

// Janelas livres desenhadas no lugar e no tamanho reais. O rótulo diz duração
// e horário juntos ("2h30 livre · 12:00 – 14:30"): só a duração obrigaria a
// conferir a régua para saber quando.
function cardJanelasLivres(janelas, t0, t1, y, px) {
  return janelas
    .map(([ji, jf]) => {
      const ini = Math.max(ji, t0);
      const fim = Math.min(jf, t1);
      if (fim - ini < JANELA_MINIMA_MIN) return "";
      const altura = y(fim) - y(ini) - 8;
      const compacta = altura < 60;
      const rotulo = `${duracaoCurta(fim - ini)} livre · ${hhmmDeMinutos(ini)} – ${hhmmDeMinutos(fim)}`;
      return `
        <div style="position:absolute;left:0;right:0;top:${px(y(ini) + 4)};height:${px(altura)};border-radius:${px(14)};border:2px dashed #C9DED6;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(135deg,#F4F8F6 0 ${px(12)},#EEF5F1 ${px(12)} ${px(24)})">
          <span style="font:600 ${px(compacta ? 17 : 20)}/1 'IBM Plex Mono',monospace;color:${EXP.verde};background:#fff;border:1px solid #C9DED6;border-radius:999px;padding:${compacta ? `${px(7)} ${px(14)}` : `${px(11)} ${px(20)}`}">${escapeHtml(rotulo)}</span>
        </div>`;
    })
    .join("");
}

function cardBlocoNaPista(bloco, analise, t0, t1, y, px) {
  const { evento } = bloco;
  const ini = Math.max(bloco.ini, t0);
  const fim = Math.min(bloco.fim, t1);
  const altura = Math.max(y(fim) - y(ini) - 8, CARD_ALTURA_MINIMA);

  const { col, total } = analise.colunaDe.get(evento.id) || { col: 0, total: 1 };
  const larguraCol = 100 / total;
  const estreito = total > 1;
  const curto = altura < CARD_ALTURA_COLAPSO;

  const cat = EXP_CAT[evento.categoria] || EXP_CAT["pauta-presencial"];
  const cancelado = evento.cancelado;
  const emConflito = analise.idsConflito.has(evento.id);
  const corFaixa = cancelado ? EXP.cancelTitulo : cat.cor;

  const selo = (texto, cor, bg, borda) =>
    `<span style="font:600 ${px(14)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:${cor};background:${bg};border:1px solid ${borda};border-radius:${px(7)};padding:${px(6)} ${px(10)};flex:0 0 auto">${texto}</span>`;

  const meta = curto
    ? ""
    : `<div style="display:flex;align-items:center;gap:${px(10)};min-width:0">
         ${cancelado ? selo("Cancelado", EXP.vermelhoForte, "#FDECEF", "#F6C4CE") : selo(cat.label, cat.cor, cat.bg, cat.borda)}
         ${evento.local ? `<span style="font:400 ${px(20)}/1.2 'IBM Plex Sans',sans-serif;color:${EXP.texto2};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">${escapeHtml(evento.local)}</span>` : ""}
         ${emConflito ? selo("Conflito", EXP.vermelhoForte, "#FDECEF", "#F6C4CE") : ""}
       </div>`;

  return `
    <div style="position:absolute;top:${px(y(ini) + 4)};height:${px(altura)};left:${col * larguraCol}%;width:${total > 1 ? `calc(${larguraCol}% - ${px(8)})` : "100%"};background:#fff;border:1px solid ${EXP.borda};border-radius:${px(14)};overflow:hidden;display:flex;align-items:${curto ? "center" : "flex-start"};gap:${px(20)};padding:${curto ? `${px(10)} ${px(20)} ${px(10)} ${px(26)}` : `${px(18)} ${px(22)} ${px(16)} ${px(28)}`};box-shadow:0 ${px(2)} ${px(10)} rgba(11,49,99,.06)">
      <span style="position:absolute;left:0;top:0;bottom:0;width:${px(8)};background:${corFaixa}"></span>
      <div style="display:flex;flex-direction:column;gap:${px(2)};flex:0 0 auto;min-width:0">
        <span style="font:600 ${px(curto ? 26 : 32)}/1 'IBM Plex Mono',monospace;color:${corFaixa};white-space:nowrap">${hhmmDeMinutos(bloco.ini)}</span>
        <span style="font:400 ${px(17)}/1 'IBM Plex Mono',monospace;color:${EXP.texto3};display:${curto ? "none" : "block"}">${duracaoCurta(bloco.dur)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:${px(6)};min-width:0;flex:1">
        <span style="font:700 ${px(estreito || curto ? 22 : 27)}/1.25 'IBM Plex Sans',sans-serif;color:${cancelado ? EXP.cancelTitulo : EXP.tinta}${cancelado ? ";text-decoration:line-through" : ""};text-wrap:pretty;overflow:hidden;max-height:${px(curto ? 28 : 68)};white-space:${curto ? "nowrap" : "normal"};text-overflow:ellipsis">${escapeHtml(evento.titulo)}</span>
        ${meta}
      </div>
    </div>`;
}

function construirCardMobile(grupos, totalFiltrados, opcoes) {
  const { proporcao, incluirCancelados, incluirJanelas } = opcoes;
  const feed = proporcao === "feed";
  const largura = 1080;
  const altura = feed ? 1350 : 1920;
  const escala = 1;
  const px = (v) => `${Math.round(v * escala)}px`;

  const gruposVisiveis = grupos
    .map((g) => ({
      ...g,
      eventos: incluirCancelados ? g.eventos : g.eventos.filter((it) => !it.evento.cancelado),
    }))
    .filter((g) => g.eventos.length > 0);

  const diaUnico = gruposVisiveis.length === 1;
  const primeiro = gruposVisiveis[0];
  const analise = primeiro ? analisarDia(primeiro.eventos, primeiro.chave) : null;

  const dataRef = primeiro ? new Date(`${primeiro.chave}T12:00:00${offsetBahia()}`) : new Date();
  const diaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone: DISPLAY_TIMEZONE, weekday: "long" })
    .format(dataRef)
    .toUpperCase();
  const diaMes = new Intl.DateTimeFormat("pt-BR", { timeZone: DISPLAY_TIMEZONE, day: "2-digit", month: "short" })
    .format(dataRef)
    .replace(".", "")
    .toUpperCase();

  const totalDoCard = gruposVisiveis.reduce((a, g) => a + g.eventos.length, 0);
  const ocupacao = analise ? duracaoCurta(analise.ocupadoMin) : "—";
  const livre = analise ? duracaoCurta(analise.livreMin) : "—";
  const conflitos = analise ? analise.paresConflito.length : 0;
  const faixaDia = analise && diaUnico ? cardFaixaDoDia(analise.blocos) : "—";

  const alturaHero = feed ? CARD_HERO_FEED : CARD_HERO_STORY;

  const indicador = (rotulo, valor, alerta) => `
    <div style="flex:1;padding:${px(18)} ${px(22)};border-radius:${px(16)};background:${alerta ? "rgba(216,4,37,.26)" : "rgba(255,255,255,.1)"};border:1px solid ${alerta ? "rgba(243,179,190,.4)" : "rgba(255,255,255,.18)"};display:flex;flex-direction:column;gap:${px(8)}">
      <span style="font:600 ${px(17)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.1em;color:${alerta ? "#F3B3BE" : "#9FB6D8"}">${rotulo}</span>
      <span style="font:600 ${px(38)}/1 'IBM Plex Mono',monospace;color:#fff">${valor}</span>
    </div>`;

  // ---- corpo: pista em escala (um dia) ou lista (vários dias) -------------
  let corpo = "";

  if (!gruposVisiveis.length) {
    corpo = `<div style="padding:${px(60)} 0;text-align:center;font:400 ${px(26)}/1.5 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">Nenhum compromisso encontrado para os filtros selecionados.</div>`;
  } else if (diaUnico) {
    let t0 = CARD_PISTA_INI;
    let t1 = CARD_PISTA_FIM;
    analise.blocos.forEach((b) => {
      t0 = Math.min(t0, Math.floor(b.ini / 60) * 60);
      t1 = Math.max(t1, Math.ceil(b.fim / 60) * 60);
    });

    // Compromissos de dia inteiro ou de vários dias não têm posição na escala:
    // vão numa faixa acima da pista, que também encolhe a pista na medida.
    const continuos = analise.contínuos
      .map((it) => {
        const cat = EXP_CAT[it.evento.categoria] || EXP_CAT["pauta-presencial"];
        return `<span style="display:flex;align-items:center;gap:${px(10)};background:#fff;border:1px solid ${EXP.borda};border-left:${px(6)} solid ${cat.cor};border-radius:${px(10)};padding:${px(12)} ${px(18)};font:600 ${px(21)}/1.2 'IBM Plex Sans',sans-serif;color:${EXP.tinta}">${escapeHtml(it.evento.titulo)}<span style="font:400 ${px(17)}/1 'IBM Plex Mono',monospace;color:${EXP.texto3}">${duracaoLegivel(it.evento)}</span></span>`;
      })
      .join("");
    const faixaContinuos = continuos
      ? `<div style="display:flex;flex-direction:column;gap:${px(10)};padding-bottom:${px(18)};flex:0 0 auto">${continuos}</div>`
      : "";
    const alturaContinuos = analise.contínuos.length * 62 + (continuos ? 18 : 0);

    const alturaPista = altura - alturaHero - CARD_RODAPE - CARD_PISTA_PAD - alturaContinuos;
    const pxPorMinuto = alturaPista / (t1 - t0);
    const y = (m) => (m - t0) * pxPorMinuto;

    corpo = `
      ${faixaContinuos}
      <div style="position:relative;flex:0 0 auto;height:${px(alturaPista)}">
        ${cardReguaHoras(t0, t1, y, px)}
        <div style="position:absolute;left:${px(112)};right:0;top:0;bottom:0">
          ${incluirJanelas ? cardJanelasLivres(analise.janelas, t0, t1, y, px) : ""}
          ${analise.blocos.map((b) => cardBlocoNaPista(b, analise, t0, t1, y, px)).join("")}
        </div>
      </div>`;
  } else {
    corpo = gruposVisiveis
      .map((grupo) => {
        const analiseGrupo = analisarDia(grupo.eventos, grupo.chave);
        const titulo = `<div style="font:600 ${px(20)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.12em;color:${EXP.texto2};padding-top:${px(10)};flex:0 0 auto">${escapeHtml(dataLongaDaChave(grupo.chave).toUpperCase())}</div>`;
        const continuos = analiseGrupo.contínuos
          .map((it) => cartaoMobile({ ...it, ini: 0, fim: 1440, dur: 1440 }, analiseGrupo, escala))
          .join("");
        const blocos = analiseGrupo.blocos.map((bloco) => cartaoMobile(bloco, analiseGrupo, escala)).join("");
        return titulo + continuos + blocos;
      })
      .join("");
  }

  const paper = document.createElement("div");
  paper.className = "export-paper";
  paper.style.cssText =
    `width:${largura}px;height:${altura}px;display:flex;flex-direction:column;background:${EXP.painel};` +
    "overflow:hidden;box-sizing:border-box;font-family:'IBM Plex Sans',system-ui,Arial,sans-serif;color:" + EXP.tinta + ";";

  paper.innerHTML = `
    <div style="background:linear-gradient(150deg,${EXP.navy} 0%,${EXP.navyMid} 55%,${EXP.navyEscuro} 100%);padding:${feed ? `${px(40)} ${px(60)} ${px(36)}` : `${px(56)} ${px(60)} ${px(48)}`};display:flex;flex-direction:column;justify-content:space-between;flex:0 0 auto;height:${px(alturaHero)};overflow:hidden">
      <div style="display:flex;align-items:center;gap:${px(20)}">
        <div style="width:${px(84)};height:${px(84)};border-radius:${px(18)};background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:0 0 auto">
          ${marcaImg("tcm-mark.png", 68, "TCM-BA")}
        </div>
        <div style="display:flex;flex-direction:column;gap:${px(7)}">
          <span style="font:700 ${px(30)}/1 'IBM Plex Sans',sans-serif;color:#fff;letter-spacing:-.01em">Agenda Institucional</span>
          <span style="font:400 ${px(21)}/1.3 'IBM Plex Sans',sans-serif;color:#9FB6D8">Tribunal de Contas dos Municípios do Estado da Bahia</span>
        </div>
      </div>

      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:${px(24)}">
        <div style="display:flex;flex-direction:column;gap:${px(10)}">
          <span style="font:600 ${px(21)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.16em;color:#9FB6D8">${diaUnico ? escapeHtml(diaSemana) : escapeHtml(subtituloDaPagina().toUpperCase())}</span>
          <span style="font:700 ${px(feed ? 64 : 80)}/1 Bitter,Georgia,serif;color:#fff;letter-spacing:-.03em">${diaUnico ? escapeHtml(diaMes) : `${totalDoCard} COMPROMISSOS`}</span>
        </div>
        ${
          diaUnico
            ? `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:${px(8)};padding-bottom:${px(8)}">
                 <span style="font:600 ${px(17)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.12em;color:#9FB6D8">EXPEDIENTE OCUPADO</span>
                 <span style="font:600 ${px(34)}/1 'IBM Plex Mono',monospace;color:#fff">${faixaDia}</span>
               </div>`
            : ""
        }
      </div>

      <div style="display:flex;gap:${px(14)}">
        ${indicador("COMPROMISSOS", totalDoCard, false)}
        ${indicador("OCUPAÇÃO", ocupacao, false)}
        ${indicador("LIVRE", livre, false)}
        ${indicador("CONFLITOS", conflitos, conflitos > 0)}
      </div>
    </div>

    <div style="flex:1;min-height:0;background:${EXP.painel};padding:${px(36)} ${px(52)} ${px(32)} ${px(44)};display:flex;flex-direction:column;overflow:hidden">
      ${corpo}
    </div>

    <div style="flex:0 0 auto;background:#fff;border-top:1px solid ${EXP.borda};padding:${px(26)} ${px(60)};display:flex;align-items:center;gap:${px(22)}">
      ${marcaImg("tcm-lockup.png", 58, "Tribunal de Contas dos Municípios do Estado da Bahia")}
      <div style="margin-left:auto;display:flex;flex-direction:column;gap:${px(5)};align-items:flex-end">
        <span style="font:600 ${px(19)}/1 'IBM Plex Sans',sans-serif;color:${EXP.navy}">SAA · Agenda Institucional</span>
        <span style="font:400 ${px(17)}/1 'IBM Plex Mono',monospace;color:${EXP.texto2}">atualizado às ${formatarHora(new Date())}</span>
      </div>
    </div>
  `;
  return paper;
}

// Opções de conteúdo escolhidas no painel de exportação.
function opcoesExportacao() {
  const ler = (id, padrao) => {
    const el = document.getElementById(id);
    return el ? el.checked : padrao;
  };
  return {
    proporcao: state.exportacao.proporcao,
    incluirCancelados: ler("export-incluir-cancelados", true),
    incluirJanelas: ler("export-incluir-janelas", true),
    linhaAssinatura: ler("export-linha-assinatura-check", false),
  };
}

// Ponto único de construção do artefato — a pré-visualização e o arquivo
// baixado passam pela mesma função, então o que se vê é o que sai.
function construirPaperExport(grupos, totalFiltrados) {
  const opcoes = opcoesExportacao();
  return state.exportacao.formato === "a4"
    ? construirExtratoA4(grupos, totalFiltrados, opcoes)
    : construirCardMobile(grupos, totalFiltrados, opcoes);
}

// Carrega a assinatura institucional do TCM-BA como data URL uma única vez,
// para uso nos cabeçalhos do PDF (jsPDF) e do JPEG (HTML/html2canvas). O SVG
// é convertido em data URL porque o html2canvas só rasteriza imagens que não
// dependem de uma nova requisição de rede durante a captura.
async function aguardarImagensCarregadas(container) {
  const imagens = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imagens.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          })
    )
  );
}

async function renderizarCanvasElemento(el, escala) {
  document.getElementById("export-sandbox").appendChild(el);
  // setTimeout em vez de requestAnimationFrame: rAF não dispara em abas
  // em segundo plano/sem foco, o que travaria a exportação indefinidamente.
  await new Promise((r) => setTimeout(r, 0));
  await aguardarImagensCarregadas(el);
  const canvas = await html2canvas(el, { scale: escala, backgroundColor: "#ffffff", useCORS: true });
  el.remove();
  return canvas;
}

/* ==========================================================================
   OVERLAY DE EXPORTAÇÃO (formato, densidade, pré-visualização e download)
   ========================================================================== */

// Renderiza a pré-visualização do papel de exportação dentro do overlay.
function renderizarPreviewExport(filtrados) {
  const alvo = document.getElementById("export-preview");
  if (!alvo) return;
  const lista = filtrados || obterEventosFiltrados();
  const grupos = agruparPorDia(lista);
  const paper = construirPaperExport(grupos, lista.length);

  // O papel é construído no tamanho real do artefato (794px no A4, 1080px no
  // card) e apenas *exibido* reduzido. Reduzir com transform em vez de mudar
  // as medidas mantém a pré-visualização fiel ao arquivo que será baixado.
  alvo.innerHTML = "";
  const palco = document.createElement("div");
  palco.className = "export-preview__palco";
  palco.appendChild(paper);
  alvo.appendChild(palco);
  ajustarEscalaPreview();
}

// Ajusta a redução da pré-visualização ao espaço disponível no palco.
function ajustarEscalaPreview() {
  const alvo = document.getElementById("export-preview");
  const palco = alvo && alvo.querySelector(".export-preview__palco");
  const paper = palco && palco.querySelector(".export-paper");
  if (!paper) return;

  const disponivel = alvo.clientWidth || alvo.parentElement.clientWidth;
  const larguraPapel = paper.offsetWidth || 794;
  if (disponivel <= 0) return; // painel ainda oculto: nada a medir
  const escala = Math.max(0.1, Math.min(1, (disponivel - 8) / larguraPapel));
  palco.style.transform = `scale(${escala})`;
  palco.style.width = `${larguraPapel}px`;
  palco.style.height = `${paper.offsetHeight * escala}px`;
}

let elementoComFocoAntesDoExport = null;

function abrirOverlayExport() {
  elementoComFocoAntesDoExport = document.activeElement;
  const overlay = document.getElementById("export-backdrop");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  renderizarPreviewExport();
  document.getElementById("btn-fechar-export").focus();
}

function fecharOverlayExport() {
  const overlay = document.getElementById("export-backdrop");
  if (overlay.hidden) return;
  overlay.hidden = true;
  document.body.style.overflow = "";
  if (elementoComFocoAntesDoExport && document.contains(elementoComFocoAntesDoExport)) {
    elementoComFocoAntesDoExport.focus();
  }
}

// Captura o papel visível na pré-visualização e gera JPEG ou PDF — a saída
// reflete exatamente o que está na tela (WYSIWYG). No formato A4 o conteúdo é
// fatiado por página; no mobile vira uma única página longa.
async function exportarPapel(tipo) {
  if (!window.html2canvas) throw new Error("Biblioteca de captura indisponível.");
  await precarregarMarcas();

  const { formato, proporcao } = state.exportacao;
  const lista = obterEventosFiltrados();
  const grupos = agruparPorDia(lista);

  // O artefato baixado é construído do zero, no tamanho real, e rasterizado
  // fora da tela — a pré-visualização aparece reduzida por transform, e
  // capturar o elemento reduzido produziria um arquivo de baixa resolução.
  const paper = construirPaperExport(grupos, lista.length);
  const escala = formato === "a4" ? 2.5 : 1.5;
  const canvas = await renderizarCanvasElemento(paper, escala);

  const carimbo = new Date().toISOString().slice(0, 10);
  const sufixo = formato === "a4" ? "extrato" : proporcao === "feed" ? "card-feed" : "card-story";
  const nomeBase = `agenda-tcm-ba-${carimbo}-${sufixo}`;

  if (tipo === "jpeg") {
    const link = document.createElement("a");
    link.download = `${nomeBase}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    return;
  }

  const { jsPDF } = window.jspdf;
  const img = canvas.toDataURL("image/jpeg", 0.95);

  if (formato === "a4") {
    // O extrato já é desenhado na proporção do A4 (794 × 1123 px a 96dpi),
    // então a imagem ocupa a página inteira, sem margens artificiais. Quando
    // o período exportado passa de uma página, a mesma imagem é reposicionada
    // página a página.
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const larguraMm = 210;
    const alturaPaginaMm = 297;
    const alturaTotalMm = (canvas.height * larguraMm) / canvas.width;
    let deslocamento = 0;
    let primeira = true;
    while (deslocamento < alturaTotalMm - 1) {
      if (!primeira) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, -deslocamento, larguraMm, alturaTotalMm);
      deslocamento += alturaPaginaMm;
      primeira = false;
    }
    pdf.save(`${nomeBase}.pdf`);
    return;
  }

  // Card mobile em PDF: página sob medida, com a mesma proporção da imagem.
  const larguraMm = 120;
  const alturaMm = (canvas.height * larguraMm) / canvas.width;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [larguraMm, Math.min(alturaMm, 5000)],
  });
  pdf.addImage(img, "JPEG", 0, 0, larguraMm, alturaMm);
  pdf.save(`${nomeBase}.pdf`);
}

/* ==========================================================================
   EXPORTAÇÃO EM TEXTO (modal)
   ========================================================================== */

// Mesmo conteúdo minimalista das exportações em PDF/JPEG (horário, título,
// categoria, link só para pauta online, aviso de cancelamento), em texto
// simples — respeita os filtros ativos, igual às demais exportações.
function construirTextoAgenda() {
  const eventos = obterEventosFiltrados();
  const grupos = agruparPorDia(eventos);
  const linhas = [];

  linhas.push("SAA — Agenda Institucional do TCM-BA");
  linhas.push("Gerado em " + formatarDataHora(new Date()));
  linhas.push("");

  if (eventos.length === 0) {
    linhas.push("Nenhum compromisso encontrado para os filtros selecionados.");
    return linhas.join("\n");
  }

  grupos.forEach((grupo) => {
    linhas.push(grupo.rotulo.toUpperCase());
    grupo.eventos.forEach(({ evento, diaChave }) => {
      const horario = horarioResumoPorDia(evento, diaChave);
      const aviso = evento.cancelado ? "  [⚠ CANCELADO]" : "";
      const continuo = eventoEhContinuo(evento)
        ? `  [vários dias: ${formatarDataCurta(new Date(evento.inicio))} a ${formatarDataCurta(dataFimInclusivo(evento))}]`
        : "";
      linhas.push(`  ${horario} | ${CATEGORIA_LABEL[evento.categoria]} | ${evento.titulo}${aviso}${continuo}`);
      if (evento.categoria === "pauta-online" && evento.link) {
        linhas.push(`      Link: ${evento.link}`);
      }
    });
    linhas.push("");
  });

  return linhas.join("\n").trim();
}

function abrirModalTexto() {
  document.getElementById("text-export-conteudo").value = construirTextoAgenda();
  document.getElementById("text-export-copiado").hidden = true;
  document.getElementById("text-export-modal").hidden = false;
  document.getElementById("text-export-backdrop").hidden = false;
  document.getElementById("text-export-conteudo").focus();
}

function fecharModalTexto() {
  document.getElementById("text-export-modal").hidden = true;
  document.getElementById("text-export-backdrop").hidden = true;
}

/* ==========================================================================
   LIGAÇÃO DE EVENTOS DE INTERFACE
   ========================================================================== */

function configurarChipGroup(seletor, callback, multipla) {
  const grupo = document.querySelector(seletor);
  grupo.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".chip");
    if (!btn) return;

    if (multipla) {
      btn.classList.toggle("is-active");
    } else {
      grupo.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
    }
    callback(btn, grupo);
  });
}

function inicializarInterface() {
  inicializarTema();
  document.getElementById("btn-tema").addEventListener("click", alternarTema);

  // Sem URL configurada não há para onde apontar o botão.
  const btnCalendario = document.getElementById("btn-abrir-calendario");
  if (CALENDAR_HTML_URL) {
    btnCalendario.href = CALENDAR_HTML_URL;
  } else {
    btnCalendario.hidden = true;
  }

  document.getElementById("btn-atualizar").addEventListener("click", () => atualizarAgenda());
  document.getElementById("btn-tentar-novamente").addEventListener("click", () => atualizarAgenda());

  // A busca do topo é única, mas cada módulo tem o seu conjunto de dados: ela
  // filtra o que estiver em tela, em vez de existir duas caixas de busca.
  document.getElementById("busca").addEventListener("input", (ev) => {
    if (state.modulo === "projetos") {
      state.filtrosProjeto.busca = ev.target.value;
      renderizarProjetos();
      return;
    }
    if (state.modulo === "ramais") {
      state.filtroRamais = ev.target.value;
      renderizarRamais();
      return;
    }
    state.filtros.busca = ev.target.value;
    renderizarConteudo();
  });

  document.getElementById("mostrar-concluidos").addEventListener("change", (ev) => {
    state.filtros.mostrarConcluidos = ev.target.checked;
    renderizarConteudo();
  });

  const inputDataInicio = document.getElementById("filtro-data-inicio");
  const inputDataFim = document.getElementById("filtro-data-fim");
  const btnLimparDatas = document.getElementById("btn-limpar-datas");

  // Valida o intervalo (Até >= De) antes de aplicar ao filtro — em caso de
  // erro, mantém o filtro anterior válido e exibe uma mensagem clara.
  function aplicarFiltroDeData() {
    const inicio = inputDataInicio.value || null;
    const fim = inputDataFim.value || null;

    if (inicio && fim && fim < inicio) {
      mostrarErroData('A data "Até" precisa ser igual ou posterior à data "De".');
      return;
    }

    esconderErroData();
    state.filtros.dataInicio = inicio;
    state.filtros.dataFim = fim;

    // Escolher uma data manda no que é exibido. Sem devolver o período para
    // "Todos", a tela ficaria contraditória: chip "Hoje" aceso enquanto se
    // exibe outro dia.
    if (inicio || fim) {
      state.filtros.periodo = "todos";
      sincronizarChipsPeriodo();
    }

    atualizarVisibilidadeBtnLimparDatas();
    renderizarConteudo();
  }

  inputDataInicio.addEventListener("change", aplicarFiltroDeData);
  inputDataFim.addEventListener("change", aplicarFiltroDeData);

  btnLimparDatas.addEventListener("click", () => {
    limparFiltroDeData();
    renderizarConteudo();
  });

  configurarChipGroup(
    "#periodo-group",
    (btn) => {
      state.filtros.periodo = btn.dataset.periodo;
      // Caminho inverso do de cima: escolher um período descarta o intervalo
      // digitado, para que os dois controles nunca disputem a mesma janela.
      limparFiltroDeData();
      renderizarConteudo();
    },
    false
  );

  // Lista de categorias (sidebar): alterna a categoria clicada.
  document.getElementById("categoria-lista").addEventListener("click", (ev) => {
    const item = ev.target.closest(".cat-list__item");
    if (!item) return;
    const categoria = item.dataset.categoria;
    if (state.filtros.categorias.has(categoria)) state.filtros.categorias.delete(categoria);
    else state.filtros.categorias.add(categoria);
    renderizarConteudo();
    if (window.innerWidth <= 860) fecharSidebarMobile();
  });

  // ---------------------------------------------------------------------
  // Overlay de exportação
  // ---------------------------------------------------------------------

  document.getElementById("btn-abrir-export").addEventListener("click", abrirOverlayExport);

  // A pré-visualização é reduzida por transform: ao mudar a largura da
  // janela, a redução precisa ser recalculada, senão sobra ou falta espaço.
  window.addEventListener("resize", () => {
    if (!document.getElementById("export-backdrop").hidden) ajustarEscalaPreview();
  });
  document.getElementById("btn-fechar-export").addEventListener("click", fecharOverlayExport);
  document.getElementById("export-backdrop").addEventListener("click", (ev) => {
    // Fecha apenas ao clicar no fundo escurecido, fora do painel/preview.
    if (ev.target.id === "export-backdrop") fecharOverlayExport();
  });

  // Seleção de formato e densidade — atualiza a pré-visualização ao vivo.
  function ligarOpcoesExport(seletor, aoEscolher) {
    const grupo = document.querySelector(seletor);
    grupo.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".opt-card");
      if (!btn) return;
      grupo.querySelectorAll(".opt-card").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      aoEscolher(btn);
      renderizarPreviewExport();
    });
  }
  ligarOpcoesExport("#export-formato-group", (btn) => {
    state.exportacao.formato = btn.dataset.formato;
    sincronizarOpcoesExport();
  });
  ligarOpcoesExport("#export-densidade-group", (btn) => {
    state.exportacao.densidade = btn.dataset.densidade;
  });
  ligarOpcoesExport("#export-proporcao-group", (btn) => {
    state.exportacao.proporcao = btn.dataset.proporcao;
  });

  // Alternadores de conteúdo (cancelados, janelas livres, assinatura).
  ["export-incluir-cancelados", "export-incluir-janelas", "export-linha-assinatura-check"].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) campo.addEventListener("change", () => renderizarPreviewExport());
  });

  sincronizarOpcoesExport();

  // Cada artefato tem controles próprios: o extrato A4 não tem proporção de
  // story, e o card mobile não tem linha de assinatura.
  function sincronizarOpcoesExport() {
    const ehA4 = state.exportacao.formato === "a4";
    const alternar = (id, visivel) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !visivel;
    };
    alternar("export-bloco-a4", ehA4);
    alternar("export-bloco-mobile", !ehA4);
    alternar("export-linha-assinatura", ehA4);
    alternar("export-linha-janelas", true);

    const btnJpeg = document.getElementById("btn-exportar-jpeg");
    const btnPdf = document.getElementById("btn-exportar-pdf");
    if (btnJpeg) btnJpeg.textContent = ehA4 ? "Baixar imagem" : "Baixar JPEG";
    if (btnPdf) btnPdf.textContent = "Baixar PDF";
  }

  async function baixarExport(tipo, btn) {
    btn.disabled = true;
    const textoOriginal = btn.textContent;
    btn.textContent = tipo === "pdf" ? "Gerando PDF…" : "Gerando JPEG…";
    try {
      await exportarPapel(tipo);
    } catch (erro) {
      console.error("Erro ao exportar:", erro);
      alert("Não foi possível gerar o arquivo: " + erro.message);
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  }
  document.getElementById("btn-exportar-pdf").addEventListener("click", (ev) => baixarExport("pdf", ev.currentTarget));
  document.getElementById("btn-exportar-jpeg").addEventListener("click", (ev) => baixarExport("jpeg", ev.currentTarget));

  // ---------------------------------------------------------------------
  // Sidebar: drawer mobile e colapso no desktop
  // ---------------------------------------------------------------------

  document.getElementById("btn-menu").addEventListener("click", () => {
    if (state.ui.sidebarAberta) fecharSidebarMobile();
    else abrirSidebarMobile();
  });
  document.getElementById("sidebar-backdrop").addEventListener("click", fecharSidebarMobile);
  document.getElementById("btn-recolher-sidebar").addEventListener("click", alternarSidebarDesktop);

  try {
    if (localStorage.getItem(SIDEBAR_RECOLHIDA_STORAGE_KEY) === "1") {
      alternarSidebarDesktop();
    }
  } catch (e) {
    /* ignora */
  }

  // Fecha o drawer mobile automaticamente ao escolher um filtro, já que a
  // sidebar cobre o conteúdo nesse modo.
  document.getElementById("sidebar").addEventListener("click", (ev) => {
    if (window.innerWidth > 860) return;
    if (ev.target.closest(".chip, .switch, #btn-limpar-datas")) {
      fecharSidebarMobile();
    }
  });

  // ---------------------------------------------------------------------
  // Filtros ativos: botão "limpar todos"
  // ---------------------------------------------------------------------

  document.getElementById("btn-limpar-filtros").addEventListener("click", limparTodosFiltros);

  // ---------------------------------------------------------------------
  // Alternância entre linha do tempo e tabela
  // ---------------------------------------------------------------------

  document.getElementById("btn-vista-timeline").addEventListener("click", () => {
    state.ui.vista = "timeline";
    atualizarVisibilidadeVista();
  });
  document.getElementById("btn-vista-tabela").addEventListener("click", () => {
    state.ui.vista = "tabela";
    atualizarVisibilidadeVista();
  });

  // ---------------------------------------------------------------------
  // Tabela: ordenação e paginação
  // ---------------------------------------------------------------------

  document.querySelectorAll(".th-sort").forEach((btn) => {
    btn.addEventListener("click", () => {
      const campo = btn.dataset.sort;
      if (state.ui.tabelaOrdenarPor === campo) {
        state.ui.tabelaOrdemAsc = !state.ui.tabelaOrdemAsc;
      } else {
        state.ui.tabelaOrdenarPor = campo;
        state.ui.tabelaOrdemAsc = true;
      }
      state.ui.tabelaPagina = 1;
      renderizarConteudo();
    });
  });

  document.getElementById("btn-pagina-anterior").addEventListener("click", () => {
    state.ui.tabelaPagina -= 1;
    renderizarConteudo();
  });
  document.getElementById("btn-pagina-proxima").addEventListener("click", () => {
    state.ui.tabelaPagina += 1;
    renderizarConteudo();
  });

  // ---------------------------------------------------------------------
  // Painel lateral de detalhes (delegação para cartões e linhas da tabela)
  // ---------------------------------------------------------------------

  document.addEventListener("click", (ev) => {
    const btnDetalhes = ev.target.closest("[data-abrir-detalhes]");
    if (btnDetalhes) {
      abrirPainelDetalhes(btnDetalhes.dataset.abrirDetalhes);
    }
  });

  document.getElementById("btn-fechar-painel").addEventListener("click", fecharPainelDetalhes);
  document.getElementById("panel-backdrop").addEventListener("click", fecharPainelDetalhes);

  // ---------------------------------------------------------------------
  // Exportação em texto (modal)
  // ---------------------------------------------------------------------

  document.getElementById("btn-exportar-texto").addEventListener("click", abrirModalTexto);
  document.getElementById("btn-fechar-texto").addEventListener("click", fecharModalTexto);
  document.getElementById("btn-fechar-texto-2").addEventListener("click", fecharModalTexto);
  document.getElementById("text-export-backdrop").addEventListener("click", fecharModalTexto);

  document.getElementById("btn-copiar-texto").addEventListener("click", async () => {
    const textarea = document.getElementById("text-export-conteudo");
    const aviso = document.getElementById("text-export-copiado");
    try {
      await navigator.clipboard.writeText(textarea.value);
    } catch (e) {
      // Sem permissão/API de clipboard: seleciona o texto para copiar manualmente.
      textarea.focus();
      textarea.select();
    }
    aviso.hidden = false;
    setTimeout(() => {
      aviso.hidden = true;
    }, 2500);
  });

  // ---------------------------------------------------------------------
  // Tecla Esc: fecha o overlay mais recente (confirmação > texto > painel > drawer)
  // ---------------------------------------------------------------------

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;

    const confirmModal = document.getElementById("confirm-modal");
    if (!confirmModal.hidden) {
      document.getElementById("confirm-cancelar").click();
      return;
    }
    if (!document.getElementById("text-export-modal").hidden) {
      fecharModalTexto();
      return;
    }
    if (!document.getElementById("export-backdrop").hidden) {
      fecharOverlayExport();
      return;
    }
    if (document.getElementById("detail-panel").getAttribute("aria-hidden") === "false") {
      fecharPainelDetalhes();
      return;
    }
    if (state.ui.sidebarAberta) {
      fecharSidebarMobile();
    }
  });
}

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

// Lê o recorte pedido na própria URL, para que um link abra a agenda já no
// dia certo. É o que permite a um e-mail, a um cron ou a um atalho no celular
// apontarem para um dia específico — e é também o que garante que a imagem
// gerada automaticamente venha desta mesma tela, com estes mesmos números, em
// vez de um segundo renderizador que divergiria com o tempo.
//
//   ?data=2026-09-08              um dia
//   ?de=2026-09-08&ate=2026-09-12 um intervalo
//   ?periodo=dia|semana|mes|todos quando não há data explícita
//
// Datas fora do formato YYYY-MM-DD são ignoradas em silêncio: um link torto
// deve abrir a agenda de hoje, não uma tela de erro.
function aplicarFiltrosDaURL() {
  const params = new URLSearchParams(window.location.search);
  const dataValida = (v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

  // "?modulo=" abre o sistema direto em um módulo. Aceita "plano" como
  // sinônimo de "projetos" para que o link acompanhe o nome exibido na tela.
  const pedido = (params.get("modulo") || "").toLowerCase();
  const moduloPedido =
    pedido === "plano" || pedido === "plano100" ? "projetos" : pedido === "ramal" ? "ramais" : pedido;

  const dia = dataValida(params.get("data"));
  const de = dia || dataValida(params.get("de"));
  const ate = dia || dataValida(params.get("ate"));

  if (de || ate) {
    state.filtros.dataInicio = de;
    state.filtros.dataFim = ate;
    // Intervalo explícito manda no que é exibido; o período volta a "Todos"
    // para que os dois controles não disputem a mesma janela.
    state.filtros.periodo = "todos";
    const campoInicio = document.getElementById("filtro-data-inicio");
    const campoFim = document.getElementById("filtro-data-fim");
    if (campoInicio) campoInicio.value = de || "";
    if (campoFim) campoFim.value = ate || "";
    atualizarVisibilidadeBtnLimparDatas();
    sincronizarChipsPeriodo();
    // Um intervalo explícito na URL é um pedido pela agenda — é o formato dos
    // links do envio diário. Abrir o portal aqui esconderia o que foi pedido.
    trocarModulo(moduloPedido || "agenda");
    return;
  }

  const periodo = params.get("periodo");
  if (["dia", "semana", "mes", "todos"].includes(periodo)) {
    state.filtros.periodo = periodo;
    sincronizarChipsPeriodo();
    trocarModulo(moduloPedido || "agenda");
    return;
  }

  trocarModulo(moduloPedido || "portal");
}

// Ponto de automação. Expõe a geração do artefato para processos que abrem
// esta página em navegador headless — hoje, o envio diário por e-mail.
//
// Devolve o data URL do JPEG no tamanho real, produzido pelo MESMO caminho do
// botão "Baixar JPEG": mesma montagem do papel, mesma escala, mesma
// rasterização. É o que garante que o arquivo enviado automaticamente seja
// idêntico ao que a pessoa baixaria da tela, em vez de sair de um segundo
// renderizador que divergiria com o tempo.
//
// Respeita os filtros em vigor, inclusive os vindos da URL — de modo que
// abrir "?data=2026-09-08" e chamar esta função produz o card daquele dia.
window.saaGerarCard = async function ({ formato = "mobile", proporcao = "story", qualidade = 0.95 } = {}) {
  if (!window.html2canvas) throw new Error("Biblioteca de captura indisponível.");
  await precarregarMarcas();

  state.exportacao.formato = formato;
  state.exportacao.proporcao = proporcao;

  const lista = obterEventosFiltrados();
  const grupos = agruparPorDia(lista);
  const paper = construirPaperExport(grupos, lista.length);
  const canvas = await renderizarCanvasElemento(paper, formato === "a4" ? 2.5 : 1.5);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", qualidade),
    largura: canvas.width,
    altura: canvas.height,
    compromissos: lista.length,
  };
};

/* ==========================================================================
   MÓDULO CALENDÁRIO 100 DIAS
   --------------------------------------------------------------------------
   Projetos em desenvolvimento com prazo de entrega dentro de um horizonte de
   100 dias, e o histórico de status de cada um.

   Diferença essencial em relação à agenda: a agenda é SOMENTE LEITURA — ela
   busca um ICS e não grava nada. Aqui os dados nascem no próprio sistema, o
   que exige um lugar para persistir.

   Persistência: localStorage, isto é, no navegador de quem usa. É o único
   destino possível sem servidor de dados e sem autenticação — e o site é
   público, então um banco compartilhado deixaria qualquer visitante criar,
   editar e apagar projetos do gabinete. A consequência (os projetos não
   aparecem em outro dispositivo) está dita na própria tela, não escondida
   aqui no código, e há exportação/importação em JSON para levar os dados de
   uma máquina a outra enquanto não houver back-end.

   Toda a leitura e gravação passa por lerProjetos/gravarProjetos: trocar o
   destino depois é mexer nessas duas funções, não na tela.
   ========================================================================== */

const PROJETOS_STORAGE_KEY = "saaTcm.projetos.v1";
const SEMENTE_STORAGE_KEY = "saaTcm.projetos.semente";

const SITUACOES = {
  "nao-iniciado": { label: "Não iniciado", cor: "#5F6E88", bg: "#EFF2F7", borda: "#DCE3EE" },
  "em-andamento": { label: "Em andamento", cor: "#2C63B0", bg: "#EAF2FC", borda: "#C9DCF4" },
  "em-risco": { label: "Em risco", cor: "#A65A05", bg: "#FDF1E3", borda: "#F0DCBE" },
  concluido: { label: "Concluído", cor: "#0F7B5F", bg: "#E7F4F0", borda: "#C4E3D9" },
  suspenso: { label: "Suspenso", cor: "#B00320", bg: "#FDECEF", borda: "#F6C4CE" },
  vencido: { label: "Vencido", cor: "#7C0518", bg: "#FBE4E8", borda: "#EFB3C0" },
};

// Contrato próximo do fim da vigência exige providência — prorrogação ou nova
// licitação — e essa antecedência é a janela de 90 dias.
const RISCO_CONTRATO_DIAS = 90;


// Contrato não tem situação digitada: ela decorre da vigência. Derivar em vez
// de gravar é o que impede o painel de envelhecer — no dia em que a vigência
// passa, o mesmo registro deixa de ser "em risco" e passa a "vencido" sozinho,
// sem depender de alguém lembrar de atualizar.
function situacaoEfetiva(p) {
  if (!p) return SITUACAO_PADRAO;
  // Escolha explícita vence a regra: quem marcou a categoria à mão tem uma
  // razão que a vigência não conhece — contrato prorrogado, encerrado antes do
  // prazo, suspenso por decisão. A volta ao automático é um clique.
  if (p.tipo !== "contrato" || p.situacaoManual) return p.situacao || SITUACAO_PADRAO;
  const dias = diasRestantes(p);
  if (dias < 0) return "vencido";
  if (dias <= RISCO_CONTRATO_DIAS) return "em-risco";
  return "em-andamento";
}

const SITUACAO_PADRAO = "nao-iniciado";

/* --------------------------------------------------------------------------
   Persistência
   -------------------------------------------------------------------------- */

function lerProjetos() {
  try {
    const bruto = localStorage.getItem(PROJETOS_STORAGE_KEY);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? dados.filter(projetoValido) : [];
  } catch (e) {
    console.warn("Não foi possível ler os projetos salvos:", e);
    return [];
  }
}

function gravarProjetos(projetos) {
  try {
    localStorage.setItem(PROJETOS_STORAGE_KEY, JSON.stringify(projetos));
    return true;
  } catch (e) {
    console.error("Não foi possível gravar os projetos:", e);
    mostrarErroProjeto("Não foi possível salvar. O armazenamento do navegador pode estar cheio ou bloqueado.");
    return false;
  }
}

// Um registro vindo do armazenamento (ou de um arquivo restaurado) só é aceito
// com o mínimo que a tela precisa para não quebrar ao renderizar.
function projetoValido(p) {
  return Boolean(
    p &&
      typeof p.id === "string" &&
      typeof p.nome === "string" &&
      p.nome.trim() &&
      /^\d{4}-\d{2}-\d{2}$/.test(p.prazoEntrega || "")
  );
}

/* --------------------------------------------------------------------------
   Cálculos derivados
   -------------------------------------------------------------------------- */

function hojeChave() {
  return chaveDia(new Date());
}

// Diferença em dias entre duas datas "YYYY-MM-DD". Meio-dia como referência
// evita que o horário de gravação faça a conta pular um dia.
function diasEntreChaves(de, ate) {
  const a = new Date(`${de}T12:00:00${offsetBahia()}`).getTime();
  const b = new Date(`${ate}T12:00:00${offsetBahia()}`).getTime();
  return Math.round((b - a) / 86400000);
}

function chaveMaisDias(chave, dias) {
  const d = new Date(`${chave}T12:00:00${offsetBahia()}`);
  d.setDate(d.getDate() + dias);
  return chaveDia(d);
}

// Atraso é derivado, nunca digitado: o prazo passou e a entrega não aconteceu.
// Deixar o usuário marcar "atrasado" à mão produziria projetos vencidos ainda
// exibidos como em dia.
function projetoAtrasado(p) {
  // "Concluído" e "Vencido" já são a palavra final sobre o prazo; sobrepor
  // "Atrasado" a eles seria dizer duas vezes a mesma coisa, e errado.
  //
  // A categoria escolhida à mão também tem a palavra final: quem marcou um
  // contrato de data vencida como "em andamento" sabe de uma prorrogação que a
  // data não conta. Sobrepor "Atrasado" seria contradizer a própria escolha.
  if (p.situacaoManual) return false;
  const situacao = situacaoEfetiva(p);
  if (situacao === "concluido" || situacao === "vencido") return false;
  return diasEntreChaves(hojeChave(), p.prazoEntrega) < 0;
}

function diasRestantes(p) {
  return diasEntreChaves(hojeChave(), p.prazoEntrega);
}

function rotuloPrazo(p) {
  const dias = diasRestantes(p);
  const situacao = situacaoEfetiva(p);
  if (situacao === "concluido") return "entregue";
  // Contrato não atrasa: a vigência vence. A palavra muda porque o fato é
  // outro — não há entrega em mora, há cobertura contratual encerrada.
  if (p.tipo === "contrato") {
    if (dias < 0) return `vigência vencida há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`;
    if (dias === 0) return "vigência encerra hoje";
    if (dias === 1) return "vigência encerra amanhã";
    return `${dias} dias de vigência`;
  }
  if (dias < 0) return `${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"} de atraso`;
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `faltam ${dias} dias`;
}

function dataCurtaDaChave(chave) {
  return formatarDataCurta(new Date(`${chave}T12:00:00${offsetBahia()}`));
}

// Diz em uma linha qual janela de entrega está sendo exibida — pelo intervalo
// do calendário, quando há um, ou pelo horizonte em dias.
function subtituloDoPlano() {
  const { horizonte, prazoInicio, prazoFim } = state.filtrosProjeto;
  if (prazoInicio && prazoFim) return `Entregas de ${dataCurtaDaChave(prazoInicio)} a ${dataCurtaDaChave(prazoFim)}`;
  if (prazoInicio) return `Entregas a partir de ${dataCurtaDaChave(prazoInicio)}`;
  if (prazoFim) return `Entregas até ${dataCurtaDaChave(prazoFim)}`;
  if (horizonte === HORIZONTE_TODAS) return "Todas as entregas lançadas, sem recorte de data";
  return `Entregas até ${dataCurtaDaChave(chaveMaisDias(hojeChave(), horizonte))} · horizonte de ${horizonte} dias`;
}

function corDoProjeto(p) {
  if (projetoAtrasado(p)) return SITUACOES.suspenso.cor;
  return (SITUACOES[situacaoEfetiva(p)] || SITUACOES[SITUACAO_PADRAO]).cor;
}

// Há um intervalo de prazo escolhido no calendário da barra lateral?
function filtroDePrazoAtivo() {
  return Boolean(state.filtrosProjeto.prazoInicio || state.filtrosProjeto.prazoFim);
}

function projetosNoHorizonte() {
  return projetosFiltrados();
}

function projetosFiltrados({ ignorarHorizonte = false } = {}) {
  const { horizonte, situacoes, busca, prazoInicio, prazoFim } = state.filtrosProjeto;
  const hoje = hojeChave();
  const limite = chaveMaisDias(hoje, horizonte);
  const porIntervalo = filtroDePrazoAtivo();

  return state.projetos
    .filter((p) => {
      // Intervalo escolhido no calendário manda sozinho: quem pediu "entregas
      // de março" quer exatamente isso, inclusive o que já venceu dentro da
      // janela e o que cai além dos 100 dias.
      if (porIntervalo) {
        if (prazoInicio && p.prazoEntrega < prazoInicio) return false;
        if (prazoFim && p.prazoEntrega > prazoFim) return false;
      } else if (!ignorarHorizonte && horizonte !== HORIZONTE_TODAS && p.prazoEntrega > limite) {
        // Fora do horizonte só some quem entrega depois dele. O que já venceu
        // e não foi entregue continua na lista — sumir com um projeto
        // atrasado seria esconder justamente o que precisa de atenção.
        return false;
      }
      if (situacoes.size && !situacoes.has(situacaoEfetiva(p))) return false;
      if (busca) {
        const alvo = normalizarTexto(`${p.nome} ${p.descricao || ""} ${p.responsavel || ""} ${p.area || ""}`);
        if (!alvo.includes(normalizarTexto(busca))) return false;
      }
      return true;
    })
    .sort((a, b) => a.prazoEntrega.localeCompare(b.prazoEntrega) || a.nome.localeCompare(b.nome));
}

/* --------------------------------------------------------------------------
   Renderização
   -------------------------------------------------------------------------- */

// Três estados diferentes pedem a mesma coisa — providência agora: prazo de
// entrega estourado, vigência encerrada e prazo curto demais. Reuni-los num
// predicado evita que um contrato vencido suma do contador e do alerta por
// não ser tecnicamente "atrasado".
function exigeProvidencia(p) {
  const situacao = situacaoEfetiva(p);
  return projetoAtrasado(p) || situacao === "em-risco" || situacao === "vencido";
}

function prazoEstourado(p) {
  return projetoAtrasado(p) || situacaoEfetiva(p) === "vencido";
}

function seloSituacao(p) {
  const atrasado = projetoAtrasado(p);
  const s = atrasado
    ? { label: "Atrasado", cor: SITUACOES.suspenso.cor, bg: SITUACOES.suspenso.bg, borda: SITUACOES.suspenso.borda }
    : SITUACOES[situacaoEfetiva(p)] || SITUACOES[SITUACAO_PADRAO];
  return `<span class="situacao-selo" style="color:${s.cor};background:${s.bg};border:1px solid ${s.borda}">${escapeHtml(s.label)}</span>`;
}

// O contador do menu conta a base inteira, não o recorte filtrado, e por isso
// não pertence a nenhum módulo em particular — quem abre o sistema no portal
// precisa vê-lo tanto quanto quem está na tela do plano.
function atualizarBadgeProjetos() {
  const badge = document.getElementById("nav-badge-projetos");
  if (!badge) return;
  badge.textContent = state.projetos.length;
  badge.hidden = state.projetos.length === 0;
}

function renderizarResumoProjetos(lista) {
  const emAndamento = lista.filter((p) => situacaoEfetiva(p) === "em-andamento").length;
  const risco = lista.filter(exigeProvidencia).length;
  const concluidos = lista.filter((p) => situacaoEfetiva(p) === "concluido").length;

  document.getElementById("proj-stat-total").textContent = lista.length;
  // "No horizonte" só é verdade quando existe um horizonte; sem recorte, o
  // número é simplesmente o que está cadastrado.
  document.getElementById("proj-stat-total-rotulo").textContent =
    filtroDePrazoAtivo() || state.filtrosProjeto.horizonte !== HORIZONTE_TODAS ? "no recorte" : "cadastrados";
  document.getElementById("proj-stat-andamento").textContent = emAndamento;
  document.getElementById("proj-stat-andamento-rotulo").textContent = emAndamento === 1 ? "projeto" : "projetos";
  document.getElementById("proj-stat-risco").textContent = risco;
  document.getElementById("proj-stat-risco-rotulo").textContent = risco === 0 ? "nenhum" : risco === 1 ? "projeto" : "projetos";
  document.getElementById("proj-stat-concluidos").textContent = concluidos;
  document.getElementById("proj-cel-risco").classList.toggle("is-alerta", risco > 0);

  const estourados = lista.filter(prazoEstourado);
  const alerta = document.getElementById("proj-alerta");
  if (estourados.length) {
    const soContratos = estourados.every((p) => p.tipo === "contrato");
    const substantivo = soContratos ? "contrato" : "registro";
    document.getElementById("proj-alerta-titulo").textContent =
      estourados.length === 1
        ? `1 ${substantivo} com prazo vencido`
        : `${estourados.length} ${substantivo}s com prazo vencido`;
    document.getElementById("proj-alerta-detalhe").textContent = estourados
      .slice(0, 3)
      .map((p) => `${p.nome} (${rotuloPrazo(p)})`)
      .join(" · ");
    alerta.hidden = false;
  } else {
    alerta.hidden = true;
  }

  atualizarBadgeProjetos();

  document.getElementById("proj-resumo").textContent =
    `${lista.length} ${lista.length === 1 ? "projeto" : "projetos"}`;

  document.getElementById("proj-subtitulo").textContent = subtituloDoPlano();
  renderizarAvisoDeOcultos(lista);
}

// Filtro que esconde registros sem dizer nada leva a pessoa a concluir que os
// que faltam se perderam. Aqui a conta fica à vista, com o caminho para ver o
// resto a um clique: pelo horizonte, quando é ele que corta; pelos demais
// filtros, quando são eles.
function renderizarAvisoDeOcultos(lista) {
  const aviso = document.getElementById("proj-ocultos");
  const texto = document.getElementById("proj-ocultos-texto");
  const botao = document.getElementById("btn-ver-ocultos");
  if (!aviso || !texto || !botao) return;

  const ocultos = state.projetos.length - lista.length;
  if (ocultos <= 0) {
    aviso.hidden = true;
    return;
  }

  const { horizonte } = state.filtrosProjeto;
  const semHorizonte = projetosFiltrados({ ignorarHorizonte: true }).length;
  const peloHorizonte =
    !filtroDePrazoAtivo() && horizonte !== HORIZONTE_TODAS && semHorizonte > lista.length;

  if (peloHorizonte) {
    const fora = semHorizonte - lista.length;
    texto.textContent = `${fora} ${fora === 1 ? "entrega fica" : "entregas ficam"} além do horizonte de ${horizonte} dias.`;
    botao.textContent = "Ver todas";
    botao.dataset.acao = "horizonte";
  } else {
    texto.textContent = `${ocultos} ${ocultos === 1 ? "registro está oculto" : "registros estão ocultos"} pelos filtros em vigor.`;
    botao.textContent = "Limpar filtros";
    botao.dataset.acao = "limpar";
  }
  aviso.hidden = false;
}

// Devolve a lista completa à tela, pelo caminho que o aviso oferece.
function verTodosOsProjetos(acao) {
  if (acao === "limpar") {
    state.filtrosProjeto.situacoes.clear();
    state.filtrosProjeto.busca = "";
    const busca = document.getElementById("busca");
    if (busca) busca.value = "";
    state.filtrosProjeto.prazoInicio = null;
    state.filtrosProjeto.prazoFim = null;
    document.getElementById("proj-filtro-de").value = "";
    document.getElementById("proj-filtro-ate").value = "";
    mostrarErroPrazo("");
    atualizarVisibilidadeBtnLimparPrazo();
  }
  state.filtrosProjeto.horizonte = HORIZONTE_TODAS;
  sincronizarChipsHorizonte();
  renderizarProjetos();
}

// Barras posicionadas numa escala de datas: início e prazo viram porcentagem
// da janela, do mesmo jeito que a linha do tempo da agenda converte minutos.
function renderizarPistaProjetos(lista) {
  const card = document.getElementById("proj-pista-card");
  const pista = document.getElementById("proj-pista");
  const escala = document.getElementById("proj-escala");

  if (!lista.length) {
    card.hidden = true;
    return;
  }
  card.hidden = false;

  const hoje = hojeChave();
  const horizonte = state.filtrosProjeto.horizonte;
  const { prazoInicio, prazoFim } = state.filtrosProjeto;

  // A escala tem de conter tudo que está na lista, senão barras aparecem
  // grudadas na borda ou fora dela. Com intervalo escolhido no calendário a
  // janela é o próprio intervalo, esticado até caber a entrega mais distante.
  let inicioJanela = prazoInicio || hoje;
  // Sem teto de data a escala nasce da própria lista, senão "Todas" abriria
  // uma régua de dez anos com as barras de curto prazo espremidas na esquerda.
  let fimJanela = prazoFim || (horizonte === HORIZONTE_TODAS ? lista[0].prazoEntrega : chaveMaisDias(hoje, horizonte));
  lista.forEach((p) => {
    if (p.dataInicio && p.dataInicio < inicioJanela) inicioJanela = p.dataInicio;
    if (p.prazoEntrega < inicioJanela) inicioJanela = p.prazoEntrega;
    if (p.prazoEntrega > fimJanela) fimJanela = p.prazoEntrega;
  });
  if (fimJanela <= inicioJanela) fimJanela = chaveMaisDias(inicioJanela, 1);
  const total = Math.max(diasEntreChaves(inicioJanela, fimJanela), 1);
  const pct = (chave) => (Math.min(Math.max(diasEntreChaves(inicioJanela, chave), 0), total) / total) * 100;

  const passos = Math.min(6, total);
  escala.innerHTML = Array.from({ length: passos + 1 }, (_, i) => {
    const chave = chaveMaisDias(inicioJanela, Math.round((total / passos) * i));
    // As pontas encostam na borda em vez de ficarem centradas na marca: com
    // translateX(-50%) em 0% e 100% metade do rótulo sairia da régua.
    const extremo = i === 0 ? " proj-escala__marca--inicio" : i === passos ? " proj-escala__marca--fim" : "";
    const ancora = i === 0 ? "left:0" : i === passos ? "right:0" : `left:${pct(chave)}%`;
    return `<span class="proj-escala__marca${extremo}" style="${ancora}">${dataCurtaDaChave(chave)}</span>`;
  }).join("");

  const linhas = lista
    .map((p) => {
      const cor = corDoProjeto(p);
      const progresso = Math.max(0, Math.min(100, Number(p.progresso) || 0));
      const dir = pct(p.prazoEntrega);
      const titulo = escapeAttr(`${p.nome} — ${p.dataInicio ? "entrega" : "prazo"} ${dataCurtaDaChave(p.prazoEntrega)}`);

      // Sem data de início não há período a desenhar. Esticar a barra da borda
      // da janela até o prazo inventaria um começo — e um que mudaria de lugar
      // a cada troca de filtro. Nesse caso a data vira um marco no prazo, com
      // o rótulo do lado de dentro da régua.
      if (!p.dataInicio) {
        const daDireita = dir > 55;
        const ancora = daDireita ? `right:${(100 - dir).toFixed(3)}%` : `left:${dir.toFixed(3)}%`;
        return `
          <div class="proj-barra-linha">
            <button class="proj-barra proj-barra--marco" type="button" data-projeto="${escapeAttr(p.id)}"
                    style="${ancora};background:${cor};color:#fff" title="${titulo}">
              <span class="proj-barra__rotulo">${escapeHtml(p.nome)}</span>
            </button>
          </div>`;
      }

      const ini = p.dataInicio > inicioJanela ? p.dataInicio : inicioJanela;
      const esq = pct(ini);
      const largura = Math.max(dir - esq, 1.5);
      return `
        <div class="proj-barra-linha">
          <button class="proj-barra" type="button" data-projeto="${escapeAttr(p.id)}"
                  style="left:${esq}%;width:${largura}%;background:${cor};color:#fff" title="${titulo}">
            <span class="proj-barra__progresso" style="width:${progresso}%"></span>
            <span class="proj-barra__rotulo">${escapeHtml(p.nome)}</span>
          </button>
        </div>`;
    })
    .join("");

  // A marca do "hoje" some quando a janela escolhida não o contém: mantê-la
  // colada na borda faria parecer que a data cai ali dentro.
  const hojeNaJanela = hoje >= inicioJanela && hoje <= fimJanela;
  const marcaHoje = hojeNaJanela ? `<div class="proj-pista__hoje" style="left:${pct(hoje)}%"></div>` : "";
  pista.innerHTML = `${marcaHoje}${linhas}`;
  document.getElementById("proj-pista-contagem").textContent =
    `${lista.length} ${lista.length === 1 ? "barra" : "barras"} · ${dataCurtaDaChave(inicioJanela)} a ${dataCurtaDaChave(fimJanela)}`;
}

function renderizarListaProjetos(lista) {
  const alvo = document.getElementById("proj-lista");
  const vazio = document.getElementById("proj-vazio");

  if (!lista.length) {
    alvo.innerHTML = "";
    vazio.hidden = false;
    document.getElementById("proj-vazio-msg").innerHTML = state.projetos.length
      ? "Nenhum projeto corresponde aos filtros selecionados."
      : "Nenhum projeto lançado ainda. Use <strong>Novo projeto</strong> para registrar o primeiro.";
    return;
  }
  vazio.hidden = true;

  alvo.innerHTML = lista
    .map((p) => {
      const cor = corDoProjeto(p);
      const progresso = Math.max(0, Math.min(100, Number(p.progresso) || 0));
      const ehContrato = p.tipo === "contrato";
      // Contrato não tem progresso a exibir: o que importa é quanto resta de
      // vigência. Uma barra parada em 0% em trinta cartões só faria ruído.
      const alerta = projetoAtrasado(p) || situacaoEfetiva(p) === "vencido";
      const ultima = (p.historico || [])[0];
      return `
        <button class="proj-card" type="button" data-projeto="${escapeAttr(p.id)}">
          <span class="proj-card__faixa" style="background:${cor}"></span>
          <span class="proj-card__corpo">
            <span class="proj-card__titulo">${escapeHtml(p.nome)}</span>
            <span class="proj-card__meta">
              ${seloSituacao(p)}
              ${p.responsavel ? `<span>${escapeHtml(p.responsavel)}</span>` : ""}
              ${p.area ? `<span>${escapeHtml(p.area)}</span>` : ""}
              ${ultima && ultima.nota ? `<span>${escapeHtml(ultima.nota.slice(0, 90))}</span>` : ""}
            </span>
            ${ehContrato ? "" : `<span class="proj-progresso-barra"><i style="width:${progresso}%;background:${cor}"></i></span>`}
          </span>
          <span class="proj-card__lado">
            <span class="proj-prazo">${dataCurtaDaChave(p.prazoEntrega)}</span>
            <span class="proj-restante ${alerta ? "proj-restante--alerta" : ""}" style="display:block">${escapeHtml(rotuloPrazo(p))}</span>
            ${ehContrato ? "" : `<span class="proj-restante" style="display:block">${progresso}% concluído</span>`}
          </span>
        </button>`;
    })
    .join("");
}

function renderizarFiltrosSituacao(lista) {
  const container = document.getElementById("situacao-lista");
  if (!container) return;
  container.innerHTML = "";
  Object.entries(SITUACOES).forEach(([chave, s]) => {
    const ativo = state.filtrosProjeto.situacoes.has(chave);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-list__item" + (ativo ? " is-active" : "");
    btn.dataset.situacao = chave;
    btn.setAttribute("aria-pressed", String(ativo));
    btn.innerHTML = `
      <span class="cat-list__dot" style="background:${s.cor};"></span>
      <span class="cat-list__label">${s.label}</span>
      <span class="cat-list__count">${lista.filter((p) => situacaoEfetiva(p) === chave).length}</span>`;
    container.appendChild(btn);
  });
}

function renderizarProjetos() {
  const lista = projetosNoHorizonte();
  renderizarResumoProjetos(lista);
  renderizarPistaProjetos(lista);
  renderizarListaProjetos(lista);
  renderizarFiltrosSituacao(lista);
}

/* --------------------------------------------------------------------------
   EXTRATO DO PLANO 100 DIAS EM A4 (PDF/JPEG)
   --------------------------------------------------------------------------
   Mesmo princípio da exportação da agenda: o documento sai do que está em
   tela, com os filtros em vigor, e passa por um único ponto de construção —
   assim o PDF e o JPEG não podem divergir entre si nem da tela.
   -------------------------------------------------------------------------- */

// Dia/mês/ano: o horizonte de 100 dias atravessa a virada do ano, e "12/01"
// sozinho não diz de qual.
function dataPlenaDaChave(chave) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${chave}T12:00:00${offsetBahia()}`));
}

// Atraso é derivado do prazo vencido e tem precedência sobre a situação
// lançada — as cores do "suspenso" servem ao alerta, mas o rótulo é o do
// atraso. A ordem do espalhamento importa: o label vem depois.
function situacaoDoProjeto(p) {
  if (projetoAtrasado(p)) return { ...SITUACOES.suspenso, label: "Atrasado" };
  return SITUACOES[situacaoEfetiva(p)] || SITUACOES[SITUACAO_PADRAO];
}

// Janela da escala: a mesma conta da pista em tela, para que a barra impressa
// caia onde a pessoa a viu.
function janelaDoPlano(lista) {
  const hoje = hojeChave();
  const { horizonte, prazoInicio, prazoFim } = state.filtrosProjeto;
  let inicio = prazoInicio || hoje;
  let fim = prazoFim || (horizonte === HORIZONTE_TODAS && lista.length ? lista[0].prazoEntrega : chaveMaisDias(hoje, horizonte));
  lista.forEach((p) => {
    if (p.dataInicio && p.dataInicio < inicio) inicio = p.dataInicio;
    if (p.prazoEntrega < inicio) inicio = p.prazoEntrega;
    if (p.prazoEntrega > fim) fim = p.prazoEntrega;
  });
  if (fim <= inicio) fim = chaveMaisDias(inicio, 1);
  return { inicio, fim, total: Math.max(diasEntreChaves(inicio, fim), 1) };
}

function escalaPlanoExport(lista) {
  const { inicio, fim, total } = janelaDoPlano(lista);
  const hoje = hojeChave();
  const pct = (chave) => (Math.min(Math.max(diasEntreChaves(inicio, chave), 0), total) / total) * 100;

  const passos = Math.min(5, total);
  const marcas = Array.from({ length: passos + 1 }, (_, i) => {
    const chave = chaveMaisDias(inicio, Math.round((total / passos) * i));
    const pos = pct(chave);
    const alinhamento = i === 0 ? "left:0;text-align:left" : i === passos ? "right:0;text-align:right" : `left:${pos}%;transform:translateX(-50%)`;
    return `<span style="position:absolute;${alinhamento};font:400 8px/1 'IBM Plex Mono',monospace;color:${EXP.texto3};white-space:nowrap">${dataCurtaDaChave(chave)}</span>`;
  }).join("");

  const barras = lista
    .map((p) => {
      const s = situacaoDoProjeto(p);
      const progresso = Math.max(0, Math.min(100, Number(p.progresso) || 0));
      const trilho = `<span style="position:absolute;left:0;right:0;top:6px;height:3px;background:${EXP.bordaSuave};border-radius:2px"></span>`;

      // Sem data de início, um marco no prazo — a mesma escolha da tela, pelo
      // mesmo motivo: não desenhar um período que ninguém informou.
      if (!p.dataInicio) {
        const x = pct(p.prazoEntrega);
        return `
          <div style="position:relative;height:15px;margin-bottom:5px">
            ${trilho}
            <span style="position:absolute;left:${x}%;top:1px;width:9px;height:13px;margin-left:-4px;background:${s.cor};border-radius:3px"></span>
          </div>`;
      }

      const esq = pct(p.dataInicio > inicio ? p.dataInicio : inicio);
      const largura = Math.max(pct(p.prazoEntrega) - esq, 1.5);
      return `
        <div style="position:relative;height:15px;margin-bottom:5px">
          ${trilho}
          <span style="position:absolute;left:${esq}%;width:${largura}%;top:0;height:15px;background:${s.cor};border-radius:4px;overflow:hidden">
            <span style="position:absolute;left:0;top:0;bottom:0;width:${progresso}%;background:rgba(255,255,255,.28)"></span>
          </span>
        </div>`;
    })
    .join("");

  const hojeNaJanela = hoje >= inicio && hoje <= fim;
  const marcaHoje = hojeNaJanela
    ? `<span style="position:absolute;left:${pct(hoje)}%;top:0;bottom:0;width:1px;background:${EXP.vermelho}"></span>`
    : "";

  return `
    <div style="break-inside:avoid;margin-bottom:22px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
        <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">LINHA DE ENTREGA</span>
        <span style="flex:1;height:1px;background:${EXP.borda}"></span>
        <span style="font:400 8.5px/1 'IBM Plex Mono',monospace;color:${EXP.texto3}">${dataCurtaDaChave(inicio)} a ${dataCurtaDaChave(fim)}${hojeNaJanela ? ` · hoje em vermelho` : ""}</span>
      </div>
      <div style="position:relative;height:14px;margin-bottom:4px">${marcas}</div>
      <div style="position:relative">${marcaHoje}${barras}</div>
    </div>`;
}

function linhaPlanoExport(p) {
  const s = situacaoDoProjeto(p);
  const progresso = Math.max(0, Math.min(100, Number(p.progresso) || 0));
  const ultimo = (p.historico || [])[0];
  const responsavel = [p.responsavel, p.area].filter(Boolean).join(" · ");

  const apoio = [];
  if (responsavel) apoio.push(escapeHtml(responsavel));
  if (p.descricao) apoio.push(escapeHtml(p.descricao));
  const nota = ultimo && ultimo.nota ? ultimo.nota : "";

  return `
    <div style="display:grid;grid-template-columns:84px 1fr 96px 74px;gap:14px;padding:10px 0;border-bottom:1px solid ${EXP.bordaSuave};break-inside:avoid;align-items:start">
      <div style="display:flex;flex-direction:column;gap:2px">
        <span style="font:600 11px/1.2 'IBM Plex Mono',monospace;color:${EXP.tinta}">${dataPlenaDaChave(p.prazoEntrega)}</span>
        <span style="font:400 8.5px/1.2 'IBM Plex Sans',sans-serif;color:${projetoAtrasado(p) ? EXP.vermelhoTexto : EXP.texto3}">${escapeHtml(rotuloPrazo(p))}</span>
      </div>
      <div style="min-width:0;display:flex;flex-direction:column;gap:3px">
        <span style="font:600 11.5px/1.35 'IBM Plex Sans',sans-serif;color:${EXP.tinta};text-wrap:pretty">${escapeHtml(p.nome)}</span>
        ${apoio.length ? `<span style="font:400 9.5px/1.45 'IBM Plex Sans',sans-serif;color:${EXP.texto2};text-wrap:pretty">${apoio.join(" — ")}</span>` : ""}
        ${nota ? `<span style="font:400 9px/1.45 'IBM Plex Sans',sans-serif;color:${EXP.texto3};text-wrap:pretty">Último lançamento: ${escapeHtml(nota)}</span>` : ""}
      </div>
      <div>
        <span style="display:inline-block;font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.04em;color:${s.cor};background:${s.bg};border:1px solid ${s.borda};border-radius:999px;padding:5px 9px">${escapeHtml(s.label.toUpperCase())}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${
          p.tipo === "contrato"
            ? `<span style="font:400 9.5px/1.4 'IBM Plex Sans',sans-serif;color:${EXP.texto3}">contrato</span>`
            : `<span style="font:600 11px/1 'IBM Plex Mono',monospace;color:${EXP.tinta}">${progresso}%</span>
               <span style="display:block;height:4px;background:${EXP.bordaSuave};border-radius:2px;overflow:hidden">
                 <span style="display:block;height:4px;width:${progresso}%;background:${s.cor}"></span>
               </span>`
        }
      </div>
    </div>`;
}

// Título do documento. Com um recorte em vigor, dizer qual é o recorte informa
// o leitor. Sem recorte, não: "todas as entregas lançadas, sem recorte de
// data" é uma frase sobre a ausência de filtro, não sobre o documento — no
// papel ela ocupa o lugar do título sem dizer o que ali está.
function tituloDoExtratoPlano(lista) {
  const { horizonte, prazoInicio, prazoFim } = state.filtrosProjeto;
  if (prazoInicio || prazoFim || horizonte !== HORIZONTE_TODAS) return subtituloDoPlano();

  const contratos = lista.filter((p) => p.tipo === "contrato").length;
  const projetos = lista.length - contratos;
  if (contratos && projetos) return "Projetos e contratos";
  if (contratos) return "Contratos";
  return "Projetos";
}

function construirExtratoPlano(lista) {
  const emAndamento = lista.filter((p) => situacaoEfetiva(p) === "em-andamento").length;
  const risco = lista.filter(exigeProvidencia).length;
  const concluidos = lista.filter((p) => situacaoEfetiva(p) === "concluido").length;

  const indicadores = [
    { rotulo: "PROJETOS", valor: lista.length },
    { rotulo: "EM ANDAMENTO", valor: emAndamento },
    {
      // Cela de ~140px: "Em risco ou vencidos" quebraria em duas linhas e
      // desalinharia este número dos demais da fileira.
      rotulo: "RISCO OU VENCIDO",
      valor: risco,
      cor: risco ? EXP.vermelho : EXP.navy,
      destaque: risco > 0,
    },
    { rotulo: "CONCLUÍDOS", valor: concluidos, cor: concluidos ? EXP.verde : EXP.navy },
  ];

  const corpo = lista.length
    ? `${escalaPlanoExport(lista)}
       <div style="display:grid;grid-template-columns:84px 1fr 96px 74px;gap:14px;padding:0 0 8px;border-bottom:1px solid ${EXP.borda}">
         <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">ENTREGA</span>
         <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">PROJETO</span>
         <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">SITUAÇÃO</span>
         <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">PROGRESSO</span>
       </div>
       ${lista.map(linhaPlanoExport).join("")}`
    : `<div style="padding:40px 0;text-align:center;font:400 12px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">Nenhum projeto encontrado para os filtros selecionados.</div>`;

  const paper = document.createElement("div");
  paper.className = "export-paper";
  paper.style.cssText =
    "width:794px;min-height:1123px;background:#fff;padding:52px 56px 44px;display:flex;flex-direction:column;" +
    "font-family:'IBM Plex Sans',system-ui,Arial,sans-serif;color:" + EXP.tinta + ";box-sizing:border-box;";

  paper.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px">
      <div style="display:flex;align-items:center;gap:14px">
        ${marcaImg("tcm-lockup.png", 46, "Tribunal de Contas dos Municípios do Estado da Bahia")}
        ${marcaImg("tcm-55.png", 46, "55 anos de serviços prestados à sociedade")}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;padding-top:2px;text-align:right">
        <span style="font:700 13px/1 'IBM Plex Sans',sans-serif;letter-spacing:.02em;color:${EXP.navy}">PLANO 100 DIAS</span>
        <span style="font:400 11.5px/1 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">Gabinete da Presidência</span>
        <span style="font:400 11px/1 'IBM Plex Mono',monospace;color:${EXP.texto3}">SAA · Sistema de Agenda Automatizada</span>
      </div>
    </div>

    <div style="display:flex;margin:16px 0 26px">
      <span style="width:64px;height:3px;background:${EXP.vermelho}"></span>
      <span style="flex:1;height:3px;background:${EXP.navy}"></span>
    </div>

    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:22px">
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <span style="font:600 10px/1 'IBM Plex Sans',sans-serif;letter-spacing:.13em;color:${EXP.texto2}">PROJETOS EM DESENVOLVIMENTO</span>
        <h1 style="margin:0;font:700 27px/1.15 Bitter,Georgia,serif;color:${EXP.navy};letter-spacing:-.015em;text-wrap:pretty">${escapeHtml(tituloDoExtratoPlano(lista))}</h1>
      </div>
      <div style="flex:0 0 auto;text-align:right;font:400 10.5px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">
        Emitido em <span style="font-family:'IBM Plex Mono',monospace;color:${EXP.tinta}">${formatarDataHora(new Date())}</span><br>
        Fuso horário America/Bahia
      </div>
    </div>

    ${indicadoresExtrato(indicadores)}

    <div style="display:flex;flex-direction:column;flex:1">${corpo}</div>

    <div style="margin-top:auto;padding-top:16px;border-top:1px solid ${EXP.borda};display:flex;align-items:flex-end;justify-content:space-between;gap:20px">
      <div style="font:400 10px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto3};max-width:460px;text-wrap:pretty">
        Documento gerado pelo SAA a partir dos projetos lançados no módulo Plano 100 dias, com os filtros em vigor no momento da emissão.
      </div>
      <div style="font:400 10px/1.6 'IBM Plex Mono',monospace;color:${EXP.texto3};text-align:right;flex:0 0 auto">
        TCM-BA · SAA<br>${lista.length} projeto${lista.length === 1 ? "" : "s"}
      </div>
    </div>
  `;
  return paper;
}

async function exportarPlano(tipo) {
  await precarregarMarcas();
  const lista = projetosNoHorizonte();
  const paper = construirExtratoPlano(lista);
  const canvas = await renderizarCanvasElemento(paper, 2.5);

  const carimbo = new Date().toISOString().slice(0, 10);
  const nomeBase = `plano-100-dias-tcm-ba-${carimbo}`;

  if (tipo === "jpeg") {
    const link = document.createElement("a");
    link.download = `${nomeBase}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    return;
  }

  // Mesma paginação do extrato da agenda: a folha é desenhada inteira e
  // reposicionada página a página quando passa de uma.
  const { jsPDF } = window.jspdf;
  const img = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const larguraMm = 210;
  const alturaPaginaMm = 297;
  const alturaTotalMm = (canvas.height * larguraMm) / canvas.width;
  let deslocamento = 0;
  let primeira = true;
  while (deslocamento < alturaTotalMm - 1) {
    if (!primeira) pdf.addPage();
    pdf.addImage(img, "JPEG", 0, -deslocamento, larguraMm, alturaTotalMm);
    deslocamento += alturaPaginaMm;
    primeira = false;
  }
  pdf.save(`${nomeBase}.pdf`);
}

let elementoComFocoAntesDoExportPlano = null;

function abrirDialogoExportPlano() {
  const lista = projetosNoHorizonte();
  document.getElementById("plano-export-mensagem").textContent =
    lista.length === 0
      ? "Nenhum projeto nos filtros em vigor. O documento sairá com a folha institucional e o aviso de lista vazia."
      : `${lista.length} ${lista.length === 1 ? "projeto será incluído" : "projetos serão incluídos"}, conforme os filtros em vigor · ${subtituloDoPlano().toLowerCase()}.`;

  elementoComFocoAntesDoExportPlano = document.activeElement;
  document.getElementById("plano-export-backdrop").hidden = false;
  document.getElementById("plano-export-modal").hidden = false;
  document.getElementById("btn-plano-pdf").focus();
}

function fecharDialogoExportPlano() {
  document.getElementById("plano-export-backdrop").hidden = true;
  document.getElementById("plano-export-modal").hidden = true;
  if (elementoComFocoAntesDoExportPlano) elementoComFocoAntesDoExportPlano.focus();
}

async function baixarPlano(tipo, btn) {
  const textoOriginal = btn.textContent;
  btn.disabled = true;
  btn.textContent = tipo === "pdf" ? "Gerando PDF…" : "Gerando JPEG…";
  try {
    await exportarPlano(tipo);
    fecharDialogoExportPlano();
  } catch (erro) {
    console.error("Erro ao exportar o plano:", erro);
    window.alert("Não foi possível gerar o arquivo: " + erro.message);
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}

/* --------------------------------------------------------------------------
   Filtro de prazo (calendário da barra lateral)
   -------------------------------------------------------------------------- */

// Intervalo e chips de horizonte descrevem a mesma janela por dois caminhos;
// deixar os dois ativos ao mesmo tempo produziria listas que não correspondem
// a nenhum dos controles. Quem foi mexido por último manda.
function sincronizarChipsHorizonte() {
  const porIntervalo = filtroDePrazoAtivo();
  document.querySelectorAll("#horizonte-group .chip").forEach((chip) => {
    const ativo = !porIntervalo && Number(chip.dataset.horizonte) === state.filtrosProjeto.horizonte;
    chip.classList.toggle("is-active", ativo);
  });
}

function atualizarVisibilidadeBtnLimparPrazo() {
  const btn = document.getElementById("btn-limpar-prazo");
  if (btn) btn.hidden = !filtroDePrazoAtivo();
}

function mostrarErroPrazo(mensagem) {
  const el = document.getElementById("proj-erro-data");
  if (!el) return;
  el.textContent = mensagem;
  el.hidden = !mensagem;
}

function aplicarFiltroDePrazo() {
  const campoDe = document.getElementById("proj-filtro-de");
  const campoAte = document.getElementById("proj-filtro-ate");
  const de = campoDe.value || null;
  const ate = campoAte.value || null;

  if (de && ate && de > ate) {
    mostrarErroPrazo("A data inicial não pode ser posterior à final.");
    return;
  }
  mostrarErroPrazo("");

  state.filtrosProjeto.prazoInicio = de;
  state.filtrosProjeto.prazoFim = ate;
  sincronizarChipsHorizonte();
  atualizarVisibilidadeBtnLimparPrazo();
  renderizarProjetos();
}

function limparFiltroDePrazo() {
  state.filtrosProjeto.prazoInicio = null;
  state.filtrosProjeto.prazoFim = null;
  document.getElementById("proj-filtro-de").value = "";
  document.getElementById("proj-filtro-ate").value = "";
  mostrarErroPrazo("");
  sincronizarChipsHorizonte();
  atualizarVisibilidadeBtnLimparPrazo();
  renderizarProjetos();
}

/* --------------------------------------------------------------------------
   Painel do projeto: histórico e lançamento de status
   -------------------------------------------------------------------------- */

function projetoPorId(id) {
  return state.projetos.find((p) => p.id === id) || null;
}

function formatarCarimbo(iso) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function abrirPainelProjeto(id) {
  const p = projetoPorId(id);
  if (!p) return;
  state.projetoAberto = id;

  document.getElementById("proj-painel-titulo").textContent = p.nome;

  const linha = (rotulo, valor) =>
    valor
      ? `<div class="detail-panel__linha"><span class="detail-panel__linha-rotulo">${rotulo}</span><span class="detail-panel__linha-valor">${escapeHtml(valor)}</span></div>`
      : "";

  const dataLegivel = (chave) =>
    chave ? formatarDataLonga(new Date(`${chave}T12:00:00${offsetBahia()}`)) : "";

  const historico = (p.historico || []).length
    ? `<div class="historico">${(p.historico || [])
        .map((h) => {
          const s = SITUACOES[h.situacao] || SITUACOES[SITUACAO_PADRAO];
          return `
            <div class="historico__item">
              <span class="historico__ponto" style="background:${s.cor}"></span>
              <div class="historico__quando">${formatarCarimbo(h.em)}</div>
              <div class="historico__linha">
                <span class="situacao-selo" style="color:${s.cor};background:${s.bg};border:1px solid ${s.borda}">${s.label}</span>
                <span class="historico__quando">${Number(h.progresso) || 0}% concluído</span>
              </div>
              ${h.nota ? `<div class="historico__nota">${escapeHtml(h.nota)}</div>` : ""}
            </div>`;
        })
        .join("")}</div>`
    : `<p class="historico__nota" style="color:var(--color-text-secondary)">Nenhum lançamento ainda. Use o formulário abaixo para registrar o primeiro status.</p>`;

  document.getElementById("proj-painel-corpo").innerHTML = `
    ${p.descricao ? `<p class="detail-panel__descricao">${escapeHtml(p.descricao)}</p>` : ""}
    ${linha("Situação", projetoAtrasado(p) ? "Atrasado" : (SITUACOES[situacaoEfetiva(p)] || SITUACOES[SITUACAO_PADRAO]).label)}
    ${linha("Progresso", `${Math.max(0, Math.min(100, Number(p.progresso) || 0))}%`)}
    ${linha("Lançamento", dataLegivel(p.dataInicio))}
    ${linha("Prazo de entrega", `${dataLegivel(p.prazoEntrega)} — ${rotuloPrazo(p)}`)}
    ${linha("Responsável", p.responsavel)}
    ${linha("Área", p.area)}
    <div class="detail-panel__linha"><span class="detail-panel__linha-rotulo">Histórico</span></div>
    ${historico}`;

  // O formulário abre já com a situação corrente, para que lançar só a nota
  // não mude a situação sem querer.
  const selectStatus = document.getElementById("status-situacao");
  selectStatus.value = situacaoEfetiva(p);
  aplicarTravaDeContrato(p, selectStatus, document.getElementById("status-situacao-nota"));
  renderizarAcoesDoProjeto(p);
  const faixa = document.getElementById("status-progresso");
  faixa.value = Math.max(0, Math.min(100, Number(p.progresso) || 0));
  document.getElementById("status-progresso-valor").textContent = `${faixa.value}%`;
  document.getElementById("status-nota").value = "";

  document.getElementById("proj-painel").classList.add("is-aberto");
  document.getElementById("proj-painel").setAttribute("aria-hidden", "false");
  document.getElementById("proj-painel-backdrop").hidden = false;
  document.getElementById("btn-fechar-proj-painel").focus();
}

function fecharPainelProjeto() {
  state.projetoAberto = null;
  document.getElementById("proj-painel").classList.remove("is-aberto");
  document.getElementById("proj-painel").setAttribute("aria-hidden", "true");
  document.getElementById("proj-painel-backdrop").hidden = true;
}

// Um lançamento nunca substitui o anterior: ele entra no topo da pilha e passa
// a ser a situação corrente. O histórico é a razão de ser do módulo, então
// nada nele é editado ou apagado pela tela.
function lancarStatus() {
  const p = projetoPorId(state.projetoAberto);
  if (!p) return;

  // Num contrato a situação vem da vigência; gravar a escolha do campo criaria
  // um histórico contando uma versão que a tela não mostra.
  const automatico = p.tipo === "contrato" && !p.situacaoManual;
  const situacao = automatico ? situacaoEfetiva(p) : document.getElementById("status-situacao").value;
  const progresso = Number(document.getElementById("status-progresso").value) || 0;
  const nota = document.getElementById("status-nota").value.trim();

  p.historico = [{ em: new Date().toISOString(), situacao, progresso, nota }, ...(p.historico || [])];
  p.situacao = situacao;
  p.progresso = progresso;
  p.atualizadoEm = new Date().toISOString();

  if (!gravarProjetos(state.projetos)) return;
  renderizarProjetos();
  abrirPainelProjeto(p.id);
}

/* --------------------------------------------------------------------------
   Ações rápidas do painel: concluir e alterar categoria
   --------------------------------------------------------------------------
   Trocar a categoria pelo formulário de lançamento exige três passos e uma
   nota. Estas ações resolvem em um clique o que se faz o tempo todo — marcar
   uma entrega como concluída e corrigir a categoria — e ainda assim gravam
   histórico, porque mudança de situação sem registro é mudança que ninguém
   consegue explicar depois.
   -------------------------------------------------------------------------- */

function renderizarAcoesDoProjeto(p) {
  const chips = document.getElementById("proj-categoria-chips");
  const nota = document.getElementById("proj-categoria-nota");
  const btnConcluir = document.getElementById("btn-concluir-projeto");
  const btnReabrir = document.getElementById("btn-reabrir-projeto");
  const btnAuto = document.getElementById("btn-auto-projeto");
  if (!chips) return;

  const atual = situacaoEfetiva(p);
  const concluido = atual === "concluido";
  const contratoAutomatico = p.tipo === "contrato" && !p.situacaoManual;

  chips.innerHTML = Object.entries(SITUACOES)
    .map(([chave, s]) => {
      const ativo = chave === atual;
      const estilo = ativo
        ? `background:${s.cor};border-color:${s.cor};color:#fff`
        : `color:${s.cor};background:${s.bg};border-color:${s.borda}`;
      return `<button class="chip${ativo ? " is-active" : ""}" type="button" data-situacao="${chave}" style="${estilo}" aria-pressed="${ativo}">${escapeHtml(s.label)}</button>`;
    })
    .join("");

  btnConcluir.hidden = concluido;
  btnConcluir.disabled = concluido;
  btnReabrir.hidden = !concluido;
  btnAuto.hidden = !(p.tipo === "contrato" && p.situacaoManual);

  nota.hidden = !contratoAutomatico;
  nota.textContent = contratoAutomatico
    ? "Este contrato está no automático: a categoria acompanha a vigência. Escolher uma acima passa a valer sobre a regra."
    : "";
}

// Grava a nova situação e registra no histórico o que mudou e por quê.
function definirSituacaoDoProjeto(situacao, { progresso, motivo } = {}) {
  const p = projetoPorId(state.projetoAberto);
  if (!p || !SITUACOES[situacao]) return;

  const anterior = situacaoEfetiva(p);
  const novoProgresso =
    progresso === undefined ? Math.max(0, Math.min(100, Number(p.progresso) || 0)) : progresso;
  if (anterior === situacao && novoProgresso === Number(p.progresso)) return;

  // Definir a categoria à mão num contrato desliga a derivação; sem isto a
  // escolha seria gravada e a tela continuaria mostrando a regra.
  if (p.tipo === "contrato") p.situacaoManual = true;

  p.situacao = situacao;
  p.progresso = novoProgresso;
  p.atualizadoEm = new Date().toISOString();
  p.historico = [
    {
      em: p.atualizadoEm,
      situacao,
      progresso: novoProgresso,
      nota: motivo || `Categoria alterada de "${(SITUACOES[anterior] || {}).label || anterior}" para "${SITUACOES[situacao].label}".`,
    },
    ...(p.historico || []),
  ];

  if (!gravarProjetos(state.projetos)) return;
  renderizarProjetos();
  abrirPainelProjeto(p.id);
}

function concluirProjetoAberto() {
  const p = projetoPorId(state.projetoAberto);
  if (!p) return;
  // Concluir leva o progresso a 100%: uma entrega concluída com barra pela
  // metade é uma contradição que ninguém vai voltar para arrumar.
  definirSituacaoDoProjeto("concluido", {
    progresso: 100,
    motivo: p.tipo === "contrato" ? "Contrato encerrado." : "Entrega concluída.",
  });
}

function reabrirProjetoAberto() {
  const p = projetoPorId(state.projetoAberto);
  if (!p) return;
  definirSituacaoDoProjeto("em-andamento", {
    progresso: Math.min(95, Math.max(0, Number(p.progresso) || 0)),
    motivo: "Reaberto para acompanhamento.",
  });
}

// Devolve o contrato à regra da vigência.
function voltarAoAutomatico() {
  const p = projetoPorId(state.projetoAberto);
  if (!p || p.tipo !== "contrato") return;
  delete p.situacaoManual;
  p.atualizadoEm = new Date().toISOString();
  const derivada = situacaoEfetiva(p);
  p.situacao = derivada;
  p.historico = [
    {
      em: p.atualizadoEm,
      situacao: derivada,
      progresso: Math.max(0, Math.min(100, Number(p.progresso) || 0)),
      nota: "Categoria devolvida ao automático: volta a acompanhar a vigência.",
    },
    ...(p.historico || []),
  ];
  if (!gravarProjetos(state.projetos)) return;
  renderizarProjetos();
  abrirPainelProjeto(p.id);
}

/* --------------------------------------------------------------------------
   Cadastro e edição
   -------------------------------------------------------------------------- */

// Trava o campo de situação quando o registro é um contrato, dizendo por quê.
// Deixar o campo editável e ignorar o que for escolhido seria pior do que
// desabilitá-lo: a pessoa lançaria uma situação e nada mudaria na tela.
function aplicarTravaDeContrato(p, select, nota) {
  const automatico = Boolean(p && p.tipo === "contrato" && !p.situacaoManual);
  if (select) select.disabled = automatico;
  if (!nota) return;
  nota.hidden = !automatico;
  nota.textContent = automatico
    ? `Situação de contrato vem da vigência: vencido quando a data passa, em risco a ${RISCO_CONTRATO_DIAS} dias ou menos do fim, em andamento antes disso. Use "Alterar categoria" para definir à mão.`
    : "";
}

function preencherSelectSituacoes(select, valor) {
  select.innerHTML = Object.entries(SITUACOES)
    .map(([chave, s]) => `<option value="${chave}">${s.label}</option>`)
    .join("");
  select.value = valor || SITUACAO_PADRAO;
}

function mostrarErroProjeto(mensagem) {
  const alvo = document.getElementById("proj-form-erro");
  if (!alvo) return;
  alvo.textContent = mensagem;
  alvo.hidden = false;
}

function esconderErroProjeto() {
  const alvo = document.getElementById("proj-form-erro");
  if (alvo) alvo.hidden = true;
}

function abrirFormProjeto(id) {
  const p = id ? projetoPorId(id) : null;
  state.projetoEditando = p ? p.id : null;

  document.getElementById("proj-form-titulo").textContent = p ? "Editar projeto" : "Novo projeto";
  document.getElementById("proj-nome").value = p ? p.nome : "";
  document.getElementById("proj-descricao").value = p ? p.descricao || "" : "";
  document.getElementById("proj-responsavel").value = p ? p.responsavel || "" : "";
  document.getElementById("proj-area").value = p ? p.area || "" : "";
  document.getElementById("proj-inicio").value = p ? p.dataInicio || hojeChave() : hojeChave();
  // Sem prazo digitado, o padrão é o fim do horizonte: é o que "próximos 100
  // dias" quer dizer, e evita abrir o seletor de datas no vazio.
  document.getElementById("proj-prazo").value = p ? p.prazoEntrega : chaveMaisDias(hojeChave(), HORIZONTE_PADRAO);

  const selectForm = document.getElementById("proj-situacao");
  preencherSelectSituacoes(selectForm, p ? situacaoEfetiva(p) : SITUACAO_PADRAO);
  aplicarTravaDeContrato(p, selectForm, document.getElementById("proj-situacao-nota"));
  const faixa = document.getElementById("proj-progresso");
  faixa.value = p ? Math.max(0, Math.min(100, Number(p.progresso) || 0)) : 0;
  document.getElementById("proj-progresso-valor").textContent = `${faixa.value}%`;
  document.getElementById("proj-nota").value = "";

  document.getElementById("btn-excluir-projeto").hidden = !p;
  esconderErroProjeto();

  document.getElementById("proj-form").hidden = false;
  document.getElementById("proj-form-backdrop").hidden = false;
  document.getElementById("proj-nome").focus();
}

function fecharFormProjeto() {
  state.projetoEditando = null;
  document.getElementById("proj-form").hidden = true;
  document.getElementById("proj-form-backdrop").hidden = true;
}

function salvarProjeto() {
  const nome = document.getElementById("proj-nome").value.trim();
  const inicio = document.getElementById("proj-inicio").value;
  const prazo = document.getElementById("proj-prazo").value;

  if (!nome) return mostrarErroProjeto("Informe o nome do projeto.");
  if (!prazo) return mostrarErroProjeto("Informe o prazo de entrega.");
  if (inicio && prazo < inicio) {
    return mostrarErroProjeto("O prazo de entrega não pode ser anterior ao lançamento.");
  }
  esconderErroProjeto();

  const situacao = document.getElementById("proj-situacao").value;
  const progresso = Number(document.getElementById("proj-progresso").value) || 0;
  const nota = document.getElementById("proj-nota").value.trim();
  const agora = new Date().toISOString();

  const campos = {
    nome,
    descricao: document.getElementById("proj-descricao").value.trim(),
    responsavel: document.getElementById("proj-responsavel").value.trim(),
    area: document.getElementById("proj-area").value.trim(),
    dataInicio: inicio,
    prazoEntrega: prazo,
    situacao,
    progresso,
    atualizadoEm: agora,
  };

  const existente = projetoPorId(state.projetoEditando);
  if (existente) {
    // Editar dados cadastrais não inventa lançamento no histórico. Só entra
    // registro quando a situação, o progresso ou uma nota mudam de fato.
    const mudouSituacao = existente.situacao !== situacao || Number(existente.progresso) !== progresso;
    Object.assign(existente, campos);
    if (mudouSituacao || nota) {
      existente.historico = [{ em: agora, situacao, progresso, nota }, ...(existente.historico || [])];
    }
  } else {
    state.projetos.push({
      id: `prj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ...campos,
      criadoEm: agora,
      historico: [{ em: agora, situacao, progresso, nota: nota || "Projeto lançado." }],
    });
  }

  if (!gravarProjetos(state.projetos)) return;
  fecharFormProjeto();
  renderizarProjetos();
}

function excluirProjeto() {
  const p = projetoPorId(state.projetoEditando);
  if (!p) return;
  if (!window.confirm(`Excluir "${p.nome}" e todo o seu histórico? Esta ação não pode ser desfeita.`)) return;
  state.projetos = state.projetos.filter((x) => x.id !== p.id);
  if (!gravarProjetos(state.projetos)) return;
  fecharFormProjeto();
  fecharPainelProjeto();
  renderizarProjetos();
}

/* --------------------------------------------------------------------------
   Cópia de segurança — enquanto os dados vivem só neste navegador, é o que
   permite levá-los a outro dispositivo ou recuperá-los depois de uma limpeza
   de cache.
   -------------------------------------------------------------------------- */

function exportarProjetos() {
  const conteudo = JSON.stringify(state.projetos, null, 2);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([conteudo], { type: "application/json" }));
  link.download = `saa-projetos-${hojeChave()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importarProjetos(arquivo) {
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const dados = JSON.parse(String(leitor.result));
      const validos = Array.isArray(dados) ? dados.filter(projetoValido) : [];
      if (!validos.length) {
        window.alert("O arquivo não contém projetos em formato reconhecido.");
        return;
      }
      // Mescla por id: restaurar uma cópia não apaga o que já existe aqui.
      const porId = new Map(state.projetos.map((p) => [p.id, p]));
      validos.forEach((p) => porId.set(p.id, p));
      state.projetos = [...porId.values()];
      if (!gravarProjetos(state.projetos)) return;
      renderizarProjetos();
      window.alert(`${validos.length} projeto(s) restaurado(s).`);
    } catch (e) {
      window.alert("Não foi possível ler o arquivo: " + e.message);
    }
  };
  leitor.readAsText(arquivo);
}

/* --------------------------------------------------------------------------
   Ramal DTI
   --------------------------------------------------------------------------
   Lista de consulta: vem com o sistema, igual para todo mundo, sem nada a
   gravar. O que a tela precisa fazer bem é achar um ramal depressa — daí a
   busca ligada ao campo do topo — e não deixar a regra de entrada escondida
   atrás da lista, que é o erro que uma lista de telefones costuma cometer.
   -------------------------------------------------------------------------- */

function dadosDeRamais() {
  const d = window.SAA_RAMAIS;
  return d && Array.isArray(d.grupos) ? d : null;
}

// Número discável completo. O ramal de quatro dígitos é o que se usa por
// dentro; de fora, ou do celular, só serve com DDD e prefixo.
function telefoneCompleto(ramal) {
  const d = dadosDeRamais();
  if (!d) return "";
  return `+55${d.ddd}3115${ramal}`;
}

function numeroLegivel(ramal) {
  const d = dadosDeRamais();
  return d ? `${d.prefixo}${ramal}` : ramal;
}

function ramaisDoItem(item) {
  return Array.isArray(item.ramais) ? item.ramais : [item.ramal];
}

function totalDeRamais(grupos) {
  return grupos.reduce((a, g) => a + g.itens.reduce((b, i) => b + ramaisDoItem(i).length, 0), 0);
}

// Filtra por nome, por ramal e pelo nome da equipe — procurar "infra" deve
// trazer o grupo inteiro, e procurar "5667" deve trazer a pessoa.
function gruposFiltrados() {
  const d = dadosDeRamais();
  if (!d) return [];
  const busca = normalizarTexto(state.filtroRamais || "").trim();
  if (!busca) return d.grupos;

  return d.grupos
    .map((g) => {
      const grupoBate = normalizarTexto(g.nome).includes(busca);
      const itens = grupoBate
        ? g.itens
        : g.itens.filter((i) =>
            normalizarTexto(i.nome).includes(busca) || ramaisDoItem(i).some((r) => r.includes(busca))
          );
      return { ...g, itens };
    })
    .filter((g) => g.itens.length);
}

function cartaoDeRamal(item) {
  const ramais = ramaisDoItem(item);
  const botoes = ramais
    .map(
      (r) => `
        <a class="ramal-numero" href="tel:${escapeAttr(telefoneCompleto(r))}"
           title="${escapeAttr(`Ligar para ${numeroLegivel(r)}`)}">
          <span class="ramal-numero__digitos">${escapeHtml(r)}</span>
        </a>`
    )
    .join("");
  return `
    <li class="ramal-item${item.geral ? " ramal-item--geral" : ""}">
      <span class="ramal-nome">${escapeHtml(item.nome)}</span>
      <span class="ramal-numeros">${botoes}</span>
    </li>`;
}

function renderizarRamais() {
  const d = dadosDeRamais();
  const alvo = document.getElementById("ramais-grupos");
  if (!alvo) return;

  if (!d) {
    alvo.innerHTML = `<p class="ramais-indisponivel">A lista de ramais não pôde ser carregada.</p>`;
    return;
  }

  // Porta de entrada
  document.getElementById("porta-rotulo").textContent = d.portaDeEntrada.rotulo;
  document.getElementById("porta-titulo").textContent = d.portaDeEntrada.titulo;
  document.getElementById("porta-nota").textContent = d.portaDeEntrada.nota;
  const numero = document.getElementById("porta-numero");
  numero.textContent = numeroLegivel(d.portaDeEntrada.ramal);
  numero.href = `tel:${telefoneCompleto(d.portaDeEntrada.ramal)}`;

  // Atalhos
  document.getElementById("ramais-atalhos").innerHTML = d.atalhos
    .map(
      (a) => `
      <a class="ramal-atalho" href="tel:${escapeAttr(telefoneCompleto(a.ramal))}">
        <span class="ramal-atalho__rotulo">${escapeHtml(a.rotulo)}</span>
        <span class="ramal-atalho__ramal">${escapeHtml(a.ramal)}</span>
      </a>`
    )
    .join("");

  const grupos = gruposFiltrados();
  const visiveis = totalDeRamais(grupos);
  const total = totalDeRamais(d.grupos);

  document.getElementById("ramais-resumo").textContent =
    `${visiveis} ${visiveis === 1 ? "ramal" : "ramais"}`;
  document.getElementById("ramais-subtitulo").textContent =
    `${total} ramais em ${d.grupos.length} equipes · todos com o prefixo ${d.prefixo}`;

  // O aviso aparece sempre que há busca em vigor, não só quando ela falha:
  // quem filtrou e achou também precisa de um caminho de volta à lista
  // inteira que não seja apagar o campo à mão.
  const aviso = document.getElementById("ramais-vazio");
  const termo = (state.filtroRamais || "").trim();
  aviso.hidden = !termo;
  if (termo) {
    document.getElementById("ramais-vazio-texto").textContent = visiveis
      ? `${visiveis} de ${total} ramais, filtrados por "${termo}".`
      : `Nenhum ramal corresponde a "${termo}".`;
  }

  alvo.innerHTML = grupos
    .map(
      (g) => `
      <section class="ramal-grupo">
        <div class="ramal-grupo__cabecalho">
          <h3 class="ramal-grupo__titulo">${escapeHtml(g.nome)}</h3>
          <span class="ramal-grupo__contagem">${totalDeRamais([g])}</span>
        </div>
        <ul class="ramal-lista">${g.itens.map(cartaoDeRamal).join("")}</ul>
      </section>`
    )
    .join("");
}

function renderizarPortalRamais() {
  const d = dadosDeRamais();
  const definir = (id, texto) => {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  };
  if (!d) {
    definir("portal-ramais-porta", "—");
    definir("portal-ramais-grupos", "—");
    definir("portal-ramais-total", "—");
    definir("portal-ramais-destaque", "A lista de ramais não pôde ser carregada.");
    definir("portal-ramais-selo", "Indisponível");
    return;
  }
  definir("portal-ramais-porta", d.portaDeEntrada.ramal);
  definir("portal-ramais-grupos", String(d.grupos.length));
  definir("portal-ramais-total", String(totalDeRamais(d.grupos)));

  const destaque = document.getElementById("portal-ramais-destaque");
  if (destaque) {
    destaque.textContent = `Rotina entra pelo ${numeroLegivel(d.portaDeEntrada.ramal)} — ${d.portaDeEntrada.titulo}.`;
    destaque.classList.add("portal-card__destaque--forte");
  }
  definir("portal-ramais-selo", d.atalhos.map((a) => `${a.rotulo} ${a.ramal}`).join(" · "));
}

function inicializarModuloRamais() {
  const limpar = document.getElementById("btn-limpar-busca-ramais");
  if (limpar) {
    limpar.addEventListener("click", () => {
      state.filtroRamais = "";
      const busca = document.getElementById("busca");
      if (busca) busca.value = "";
      renderizarRamais();
    });
  }
}

/* --------------------------------------------------------------------------
   Portal
   --------------------------------------------------------------------------
   Tela de entrada do sistema. Não é uma capa decorativa: cada cartão mostra o
   estado real do seu módulo, lido das mesmas fontes que as telas internas
   usam — os eventos já carregados e os projetos gravados. Assim a página
   inicial responde "o que exige atenção agora?" antes de qualquer clique, em
   vez de obrigar a entrar em cada módulo para descobrir.
   -------------------------------------------------------------------------- */

// Compromissos de um dia específico, ignorando os filtros da tela — o portal
// resume a base inteira, não o recorte que estiver em vigor na agenda.
function eventosDoDia(chave) {
  return state.eventos.filter((e) => chaveDia(new Date(e.inicio)) === chave);
}

function eventosNaJanela(chaveInicio, dias) {
  const fim = chaveMaisDias(chaveInicio, dias);
  return state.eventos.filter((e) => {
    const c = chaveDia(new Date(e.inicio));
    return c >= chaveInicio && c <= fim;
  });
}

function plural(n, singular, pluralPalavra) {
  return `${n} ${n === 1 ? singular : pluralPalavra}`;
}

function renderizarPortalAgenda() {
  const hoje = hojeChave();
  const doDia = eventosDoDia(hoje);
  const semana = eventosNaJanela(hoje, 7);

  const definir = (id, texto) => {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  };

  definir("portal-agenda-hoje", String(doDia.length));
  definir("portal-agenda-semana", String(semana.length));
  definir("portal-agenda-total", String(state.eventos.length));

  // O destaque aponta o próximo compromisso ainda por acontecer. Quando o dia
  // já venceu, olha adiante em vez de dizer apenas "nada hoje" — a pergunta
  // real de quem abre o sistema é qual é o próximo passo.
  const agora = Date.now();
  const proximo = state.eventos
    .filter((e) => new Date(e.fim).getTime() > agora)
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))[0];

  const destaque = document.getElementById("portal-agenda-destaque");
  if (destaque) {
    if (!state.eventos.length) {
      destaque.textContent = "Nenhum compromisso sincronizado até o momento.";
      destaque.classList.remove("portal-card__destaque--forte");
    } else if (proximo) {
      const mesmoDia = chaveDia(new Date(proximo.inicio)) === hoje;
      const quando = mesmoDia
        ? `hoje, ${formatarHora(new Date(proximo.inicio))}`
        : `${formatarDataLonga(new Date(proximo.inicio))}, ${formatarHora(new Date(proximo.inicio))}`;
      destaque.textContent = `Próximo: ${proximo.titulo} — ${quando}.`;
      destaque.classList.add("portal-card__destaque--forte");
    } else {
      destaque.textContent = "Sem compromissos futuros na base sincronizada.";
      destaque.classList.remove("portal-card__destaque--forte");
    }
  }

  const selo = document.getElementById("portal-agenda-selo");
  if (selo) {
    if (state.ultimaAtualizacao) {
      selo.textContent = `Sincronizado ${formatarHora(state.ultimaAtualizacao)}`;
      selo.classList.toggle("portal-card__selo--aviso", Boolean(state.usandoCache));
    } else {
      selo.textContent = "Sincronizando…";
      selo.classList.remove("portal-card__selo--aviso");
    }
  }
}

function renderizarPortalProjetos() {
  // Conta a base inteira: sem recorte de data e sem os filtros de situação e
  // busca do módulo. O portal responde "quanto existe cadastrado", e um número
  // que variasse conforme o recorte deixado na outra tela não responderia isso.
  const lista = [...state.projetos].sort((a, b) => a.prazoEntrega.localeCompare(b.prazoEntrega));

  const andamento = lista.filter((p) => situacaoEfetiva(p) === "em-andamento").length;
  const risco = lista.filter(exigeProvidencia).length;

  const definir = (id, texto) => {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  };

  definir("portal-proj-total", String(lista.length));
  definir("portal-proj-andamento", String(andamento));
  definir("portal-proj-risco", String(risco));

  const celRisco = document.getElementById("portal-proj-cel-risco");
  if (celRisco) celRisco.classList.toggle("portal-metrica--acesa", risco > 0);

  const destaque = document.getElementById("portal-proj-destaque");
  if (destaque) {
    const pendentes = lista.filter((p) => situacaoEfetiva(p) !== "concluido");
    if (!state.projetos.length) {
      destaque.textContent = "Nenhum projeto lançado. Comece cadastrando as entregas dos próximos 100 dias.";
      destaque.classList.remove("portal-card__destaque--forte");
    } else if (!pendentes.length) {
      destaque.textContent = "Todas as entregas do horizonte estão concluídas.";
      destaque.classList.remove("portal-card__destaque--forte");
    } else {
      const p = pendentes[0];
      destaque.textContent = `Próxima entrega: ${p.nome} — ${rotuloPrazo(p)}.`;
      destaque.classList.add("portal-card__destaque--forte");
    }
  }

  const selo = document.getElementById("portal-proj-selo");
  if (selo) {
    const concluidos = lista.filter((p) => situacaoEfetiva(p) === "concluido").length;
    selo.textContent = lista.length
      ? `${concluidos} de ${plural(lista.length, "entrega concluída", "entregas concluídas")}`
      : "Nenhum registro cadastrado";
    selo.classList.remove("portal-card__selo--aviso");
  }
}

function renderizarPortal() {
  const data = document.getElementById("portal-data");
  if (data) {
    const hoje = formatarDataLonga(new Date());
    data.textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1);
  }
  renderizarPortalAgenda();
  renderizarPortalProjetos();
  renderizarPortalRamais();
  atualizarBadgeProjetos();
}

function inicializarPortal() {
  // Delegação no documento: os gatilhos do portal são cartões e também o
  // "Início" da trilha de navegação, que vivem em partes diferentes da página.
  document.addEventListener("click", (ev) => {
    const gatilho = ev.target.closest("[data-ir]");
    if (!gatilho) return;
    ev.preventDefault();
    trocarModulo(gatilho.dataset.ir);
  });

  // Os cartões são <article> com role="button": o teclado precisa do mesmo
  // comportamento que o mouse tem.
  document.querySelectorAll(".portal-card[data-ir]").forEach((card) => {
    card.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      trocarModulo(card.dataset.ir);
    });
  });
}

/* --------------------------------------------------------------------------
   Troca de módulo
   -------------------------------------------------------------------------- */

const MODULOS = ["portal", "agenda", "projetos", "ramais"];

const ROTULO_MODULO = {
  portal: "Portal",
  agenda: "Agenda",
  projetos: "Plano 100 dias",
  ramais: "Ramal DTI",
};

// A linha de apoio da topbar acompanha o módulo: "compromissos sincronizados
// do Google Agenda" descreve a agenda, não o plano de entregas.
const SUBTITULO_MODULO = {
  portal: "TCM-BA — Agenda institucional e Plano 100 dias",
  agenda: "TCM-BA — compromissos sincronizados do Google Agenda",
  projetos: "TCM-BA — projetos e entregas dos próximos 100 dias",
  ramais: "TCM-BA — ramais da Diretoria de Tecnologia da Informação",
};

function trocarModulo(modulo) {
  state.modulo = MODULOS.includes(modulo) ? modulo : "portal";
  const atual = state.modulo;

  document.getElementById("modulo-portal").hidden = atual !== "portal";
  document.getElementById("modulo-agenda").hidden = atual !== "agenda";
  document.getElementById("modulo-projetos").hidden = atual !== "projetos";
  document.getElementById("modulo-ramais").hidden = atual !== "ramais";
  document.getElementById("filtros-agenda").hidden = atual !== "agenda";
  document.getElementById("filtros-projetos").hidden = atual !== "projetos";

  // Busca, exportação e atualização pertencem a módulos específicos; onde não
  // teriam o que fazer, saem da tela em vez de ficarem inertes.
  const busca = document.getElementById("busca");
  const campoBusca = busca && busca.closest(".topbar__search");
  if (campoBusca) campoBusca.hidden = atual === "portal";
  if (busca) {
    busca.placeholder =
      atual === "projetos"
        ? "Buscar por projeto, responsável ou área…"
        : atual === "ramais"
        ? "Buscar por nome, equipe ou ramal…"
        : "Buscar por título, descrição ou local…";
    // Cada módulo tem a sua busca. Carregar o texto de um para o outro daria
    // uma lista filtrada por um termo que não está mais escrito em lugar
    // nenhum visível.
    busca.value =
      atual === "projetos" ? state.filtrosProjeto.busca || ""
      : atual === "ramais" ? state.filtroRamais || ""
      : state.filtros.busca || "";
  }
  document.getElementById("btn-abrir-export").hidden = atual !== "agenda";
  document.getElementById("btn-atualizar").hidden = atual !== "agenda";

  document.querySelectorAll(".sidebar__nav-item").forEach((b) => {
    const ativo = b.dataset.modulo === atual;
    b.classList.toggle("is-active", ativo);
    if (ativo) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });

  // No portal a trilha se resume ao próprio início; nos módulos ela ganha o
  // segundo nível e o "Início" volta a ser um link de retorno.
  const trilhaLista = document.querySelector(".breadcrumbs ol");
  const trilhaInicio = document.querySelector('.breadcrumbs [data-ir="portal"]');
  const trilhaAtual = document.querySelector(".breadcrumbs li[aria-current]");
  if (trilhaAtual) trilhaAtual.textContent = ROTULO_MODULO[atual];
  if (trilhaLista) trilhaLista.classList.toggle("breadcrumbs--raiz", atual === "portal");
  if (trilhaInicio) trilhaInicio.setAttribute("aria-disabled", atual === "portal" ? "true" : "false");

  const sub = document.getElementById("topbar-sub");
  if (sub) sub.textContent = SUBTITULO_MODULO[atual];

  // A assinatura de rodapé repete a marca que o cabeçalho do portal já
  // apresenta; nos módulos ela continua fechando o conteúdo.
  const assinatura = document.querySelector(".content-signature");
  if (assinatura) assinatura.hidden = atual === "portal";

  // Fechar a gaveta ao navegar evita que o menu fique aberto por cima do
  // módulo recém-aberto no celular.
  if (window.innerWidth <= 860) fecharSidebarMobile();

  const principal = document.getElementById("conteudo-principal");
  if (principal) principal.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "auto" });

  if (atual === "projetos") renderizarProjetos();
  if (atual === "ramais") renderizarRamais();
  if (atual === "portal") renderizarPortal();
}

/* --------------------------------------------------------------------------
   Ligação com a interface
   -------------------------------------------------------------------------- */

// Carrega a carteira que vem com o sistema (dados/contratos.js e
// dados/projetos.js) na primeira abertura de cada navegador. Sem isto, esses
// registros só existiriam para quem importasse o arquivo à mão, em cada
// dispositivo.
//
// Uma vez por navegador, e mesclada por id: quem editar ou apagar um contrato
// não o vê ressurgir no carregamento seguinte. A versão gravada é a do arquivo
// de dados, então acrescentar contratos lá alcança quem já usa o sistema, sem
// desfazer o que a pessoa mexeu nos que já tinha.
function semearCarteira() {
  const contratos = Array.isArray(window.SAA_CONTRATOS) ? window.SAA_CONTRATOS : [];
  const projetos = Array.isArray(window.SAA_PROJETOS) ? window.SAA_PROJETOS : [];
  const semente = [...contratos, ...projetos];
  // A marca combina as duas versões: acrescentar um projeto faz a semente
  // rodar de novo e alcançar quem já usa o sistema, sem tocar no que a pessoa
  // já tinha (a mesclagem por id preserva o que está gravado).
  const versao = [window.SAA_CONTRATOS_VERSAO || "", window.SAA_PROJETOS_VERSAO || ""].join("|");
  if (!semente.length || versao === "|") return false;

  let aplicada = "";
  try {
    aplicada = localStorage.getItem(SEMENTE_STORAGE_KEY) || "";
  } catch (e) {
    // Navegador sem armazenamento: semeia em memória a cada carga, que é
    // melhor do que o painel abrir vazio.
  }
  if (aplicada === versao) return false;

  const validos = semente.filter(projetoValido);
  if (!validos.length) return false;

  const porId = new Map(state.projetos.map((p) => [p.id, p]));
  let mudou = 0;
  validos.forEach((p) => {
    // Carimbo de origem: permite distinguir, mais tarde, um registro que veio
    // do sistema e nunca foi tocado de um que a pessoa ajustou.
    const marcado = { ...p, origem: "semente", semeadoEm: p.atualizadoEm || "" };
    const existente = porId.get(p.id);

    if (!existente) {
      porId.set(p.id, marcado);
      mudou++;
      return;
    }

    // Corrigir um prazo no arquivo de dados precisa alcançar quem já abriu o
    // sistema — senão a correção só valeria para navegadores novos. Mas a
    // correção não pode atropelar quem editou o registro: só substitui o que
    // veio da semente e continua exatamente como foi semeado.
    // Registros semeados por versões anteriores não têm o carimbo. Para eles
    // vale o mesmo teste por outro caminho: a semente grava criadoEm igual a
    // atualizadoEm, e qualquer edição mexe só no segundo.
    const carimbado = existente.origem === "semente" && existente.semeadoEm;
    const intocado = carimbado
      ? existente.semeadoEm === existente.atualizadoEm
      : Boolean(existente.criadoEm) && existente.criadoEm === existente.atualizadoEm;
    if (intocado && existente.atualizadoEm !== marcado.atualizadoEm) {
      porId.set(p.id, marcado);
      mudou++;
    }
  });
  state.projetos = [...porId.values()];

  try {
    localStorage.setItem(SEMENTE_STORAGE_KEY, versao);
  } catch (e) {
    /* sem armazenamento: segue sem marcar */
  }
  if (mudou) gravarProjetos(state.projetos);
  return mudou > 0;
}

function inicializarModuloProjetos() {
  state.projetos = lerProjetos();
  semearCarteira();

  preencherSelectSituacoes(document.getElementById("status-situacao"), SITUACAO_PADRAO);

  document.querySelectorAll(".sidebar__nav-item").forEach((btn) => {
    btn.addEventListener("click", () => trocarModulo(btn.dataset.modulo));
  });

  document.getElementById("btn-novo-projeto").addEventListener("click", () => abrirFormProjeto(null));
  document.getElementById("btn-salvar-proj").addEventListener("click", salvarProjeto);
  document.getElementById("btn-cancelar-proj").addEventListener("click", fecharFormProjeto);
  document.getElementById("btn-fechar-proj-form").addEventListener("click", fecharFormProjeto);
  document.getElementById("proj-form-backdrop").addEventListener("click", fecharFormProjeto);
  document.getElementById("btn-excluir-projeto").addEventListener("click", excluirProjeto);

  document.getElementById("proj-progresso").addEventListener("input", (ev) => {
    document.getElementById("proj-progresso-valor").textContent = `${ev.target.value}%`;
  });
  document.getElementById("status-progresso").addEventListener("input", (ev) => {
    document.getElementById("status-progresso-valor").textContent = `${ev.target.value}%`;
  });

  document.getElementById("btn-lancar-status").addEventListener("click", lancarStatus);
  document.getElementById("btn-concluir-projeto").addEventListener("click", concluirProjetoAberto);
  document.getElementById("btn-reabrir-projeto").addEventListener("click", reabrirProjetoAberto);
  document.getElementById("btn-auto-projeto").addEventListener("click", voltarAoAutomatico);
  document.getElementById("proj-categoria-chips").addEventListener("click", (ev) => {
    const chip = ev.target.closest("[data-situacao]");
    if (chip) definirSituacaoDoProjeto(chip.dataset.situacao);
  });
  document.getElementById("btn-editar-projeto").addEventListener("click", () => {
    if (state.projetoAberto) abrirFormProjeto(state.projetoAberto);
  });
  document.getElementById("btn-fechar-proj-painel").addEventListener("click", fecharPainelProjeto);
  document.getElementById("proj-painel-backdrop").addEventListener("click", fecharPainelProjeto);

  // Delegação: barras e cartões são recriados a cada render.
  document.getElementById("modulo-projetos").addEventListener("click", (ev) => {
    const alvo = ev.target.closest("[data-projeto]");
    if (alvo) abrirPainelProjeto(alvo.dataset.projeto);
  });

  document.getElementById("situacao-lista").addEventListener("click", (ev) => {
    const item = ev.target.closest(".cat-list__item");
    if (!item) return;
    const chave = item.dataset.situacao;
    const set = state.filtrosProjeto.situacoes;
    if (set.has(chave)) set.delete(chave);
    else set.add(chave);
    renderizarProjetos();
  });

  document.querySelectorAll("#horizonte-group .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const valor = Number(chip.dataset.horizonte);
      state.filtrosProjeto.horizonte = Number.isFinite(valor) ? valor : HORIZONTE_PADRAO;
      // Escolher um horizonte descarta o intervalo do calendário: são dois
      // caminhos para a mesma janela, e o último a ser usado é o que vale.
      state.filtrosProjeto.prazoInicio = null;
      state.filtrosProjeto.prazoFim = null;
      document.getElementById("proj-filtro-de").value = "";
      document.getElementById("proj-filtro-ate").value = "";
      mostrarErroPrazo("");
      sincronizarChipsHorizonte();
      atualizarVisibilidadeBtnLimparPrazo();
      renderizarProjetos();
    });
  });

  document.getElementById("btn-exportar-plano").addEventListener("click", abrirDialogoExportPlano);
  document.getElementById("btn-fechar-plano-export").addEventListener("click", fecharDialogoExportPlano);
  document.getElementById("plano-export-backdrop").addEventListener("click", fecharDialogoExportPlano);
  document.getElementById("btn-plano-pdf").addEventListener("click", (ev) => baixarPlano("pdf", ev.currentTarget));
  document.getElementById("btn-plano-jpeg").addEventListener("click", (ev) => baixarPlano("jpeg", ev.currentTarget));

  document.getElementById("proj-filtro-de").addEventListener("change", aplicarFiltroDePrazo);
  document.getElementById("proj-filtro-ate").addEventListener("change", aplicarFiltroDePrazo);
  document.getElementById("btn-limpar-prazo").addEventListener("click", limparFiltroDePrazo);
  document.getElementById("btn-ver-ocultos").addEventListener("click", (ev) => verTodosOsProjetos(ev.currentTarget.dataset.acao));

  document.getElementById("btn-exportar-projetos").addEventListener("click", exportarProjetos);
  document.getElementById("input-importar-projetos").addEventListener("change", (ev) => {
    const arquivo = ev.target.files && ev.target.files[0];
    if (arquivo) importarProjetos(arquivo);
    ev.target.value = "";
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (!document.getElementById("plano-export-modal").hidden) fecharDialogoExportPlano();
    else if (!document.getElementById("proj-form").hidden) fecharFormProjeto();
    else if (state.projetoAberto) fecharPainelProjeto();
  });
}

function iniciar() {
  inicializarInterface();
  inicializarModuloProjetos();
  inicializarModuloRamais();
  inicializarPortal();
  aplicarFiltrosDaURL();

  // Pré-carrega as marcas institucionais em data URL: o html2canvas só
  // rasteriza imagens que já estejam disponíveis no momento da captura.
  precarregarMarcas();

  // Pré-carrega o cache local para uma primeira renderização instantânea,
  // antes mesmo da resposta da rede chegar.
  const cache = carregarCache();
  if (cache) {
    marcarConflitos(cache.events);
    state.eventos = cache.events;
    state.usandoCache = true;
    state.ultimaAtualizacao = new Date(cache.savedAt);
    renderizarTudo();
    mostrarAvisoCache();
  }

  atualizarAgenda();
  setInterval(atualizarAgenda, REFRESH_INTERVAL_MS);
}

document.addEventListener("DOMContentLoaded", iniciar);
