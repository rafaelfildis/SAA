# SAA — Agenda Institucional do TCM-BA

Aplicação web responsiva para visualização da agenda institucional do **Tribunal de Contas dos Municípios do Estado da Bahia**, sincronizada automaticamente com o calendário do **Google Agenda** publicado em formato ICS.

## Identidade visual

As cores foram **amostradas por pixel da própria logomarca** do TCM-BA, no PDF
institucional de referência. Não são aproximações a olho.

| Token | Hex | Aplicação na interface |
| --- | --- | --- |
| Navy institucional | `#0B3163` | Topbar, títulos, compromissos presenciais |
| Navy escuro | `#071C38` | Fim do gradiente do cabeçalho |
| Vermelho institucional | `#E30521` | Marca |
| Vermelho de interface | `#D80425` | Ações primárias, linha do "agora", alertas |
| Azul de link | `#14448A` | Links, horários, foco |
| Azul de reunião online | `#2C63B0` | Compromissos remotos |
| Verde de disponibilidade | `#0F7B5F` | Em andamento, janelas livres, Escola de Contas |
| Âmbar de deslocamento | `#A65A05` | Viagens |
| Tinta de texto | `#12203A` | Corpo de texto |
| Texto secundário | `#5F6E88` | Rótulos de seção, apoio |
| Texto terciário | `#64718E` | Régua de horas, metadados |
| Borda | `#DCE3EE` | Divisores e contornos de card |
| Fundo de painel | `#F4F7FB` | Área de conteúdo |

As cores ficam concentradas em variáveis CSS (`:root` em `styles.css`), com um
conjunto equivalente para o tema escuro — os pastéis do tema claro não têm
contraste sobre painel escuro e por isso são redefinidos em versões
translúcidas, não reaproveitados.

**Tipografia:** Bitter nos títulos, IBM Plex Sans na interface e IBM Plex Mono
em horários e números — em uma tabela de agenda os dígitos precisam alinhar em
coluna. Carregadas do Google Fonts, com pilha de fallback local em todos os
casos.

**Acessibilidade:** todo texto sobre fundo opaco passa WCAG AA (4,5:1). Os
cinzas mais críticos foram auditados individualmente: régua de horas `#64718E`
(4,76:1), rótulos de seção `#5F6E88` (5,16:1) e título de compromisso cancelado
`#616A7E` (5,13:1). Estado nunca é comunicado só por cor: cada compromisso
carrega um selo textual (AGENDADO, EM ANDAMENTO, CONCLUÍDO, CANCELADO) e
conflitos ganham ícone de atenção além do vermelho — relevante para
conformidade com o eMAG.

### Arquivos da marca (`img/`)

| Arquivo | Uso |
| --- | --- |
| `tcm-mark.png` | Símbolo "A" isolado — topbar, sobre placa branca, e cabeçalho do card JPEG |
| `tcm-lockup.png` | Assinatura horizontal completa — rodapés e cabeçalho do extrato A4 |
| `tcm-55.png` | Selo comemorativo dos 55 anos |
| `tcm-marca.svg` | Símbolo isolado em vetor (reconstrução), disponível para uso avulso |
| `tcm-logo.svg` | Assinatura completa em vetor — rodapé da página |
| `tcm-55anos.svg` | Selo comemorativo em vetor |

Os três PNG foram redimensionados para cerca do dobro do maior uso real em
tela — 220px de largura no símbolo (exibido a 78px no card, rasterizado a
1,5x), 420px na assinatura e 180px no selo — e recomprimidos: 763 KB no
conjunto original, 76 KB agora. O símbolo veio da entrega do design como um
recorte grosseiro da assinatura, trazendo um pedaço do "T" de TCM à direita e o
topo da tipografia embaixo; foi recortado no símbolo, com respiro, para não
publicar a marca do Tribunal cortada.

> **Substituição pelos arquivos oficiais:** basta sobrescrever os arquivos
> mantendo os mesmos nomes e proporções — nenhum código precisa mudar. As
> imagens são convertidas em *data URL* em tempo de execução para que o
> `html2canvas` consiga rasterizá-las nas exportações.

## Interface

