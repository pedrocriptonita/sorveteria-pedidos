/**
 * Agente local de impressão ESC/POS — DevoraFood
 * ──────────────────────────────────────────────
 * Fica rodando em segundo plano no computador da cozinha.
 * A cada POLL_INTERVAL_MS, busca jobs PENDENTE em /api/print/jobs,
 * imprime via ESC/POS na térmica e reporta IMPRESSO ou ERRO.
 *
 * Dependências (instalar com: npm install):
 *   - node-thermal-printer  →  driver ESC/POS multiplataforma
 *   - node-fetch             →  requisições HTTP (Node < 18 polyfill; no 18+ nativo)
 *
 * Configuração: copie .env.example → .env e preencha as variáveis.
 */

"use strict";

// ─── Carrega .env local do agente ────────────────────────────────────────────
const path = require("path");
const fs = require("fs");

const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── Configuração ────────────────────────────────────────────────────────────
const API_BASE_URL    = (process.env.API_BASE_URL   || "http://localhost:3000").replace(/\/$/, "");
const AGENT_TOKEN     = process.env.PRINT_AGENT_TOKEN || "";
const PRINTER_NAME    = process.env.PRINTER_NAME    || ""; // ex: "POS-80"
const PRINTER_IFACE   = process.env.PRINTER_IFACE   || "network"; // "network" | "printer" | "usb"
const PRINTER_IP      = process.env.PRINTER_IP      || "";        // somente para IFACE=network
const PRINTER_PORT    = Number(process.env.PRINTER_PORT || "9100"); // padrão ESC/POS na rede
const POLL_INTERVAL   = Number(process.env.POLL_INTERVAL_MS || "3000");

// ─── Imports ─────────────────────────────────────────────────────────────────
let ThermalPrinter, PrinterTypes;
try {
  ({ ThermalPrinter, PrinterTypes } = require("node-thermal-printer"));
} catch {
  console.error("[AGENTE] ERRO: 'node-thermal-printer' não instalado.");
  console.error("         Execute: npm install  dentro da pasta print-agent/");
  process.exit(1);
}

// ─── Helper: fetch compatível ─────────────────────────────────────────────────
const nodeFetch = globalThis.fetch
  ? globalThis.fetch.bind(globalThis)
  : (() => {
      try { return require("node-fetch"); }
      catch { return null; }
    })();

if (!nodeFetch) {
  console.error("[AGENTE] Node.js < 18 detectado e 'node-fetch' não instalado.");
  console.error("         Execute: npm install  dentro da pasta print-agent/");
  process.exit(1);
}

// ─── Validação de config ──────────────────────────────────────────────────────
if (!AGENT_TOKEN) {
  console.error("[AGENTE] ERRO: PRINT_AGENT_TOKEN não definido no .env!");
  process.exit(1);
}
if (PRINTER_IFACE === "network" && !PRINTER_IP) {
  console.error("[AGENTE] ERRO: PRINTER_IP não definido para modo 'network'!");
  process.exit(1);
}

// ─── Cria instância da impressora ─────────────────────────────────────────────
function criarImpressora() {
  const config = {
    type: PrinterTypes.EPSON,
    characterSet: "SLOVENIA",     // suporte a caracteres latinos (ç, ã, etc.)
    removeSpecialCharacters: false,
  };

  if (PRINTER_IFACE === "network") {
    config.interface = `tcp://${PRINTER_IP}:${PRINTER_PORT}`;
  } else if (PRINTER_IFACE === "printer") {
    config.interface = `printer:${PRINTER_NAME}`;
  } else if (PRINTER_IFACE === "usb") {
    config.interface = PRINTER_NAME;
  }

  return new ThermalPrinter(config);
}

