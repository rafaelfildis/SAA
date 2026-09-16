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
| Verde de disponibilidade | `#0F7B5F` | Em andamento, janelas livres |
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

## Portal

A tela de entrada é um portal com um cartão por módulo. Não é uma capa
decorativa: cada cartão lê o estado real do seu módulo — os compromissos já
sincronizados e os projetos gravados — e responde "o que exige atenção agora?"
antes de qualquer clique.

**Cartão da Agenda:** compromissos de hoje, dos próximos 7 dias, total na base,
o próximo compromisso ainda por acontecer e o horário da última sincronização.
Quando o dia já venceu, o destaque olha adiante em vez de dizer apenas "nada
hoje".

**Cartão do Plano 100 dias:** projetos no horizonte, em andamento, em risco ou
atrasados, e a próxima entrega com o prazo em dias. A cela de risco só acende
quando existe algo a alertar — uma cela vermelha permanente deixa de ser sinal
e vira ruído.

**Cartão da Estrutura DTI:** unidades abaixo da Diretoria hoje, unidades
previstas na minuta e quantas funções de TI seguem sem unidade própria — a cela
de alerta só acende quando existe alguma. O destaque nomeia as unidades que a
minuta cria, e o selo traz o total de pessoas no organograma (59, hoje) com a
ressalva de que a proposta está em discussão.

**Cartão de Tarefas:** quantas estão a fazer, quantas em andamento e quantas
atrasadas — a cela de alerta só acende quando existe atraso. O destaque nomeia a
próxima tarefa com prazo e quem responde por ela, e o selo conta o que está em
aberto.

Os números do portal ignoram os filtros em vigor nas telas internas: a página
inicial resume a base, não o recorte que ficou selecionado em outro módulo.

**Navegação:** cartões (clique, Enter ou espaço), a barra lateral e o "Início"
da trilha de navegação levam de um lado a outro. Busca, atualização e
exportação pertencem a módulos específicos e saem da tela onde não teriam o que
fazer, em vez de ficarem inertes.

**Links diretos:** `?modulo=agenda`, `?modulo=plano` (ou `?modulo=projetos`),
`?modulo=ramais` (ou `?modulo=ramal`), `?modulo=estrutura` (ou
`?modulo=organograma`), `?modulo=tarefas` (ou `?modulo=quadro`, `?modulo=kanban`),
`?modulo=equipes` (ou `?modulo=equipe`, `?modulo=alocacao`, `?modulo=celulas`)
e `?modulo=portal` abrem o sistema direto em um módulo. No módulo Estrutura DTI, `?visao=sugerida` (ou `?visao=proposta`)
abre direto na minuta, e `?visao=atual` na estrutura vigente — que é o padrão.
Um intervalo explícito de
datas na URL (`?data=`, `?de=`/`?ate=`) continua caindo na agenda — é o formato
dos links do envio diário, e abrir o portal ali esconderia o que foi pedido.

## Módulos

O sistema tem seis módulos, alcançados pelo portal ou pela navegação da
barra lateral.

### Agenda

Compromissos do dia lidos do Google Agenda. **Somente leitura** — a origem é o
calendário, e o painel não grava nada.

### Plano 100 dias

Projetos em desenvolvimento com entrega prevista dentro de um horizonte
(100, 30 ou 7 dias), e o histórico de status de cada um.

**Cadastro do projeto:** nome, objetivo/escopo, responsável, área, **unidade da
DTI**, **fornecedor**, data de lançamento, prazo de entrega, situação e
progresso.

**Etiqueta de unidade.** Cada registro mostra na própria lista de quem é o
instrumento — `DDES`, `DINT` ou `DBAD` —, com uma cor por Divisão e contorno em
vez de fundo cheio, para não competir com o selo de situação, que é o que pede
ação. Contrato de **fiscalização compartilhada traz mais de uma etiqueta**,
porque é o que ele é: o 65/2022, dos postos de serviço, é gerido pelas três
Divisões, e o 25/2022, de nuvem, pela Infraestrutura e pelo Banco de Dados. No
formulário a unidade é um seletor de uma opção; salvar sem tocar nele preserva
a lista original, inclusive a de mais de uma unidade, que o seletor não sabe
representar. Projeto sem unidade declarada simplesmente não recebe etiqueta.

**Fornecedor em etiqueta própria**, ao lado da etiqueta colorida da unidade e
com ícone de empresa. Em texto corrido ele ficava encostado no nome do fiscal, e
dois nomes em cinza seguido viravam uma linha só: o ícone distingue empresa de
pessoa sem gastar uma palavra de rótulo. A etiqueta é neutra de propósito — a
cor pertence à Divisão, e dar outra à empresa faria a lista competir consigo
mesma. Quando o nome vem como "SIGLA — razão social", a etiqueta mostra a sigla
(`PRODEB`, `Dataprev`, `X-Site`), que é como a empresa é chamada nos autos; o
nome inteiro, com CNPJ, fica no title e no painel de detalhe.

O **fiscal** fica ao lado, em texto com ícone de pessoa, e o nome **não corta**:
a linha de metadados quebra, porque nome de pessoa cortado no meio é pior do que
uma linha a mais — uma comissão de cinco fiscais, porém, para em três linhas
para não empurrar o resto do cartão. Nos contratos esse campo é o **fiscal ou a
comissão de fiscalização** declarada, e tanto o title quanto o painel rotulam a
linha como "Fiscalização" em vez de "Responsável".

A busca alcança os dois campos e a sigla da unidade: "X-Site" traz os cinco
contratos da empresa, "DBAD" os doze sob a Divisão de Banco de Dados.