- **Topbar** institucional (gradiente navy `#0B3163 → #071C38`) com a marca, busca global e ações rápidas.
- **Sidebar** de navegação/filtros: filtro de data, período, **rota do dia** ("onde estar hoje"), modalidade com contagem e estado da sincronização. Drawer com backdrop no mobile (botão ☰), recolhível no desktop (preferência salva em `localStorage`).
- **Cartão "agora / a seguir"**: compromisso em andamento com barra de progresso e tempo restante, e o próximo com contagem regressiva.
- **Resumo do dia** em quatro números derivados — quantos compromissos ainda faltam, ocupação sobre 10h úteis, total livre e número de sobreposições. Em janelas de vários dias (semana, mês, "todos") a mesma faixa troca de leitura para contagem por situação.
- **Linha do tempo em escala real de horas** (07:30–18:30 por padrão, 96px/hora) para a agenda de um único dia: um compromisso de 3h30 ocupa três vezes e meia o espaço de um de 1h. Inclui régua de horas, linha vermelha do "agora", **janelas livres** desenhadas no lugar e no tamanho reais e **sobreposições** dividindo a pista em colunas.
- **Alerta de sobreposição** no topo, nomeando o par de compromissos, os horários e o tempo sobreposto, com link para a posição na linha do tempo.
- Duas visões alternáveis: **linha do tempo** e **tabela** (ordenável, paginada; some no mobile, vira cards).
- **Layout mobile** de referência 390px: abaixo de 720px a pista em escala real sai e a lista vertical assume, com o mesmo conteúdo.
- **Painel lateral** de detalhes por compromisso (botão "Ver detalhes"), com foco preso e retorno de foco ao fechar.
- **Modal de confirmação** antes de exportações grandes (>40 compromissos) e **validação inline** do filtro de datas.
- Acessibilidade: skip-link, `:focus-visible`, landmarks (`header`/`nav`/`main`/`aside`), `aria-live`/`aria-invalid`/`aria-expanded`, tecla Esc fecha painéis/drawer/modal na ordem correta.

## Stack

