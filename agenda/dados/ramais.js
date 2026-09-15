// Lista telefônica do TCM-BA. Vem com o sistema, como a carteira de contratos:
// é uma lista de consulta, igual para todo mundo, sem nada a gravar por
// navegador.
//
// A fonte é a lista telefônica oficial do Tribunal, transcrita por inteiro: o
// prédio sede, o prédio anexo (DNOCS) e as inspetorias regionais de controle
// externo. Cada setor do documento virou uma caixa, na ordem em que aparece lá
// — conferir a tela contra o original é ler de cima a baixo, sem procurar.
//
// Os três blocos não se discam do mesmo jeito, e é isso que `discagem` resolve:
//
//   "sede"      ramal de cinco dígitos (5XXXX). De fora, o prefixo 71 3115- e
//               os quatro últimos dígitos: o ramal 54535 é o (71) 3115-4535.
//   "interno"   ramal do prédio anexo (81XXX). A lista oficial não publica o
//               número externo desse bloco, então o ramal aparece sem link de
//               discagem: deduzir um prefixo faria o toque no celular ligar
//               para o lugar errado, que é pior do que não ligar.
//   "telefone"  o que a lista traz já é o telefone público da inspetoria, com
//               DDD. Onde o DDD não vem, é Salvador (71).

window.SAA_RAMAIS = {
  fonte: "Lista telefônica do TCM-BA",
  prefixo: "71 3115-",
  ddd: "71",

  // A regra de entrada vem antes da lista de propósito: o texto oficial diz
  // que rotina entra pelo 54631, e os ramais diretos são para quando já há
  // tratativa em curso. Uma lista sem essa regra convida a furar a fila.
  portaDeEntrada: {
    titulo: "Infra e Suporte",
    rotulo: "Porta de entrada — operação",
    ramal: "54631",
    nota: "Chamado, incidente e solicitação de rotina entram por aqui. Os ramais abaixo são para acionamento direto quando já houver tratativa em curso.",
  },

  atalhos: [
    { rotulo: "Sessão do Plenário", ramal: "54665" },
    { rotulo: "Sistema e-TCM", ramal: "55670" },
  ],

  blocos: [
    {
      id: "sede",
      nome: "Prédio Sede",
      discagem: "sede",
      nota: "Ramal de cinco dígitos; de fora, 71 3115- e os quatro últimos.",
      setores: [
        {
          nome: "Presidência — Cons. Nelson Pellegrino",
          itens: [
            { nome: "Aristides (Chefe de Gabinete)", ramal: "55622" },
            { nome: "Carmem", ramal: "54430" },
            { nome: "Anderson", ramal: "55618" },
            { nome: "Lúcia Magali", ramal: "55668" },
            { nome: "Robson Wilson", ramal: "54538" },
            { nome: "Celso", ramal: "54431" },
            { nome: "Caires", ramal: "54419" },
            { nome: "Claudionor", ramais: ["54402", "54434"] },
            { nome: "Assessoria", ramal: "55650" },
            { nome: "Mércia", ramal: "55653" },
          ],
        },
        {
          nome: "Vice-Presidência — Cons. Paulo Rangel",
          itens: [
            { nome: "Gaspar (Coordenador de Gabinete)", ramal: "55689" },
            { nome: "Mônica", ramal: "54659" },
            { nome: "Assessoria", ramal: "55601" },
            { nome: "Estagiários", ramal: "54488" },
          ],
        },
        {
          nome: "Gabinete do Conselheiro Corregedor — Cons. Plínio Carneiro",
          itens: [
            { nome: "José Leopoldino (Coordenador de Gabinete)", ramal: "54638" },
            { nome: "Manuela", ramal: "54530" },
            { nome: "Thiago", ramal: "54602" },
            { nome: "Karine", ramal: "55664" },
          ],
        },
        {
          nome: "Corregedoria",
          itens: [{ nome: "Sônia Maria", ramal: "54442" }],
        },
        {
          nome: "Gabinete do Conselheiro Ronaldo Sant'Anna",
          itens: [
            { nome: "Milene (Coordenadora de Gabinete)", ramal: "54540" },
            { nome: "Aline — Recepção", ramal: "54597" },
            { nome: "Assessoria — Conceição, Marcos, Jaime e Cláudio", ramal: "54423" },
            { nome: "Estagiários", ramal: "54623" },
            { nome: "Assessoria — Vánia, Viviane e Karina", ramal: "55603" },
          ],
        },
        {
          nome: "Gabinete da Conselheira Ouvidora — Cons.ª Aline Peixoto",
          itens: [
            { nome: "Nesmar (Coordenador de Gabinete)", ramal: "55676" },
            { nome: "Nice", ramal: "54437" },
            { nome: "Victor", ramal: "54655" },
            { nome: "Assessoria", ramal: "55660" },
            { nome: "Assessoria", ramal: "54639" },
          ],
        },
        {
          nome: "Gabinete da Conselheira Diretora da Escola de Contas — Cons.ª Camila Vasquez",
          itens: [
            { nome: "Fernanda (Coordenadora de Gabinete)", ramal: "54420" },
            { nome: "Apoio", ramal: "54428", geral: true },
            { nome: "Bruno", ramal: "54441" },
            { nome: "Hugo", ramal: "54439" },
          ],
        },
        {
          nome: "Superintendência de Planejamento e Gestão — SPG",
          itens: [
            { nome: "Nelma — Superintendente", ramal: "54649" },
            { nome: "Karen", ramal: "54596" },
          ],
        },
        {
          nome: "Superintendência de Controle Externo — SCE",
          itens: [
            { nome: "Marilene — Superintendente", ramal: "54658" },
            { nome: "Clícia", ramal: "55619" },
            { nome: "Assessoria SCE", ramal: "54632" },
            { nome: "Assessoria SCE", ramal: "54656" },
          ],
        },
        {
          nome: "Conselheiros Substitutos",
          itens: [
            { nome: "Apoio Auditores", ramal: "55658", geral: true },
            { nome: "Antonio Emanuel", ramal: "55610" },
            { nome: "Alex Aleluia", ramal: "54587" },
            { nome: "Antonio Carlos", ramal: "54409" },
            { nome: "José Ventin", ramal: "54549" },
            { nome: "Auditores", ramal: "54445" },
          ],
        },
        {
          nome: "Ministério Público de Contas",
          itens: [
            { nome: "Aline Paim (Procuradora)", ramal: "54547" },
            { nome: "Tiago", ramal: "55671" },
          ],
        },
        {
          nome: "Diretoria Administrativa e Financeira — DAF",
          itens: [
            { nome: "João Augusto — Diretor", ramal: "54551" },
            { nome: "Cristina", ramal: "54697" },
            { nome: "Manoel", ramal: "54417" },
            { nome: "Moara", ramal: "55683" },
            { nome: "Ana Margarethe", ramal: "55605" },
          ],
        },
        {
          nome: "Gerência de Contratos — GECOC",
          itens: [
            { nome: "Guilherme Almeida — Gerente", ramal: "55654" },
            { nome: "Apoio GECOC", ramal: "54637", geral: true },
          ],
        },
        {
          nome: "Gerência de Serviços Gerais — GESEG",
          itens: [
            { nome: "Lúcio — Gerente", ramal: "54435" },
            { nome: "Evilásio", ramal: "54433" },
            { nome: "Alexandre", ramal: "55657" },
          ],
        },
        {
          nome: "Seção de Transporte — SETRA",
          itens: [
            { nome: "Carlos Henrique — Chefe SETRA", ramal: "55655" },
            { nome: "Apoio SETRA", ramal: "54411", geral: true },
            { nome: "Apoio Motoristas", ramal: "54432" },
          ],
        },
        {
          nome: "Gerência de Material e Patrimônio — GEMAP",
          itens: [
            { nome: "Jorge — Chefe SEALM", ramal: "54421" },
            { nome: "Mônica — Gerente", ramal: "54416" },
          ],
        },
        {
          nome: "Diretoria de Planejamento e Gestão de Pessoas — DPP",
          itens: [
            { nome: "José Francisco Neto — Diretor", ramal: "55673" },
            { nome: "Daniele", ramal: "54594" },
            { nome: "Cristiane", ramal: "55611" },
            { nome: "Poliana", ramal: "54418" },
            { nome: "Kléber", ramal: "54633" },
          ],
        },
        {
          // A DTI é a casa de quem usa este painel: os quatro últimos ramais
          // não estão na lista oficial, vêm da lista de atendimento da própria
          // Diretoria, e ficam marcados para que a diferença seja visível em
          // vez de silenciosa.
          nome: "Diretoria de Tecnologia da Informação — DTI",
          // Aqui a ordem do documento cede: os dois pontos de entrada da
          // operação vêm primeiro, como no bloco do topo da tela.
          itens: [
            { nome: "Apoio SEATU", ramal: "54631", geral: true },
            { nome: "Suporte e-TCM — Apoio", ramal: "55670", geral: true },
            { nome: "Diego — Diretor", ramal: "55651" },
            { nome: "Mauro", ramal: "55624" },
            { nome: "Fabiana", ramal: "55609" },
            { nome: "Rafael", ramal: "54535" },
            { nome: "Diego", ramal: "54629" },
            { nome: "Aislan", ramal: "55663" },
            { nome: "Paula", ramal: "55614" },
            { nome: "Apoio", ramal: "55659" },
            { nome: "Lucas", ramal: "55666" },
            { nome: "Edvaldo", ramal: "55615" },
            { nome: "Adson", ramal: "55617" },
            { nome: "Raul", ramal: "55667" },
            { nome: "Eduardo", ramal: "55604" },
            { nome: "Vinícius", ramal: "55607" },
            { nome: "Apoio SEATU", ramal: "55661" },
            { nome: "Caique", ramal: "55684" },
            { nome: "Eduardo — Plenário", ramal: "54665" },
            { nome: "Sérvulo", ramal: "55656", interno: true },
            { nome: "Fabrício", ramal: "54550", interno: true },
            { nome: "Ian / Ivan", ramal: "55613", interno: true },
            { nome: "Estagiários", ramal: "55665", interno: true },
          ],
        },
        {
          nome: "Assessoria Jurídica — AJU",
          itens: [
            { nome: "Flávia — Chefia", ramal: "54546" },
            { nome: "Apoio AJU", ramal: "54603", geral: true },
            { nome: "Apoio AJU", ramal: "54650" },
          ],
        },
        {
          nome: "Secretaria Geral — SGE",
          itens: [
            { nome: "Ana Mendonça — Chefia", ramal: "54657" },
            { nome: "Apoio SGE", ramal: "54404", geral: true },
            { nome: "Apoio SGE", ramal: "55621" },
            { nome: "Apoio SGE", ramal: "54614" },
          ],
        },
        {
          nome: "1ª Diretoria de Controle Externo",
          itens: [
            { nome: "Marcelo — Chefia", ramal: "54647" },
            { nome: "Apoio 1ª DCE", ramal: "54642", geral: true },
            { nome: "Apoio 1ª DCE", ramal: "54635" },
            { nome: "Adriana", ramal: "54616" },
          ],
        },
        {
          nome: "2ª Diretoria de Controle Externo",
          itens: [
            { nome: "Felipe — Chefia", ramal: "54643" },
            { nome: "Apoio 2ª DCE", ramal: "54487", geral: true },
            { nome: "Apoio 2ª DCE", ramal: "55662" },
          ],
        },
        {
          nome: "1ª Divisão de Controle Externo",
          itens: [
            { nome: "Michel — Chefia", ramal: "54605" },
            { nome: "Hécia", ramal: "54636" },
            { nome: "Apoio 1ª DCOE", ramal: "54410", geral: true },
          ],
        },
        {
          nome: "2ª Divisão de Controle Externo",
          itens: [{ nome: "André — Chefia", ramal: "54627" }],
        },
        {
          nome: "3ª Divisão de Controle Externo",
          itens: [{ nome: "Igor — Chefia", ramal: "54646" }],
        },
        {
          nome: "4ª Divisão de Controle Externo",
          itens: [{ nome: "Juliana — Chefia", ramal: "54607" }],
        },
        {
          nome: "Assessoria Militar",
          itens: [
            { nome: "Coronel Xavier", ramal: "54695" },
            { nome: "Major Flávia", ramal: "55600" },
          ],
        },
        {
          nome: "Assessoria de Informações Estratégicas — AIE",
          itens: [
            { nome: "Valfredo", ramal: "55620" },
            { nome: "Hélio", ramal: "55672" },
            { nome: "Teotônio", ramal: "55693" },
            { nome: "Hélio", ramal: "55616" },
          ],
        },
        {
          nome: "Coordenação das Entidades Representativas — CER",
          itens: [
            { nome: "Luis Humberto", ramal: "54698" },
            { nome: "Anuska", ramal: "54622" },
          ],
        },
        {
          nome: "Cerimonial",
          itens: [{ nome: "Francisco Senna", ramal: "55677" }],
        },
        {
          nome: "Núcleo de Recursos Humanos — NRH",
          itens: [{ nome: "Daniela", ramal: "54696" }],
        },
        {
          nome: "GECPD, DDI e SEDOC",
          itens: [
            { nome: "Luís Júnior — Chefe", ramal: "54415" },
            { nome: "Apoio GECPD", ramal: "54483", geral: true },
            { nome: "SEDOC — Geral", ramal: "54548" },
            { nome: "Apoio DDI", ramal: "54604" },
            { nome: "Marta", ramal: "54641" },
          ],
        },
        {
          nome: "Assessoria de Comunicação Social — ASCOM",
          itens: [
            { nome: "Demóstenes", ramal: "55682" },
            { nome: "Priscila", ramal: "54444" },
          ],
        },
        {
          nome: "ASTECOM",
          itens: [
            { nome: "Manoel Cunha", ramal: "54534" },
            { nome: "Apoio ASTECOM", ramal: "54427", geral: true },
          ],
        },
        {
          nome: "Apoio e Serviços Gerais",
          itens: [
            { nome: "Manutenção Geral", ramal: "54581", geral: true },
            { nome: "Recepção — Térreo", ramal: "54612" },
            { nome: "Recepção — 4º andar", ramal: "54424" },
            { nome: "Recepção — 3º andar", ramal: "54452" },
            { nome: "Água e Limpeza", ramal: "55681" },
            { nome: "Copa — 3º andar", ramal: "54426" },
            { nome: "Copa — 4º andar", ramal: "55679" },
            { nome: "Lúcia", ramal: "54618" },
          ],
        },
      ],
    },

    {
      id: "anexo",
      nome: "Prédio Anexo (DNOCS)",
      discagem: "interno",
      nota: "Ramal interno do prédio anexo. A lista oficial não publica o número externo deste bloco.",
      setores: [
        {
          nome: "Diretoria de Controle de Atos de Pessoal — DAP",
          itens: [
            { nome: "Jailson — Diretor", ramal: "81011" },
            { nome: "Kleverson", ramal: "81010" },
            { nome: "Joandson", ramal: "81014" },
            { nome: "Hermínio", ramal: "81015" },
            { nome: "Adelmo", ramal: "81016" },
            { nome: "Mariana", ramal: "81017" },
            { nome: "Fábio", ramal: "81013" },
          ],
        },
        {
          nome: "3ª Diretoria de Controle Externo",
          itens: [
            { nome: "Vitor Maciel — Chefia", ramal: "81050" },
            { nome: "Recepção", ramal: "81051", geral: true },
            { nome: "Auditores", ramal: "81030" },
            { nome: "Auditores", ramal: "81053" },
          ],
        },
        {
          nome: "Gerência Financeira — GEFIN",
          itens: [
            { nome: "Danival — Gerente", ramal: "81035" },
            { nome: "Helena", ramal: "81036" },
            { nome: "José Pimentel", ramal: "81037" },
            { nome: "Luciano", ramal: "81038" },
            { nome: "Maria do Carmo", ramal: "81057" },
          ],
        },
        {
          nome: "Divisão de Gestão de Pessoas — DGEP",
          itens: [
            { nome: "Augusto — Chefia", ramal: "81058" },
            { nome: "Joanice", ramal: "81002" },
            { nome: "Gabriel", ramal: "81062" },
            { nome: "Ubérico", ramal: "81063" },
            { nome: "Ilana", ramal: "81042" },
            { nome: "Estagiário", ramal: "81059" },
            { nome: "Jailderson", ramal: "81060" },
            { nome: "Fabíola", ramal: "81044" },
            { nome: "Taís", ramal: "81061" },
          ],
        },
        {
          nome: "Gerência de Exame de Contas — GECON",
          itens: [
            { nome: "Alexandre", ramal: "81045" },
            { nome: "André", ramal: "81052" },
          ],
        },
        {
          nome: "Divisão de Planejamento e Controle de Auditoria — DPCA",
          itens: [{ nome: "Luís Leite", ramal: "81049" }],
        },
        {
          nome: "Divisão Executiva de Fiscalização de Auditoria — DEFA",
          itens: [{ nome: "Bartolomeu Jr.", ramal: "81048" }],
        },
        {
          nome: "Ouvidoria",
          itens: [
            { nome: "José de Araújo — Chefia", ramal: "81047" },
            { nome: "Apoio", ramal: "81046", geral: true },
          ],
        },
        {
          nome: "Diretoria de Assistência aos Municípios — DAM",
          itens: [
            { nome: "Alessandro — Diretor", ramal: "81041" },
            { nome: "Mariana", ramal: "81040" },
            { nome: "Sala Técnica", ramal: "81026" },
            { nome: "Sala Técnica", ramal: "81025" },
            { nome: "Apoio", ramal: "81039", geral: true },
          ],
        },
        {
          nome: "Assessoria de Controle Interno — ACI",
          itens: [
            { nome: "Sérgio — Chefia", ramal: "81055" },
            { nome: "Apoio ACI", ramal: "81056", geral: true },
          ],
        },
        {
          nome: "Comissão de Contratação — CDC",
          itens: [
            { nome: "Bruno — Chefia", ramal: "81031" },
            { nome: "Estagiário", ramal: "81033" },
            { nome: "Stephanie", ramal: "81032" },
          ],
        },
        {
          nome: "Escola de Contas — ECONT",
          itens: [
            { nome: "Cristiano — Chefia", ramal: "81028" },
            { nome: "Jumara", ramal: "81020" },
            { nome: "Valter", ramal: "81019" },
          ],
        },
        {
          nome: "Recepções — Prédio Anexo",
          itens: [
            { nome: "Recepção — 3º andar", ramal: "81027" },
            { nome: "Recepção — Térreo", ramal: "81024" },
          ],
        },
      ],
    },

    {
      id: "regionais",
      nome: "Inspetorias Regionais",
      discagem: "telefone",
      nota: "O número da lista já é o telefone público da inspetoria, com DDD.",
      setores: [
        {
          nome: "1ª IRCE — Salvador (DNOCS)",
          itens: [
            { nome: "José Aurelino — Inspetor", ramal: "3118-1021" },
            { nome: "Recepção", ramal: "3118-1022", geral: true },
          ],
        },
        {
          nome: "2ª IRCE — Feira de Santana",
          itens: [
            { nome: "Alessandro Araújo — Inspetor", ramal: "(75) 3625-2417" },
            { nome: "Apoio", ramal: "(75) 3622-4234", geral: true },
          ],
        },
        {
          nome: "3ª IRCE — Sto. Antônio de Jesus",
          itens: [
            { nome: "Clésio Pires — Inspetor", ramal: "(75) 3631-3059" },
            { nome: "Apoio", ramal: "(75) 3631-3488", geral: true },
          ],
        },
        {
          nome: "4ª IRCE — Itabuna",
          itens: [
            { nome: "Kátia Simone — Inspetora", ramal: "(73) 3211-1421" },
            { nome: "Apoio", ramal: "(73) 3613-8312", geral: true },
          ],
        },
        {
          nome: "5ª IRCE — Vitória da Conquista",
          itens: [
            { nome: "Ramon de Souza — Inspetor", ramal: "(77) 3424-4599" },
            { nome: "Apoio", ramal: "(77) 3424-4442", geral: true },
          ],
        },
        {
          nome: "6ª IRCE — Jequié",
          itens: [
            { nome: "Tiago Bentes — Inspetor", ramal: "(73) 3525-3524" },
            { nome: "Apoio", ramal: "(73) 3525-7751", geral: true },
          ],
        },
        {
          nome: "7ª IRCE — Caetité",
          itens: [
            { nome: "Samuel Saladino — Inspetor", ramal: "(77) 3454-1852" },
            { nome: "Apoio", ramal: "(77) 3454-3614", geral: true },
          ],
        },
        {
          nome: "8ª IRCE — Alagoinhas",
          itens: [{ nome: "Josival de Cristo — Inspetor", ramal: "(75) 3422-4206" }],
        },
        {
          nome: "9ª IRCE — Serrinha",
          itens: [
            { nome: "Robson de Araújo — Inspetor", ramal: "(75) 3261-2066" },
            { nome: "Apoio", ramal: "(75) 3261-2105", geral: true },
          ],
        },
        {
          nome: "11ª IRCE — Irecê",
          itens: [
            { nome: "Oscar Silva — Inspetor", ramal: "(74) 3641-3223" },
            { nome: "Apoio", ramal: "(74) 3641-3512", geral: true },
          ],
        },
        {
          nome: "12ª IRCE — Itaberaba",
          itens: [{ nome: "Gilson Marcio — Inspetor", ramal: "(75) 3251-2333" }],
        },
        {
          nome: "21ª IRCE — Juazeiro",
          itens: [
            { nome: "Rogério Cerqueira — Inspetor", ramal: "(74) 3611-4237" },
            { nome: "Apoio", ramal: "(74) 3613-5008", geral: true },
          ],
        },
        {
          nome: "22ª IRCE — Paulo Afonso",
          itens: [{ nome: "Jane Clécia — Inspetora", ramal: "(75) 3281-2629" }],
        },
        {
          nome: "23ª IRCE — Jacobina",
          itens: [
            { nome: "Agnelo das Mercês — Inspetor", ramal: "(74) 3621-3155" },
            { nome: "Apoio", ramal: "(74) 3621-0509", geral: true },
          ],
        },
        {
          nome: "25ª IRCE — Sta. Maria da Vitória",
          itens: [
            { nome: "Andresson André Moreira — Inspetor", ramal: "(77) 3483-1579" },
            { nome: "Apoio", ramal: "(77) 3483-1829", geral: true },
          ],
        },
        {
          nome: "26ª IRCE — Eunápolis",
          itens: [{ nome: "Lenival Gonçalves — Inspetor", ramal: "(73) 3281-2625" }],
        },
        {
          nome: "27ª IRCE — Barreiras",
          itens: [{ nome: "Gildaci Pereira — Inspetor", ramal: "(77) 3611-6220" }],
        },
      ],
    },
  ],
};