**Situações:** não iniciado, em andamento, em risco, concluído, suspenso e
vencido. *Atrasado* não é uma delas: é derivado do prazo vencido sem entrega.
Deixar alguém marcar "atrasado" à mão produziria projetos vencidos ainda
exibidos como em dia. *Concluído* e *vencido* são a palavra final sobre o
prazo, e por isso não recebem "atrasado" por cima.

#### Contratos

Um registro com `tipo: "contrato"` não tem situação digitada: ela **decorre da
vigência**, e o campo aparece travado com a regra escrita ao lado.

| Vigência | Situação |
| --- | --- |
| já passou | **Vencido** |
| faltam 90 dias ou menos | **Em risco** |
| mais que isso | **Em andamento** |

A carteira vem de `dados/contratos.js`, e **fornecedor, unidade responsável e
fiscalização vieram das respostas das três Divisões** ao levantamento da
Presidência, de agosto de 2026 — antes disso os 30 contratos estavam sem essas
três informações.

A antecedência de 90 dias é a janela para prorrogar ou abrir nova licitação.
Derivar em vez de gravar é o que impede o painel de envelhecer: no dia em que
a vigência passa, o mesmo registro deixa de ser "em risco" e passa a
"vencido" sozinho, sem depender de alguém lembrar de atualizar.

Contrato não mostra barra de progresso nem "% concluído" — o que importa é
quanto resta de vigência — e o rótulo de prazo fala a língua do registro:
"vigência vencida há 32 dias", não "32 dias de atraso".

**Sem data de início não há período a desenhar.** Na linha de entrega esses
registros viram um **marco no prazo**, não uma barra esticada da borda da
janela até a data: a barra inventaria um começo, e um que mudaria de lugar a
cada troca de filtro.

**Horizonte "Todas":** os chips de entrega incluem uma opção sem teto de data,
porque contratos correm por anos e a janela de 100 dias esconderia a maioria.

**Histórico:** cada lançamento registra data e hora, situação, progresso e uma
nota do que mudou, e entra no topo da pilha sem apagar o anterior. Editar
dados cadastrais não inventa lançamento — só entra registro quando situação,
progresso ou nota mudam de fato.

**Filtro de prazo:** um calendário De/Até na barra lateral recorta os projetos
pelo **prazo de entrega**. Intervalo e chips de horizonte (100/30/7 dias)
descrevem a mesma janela por dois caminhos, então **o último a ser usado
manda**: escolher datas desativa os chips, escolher um chip limpa as datas.
Diferente do horizonte, o intervalo puxa também o que entrega **além dos 100
dias** e o que **já venceu** dentro da janela — quem pede "entregas de março"
quer exatamente isso.

**Exportar plano:** gera um documento A4 institucional em **PDF ou JPEG** com
os projetos em tela, respeitando os filtros em vigor. Traz os indicadores, a
linha de entrega e a lista com prazo, situação, responsável, progresso e o
último lançamento de cada projeto. Passa pelo mesmo ponto de construção nos
dois formatos, então PDF e JPEG não divergem entre si nem da tela.

**Linha de entrega:** uma barra por projeto posicionada numa escala de datas,
com a linha vertical do "hoje" atravessando todas. A barra é preenchida na
proporção do progresso e colorida pela situação — vermelho quando o prazo
venceu.

Projetos com prazo além do horizonte somem da lista; **os vencidos e não
entregues permanecem**, porque sumir com um projeto atrasado seria esconder
justamente o que precisa de atenção.

#### Onde os dados ficam

No `localStorage`, isto é, **no navegador de quem usa** — e a tela diz isso,
na caixa "Armazenamento".

A razão é que o site é público e não tem autenticação: um banco compartilhado
deixaria qualquer visitante criar, editar e apagar projetos. Enquanto não
houver back-end com login, o módulo oferece **exportar e restaurar em JSON**
para levar os dados de uma máquina a outra ou recuperá-los depois de uma
limpeza de cache. A restauração mescla por id, então não apaga o que já existe
no dispositivo.

Toda leitura e gravação passa por `lerProjetos()` / `gravarProjetos()`: trocar
o destino depois é mexer nessas duas funções, não na tela.

### Ramais

Lista telefônica do TCM-BA inteira, setor por setor: **213 ramais em 65
setores**, transcritos da lista oficial do Tribunal. Lista de consulta que vem
com o sistema (`dados/ramais.js`), igual para todo mundo e sem nada a gravar por
navegador.

**Uma caixa por setor, em três blocos.** A lista oficial cobre três lugares que
não se discam do mesmo jeito, e a tela os separa em faixas, cada uma com as
caixas dos seus setores na ordem do documento:

| Bloco | Setores | Ramais | Como se disca |
| --- | --- | --- | --- |
| Prédio Sede | 35 | 138 | Ramal de cinco dígitos; de fora, `71 3115-` e os quatro últimos |
| Prédio Anexo (DNOCS) | 13 | 46 | Ramal interno do prédio; a lista oficial não publica o número externo |
| Inspetorias Regionais | 17 | 29 | O número da lista já é o telefone público da inspetoria, com DDD |

Conferir a tela contra o documento oficial é ler de cima a baixo — a ordem é a
mesma. A única exceção é a caixa da DTI, onde os dois pontos de entrada da
operação vêm antes dos nomes, pelo mesmo motivo do bloco do topo da tela.

**A regra de entrada vem antes da lista.** O bloco do topo traz a porta de
entrada da operação da TI — Infra e Suporte, ramal 54631 — com o aviso de que
chamado, incidente e solicitação de rotina passam por ali. Uma lista de
telefones que começa pelos nomes convida a ligar direto para a pessoa, que é
justamente o que a norma pede para não fazer na rotina.