// ─── Formata e imprime uma comanda ────────────────────────────────────────────
async function imprimirComanda(conteudo) {
  const printer = criarImpressora();

  const isConnected = await printer.isPrinterConnected();
  if (!isConnected) {
    throw new Error(`Impressora inacessível (${PRINTER_IFACE} → ${PRINTER_IP || PRINTER_NAME})`);
  }

  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println("=== COMANDA ===");
  printer.bold(false);
  printer.newLine();

  // Número e tipo do pedido
  printer.setTextSize(1, 1);
  printer.bold(true);
  printer.println(`Pedido #${conteudo.numeroPedido}`);
  printer.bold(false);
  printer.alignLeft();
  printer.println(`Entrega: ${conteudo.tipoEntrega === "DELIVERY" ? "DELIVERY" : "RETIRADA"}`);

  // Horário
  const horario = new Date(conteudo.criadoEm).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  printer.println(`Hora: ${horario}`);
  printer.drawLine();

  // Itens
  printer.bold(true);
  printer.println("ITENS:");
  printer.bold(false);
  for (const item of conteudo.itens) {
    printer.println(`${item.quantidade}x ${item.nome}`);
    if (item.observacao) {
      printer.println(`   OBS: ${item.observacao}`);
    }
  }

  // Observação geral do pedido
  if (conteudo.observacao) {
    printer.drawLine();
    printer.bold(true);
    printer.println("OBS GERAL:");
    printer.bold(false);
    printer.println(conteudo.observacao);
  }

  printer.drawLine();

  // Total
  printer.bold(true);
  printer.alignRight();
  printer.println(`TOTAL: R$ ${conteudo.total.toFixed(2).replace(".", ",")}`);
  printer.bold(false);
  printer.alignCenter();

  printer.newLine();
  printer.newLine();
  printer.cut();

  await printer.execute();
  printer.clear();
}

// ─── Reporta resultado ao servidor ────────────────────────────────────────────
async function reportarStatus(jobId, status, erro = null) {
  const body = erro ? { status, erro } : { status };
  await nodeFetch(`${API_BASE_URL}/api/print/jobs/${jobId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AGENT_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
}

// ─── Ciclo de polling ─────────────────────────────────────────────────────────
async function poll() {
  let res;
  try {
    res = await nodeFetch(`${API_BASE_URL}/api/print/jobs?limit=10`, {
      headers: { Authorization: `Bearer ${AGENT_TOKEN}` },
    });
  } catch (err) {
    console.error(`[AGENTE] Erro ao buscar jobs: ${err.message}`);
    return;
  }

  if (!res.ok) {
    if (res.status === 401) {
      console.error("[AGENTE] ERRO 401: PRINT_AGENT_TOKEN inválido ou servidor indisponível.");
    } else {
      console.error(`[AGENTE] Resposta inesperada: ${res.status}`);
    }
    return;
  }

  const { jobs } = await res.json();

  if (!jobs || jobs.length === 0) return;

  console.log(`[AGENTE] ${jobs.length} job(s) encontrado(s).`);

  for (const job of jobs) {
    if (!job.conteudo) {
      console.warn(`[AGENTE] Job ${job.id} sem conteúdo — ignorado.`);
      await reportarStatus(job.id, "ERRO", "Job sem conteúdo de comanda.");
      continue;
    }

    try {
      console.log(`[AGENTE] Imprimindo job ${job.id} — pedido #${job.conteudo.numeroPedido}...`);
      await imprimirComanda(job.conteudo);
      await reportarStatus(job.id, "IMPRESSO");
      console.log(`[AGENTE] ✓ Job ${job.id} impresso com sucesso.`);
    } catch (err) {
      console.error(`[AGENTE] ✗ Falha no job ${job.id}: ${err.message}`);
      await reportarStatus(job.id, "ERRO", err.message);
    }
  }
}

// ─── Inicialização ────────────────────────────────────────────────────────────
console.log("╔═══════════════════════════════════════════╗");
console.log("║   DevoraFood — Agente de Impressão ESC/POS ║");
console.log("╚═══════════════════════════════════════════╝");
console.log(`Servidor : ${API_BASE_URL}`);
console.log(`Impressora: ${PRINTER_IFACE} → ${PRINTER_IP || PRINTER_NAME || "(auto)"}`);
console.log(`Intervalo : ${POLL_INTERVAL}ms`);
console.log("─────────────────────────────────────────────");
console.log("Agente iniciado. Aguardando jobs de impressão...\n");

// Executa o primeiro poll imediatamente e depois a cada POLL_INTERVAL ms
poll();
setInterval(poll, POLL_INTERVAL);
