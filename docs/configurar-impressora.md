# Guia de Configuração e Testes: Impressora Térmica (ESC/POS)

Este documento cobre o passo a passo completo para configurar a impressão automática de comandas na cozinha — incluindo o agente local ESC/POS e a inicialização automática ao ligar o computador.

---

## Cenário deste setup

```
Mesmo computador (balcão)
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [Sistema de Balcão]  ──┐                              │
│                          ├──► [Windows Spooler] ──► [🖨 Impressora USB]
│   [DevoraFood Agente]  ──┘                              │
│                                                         │
│   [Next.js DevoraFood] ◄── polling a cada 3s ──┘       │
└─────────────────────────────────────────────────────────┘
```

A impressora está conectada via **USB no computador do balcão**. Tanto o sistema de balcão quanto o DevoraFood imprimem na mesma impressora, mas **não há conflito**: o **Windows Spooler** funciona como fila intermediária e serializa os jobs dos dois sistemas automaticamente — sem nenhuma configuração extra no sistema de balcão.

> ⚠️ **Por que não usar modo USB direto?**  
> Se o agente tentasse abrir a porta USB diretamente (modo `usb`), travaria o acesso enquanto o sistema de balcão estivesse imprimindo, causando erros. O modo `printer` (Spooler) evita completamente esse problema.

---

## Como funciona a arquitetura de impressão

Quando um pedido é confirmado, o sistema cria um job de impressão na tabela `FilaImpressao`. O **agente** (`print-agent/agent.js`) roda em segundo plano no computador do balcão, faz polling na API a cada 3 segundos, busca os jobs pendentes, formata em ESC/POS e envia para a impressora via Spooler. Se a impressora estiver ocupada com um job do sistema de balcão, o Spooler aguarda e imprime na sequência.

---

## 1. Pré-requisitos

- **Node.js ≥ 18** instalado no computador do balcão.
  - Download: https://nodejs.org/ (versão LTS)
- **Driver da impressora** já instalado no Windows (a impressora já deve aparecer em *Dispositivos e Impressoras* e funcionar para o sistema de balcão)

---

## 2. Descobrir o nome exato da impressora no Windows

Este passo é essencial para o modo `printer` (Spooler):

1. Abra o **menu Iniciar** e procure por **"Dispositivos e Impressoras"**.
2. Encontre a impressora térmica na lista.
3. O nome que aparece embaixo do ícone é o nome que você vai usar. Copie-o **exatamente** como está (incluindo espaços e maiúsculas).
   - Exemplos: `POS-80`, `EPSON TM-T20III`, `Bematech MP-4200 TH`
4. Guarde esse nome — você vai precisar dele no próximo passo.

---

## 3. Configurar o `.env.local` do servidor

No arquivo `.env.local` na raiz do projeto, confirme as variáveis de impressão:

```env
PRINT_MODE="agent"
PRINT_AGENT_TOKEN="meu-token-secreto-forte-aqui"
```

> **Gere um token forte:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> Guarde esse valor — ele será usado também no `.env` do agente.

---

## 4. Configurar o Agente de Impressão

### 4.1 Instalar as dependências

Abra o terminal na pasta `print-agent/` e execute:

```bash
cd print-agent
npm install
```

### 4.2 Criar o arquivo `.env` do agente

```bash
copy .env.example .env
```

Abra o `.env` e preencha:

```env
# URL do servidor (mesmo computador = localhost)
API_BASE_URL="http://localhost:3000"

# MESMO valor do PRINT_AGENT_TOKEN no .env.local do servidor
PRINT_AGENT_TOKEN="meu-token-secreto-forte-aqui"

# ── MODO SPOOLER WINDOWS (recomendado para USB compartilhada) ──
PRINTER_IFACE="printer"

# Nome EXATO da impressora em Dispositivos e Impressoras
PRINTER_NAME="POS-80"

# Intervalo de polling (ms)
POLL_INTERVAL_MS="3000"
```

---

## 5. Testar a Fila de Impressão (sem hardware)

Valide que a fila no banco de dados funciona corretamente:

```bash
# Na pasta raiz do projeto (não em print-agent/)
npm run validate:print
```

Saída esperada:
```text
1) Enfileirado: job abc123 (PENDENTE)
2) Aparece na fila: true (1 pendente(s))
3) Marcado: IMPRESSO em 2026-...
✓ Fila de impressão validada com sucesso.
4) Limpeza: pedido + job + cliente de teste removidos.
```

---

## 6. Testar o Agente com a Impressora Real

1. Certifique-se que a impressora está ligada e funcionando para o sistema de balcão.
2. Com o servidor Next.js rodando (`npm run dev`), execute o agente:
   ```bash
   cd print-agent
   node agent.js
   ```
3. Saída esperada no terminal:
   ```text
   ╔═══════════════════════════════════════════╗
   ║   DevoraFood — Agente de Impressão ESC/POS ║
   ╚═══════════════════════════════════════════╝
   Servidor : http://localhost:3000
   Impressora: printer → POS-80
   Intervalo : 3000ms
   ─────────────────────────────────────────────
   Agente iniciado. Aguardando jobs de impressão...
   ```
4. Faça um pedido de teste em dinheiro (entra na fila imediatamente, sem aguardar PIX).
5. Em até 3 segundos o agente detecta o job e imprime a comanda.

---

## 7. Inicialização Automática ao Ligar o Computador

Para que o agente inicie automaticamente junto com o Windows.