**Quase todo ramal disca.** Cada número é um link `tel:` com DDD e prefixo
completos, então no celular um toque liga: o ramal 54535 do sede vira
`+55 71 3115-4535`, e o telefone de uma inspetoria vai como está na lista. A
exceção é o prédio anexo: sem número externo publicado, o ramal aparece em
moldura tracejada e sem link — deduzir um prefixo faria o toque ligar para o
lugar errado, que é pior do que não ligar.

**Busca pelo campo do topo**, por nome, por ramal, por setor ou por prédio:
procurar "gecoc" traz a caixa inteira, "anexo" traz o prédio todo, "5667" traz a
pessoa e "36252417" acha o telefone que a lista escreve como `(75) 3625-2417`.
Cada módulo guarda a sua própria busca, então trocar de tela não carrega o termo
de um para o outro.

A linha de apoio ou de recepção de cada setor fica destacada na caixa — é por
onde se começa quando não se procura ninguém em particular —, e os dois números
que se procura sem querer procurar, Sessão do Plenário (54665) e Sistema e-TCM
(55670), ficam como atalhos logo abaixo da porta de entrada.

Quatro ramais da DTI vêm da lista de atendimento da própria Diretoria e não
constam da lista oficial: ficam marcados com o selo **interno**, para que a
diferença entre o documento e o uso do dia a dia seja visível em vez de
silenciosa.

### Estrutura DTI

Organograma da Diretoria de Tecnologia da Informação em **duas visões**, no
alternador do topo da tela: **estrutura atual** e **estrutura sugerida**.
Material de consulta que vem com o sistema (`dados/estrutura.js`), igual para
todo mundo e sem nada a gravar por navegador — desenho de estrutura se decide
em ato do Tribunal, não no `localStorage` de quem abriu a tela.

A tela tem duas coisas e só: **o fluxograma** e **a lista de quem está em cada
unidade**. Nenhum texto corrido, nenhum comparativo, nenhuma nota — a leitura é
o desenho.

**Esqueleto fixo.** Na estrutura atual, de cima para baixo: **Diretor → chefes
de divisão (DAS-4) → Gerentes de TI (DAS-3)**, com a **Seção de Atendimento ao
Usuário** dentro da Divisão de Infraestrutura Tecnológica, porque é onde ela
está e quem a chefia é um gerente.

**Cada gerência tem a sua caixa**, com o selo do cargo comissionado e o nome de
quem responde em azul no título. Na estrutura atual os três DAS-3 da Divisão de
Desenvolvimento de Sistemas aparecem assim, um em cada caixa, e sem linha de
apoio: a relação de lotação não declara o escopo de nenhuma das três, e
preencher a linha com "escopo a definir" repetido três vezes seria ocupar o
desenho com o que ele não sabe. Na minuta, as frentes são da unidade e não de
pessoas: o Núcleo de Desenvolvimento de Sistemas declara `frentes` —
Desenvolvimento, Sustentação e Modernização de Sistema — e cada uma ganha uma
caixa com o nome da frente e nada mais.

**Uma medida e uma cor para toda caixa, e o destaque só no topo.** Com cinco
camadas na mesma árvore, largura e cor diferentes em cada uma faziam a mesma
linha parecer desalinhada e o desenho, desorganizado — e a profundidade já se lê
pela posição e pelos conectores, que é para isso que eles existem. Todas as
caixas são iguais: 182px, fundo azul-claro institucional e borda superior navy
mais grossa. Só a caixa de onde o desenho parte — a Diretoria na estrutura
atual, a Superintendência na minuta — sai do padrão, em painel navy cheio com a
borda vermelha institucional.

Duas distinções sobrevivem, e nenhuma é de camada: unidade que a **minuta cria**
fica com a mesma caixa **tracejada**, porque a proposta cria cinco unidades e
mantém as outras, e o **título da caixa de gerência** segue no azul dos
responsáveis, porque ali ele é nome de pessoa e não de unidade. As classes de
camada continuam no HTML (`--unidade`, `--diretoria-filha`, `--nucleo`,
`--gerencia`) como marca do nível, para a busca e para o teste, sem cor nem
medida próprias.

**Na estrutura atual, o nome de quem responde pela unidade vai em azul, em linha
própria** — é o que se procura primeiro em um organograma, e em cinza de apoio
ele se perdia entre o cargo e a contagem de pessoas. Chefia sem titular aparece
em cor de aviso, não em azul: não é nome, é pendência. A caixa traz ainda o
nível do cargo e o quadro em números; nome de quem não é chefia ou gerência não
aparece no desenho.

**A minuta, ao contrário, desenha estrutura e não pessoas.** Nenhuma unidade
dela declara quadro nominal: cada caixa traz no selo o nível e o cargo que o
ocupa — `DIRETORIA · DAS-4`, `COORDENAÇÃO · DAS-3`, `NÚCLEO · TERCEIRIZADOS` e,
no Banco de Dados, `NÚCLEO · EFETIVOS` —, e o único nome do desenho é o do
titular de hoje na Superintendência. Não há contagem de pessoas na caixa, nem
chamada de equipe, nem caixa clicável: sem quadro nominal não há lista para
abrir. Enquanto a criação de unidade e a designação de chefia dependem de ato,
lotar nomes na proposta daria por decidido o que não está — quem quiser ver
quem está onde hoje usa a estrutura atual, que é onde esse dado existe.