- **Frontend**: HTML5 + CSS3 + JavaScript puro (sem framework/bundler), bibliotecas carregadas via CDN:
  - [ical.js](https://github.com/kewisch/ical.js) — parsing do arquivo ICS (VEVENT, RRULE, EXDATE, RECURRENCE-ID, VTIMEZONE).
  - [html2canvas](https://html2canvas.hertzen.com/) + [jsPDF](https://github.com/parallax/jsPDF) — exportação em JPEG e PDF.
- **Backend**: Node.js + Express (`server.js`), camada intermediária para contornar CORS ao buscar o ICS do Google Agenda.

## Origem dos dados

A agenda é lida do **Google Agenda**, pelo *endereço secreto no formato iCal*.

### Qual endereço a implantação usa

Esta implantação roda com a agenda **pública** e, por isso, com o **endereço
público** no formato iCal, definido como padrão em `server.js` e
`api/calendar.js`:

```
https://calendar.google.com/calendar/ical/<conta>/public/basic.ics
```

Ele vive no código por ser público por definição: não é credencial e não revela
nada que a agenda já não revele a qualquer pessoa. Em troca, dispensa variável
de ambiente — a aplicação sobe e funciona sem nenhuma configuração de
implantação.

**Pré-requisito no Google:** Configurações da agenda → *Permissões de acesso a
eventos* → marcar **Tornar disponível ao público**, com **Ver todos os detalhes
do evento**. A opção *Ver apenas livre/ocupado* faz o feed sair sem título,
local nem participantes, e a agenda aparece como uma sequência de blocos
anônimos.

> **Consequência:** com a agenda pública, qualquer pessoa na internet lê os
> compromissos direto do Google, e o feed pode ser indexado por buscadores.
> Não é "acesso por link", é acesso aberto.

### Voltando a agenda para privada

Desmarque *Tornar disponível ao público* no Google e defina a variável de
ambiente `CALENDAR_ICS_URL` na implantação, apontando para o **Endereço secreto
no formato iCal** (Configurações da agenda → *Integrar agenda*). A variável tem
precedência sobre o padrão do código, então nada mais precisa mudar.

> **O endereço secreto é credencial ao portador.** Quem tiver o link lê a agenda
> inteira, sem autenticação e por prazo indeterminado. Ele vive exclusivamente
> na variável de ambiente — nunca no código, nunca no repositório (que é
> **público**; o `.env` está no `.gitignore`) e nunca no HTML/JS servido ao
> navegador. Se vazar, **Redefinir**, na mesma tela do Google, invalida o
> endereço atual e gera outro.

### Modo de demonstração

A constante `USE_DEMO_DATA` no topo de `script.js` alterna entre a agenda real e
um conjunto fictício:

```js
const USE_DEMO_DATA = false; // agenda real, lida do Google Agenda
```

Ligada, `construirIcsDemo()` monta um calendário ICS em torno da data de hoje —
cinco compromissos no dia, um cancelado, uma sobreposição real (14:00–15:30 ×
15:00–16:00) e três janelas livres, mais uma semana e um mês de agenda para que
os filtros de período não abram vazios. Gerar ICS de verdade, em vez de injetar
objetos prontos, mantém o caminho de parsing, recorrência e classificação
exercitado exatamente como em produção. Serve para desenvolvimento sem rede e
para demonstrações públicas, em que a agenda real não deve aparecer.

### Latência da sincronização

O feed iCal do Google **não é tempo real**: é servido a partir de um retrato que
o Google atualiza em intervalos próprios, e uma alteração feita agora pode levar
horas para aparecer aqui. Somam-se a isso os até 5 minutos do cache de
`/api/calendar` (`CACHE_TTL_MS`) e os 15 minutos do ciclo de atualização
automática do frontend (`REFRESH_INTERVAL_MS`). Para prazos e compromissos
inadiáveis, a fonte de verdade continua sendo o Google Agenda; este painel é
camada de visualização e extração. Sincronização quase imediata exigiria a
Google Calendar API (OAuth 2.0 + `events.list` com `syncToken`), não o feed iCal.

## Executando localmente

```bash
cd agenda
npm install
export CALENDAR_ICS_URL="https://calendar.google.com/calendar/ical/SEU_EMAIL%40gmail.com/private-TOKEN/basic.ics"
npm start
```

Acesse `http://localhost:3000`.

`CALENDAR_ICS_URL` é **opcional**: sem ela vale o endereço público padrão definido no código. Defina-a apenas para apontar a um endereço secreto (agenda privada). Copie `.env.example` para `.env` e ajuste também `ALLOWED_ORIGIN` e `CACHE_TTL_MS` conforme o ambiente.

## Deploy na Vercel

O repositório tem tanto `server.js` (Express, para rodar localmente com `npm start`) quanto `api/calendar.js` (função serverless equivalente, usada em produção na Vercel). A Vercel não executa o `server.js` diretamente — ela detecta automaticamente arquivos dentro de `api/` como funções serverless e serve os demais arquivos estaticamente.

O projeto na Vercel é o **`saa-agenda-tcm-ba`**, ligado a este repositório com
**Root Directory = `agenda`**. Cada push na branch de produção do repositório
gera um deploy de produção; pushes em outras branches geram deploys de
pré-visualização, com URL própria.

O `agenda/vercel.json` fixa o preset como site estático (`framework: null`,
sem build) com `api/` como função serverless. Sem ele a Vercel detecta o
`express` do `package.json`, roteia tudo pelo `server.js` e a raiz responde
`Cannot GET /` — o `server.js` existe para rodar localmente, não como função.

Se for preciso recriar o projeto do zero:

1. Importe o repositório na Vercel e defina o Root Directory como `agenda` (o app fica nessa subpasta).
2. Nenhum "Build Command" é necessário — é um site estático mais uma função serverless (preset "Other").
3. Nenhuma variável de ambiente é necessária enquanto a agenda estiver pública — o endereço padrão está no código. Em **Settings → Environment Variables**, defina `CALENDAR_ICS_URL` apenas se a agenda voltar a ser privada, e opcionalmente `ALLOWED_ORIGIN` (domínio de produção) e `CACHE_TTL_MS`.

Depois disso, `/` carrega `agenda/index.html` e `/api/calendar` responde com o
ICS do Google Agenda.

> A variável é lida no momento da invocação da função. Alterar seu valor na
> Vercel exige um **redeploy** para que as funções passem a enxergar o novo
> conteúdo.

## Como funciona a leitura do calendário

1. O frontend tentaria `fetch(CALENDAR_ICS_URL)` direto do navegador — **apenas se** a constante estivesse preenchida em `script.js`. Ela é mantida vazia de propósito (o endereço secreto não pode ser servido ao navegador), então a etapa é sempre pulada. O feed iCal do Google também não envia cabeçalhos CORS, de modo que esse caminho seria bloqueado de qualquer forma.
2. O frontend usa `fetch(CALENDAR_API_URL)`, isto é, `/api/calendar`. Este é o caminho normal de leitura, não um plano B.
3. `server.js` (ou `api/calendar.js`, na Vercel) busca o ICS no servidor, onde não há restrição de CORS, aplica um cache curto em memória (`CACHE_TTL_MS`, padrão 5 min) e devolve o conteúdo com `Content-Type: text/calendar`, liberando apenas a origem configurada em `ALLOWED_ORIGIN`. Se o Google estiver indisponível e houver cache, mesmo expirado, ele é servido com o cabeçalho `X-Cache-Stale: true`; sem cache algum, responde 502.
4. O conteúdo ICS é interpretado inteiramente no cliente com `ical.js`.

O endereço secreto **nunca é servido ao navegador**: a constante `CALENDAR_ICS_URL` de `script.js` permanece vazia e o endereço vive apenas na variável de ambiente homônima, lida no servidor. Isso importa porque o endereço secreto do Google é **credencial ao portador** — quem o tiver lê a agenda inteira, sem autenticação e por prazo indeterminado. Se vazar, use **Redefinir** na tela "Integrar agenda" do Google para invalidá-lo.

## Decisões de implementação

- **Por que só `ical.js` e não também `rrule.js`**: `ical.js` já implementa internamente a expansão de `RRULE` (via `ICAL.Event.iterator()` / `ICAL.Recur`), além de tratar `EXDATE` e overrides de `RECURRENCE-ID` através de `event.relateException()`. Adicionar `rrule.js` como um segundo motor de recorrência introduziria risco de resultados divergentes entre as duas bibliotecas sem ganho real, então a expansão de recorrência usa exclusivamente `ical.js`.
- **Fuso horário**: os horários são resolvidos a partir dos `VTIMEZONE` do calendário (registrados via `ICAL.TimezoneService.register`) e exibidos sempre em `America/Bahia` (`Intl.DateTimeFormat`), independente do fuso do navegador do usuário.
- **Janela de expansão de recorrência**: eventos recorrentes são expandidos de 1 mês no passado a 6 meses no futuro (configurável em `script.js`, constantes `JANELA_MESES_PASSADO` / `JANELA_MESES_FUTURO`), para evitar séries infinitas.
- **Eventos que atravessam vários dias**: são agrupados na data de início da timeline; o card mostra a duração total (ex.: "3 dias"). Já para os filtros de dia/semana/mês, o evento aparece se o seu intervalo *intersecta* o período filtrado — ou seja, um evento de 3 dias aparece também nos filtros dos dias intermediários.
- **Classificação automática**: função centralizada `classificarEvento(evento)` em `script.js`. A **rubrica declarada em `CATEGORIES` no próprio evento do calendário tem precedência** sobre a heurística — quando a categoria é marcada no calendário de origem, ela já respondeu a pergunta, e adivinhar por palavra-chave só pode errar ("Audiência com o Prefeito de Ilhéus" marcada como Presencial é uma audiência no gabinete, não uma viagem a Ilhéus). Sem rubrica declarada, avalia título, descrição, local e link por palavras-chave, na ordem: viagem → Escola de Contas → online → presencial (fallback quando nada é identificado).

  > **Com o Google Agenda, o ramo da rubrica declarada nunca é acionado.** O Google
  > organiza compromissos por cor, não por categoria. Eventos antigos migrados
  > chegam a trazer `CATEGORIES`, mas com o valor
  > `http://schemas.google.com/g/2005#event` — um identificador de esquema, não
  > uma rubrica, que não casa com nenhuma chave de `CATEGORIA_ICS_EXPLICITA`
  > (verificado contra o feed real). Toda a classificação
  > passa pela heurística de palavras-chave, cujo vocabulário é o do Tribunal. Links de
  > reunião continuam funcionando: `REGEX_LINK_REUNIAO` já reconhece `meet.google.com`,
  > e o Google publica o link do Meet na `DESCRIPTION`, de onde `lerUrl()` o extrai —
  > esses compromissos são classificados corretamente como *pauta online*. Os demais
  > caem no fallback *presencial*, salvo quando o título contiver palavra reconhecida.
- **Números derivados, nunca escritos à mão**: ocupação, janelas livres, sobreposições, "ainda hoje", "agora" e "a seguir" saem todos de `analisarDia()`, em tempo de render. O extrato em PDF e o card JPEG chamam a mesma função que a tela, de modo que o que é impresso é exatamente o que está exibido — e não uma segunda contagem que pode divergir.
- **Nível de detalhe por altura disponível**: na linha do tempo, o quanto cada compromisso mostra é decidido pelos pixels que sobram no bloco, não pela duração em minutos. Um compromisso de 1h em coluna dividida mostra menos que um de 1h em coluna cheia, porque tem menos espaço.
- **Cache local**: a última lista de eventos processada é salva em `localStorage` a cada atualização bem-sucedida. Se a busca falhar (rede/CORS/indisponibilidade do Google), a interface exibe os dados salvos com aviso de que podem estar desatualizados.
- **Duas camadas intermediárias equivalentes**: `server.js` (Express) para rodar localmente/em qualquer provedor Node (Render, Railway, VPS), e `api/calendar.js` (função serverless) para deploy na Vercel — a Vercel não executa o Express diretamente, então a mesma lógica de fetch + cache + CORS foi duplicada nesse formato específico.

## Estrutura de dados do evento

```js
{
  id: "identificador-unico",
  titulo: "Título do compromisso",
  descricao: "Descrição do compromisso",
  inicio: "2026-07-20T09:00:00-03:00",
  fim: "2026-07-20T10:00:00-03:00",
  diaInteiro: false,
  local: "Local do compromisso",
  link: "Link da reunião",
  categoria: "pauta-online",
  categoriasIcs: ["..."],
  status: "confirmado",
  recorrente: false,
  conflito: false
}
```

## Filtros disponíveis

- Período: todos / hoje / semana (segunda a domingo) / mês.
- Modalidade (seleção múltipla): viagem, Escola de Contas, online, presencial. Com nenhuma marcada, todos os compromissos são exibidos; marcar uma ou mais restringe a lista a elas.
- Busca textual (título, descrição, local).
- Mostrar/ocultar compromissos concluídos.

## Documentos de extração

São dois artefatos, construídos em HTML institucional puro (sempre em tema
claro, mesmo com a interface em modo escuro) e rasterizados por `html2canvas`.

### Extrato diário — A4 retrato (PDF)

794 × 1123 px a 96dpi, pronto para imprimir ou anexar em e-mail. Um dia cabe em
uma página.

- Cabeçalho com a assinatura institucional e o selo dos 55 anos, filete
  vermelho/navy e identificação do gabinete.
- Faixa de quatro indicadores: compromissos, ocupação, janelas livres e
  sobreposições.
- Tabela **horário × compromisso**, com selo de modalidade, selo de
  cancelamento/sobreposição, local, participantes e pauta.
- Aviso de sobreposição nomeando o par e o tempo sobreposto.
- Bloco de janelas livres e linha de assinatura opcional.
- Controles: conteúdo por compromisso (completo / sem pauta / resumo), incluir
  cancelados, incluir janelas livres e linha de assinatura.
- Períodos maiores que um dia repetem o bloco com um subtítulo por data e
  paginam automaticamente.

### Card de compartilhamento — JPEG mobile

1080 × 1920 px (story 9:16) ou 1080 × 1350 px (feed 4:5), para enviar por
mensagem ou publicar.

- Cabeçalho em gradiente navy com a marca, o dia da semana, a data em corpo
  grande e três indicadores (compromissos, ocupação, conflitos).
- Um cartão por compromisso, com faixa de cor da modalidade à esquerda, horário
  e duração em coluna monoespaçada, selos de AGORA e CONFLITO.
- Bloco de janelas livres e rodapé com a assinatura institucional.
- No formato feed há **570px a menos de altura**: o cabeçalho comprime e os
  blocos opcionais saem automaticamente, senão os compromissos do fim do dia
  seriam cortados.

Ambos podem ser baixados em **JPEG** ou **PDF**, sempre respeitam os filtros
ativos (período, categorias, busca, concluídos) e são construídos pela mesma
função que gera a pré-visualização — o que se vê é o que sai. A
pré-visualização é exibida reduzida por `transform: scale()`; o arquivo
baixado é montado do zero no tamanho real e rasterizado fora da tela, para não
sair em baixa resolução.

Há ainda a **exportação em texto simples** (modal com "copiar"), útil para
colar em e-mail ou mensagem.

## Checklist de testes realizados

- [x] Carregamento da agenda pelo endpoint `/api/calendar` (caminho normal: o feed iCal do Google não envia cabeçalhos CORS).
- [x] Eventos com horário.
- [x] Eventos de dia inteiro.
- [x] Eventos recorrentes (RRULE) com exceções (EXDATE/RECURRENCE-ID).
- [x] Eventos cancelados (STATUS:CANCELLED).
- [x] Eventos com link de reunião (Teams/Meet/Zoom) → classificados como "pauta online".
- [x] Filtro diário, semanal (segunda a domingo) e mensal.
- [x] Filtros de categoria combinados.
- [x] Exportação do extrato A4 em PDF e imagem.
- [x] Exportação do card mobile em JPEG (story e feed) e PDF.
- [x] Linha do tempo em escala real: ocupação 6h30, 3 janelas livres somando 2h30 e 1 sobreposição no conjunto de demonstração — os mesmos números na tela, no extrato A4 e no card JPEG.
- [x] Sobreposição dividindo a pista em colunas e alerta nomeando o par.
- [x] Layout responsivo (mobile 390px: lista vertical em coluna única, sem rolagem horizontal / desktop: pista em escala real com filtros fixos ao lado).
- [x] Exibição em `America/Bahia` independente do fuso do dispositivo.

### Verificação da troca para o Google Agenda

Feita contra um ICS construído no formato exato que o Google emite (`PRODID:-//Google
Inc//Google Calendar`, `VTIMEZONE` de `America/Sao_Paulo`, `X-GOOGLE-CONFERENCE`),
servido por um upstream local, com o app rodando de ponta a ponta e a página
carregada no Chromium em fuso `America/Bahia`:

- [x] `VTIMEZONE` do Google registrado em `ICAL.TimezoneService` sem erro.
- [x] Evento com horário, evento de dia inteiro (`DTEND` exclusivo) e evento cancelado (`STATUS:CANCELLED`) lidos corretamente.
- [x] Série recorrente com `RRULE` + `EXDATE` + override por `RECURRENCE-ID`: das 6 ocorrências declaradas, 1 removida pelo `EXDATE` e 1 deslocada pelo override — 5 ocorrências, nos horários corretos.
- [x] `ORGANIZER`/`ATTENDEE` com parâmetro `CN` lidos como participantes.
- [x] Link do Google Meet extraído da `DESCRIPTION` e classificado como *pauta online*.
- [x] `CATEGORIES` ausente em todos os eventos — confirmado que o Google não emite a propriedade.
- [x] `/api/calendar` devolve o ICS íntegro, com `text/calendar` e `Access-Control-Allow-Origin` restrito.
- [x] Endereço inválido ou agenda fora do ar: HTTP 502 com mensagem explícita, propagada até a faixa de erro da interface.
- [x] Google indisponível **com** cache quente: HTTP 200 com `X-Cache-Stale: true`.
- [x] Google indisponível **sem** cache: HTTP 502.
- [x] Interface renderizando a agenda do dia a partir do feed, com a identidade do TCM-BA intacta e a caixa de sincronização indicando "Google Agenda".

> Nota: os testes contra o feed real dependem de a rede permitir a saída HTTPS do servidor até `calendar.google.com`. Se o endereço secreto for redefinido no Google, o endpoint `/api/calendar` retornará erro 502 e a interface cairá automaticamente para os dados em cache local, exibindo o aviso correspondente — basta atualizar a variável `CALENDAR_ICS_URL` com o novo endereço.