### Método A: Agendador de Tarefas (interface gráfica)

1. Abra o **Agendador de Tarefas** → procure `taskschd.msc` na barra de busca do Windows.
2. Painel direito → **"Criar Tarefa..."** (não "Criar Tarefa Básica").
3. Aba **Geral**:
   - Nome: `DevoraFood - Agente Impressao`
   - Marque: **"Executar estando o usuário conectado ou não"**
   - Marque: **"Executar com privilégios mais altos"**
4. Aba **Gatilhos** → **Novo...**:
   - Iniciar a tarefa: **"Na inicialização"**
   - Atraso: **1 minuto** (dá tempo ao Windows carregar o Spooler e os drivers)
   - OK
5. Aba **Ações** → **Novo...**:
   - Ação: **"Iniciar um programa"**
   - Programa/script: `node`
   - Adicione argumentos: `agent.js`
   - Iniciar em: `C:\Users\pedro\OneDrive\Desktop\projetos Sistemas\sorveteria-pedidos\print-agent`
   - OK
6. Aba **Configurações**:
   - ✅ "Executar tarefa o mais rápido possível se uma inicialização agendada for perdida"
   - ✅ "Se a tarefa falhar, reiniciá-la a cada: **1 minuto**", por até **3 vezes**
7. **OK** → forneça a senha do Windows se solicitado.

### Método B: Via PowerShell (linha de comando)

Abra o **PowerShell como Administrador** e execute o bloco abaixo de uma vez:

```powershell
$Action = New-ScheduledTaskAction `
  -Execute "node" `
  -Argument "agent.js" `
  -WorkingDirectory "C:\Users\pedro\OneDrive\Desktop\projetos Sistemas\sorveteria-pedidos\print-agent"

$Trigger = New-ScheduledTaskTrigger -AtStartup

$Settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit 0 `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -StartWhenAvailable

Register-ScheduledTask `
  -TaskName "DevoraFood - Agente Impressao" `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -RunLevel Highest `
  -Force
```

### Verificar e iniciar manualmente (sem reiniciar)

```powershell
# Verifica o status
Get-ScheduledTask -TaskName "DevoraFood - Agente Impressao" | Select-Object TaskName, State

# Inicia agora para testar
Start-ScheduledTask -TaskName "DevoraFood - Agente Impressao"
```

---

## 8. Coexistência com o Sistema de Balcão — O que acontece na prática

| Situação | Comportamento |
|---|---|
| Sistema de balcão imprime e DevoraFood manda job ao mesmo tempo | Spooler do Windows enfileira — o job do DevoraFood aguarda e imprime logo em seguida |
| DevoraFood manda vários jobs seguidos | Spooler imprime um por vez, na ordem de chegada |
| Sistema de balcão imprime normalmente | Sem interferência — DevoraFood não bloqueia a impressora |
| Impressora desligada ou travada | Job fica `PENDENTE` e o agente tentará de novo em 3s; após 5 falhas vira `ERRO` (reimprimir pelo KDS) |

> ✅ **Nenhuma configuração é necessária no sistema de balcão.** Ele continua funcionando exatamente como antes.

---

## 9. Monitoramento e Reimpressão

- **KDS** (`/cozinha`): se a impressora estiver offline, o pedido aparece no board — a cozinha trabalha normalmente.
- **Monitor de impressão** no topo do KDS: mostra jobs com erro e botão **Reimprimir**.
- Após 5 tentativas com falha, o job vira `ERRO` — use o botão Reimprimir no KDS.

---

## 10. Arquivos Relevantes

| Arquivo | Descrição |
|---|---|
| [print-agent/agent.js](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/print-agent/agent.js) | O agente ESC/POS local |
| [print-agent/.env.example](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/print-agent/.env.example) | Template de config do agente |
| [print-agent/iniciar-agente.bat](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/print-agent/iniciar-agente.bat) | Script de inicialização manual |
| [src/lib/print/queue.ts](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/src/lib/print/queue.ts) | Lógica da fila de impressão (servidor) |
| [src/lib/print/auth.ts](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/src/lib/print/auth.ts) | Autenticação do agente por token |
| [src/app/api/print/jobs/route.ts](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/src/app/api/print/jobs/route.ts) | Endpoint GET de jobs pendentes |
| [scripts/validate-print.ts](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/scripts/validate-print.ts) | Script de validação da fila |

---

## 11. Troubleshooting

| Problema | Causa provável | Solução |
|---|---|---|
| `ERRO 401` no agente | Token incorreto | Confirme que `PRINT_AGENT_TOKEN` no `.env` do agente é igual ao do `.env.local` |
| Nada imprime, sem erro | Nome da impressora errado | Abra "Dispositivos e Impressoras" e copie o nome exato para `PRINTER_NAME` |
| Jobs ficam `PENDENTE` eternamente | Agente não está rodando | Verifique no Gerenciador de Tarefas → aba Detalhes → busque `node.exe` |
| Impressão com caracteres estranhos | Encoding da impressora | Ajuste `characterSet` no `agent.js` (ex: `"PC860_PORTUGUESE"` para Bematech) |
| Sistema de balcão para de imprimir | Nenhuma interferência do agente | Verifique se o driver do Spooler está saudável: `services.msc` → Print Spooler → Iniciado |
| `node-thermal-printer` não instalado | `npm install` na pasta errada | Certifique-se de estar dentro de `print-agent/` antes de `npm install` |