**Ao lado do topo, um balão com o total de cargos**, e a cor diz de que número
se trata. Na estrutura atual ele é **vermelho** e conta o quadro que está em
tela — 59 hoje —, derivado das unidades a cada carga: acrescentar ou remover uma
pessoa move o balão junto, e um total gravado à mão envelheceria na primeira
atualização. Na minuta ele é **verde, com seta**, e traz os **45 cargos**
informados pela Diretoria, que não é conta do sistema — a relação de lotação tem
16 pessoas e a alocação 43. Vermelho é o que existe, verde é o que se propõe.

O balão fica em posição absoluta dentro de um invólucro da largura do quadro,
para não deslocar o topo do eixo vertical da árvore, e entra na medida de folga
da folha, senão passaria da margem no papel.

Quem controla os dois comportamentos é o arquivo de dados, não a tela: a visão
declara `estrutural: true` e `totalDeCargos`, e cada unidade declara `cargo` —
com ele, a caixa vira posição; sem ele, mostra o titular, como na estrutura
atual.

**A estrutura sugerida.** A Diretoria passa a **Superintendência de Tecnologia
da Informação**, e abaixo dela ficam **duas Diretorias**:

- **Diretoria de Tecnologia da Informação**, que recebe a operação de hoje com
  a camada renomeada para **Coordenação**: **Coordenação de Sistemas (COSIS)**,
  ex-DDES, **Coordenação de Infraestrutura (COINFRA)**, ex-DINT, e
  **Coordenação de Suporte Técnico (COSTEC)**, ex-SEATU, as três no mesmo
  nível. Sob a Coordenação de Sistemas ficam três Núcleos: o **Núcleo de
  Desenvolvimento de Sistemas**, que reúne as três gerências (DAS-3) de hoje
  com a frente de cada uma declarada — liderança técnica, sustentação e
  modernização —, o **Núcleo de Banco de Dados**, ex-DBAD, com a chefia e o
  quadro de hoje, e o **Núcleo de UX/UI**, novo;
- **Diretoria de Projetos de TIC**, nova, com a **Coordenação de Processos de
  TIC** e a **Coordenação de Governança Digital e Segurança da Informação**.

O cargo de cada camada vem declarado no desenho: **Diretoria em DAS-4,
Coordenação em DAS-3 e Núcleo com equipe contratada** — com uma exceção
decidida pela Diretoria, o **Núcleo de Banco de Dados**, que fica com os dois
analistas efetivos de hoje, porque a administração das bases corporativas
continua em quadro próprio. O **Núcleo de Desenvolvimento de Sistemas**, esse
sim terceirizado, é conduzido por três gerências DAS-3, o que explica um Núcleo
de equipe contratada com três comissionados no quadro; a explicação está nas
premissas, no arquivo de dados.

**Nenhuma unidade existente é extinta ou perde quadro:** o que muda é a
denominação da camada de operação, o nível do Atendimento e a criação da segunda
Diretoria. Três movimentos têm razão declarada no arquivo de dados: o
**Atendimento sai de dentro da Infraestrutura** e passa ao mesmo nível das
outras Coordenações, porque é a porta de entrada de toda a área e encaminha
chamado para as duas; o **Banco de Dados desce a Núcleo sob a Coordenação de
Sistemas**, onde a prioridade do dado se decide junto com a do sistema que ele
sustenta, em vez de negociada entre unidades de mesmo nível; e a **Coordenação
de Governança Digital e Segurança da Informação** reúne o que hoje é acúmulo —
governança de TI, exercida pela Diretoria junto com a direção da área, e
segurança da informação, exercida pela Infraestrutura, que opera o ambiente que
deveria avaliar.

A equipe técnica segue ligada à Coordenação de Sistemas, e não distribuída
entre as três frentes: nem a relação de lotação nem a alocação dizem a qual
delas cada técnico responde, e inventar a distribuição seria transformar uma
pendência do levantamento em dado.

**O que a minuta não pressupõe.** A chefia das duas Diretorias, das Coordenações
novas e dos Núcleos fica a designar — no Núcleo de Desenvolvimento de Sistemas
a liderança técnica declarada pode acumulá-la, e isso é decisão da Diretoria —, e a Diretoria de Projetos de TIC, as suas
duas Coordenações e o Núcleo de UX/UI nascem sem quadro declarado: compô-los
exige remanejamento ou provimento, e o cargo comissionado correspondente a
Coordenação e a Núcleo depende do ato de criação — os três são atos do Tribunal.
As duas unidades sob a Diretoria de Projetos vêm como Coordenação por coerência
com a camada; se a Diretoria preferir mantê-las como Divisão, muda a
denominação, não o desenho. As siglas COSIS, COINFRA, COSTEC, NBD, NUX, DPTIC,
COPRO e COGOV são propostas — a denominação oficial vem no ato de criação.
**Informação gerencial e painéis seguem sem unidade responsável** nesta versão,
a definir entre Processos de TIC, Núcleo de Banco de Dados e Governança
Digital; a lacuna está registrada nas premissas, no arquivo de dados.

**Na estrutura atual, a equipe abre no clique.** Clicar na caixa de uma unidade
abre, abaixo do desenho, a equipe alocada nela. Um painel por vez, e sempre no mesmo lugar:
assim nenhuma caixa se mexe quando alguém abre uma divisão — a caixa que se
quer ler não sai do lugar debaixo do cursor. A caixa aberta fica marcada e a
chamada muda de "ver equipe alocada (36)" para "ocultar equipe (36)"; unidade
sem quadro além da chefia diz isso na própria caixa, em vez de abrir um painel
vazio. Esc, o × do painel e um segundo clique na mesma caixa dispensam a lista.

