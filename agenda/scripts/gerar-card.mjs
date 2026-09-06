/**
 * Gera o card JPEG da agenda de um dia, sem intervenção humana.
 *
 * A exportação do SAA é feita por html2canvas, que rasteriza o DOM dentro do
 * navegador — não existe DOM em um cron de servidor. Este script fecha essa
 * lacuna: sobe a aplicação localmente, abre um Chromium headless e aciona o
 * MESMO botão "Baixar JPEG" que a pessoa clicaria, capturando o arquivo que
 * o navegador baixaria. O card sai idêntico ao da tela porque é o mesmo
 * código que o produz — não uma segunda implementação que pode divergir.
 *
 * Uso:
 *   node scripts/gerar-card.mjs --ics <arquivo.ics> --data YYYY-MM-DD --saida <arquivo.jpg>
 *
 * Requer, no diretório de execução: playwright, html2canvas, jspdf, ical.js e
 * os pacotes @fontsource das três famílias. São servidos localmente porque o
 * ambiente de execução não alcança os CDNs.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_APP = path.resolve(AQUI, "..");

function arg(nome, padrao = null) {
  const i = process.argv.indexOf(`--${nome}`);
  if (i === -1 || !process.argv[i + 1]) {
    if (padrao !== null) return padrao;
    throw new Error(`Argumento obrigatório ausente: --${nome}`);
  }
  return process.argv[i + 1];
}

const CAMINHO_ICS = arg("ics");
const DATA_ALVO = arg("data");
const SAIDA = arg("saida");
const MODULOS = arg("modulos", process.cwd());
// A aplicação rasteriza a 1,5x para não sair serrilhado na tela. Para anexo de
// e-mail isso é peso morto: 1080px é a largura de projeto do card, e reduzir a
// ela derruba o arquivo de ~290 KB para ~70 KB — o que importa porque o anexo
// trafega em base64, ocupando um terço a mais.
const LARGURA_FINAL = Number(arg("largura", "1080"));

if (!/^\d{4}-\d{2}-\d{2}$/.test(DATA_ALVO)) {
  throw new Error(`--data precisa estar em YYYY-MM-DD; recebido: ${DATA_ALVO}`);
}

const PORTA_ICS = 8790;
const PORTA_APP = 8791;

// Procura a dependência primeiro onde a rotina a instalou (--modulos) e, se
// não achar, na instalação global do Node — o Playwright costuma estar lá, e
// um `npm install` no diretório de trabalho remove symlinks apontados para
// fora dele, o que já quebrou este script uma vez.
const RAIZES_DE_MODULOS = [
  path.join(MODULOS, "node_modules"),
  path.resolve(path.dirname(process.execPath), "..", "lib", "node_modules"),
];

function moduloLocal(...partes) {
  const tentados = RAIZES_DE_MODULOS.map((raiz) => path.join(raiz, ...partes));
  const achado = tentados.find((p) => existsSync(p));
  if (!achado) {
    throw new Error(`Dependência não encontrada em nenhuma raiz:\n  ${tentados.join("\n  ")}`);
  }
  return achado;
}

// As três famílias do projeto, nos pesos realmente usados pelo card. Sem elas
// o Chromium cairia em fontes genéricas e o JPEG sairia visivelmente diferente
// do que se vê na tela — justamente o que a exportação promete não fazer.
const FONTES = [
  ["IBM Plex Sans", 400, "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2"],
  ["IBM Plex Sans", 500, "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2"],
  ["IBM Plex Sans", 600, "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2"],
  ["IBM Plex Sans", 700, "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2"],
  ["IBM Plex Mono", 400, "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2"],
  ["IBM Plex Mono", 500, "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2"],
  ["IBM Plex Mono", 600, "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2"],
  ["Bitter", 600, "@fontsource/bitter/files/bitter-latin-600-normal.woff2"],
  ["Bitter", 700, "@fontsource/bitter/files/bitter-latin-700-normal.woff2"],
];

function cssDasFontes() {
  return FONTES.map(([familia, peso, rel]) => {
    const b64 = readFileSync(moduloLocal(...rel.split("/"))).toString("base64");
    return `@font-face{font-family:'${familia}';font-style:normal;font-weight:${peso};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  }).join("\n");
}

async function esperar(condicao, { tentativas = 60, intervalo = 500, oQue = "condição" } = {}) {
  for (let i = 0; i < tentativas; i++) {
    if (await condicao()) return;
    await new Promise((r) => setTimeout(r, intervalo));
  }
  throw new Error(`Tempo esgotado esperando: ${oQue}`);
}

// O ESM resolve `import` a partir do diretório do MÓDULO, não do processo, e
// este script vive dentro do repositório enquanto as dependências ficam onde a
// rotina as instalou. Por isso o Playwright é carregado pelo caminho explícito
// de --modulos, em vez de por nome.
async function carregarChromium() {
  const entrada = moduloLocal("playwright", "index.js");
  const mod = await import(pathToFileURL(entrada).href);
  // O playwright é CommonJS: o import dinâmico entrega os exports em `default`.
  const chromium = mod.chromium || mod.default?.chromium;
  if (!chromium) throw new Error("Playwright carregado, mas sem o export `chromium`.");
  return chromium;
}

// Redimensiona e recomprime o JPEG. Se o sharp não estiver disponível, segue
// com o arquivo original em vez de falhar: um card grande ainda é um card.
async function reduzir(caminho, largura) {
  let sharp;
  try {
    // O ponto de entrada do sharp mudou de lugar entre versões; tenta os dois.
    let entrada;
    for (const candidato of [["sharp", "dist", "index.cjs"], ["sharp", "lib", "index.js"]]) {
      try {
        entrada = moduloLocal(...candidato);
        break;
      } catch {
        /* tenta o próximo */
      }
    }
    if (!entrada) throw new Error("sharp não encontrado");
    const mod = await import(pathToFileURL(entrada).href);
    sharp = mod.default || mod;
  } catch {
    console.warn("sharp indisponível — mantendo o JPEG no tamanho original.");
    return;
  }
  const buffer = await sharp(caminho).resize({ width: largura }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  writeFileSync(caminho, buffer);
}

