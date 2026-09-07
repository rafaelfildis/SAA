"use strict";

/**
 * Geração do card no servidor, fotografando a própria aplicação.
 *
 * A alternativa seria reimplementar o card aqui — e duas implementações do
 * mesmo desenho divergem com o tempo, que é justamente o que o projeto evita
 * ("o que se vê é o que sai"). Em vez disso, um Chromium headless abre a
 * página publicada no dia pedido e chama window.saaGerarCard, o mesmo caminho
 * do botão "Baixar JPEG". O arquivo enviado por e-mail é, por construção,
 * idêntico ao que se baixaria da tela.
 *
 * Arquivos com prefixo "_" não viram rota na Vercel: este é módulo interno.
 */

const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const FUSO = "America/Bahia";

// Data de amanhã no fuso de Salvador, em YYYY-MM-DD. O formato "en-CA" já
// produz essa ordem; usá-lo evita montar a string à mão a partir de partes.
function amanhaEmBahia(agora = new Date()) {
  const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(amanha);
}

function origemDaRequisicao(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocolo = req.headers["x-forwarded-proto"] || "https";
  return `${protocolo}://${host}`;
}

async function gerarCard({ origem, data, formato = "mobile", proporcao = "story" }) {
  const navegador = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
    defaultViewport: { width: 1440, height: 1000 },
  });

  try {
    const pagina = await navegador.newPage();
    await pagina.emulateTimezone(FUSO);

    await pagina.goto(`${origem}/?data=${encodeURIComponent(data)}`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });

    await pagina.waitForFunction(() => typeof window.saaGerarCard === "function", { timeout: 20000 });

    // O navegador headless começa sem cache local, então é preciso esperar a
    // agenda chegar da rede antes de rasterizar — senão o card sairia vazio.
    await pagina.waitForFunction(
      () => {
        try {
          const c = JSON.parse(localStorage.getItem("saaTcm.cache.v1") || "null");
          return Boolean(c && Array.isArray(c.events));
        } catch (e) {
          return false;
        }
      },
      { timeout: 30000 }
    );

    // As fontes vêm do Google Fonts; rasterizar antes de carregá-las produz o
    // card com tipografia genérica.
    await pagina.evaluate(() => document.fonts.ready);

    const resultado = await pagina.evaluate(
      (f, p) => window.saaGerarCard({ formato: f, proporcao: p }),
      formato,
      proporcao
    );

    const base64 = resultado.dataUrl.split(",")[1];
    return {
      buffer: Buffer.from(base64, "base64"),
      base64,
      largura: resultado.largura,
      altura: resultado.altura,
      compromissos: resultado.compromissos,
    };
  } finally {
    await navegador.close();
  }
}

module.exports = { gerarCard, amanhaEmBahia, origemDaRequisicao, FUSO };