No painel os nomes vêm em colunas e em três blocos — **gerências (DAS-3),
relação de lotação e equipe técnica** —, com matrícula, vínculo e cargo para
quem vem da relação de lotação, e perfil de senioridade (mais a função
declarada, quando há) para quem vem da alocação. A distribuição por perfil fica
no título do bloco técnico: "1 master · 12 sêniores · 3 plenos · 7 juniores · 3
estagiários".

**Duas relações, contadas separadamente.** Na estrutura atual, a linha de apoio
do título resume o desenho em números: unidades, total de pessoas, quantas vêm
da **relação de lotação** (com vínculo) e quantas da **equipe técnica** (alocada
por perfil). Somá-las em um número só apagaria a diferença entre quadro próprio
e equipe alocada — hoje são **16 e 43**, e a proporção é o dado: a operação
contínua é contratada. Na minuta, onde não há quadro nominal, a mesma linha
conta o que ela tem: **unidades e cargos**.

**As respostas das Divisões ao levantamento da Presidência** (agosto de 2026)
trouxeram o que a alocação inicial não tinha: a **equipe da DINT** (14 pessoas
na Divisão mais a gerência na Seção — três postos de infraestrutura, quatro de
apoio aos sistemas, quatro de transmissão e eventos e dois estagiários) e a
**equipe da DBAD** (o Chefe, uma analista do quadro e três postos de banco de
dados). O mesmo documento **fechou duas pendências** que a relação de lotação
deixava abertas: o cargo do Chefe da DBAD, declarado como DAS-4, e o quadro de
atendimento — a resposta da DINT informa que a Seção deixou de constituir
chefia autônoma e que a equipe de atendimento está lotada na Divisão. O
organograma mantém a Seção enquanto não houver ato que a extinga, e registra a
informação na observação da unidade.

**A árvore é `<ul>` aninhado com os conectores em CSS**: sem biblioteca, sem
canvas e sem posição calculada em JavaScript, o desenho acompanha o texto
quando a fonte muda de tamanho, sobrevive ao zoom e continua legível impresso.
Em tela estreita ele rola dentro do próprio quadro, sem empurrar a página, e
abre centrado na raiz.

**A busca destaca, não recorta.** Com um termo em vigor, o fluxograma continua
mostrando a estrutura inteira e acende as caixas correspondentes. Como na
estrutura atual os nomes estão atrás de um clique, um termo que case com pessoa
**abre sozinho** o painel da unidade dela e destaca quem bate; quando o termo deixa de casar com alguém, o
painel que a busca abriu se fecha — o que foi aberto à mão fica aberto. Procura
por unidade, sigla, pessoa, matrícula, cargo, perfil de senioridade, função
declarada ou vínculo: "217406" traz a pessoa, "Sênior IV" traz os dois perfis,
"QA" traz quem responde por QA e requisitos.

**Exportar estrutura em PDF e JPEG.** Mesmo caminho dos demais módulos: o
botão no cabeçalho abre o diálogo de formato e o documento é montado em HTML no
tamanho real, rasterizado e entregue nos dois formatos pelo mesmo ponto de
construção — PDF e JPEG não divergem entre si nem do que está em tela.

A folha é **A4 paisagem**, e não retrato como o extrato do plano: um
organograma de cinco níveis em retrato obrigaria a comprimir as caixas até o
nome da pessoa não caber. Traz o cabeçalho institucional, o título da visão com
os números, **o mesmo organograma que está em tela** — desenhado pela mesma
função, em modo de papel: sem botão, sem chamada de ação e sem caixa aberta — e
a **equipe de cada unidade** listada com cargo, matrícula, vínculo ou perfil de
senioridade. Na minuta, onde não há quadro nominal, essa seção vira **cargos
por unidade**: nível, cargo, as frentes declaradas e o que a proposta diz sobre
a composição de cada uma. A folha sai branca mesmo com o app no tema escuro, porque os
tokens de cor são redefinidos dentro dela em vez de a árvore ser redesenhada.

**Quando a árvore não cabe na largura da folha, ela é reduzida em bloco** — a
minuta, com cinco camadas, passa dos 1027px úteis da A4 paisagem. Estreitar as
caixas até caberem quebraria o nome da unidade em quatro linhas e deixaria o
desenho mais alto que a página; reduzir a escala mantém a proporção do que está
em tela, que é o que se faz ao levar um organograma grande para o papel. A
medida é a extensão real das caixas, e não `scrollWidth`: a árvore é um flex
centralizado, e o que transborda à esquerda não entra nessa conta — foi assim
que a primeira caixa apareceu cortada na primeira tentativa.

No papel, a sigla é o título da caixa e o nome da unidade desce para a linha
seguinte: a mesma informação, na ordem que o espaço permite. O cabeçalho
acompanha a unidade do topo da visão — na minuta o topo é uma Superintendência,
e o cabeçalho não pode anunciar uma Diretoria. E **a minuta sai carimbada** — "MINUTA DE PROPOSTA · sem valor de ato administrativo" —, porque
um organograma proposto impresso sem ressalva circula como se fosse a estrutura
vigente.

**O que o arquivo de dados guarda além do que a tela mostra.** O levantamento
completo continua em `dados/estrutura.js` — atribuições de cada unidade,
pendências ("chefia a confirmar", "quem executa o primeiro nível"), as
premissas da minuta e a lista do que ela muda. Nada disso é exibido hoje: fica
como registro, e o cabeçalho do arquivo diz exatamente quais campos a tela lê,
para que quem editar a estrutura não procure na interface um campo que ela
ignora.

### Tarefas