async function main() {
  const chromium = await carregarChromium();
  const ics = readFileSync(CAMINHO_ICS, "utf8");

  // 1. Serve o ICS para a aplicação, no lugar do Google.
  const servidorIcs = createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "text/calendar; charset=utf-8" }).end(ics);
  });
  await new Promise((r) => servidorIcs.listen(PORTA_ICS, "127.0.0.1", r));

  // 2. Sobe a própria aplicação, sem alterar nada nela.
  const app = spawn("node", [path.join(RAIZ_APP, "server.js")], {
    cwd: RAIZ_APP,
    env: {
      ...process.env,
      PORT: String(PORTA_APP),
      CALENDAR_ICS_URL: `http://127.0.0.1:${PORTA_ICS}/agenda.ics`,
      CACHE_TTL_MS: "0",
    },
    stdio: "ignore",
  });

  const base = `http://127.0.0.1:${PORTA_APP}`;
  await esperar(
    async () => {
      try {
        return (await fetch(`${base}/api/calendar`)).ok;
      } catch {
        return false;
      }
    },
    { oQue: "a aplicação responder em /api/calendar" }
  );

  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    timezoneId: "America/Bahia",
    locale: "pt-BR",
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const pagina = await contexto.newPage();

  // 3. Substitui os CDNs bloqueados pelos arquivos locais equivalentes.
  const servirLocal = (rota, caminho, tipo) =>
    pagina.route(rota, (r) =>
      r.fulfill({ status: 200, contentType: tipo, body: readFileSync(caminho, "utf8") })
    );

  await servirLocal("**/ical.js@2.1.0/dist/ical.min.js",
    moduloLocal("ical.js", "dist", "ical.min.js"), "application/javascript");
  await servirLocal("**/html2canvas*.js",
    moduloLocal("html2canvas", "dist", "html2canvas.min.js"), "application/javascript");
  await servirLocal("**/jspdf*.js",
    moduloLocal("jspdf", "dist", "jspdf.umd.min.js"), "application/javascript");
  await pagina.route("**/fonts.googleapis.com/**", (r) =>
    r.fulfill({ status: 200, contentType: "text/css", body: cssDasFontes() })
  );

  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));

  await pagina.goto(base, { waitUntil: "networkidle" });
  await pagina.waitForFunction(
    () => {
      try {
        const c = JSON.parse(localStorage.getItem("saaTcm.cache.v1") || "null");
        return Boolean(c && Array.isArray(c.events));
      } catch {
        return false;
      }
    },
    { timeout: 30000 }
  );
  await pagina.evaluate(() => document.fonts.ready);

  // 4. Recorta o dia pedido pelos próprios campos de data da interface.
  await pagina.fill("#filtro-data-inicio", DATA_ALVO);
  await pagina.dispatchEvent("#filtro-data-inicio", "change");
  await pagina.fill("#filtro-data-fim", DATA_ALVO);
  await pagina.dispatchEvent("#filtro-data-fim", "change");
  await pagina.waitForTimeout(700);

  const compromissos = await pagina.$$eval("#timeline .card__titulo", (e) => e.length);

  // 5. Aciona a exportação exatamente como um usuário faria.
  await pagina.click("#btn-abrir-export");
  await pagina.waitForTimeout(400);
  await pagina.click('#export-formato-group [data-formato="mobile"]');
  await pagina.click('#export-proporcao-group [data-proporcao="story"]');
  await pagina.waitForTimeout(900);

  const download = pagina.waitForEvent("download", { timeout: 90000 });
  await pagina.click("#btn-exportar-jpeg");
  await (await download).saveAs(SAIDA);

  await navegador.close();

  const bytesBrutos = statSync(SAIDA).size;
  await reduzir(SAIDA, LARGURA_FINAL);
  const bytesFinais = statSync(SAIDA).size;

  app.kill();
  servidorIcs.close();

  if (erros.length) console.error("Erros de página:", erros.slice(0, 3));
  console.log(JSON.stringify({ arquivo: SAIDA, data: DATA_ALVO, compromissos, kbAntes: Math.round(bytesBrutos / 1024), kbDepois: Math.round(bytesFinais / 1024) }, null, 2));
}

main().catch((e) => {
  console.error("Falha ao gerar o card:", e.message);
  process.exit(1);
});