Quadro de tarefas por status, no formato de colunas: **A fazer → Em andamento →
Em revisão → Concluída**. Cada tarefa entra com **categoria, unidade da DTI,
responsável, prazo e prioridade**, e o cartão mostra na própria coluna o que
basta para decidir se ela precisa de atenção agora.

**As colunas e as categorias vêm de `dados/tarefas.js`**, porque são
vocabulário institucional e iguais para todo mundo; as tarefas são digitadas na
tela e ficam no armazenamento do navegador, como os projetos do Plano 100 dias.
A ordem do arquivo é a ordem do quadro, e o `id` de cada coluna é o que fica
gravado em cada tarefa — renomear o rótulo não mexe no que está salvo. A última
coluna é a de **encerramento**: é ela que diz ao quadro o que não conta mais
como pendência, e é dela que saem as contagens de "em aberto".

**Sete categorias**, cada uma com a família de cor que a etiqueta usa em tela —
Sistemas, Infraestrutura, Banco de dados, Atendimento, Contratos e
fornecedores, Governança e segurança, Gestão e pessoal. As cores vêm dos tokens
que o resto do sistema já usa, de modo que a etiqueta acompanha o tema claro e o
escuro sem cor nova em lugar nenhum. Acrescentar categoria é acrescentar uma
linha no arquivo de dados. A **unidade da DTI** é a mesma etiqueta do Plano 100
dias (`DDES`, `DINT`, `DBAD`), para que a mesma pergunta — "de quem é isto?" —
se responda igual nos dois módulos.

**Controle de prazos.** O quadro é organizado por etapa e, sozinho, não responde
o que vence primeiro: uma tarefa a dois dias do prazo fica na mesma coluna de
outra sem data nenhuma. A faixa acima do quadro lê o mesmo quadro pelo eixo do
tempo — quantas vencidas, quantas dentro da janela de aviso, quantas no prazo —
e nomeia a mais próxima do vencimento, com responsável e data. É dela que se
cobra na reunião.

A tarefa passa por três situações de prazo, decididas em um só lugar
(`situacaoDePrazoTarefa`), de onde o cartão, a ordenação da coluna e a faixa
leem. Com três cálculos separados, um cartão ficaria âmbar enquanto o contador
o daria como no prazo.

| Situação | Quando | O que aparece |
| --- | --- | --- |
| **Vencida** | o prazo passou e a tarefa não foi encerrada | etiqueta vermelha e borda vermelha no cartão |
| **Vencendo** | vence hoje ou dentro de **7 dias** | etiqueta âmbar e borda âmbar no cartão |
| **No prazo** | tem prazo, e ele está além da janela | etiqueta azul |

**O prazo no cartão é sempre etiqueta, nunca texto solto.** É o único dado do
cartão que muda de sentido com o tempo, e em texto corrido ele se perdia entre
o responsável e a última nota. A cor diz o que fazer — **azul** enquanto há
folga, **âmbar** dentro da janela de aviso, **vermelho** vencido — e a mesma
escala vale na faixa de controle, na situação do painel e na folha de
extração, de modo que a cor significa o mesmo em qualquer lugar do módulo.
Tarefa **encerrada** não recebe etiqueta: fica a data em texto, porque o prazo
dela virou histórico e uma etiqueta azul diria que ainda há algo correndo.

A janela de sete dias é o ciclo de quem acompanha o quadro uma vez por semana:
com menos, uma tarefa poderia vencer entre duas conferências sem nunca ter
aparecido como próxima do prazo. É a constante `JANELA_PRAZO_TAREFA`.

Dentro da coluna, a ordem é **vencida → vencendo → prioridade → prazo mais
próximo**. O que está a três dias de vencer cobra mais do que uma prioridade
alta sem data.

**Mover a tarefa tem três caminhos, e os três chamam o mesmo código.** Arrastar
o cartão para a coluna (com a coluna de destino realçada enquanto o cartão está
no ar), as **setas de coluna anterior e seguinte** no pé de cada cartão, e os
**botões de destino** no painel da tarefa. Arrastar não funciona com teclado e
funciona mal no celular; as setas resolvem os dois casos, e por isso não são um
extra — são o caminho principal em metade dos usos.

**Dentro da coluna, a ordem é a da cobrança:** atrasada primeiro, depois por
prioridade, depois pelo prazo mais próximo, e o resto pela ordem de lançamento.
Tarefa com prazo vencido ganha **borda vermelha** e a etiqueta vermelha no
cartão ("venceu há 3 dias"), e o cabeçalho da coluna diz quantas estão
atrasadas. Concluída não recebe marca de atraso: o prazo dela já passou a ser
histórico.

**Histórico por tarefa.** Cada movimento entre colunas entra no histórico com
data, hora e a coluna de destino, e o painel tem um campo para lançar o que
mudou sem mexer no status. A nota do último lançamento aparece no cartão — mas
só depois do primeiro andamento, porque a nota de lançamento repetida em todo
cartão diria apenas o que a coluna já diz.

**Prazo lançado do próprio painel.** O prazo é o campo que mais muda depois que
a tarefa nasce — prorroga, antecipa, chega quando não havia — e abrir o
formulário inteiro para trocar uma data fazia com que a data não fosse trocada.
O painel traz o campo com o prazo gravado, o botão **Lançar prazo**, o
**Sem prazo** para removê-lo, e ao lado, em palavras, a mesma situação que a cor
do cartão indica no quadro ("vence hoje", "em 4 dias", "venceu há 3 dias").
Enter no campo também lança.

**Mudar prazo é lançar**, no sentido que o módulo já dá à palavra: a alteração
entra no histórico com a data anterior — "Prazo alterado de 20/09/2026 para
25/09/2026", "Prazo removido (era 20/09/2026)". Prazo que muda sem deixar rastro
é prazo que ninguém consegue cobrar depois.

**A tarefa em imagem.** O botão **Baixar imagem** no painel gera um JPEG de uma
tarefa só, pelo mesmo caminho das demais extrações do sistema — folha montada em
HTML no tamanho real (840 px), rasterizada pelo `html2canvas`. A folha leva o
cabeçalho institucional, as etiquetas de categoria, unidade e prioridade alta, o
título, a descrição como foi escrita, o quadro de status, responsável,
prioridade e unidade, a **caixa do prazo na cor da situação** e os seis últimos
lançamentos do histórico (com a contagem do que ficou de fora). Serve para o que
a tela não faz: mandar a tarefa por mensagem a quem não abre o painel. O arquivo
sai como `tarefa-<título>-<data>.jpg`.

**Filtro por categoria** na barra lateral, com a contagem de cada uma e a opção
de mostrar todas; e a busca do módulo alcança título, descrição, responsável,
categoria e unidade. As duas se combinam, e o vazio explica qual das duas
deixou o quadro sem nada.

**A carteira inicial vem da Diretoria.** As primeiras tarefas foram informadas
em 14/09/2026 e entram por semente, aplicada uma vez por navegador e mesclada
por id: mover de coluna, editar ou apagar uma tarefa semeada não é desfeito no
carregamento seguinte. O **título é a ação** e a **descrição guarda o texto como
a Diretoria o escreveu** — reescrever a demanda sem deixar o original em algum
lugar transformaria a interpretação de quem lançou em registro. A descrição
**preserva as quebras de linha**: uma estratégia com curto, médio e longo prazo
chega estruturada, e virar parágrafo corrido apagaria justamente a estrutura.

### Equipe e projetos

Alocação da equipe de desenvolvimento por **célula de projeto**, uma caixa por
célula. Lista de consulta que vem com o sistema (`dados/equipes.js`), igual para
todo mundo e sem nada a gravar por navegador. A primeira unidade carregada é a
**DDES — Divisão de Desenvolvimento de Sistemas**, com 34 pessoas em 8 células,
na relação de setembro de 2026.

**A tela responde a uma pergunta: onde está a gente.** Por isso ela abre pelo
panorama — quatro números da Divisão e as barras de pessoas por célula, em ordem
decrescente — e só depois abre as caixas. As caixas seguem a mesma ordem: um
quadro de alocação que começa pela célula de uma pessoa esconde onde o esforço
está concentrado.

**Cada caixa traz a célula inteira:** os sistemas que ela atende, o líder em
primeiro lugar e destacado, e cada pessoa com a função principal, o perfil de
senioridade (ou o cargo, para quem é efetivo, comissionado ou cedido) e o
vínculo. Os estagiários aparecem na célula em que atuam, separados por um
divisor e fora da contagem do quadro — é como a relação de origem os trata.

**O vínculo é a única coisa desenhada em cor**, porque é a única em que a
proporção decide antes do número: uma célula inteira de terceirizados é risco de
contrato, e isso precisa saltar aos olhos antes de ser lido. A barra de
composição no topo de cada caixa vem com os números escritos ao lado, então quem
não distingue as cores lê a mesma informação. Os quatro tons foram validados
para daltonismo e contraste contra a superfície dos dois temas.

**Célula de uma pessoa fica marcada** com uma faixa no canto esquerdo: é a
equipe inteira de um sistema dependendo de uma agenda só. A tela aponta; a
decisão é do gestor.

**Filtro por projeto**, em chips acima das caixas. É por ele que se imprime a
equipe de um projeto só: escolha **FAROL**, exporte, escolha **Novo SICCO**,
exporte. Os chips são cumulativos — dá para selecionar dois ou três projetos —,
e **Todos os projetos** limpa a seleção.

Com **um único projeto em tela**, a folha exportada muda de forma: o título passa
a ser *Equipe do projeto FAROL*, o panorama comparativo sai (uma barra sozinha
não compara nada), a equipe ocupa a largura da página em duas colunas e o
arquivo leva o nome do projeto — `equipe-projetos-ddes-farol-tcm-ba-AAAA-MM-DD`.
Quem exporta oito equipes seguidas precisa distinguir os arquivos na pasta.

Os quatro números do topo **acompanham o filtro**: com o FAROL escolhido, eles
falam do FAROL. A tela e a folha exportada usam a mesma função para calculá-los,
de propósito — com dois cálculos separados, filtrar um projeto mostraria 7
pessoas na tela e 34 no documento, e o documento é o que vai para a reunião. O
subtítulo, esse, não acompanha: ele é o cabeçalho da unidade e diz de qual
Divisão a tela trata.

**Busca pelo campo do topo**, por pessoa, célula, sistema, função ou vínculo:
procurar "sicco" traz as células do SICCO inteiras, "QA" traz só quem testa, e
as barras do panorama acompanham o filtro — filtrado por QA, elas passam a
mostrar onde os QA estão.

A chefia da Divisão fica fora das células, em faixa própria: ela responde pela
DDES inteira, e virar mais uma caixa diria que existe um projeto chamado DDES.

**Exportação em PDF e JPEG**, pelo botão do cabeçalho. A folha sai em **A4
paisagem**: nomes de servidor são longos — "Lourival Magalhães Nascimento Neto",
com função e perfil na mesma linha — e em retrato cada pessoa quebraria em duas
linhas, dobrando a altura da lista. O documento traz o panorama, os quatro
números da Divisão, a chefia e a equipe de cada célula, com a marca
institucional e a data.

Três cuidados que o documento tem e a tela não precisa ter:

| Cuidado | Por quê |
| --- | --- |
| As três colunas são montadas em JavaScript, distribuindo cada caixa na coluna mais curta | Na tela quem faz isso é o CSS multicoluna, que o `html2canvas` rasteriza de forma imprevisível: a mesma folha sairia com a última caixa cortada em uma captura e inteira na seguinte |
| Nenhuma caixa atravessa a dobra da página | A paginação do PDF é um corte cego na imagem da folha. Sem o ajuste, o corte cai no meio de um nome. Cada caixa que atravessaria é empurrada inteira para a página seguinte |
| A folha filtrada sai carimbada **RECORTE FILTRADO**, com o termo da busca | Um documento filtrado que se apresenta como quadro completo é pior do que documento nenhum |

A exportação respeita o filtro em vigor: exporta o que está em tela. Com 34
pessoas a folha ocupa duas páginas em PDF; unidades menores cabem em uma.

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

### Ocultando um compromisso do painel

Nem tudo que está na agenda pessoal deve aparecer no painel — ainda mais com o
endereço aberto. `server.js` e `api/calendar.js` removem os compromissos
ocultos **no servidor**, antes de o ICS chegar ao navegador: esconder apenas na
renderização deixaria o evento legível para quem abrisse `/api/calendar`
direto.

Duas formas, ambas no topo dos dois arquivos:

| Mecanismo | Quando usar |
| --- | --- |
| `UIDS_OCULTOS` | Um compromisso específico. O identificador está na linha `UID:` do próprio ICS. |
| `MARCADORES_PRIVADOS` | Qualquer título que contenha o marcador (padrão: `#privado`, `#pessoal`). Permite ao titular ocultar sozinho, só acrescentando o marcador ao título no Google. |

O filtro desdobra as linhas do ICS antes de comparar (RFC 5545 §3.1), de modo
que um título longo o bastante para ser quebrado pelo Google não escapa da
checagem, e preserva o restante do arquivo — cabeçalho, `VTIMEZONE` e demais
componentes — exatamente como veio.

> **O que ele não faz:** nada é alterado no Google. O evento continua íntegro
> na agenda do titular, com convidados e notificações intocados — e continua
> visível no **endereço público do próprio Google**, que não passa por este
> proxy. Para retirá-lo também de lá, marque o evento como privado no Google
> ou despublique a agenda.

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
- **Classificação automática**: função centralizada `classificarEvento(evento)` em `script.js`. A **rubrica declarada em `CATEGORIES` no próprio evento do calendário tem precedência** sobre a heurística — quando a categoria é marcada no calendário de origem, ela já respondeu a pergunta, e adivinhar por palavra-chave só pode errar ("Audiência com o Prefeito de Ilhéus" marcada como Presencial é uma audiência no gabinete, não uma viagem a Ilhéus). Sem rubrica declarada, avalia título, descrição, local e link por palavras-chave, na ordem: viagem → online → presencial (fallback quando nada é identificado). A lista de cidades que caracterizam viagem não inclui a sede — endereço na própria cidade é compromisso local, não deslocamento.

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
- Intervalo de datas ("De"/"Até"). **Tem precedência sobre o período**: os dois
  controles recortam a mesma coisa — uma janela de tempo — e aplicá-los em
  conjunto produzia lista vazia sempre que a data escolhida não caísse dentro
  do período marcado (o caso comum: escolher outro dia com "Hoje" ainda ativo).
  Por isso digitar uma data devolve o período para "Todos", e clicar num
  período limpa as datas — nunca há dois recortes disputando a mesma janela.
- Modalidade (seleção múltipla): viagem, online, presencial. Com nenhuma marcada, todos os compromissos são exibidos; marcar uma ou mais restringe a lista a elas.
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

O dia é desenhado como **linha do tempo em escala**, não como lista de cartões.
A lista desperdiçava a imagem — com quatro compromissos de uma hora, dois terços
do card ficavam em branco — e escondia justamente o que interessa a quem abre o
card para marcar alguma coisa: onde estão os vazios.

- Cabeçalho em gradiente navy com a marca, o dia da semana, a data em corpo
  grande, a faixa **expediente ocupado** (primeiro início → último fim) e quatro
  indicadores: compromissos, ocupação, livre e conflitos. O de conflitos só fica
  vermelho quando há conflito.
- **Pista de 08:00 às 18:00**, com régua de horas e altura idêntica por hora: um
  compromisso de 3h ocupa o triplo de um de 1h. A faixa se estende sozinha
  quando há compromisso fora dela — senão um compromisso às 19h sumiria do card.
- **Janelas livres no lugar e no tamanho reais**, hachuradas, rotuladas com
  duração e horário juntos ("2h30 livre · 12:00 – 14:30"): só a duração
  obrigaria a conferir a régua para saber quando.
- Cada compromisso traz faixa de cor da modalidade, horário e duração em coluna
  monoespaçada, modalidade, local e selo de conflito quando houver. Blocos com
  menos de 100px colapsam para uma linha; sobrepostos dividem a pista em
  colunas. O nível de detalhe é decidido pelos pixels disponíveis, não pela
  duração em minutos.
- Compromissos de dia inteiro ou de vários dias não têm posição numa escala de
  horas: aparecem numa faixa acima da pista, que encolhe na medida.
- No formato feed, com 570px a menos, a escala é **recalculada** em vez de
  descartar blocos — todo o dia continua no card, mais comprimido.
- Períodos de vários dias não têm pista: uma escala de horas só significa algo
  dentro de um dia, então semana e mês continuam saindo como lista.

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
