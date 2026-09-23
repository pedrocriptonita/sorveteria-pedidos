# Guia de Configuração e Testes: Mercado Pago (PIX)

Este documento contém o passo a passo completo para configurar e testar a integração de pagamento via PIX com o **Mercado Pago** no sistema.

---

## 1. Obter Credenciais no Mercado Pago

1. Acesse o **[Painel de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel/app)**.
2. Faça login com a sua conta do Mercado Pago.
3. Crie uma aplicação (ou selecione uma aplicação existente).
4. No menu lateral, acesse **Credenciais de teste** (para ambiente Sandbox) ou **Credenciais de produção** (para transações reais):
   - Copie o **Access Token** (começa com `TEST-...` para testes ou `APP_USR-...` para produção).
5. No menu lateral, vá em **Notificações Webhooks**:
   - Em **Modo**, selecione se está configurando para Testes ou Produção.
   - Ative a opção de notificações de **Pagamentos** (`payment`).
   - Copie a **Chave Secreta** (*Secret Key*) gerada pelo Mercado Pago para validação de assinatura (`x-signature`).

---

## 2. Configurar o `.env.local`

Abra o arquivo `.env.local` na raiz do projeto e configure o bloco do provedor de pagamento (PSP):

```env
# ──────────────────────────────────────────────────────────────
# PSP de PIX — Mercado Pago
# ──────────────────────────────────────────────────────────────
PSP_PROVIDER="mercadopago"
PSP_BASE_URL=""                                # Deixar vazio (o SDK oficial do Mercado Pago gerencia)
PSP_API_KEY="TEST-seu-access-token-aqui"       # Access Token (TEST-... ou APP_USR-...)
PSP_WEBHOOK_SECRET="seu-webhook-secret-aqui"   # Secret Key para validação HMAC do webhook
PSP_CPF_CNPJ=""                                # Opcional no Mercado Pago (pode deixar vazio)
PIX_EXPIRACAO_SEGUNDOS="900"                   # Tempo de expiração do PIX em segundos (ex: 900 = 15 min)
```

> **Dica para Desenvolvimento:**  
> Se `PSP_WEBHOOK_SECRET` ficar em branco (`""`), o sistema não exigirá a assinatura criptográfica `x-signature` ao receber webhooks (útil para testes manuais via Postman/Thunder Client). Em produção, mantenha a chave preenchida para segurança.

---

## 3. Testar a Conexão e Credenciais

O projeto já possui um script que valida a comunicação direta com o Mercado Pago:

```bash
npm run validate:psp
```

- **Sucesso:**
  ```text
  Provider configurado: mercadopago
  ✓ Mercado Pago: autenticação confirmada (ACCESS_TOKEN válido).
  ```
- **Falha:** A mensagem da API do Mercado Pago será exibida informando o erro (ex.: credenciais inválidas ou sem permissão).

---

## 4. Testar a Geração do PIX no Sistema

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
2. Abra seu navegador em `http://localhost:3000`.
3. Adicione qualquer produto ao carrinho e avance até o checkout.
4. Selecione a forma de pagamento **PIX**.
5. O sistema chamará o Mercado Pago e exibirá:
   - O **QR Code PIX** gerado dinamicamente.
   - O código **Copia e Cola**.
   - O contador regressivo de expiração.

---

## 5. Testar o Webhook e a Baixa Automática

Quando o cliente realiza o pagamento do PIX, o Mercado Pago envia uma notificação para o endpoint:
`/api/webhooks/psp`

Como o Mercado Pago não consegue se comunicar diretamente com `localhost`, você tem duas opções para testar a confirmação:

### Opção A: Túnel Local com Ngrok (Recomendado para fluxo em tempo real)

1. Em outro terminal, abra um túnel para a porta do Next.js:
   ```bash
   npx ngrok http 3000
   ```
2. Copie a URL pública HTTPS gerada (exemplo: `https://abc1234.ngrok-free.app`).
3. No seu `.env.local`, atualize:
   ```env
   NEXT_PUBLIC_APP_URL="https://abc1234.ngrok-free.app"
   ```
4. No Painel de Desenvolvedores do Mercado Pago, configure a URL de Webhook:
   ```
   https://abc1234.ngrok-free.app/api/webhooks/psp
   ```
5. Realize o pagamento de teste (via simulador do MP ou pagamento real em produção) e o pedido será confirmado automaticamente na tela.

### Opção B: Polling Manual (Sem necessidade de Ngrok)

Se não puder usar ngrok no momento:

1. Faça o pagamento do QR Code.
2. No terminal do projeto, execute o script de reconciliação de pagamentos:
   ```bash
   npm run poll:pagamentos
   ```
3. O script consultará o Mercado Pago, identificará que o pagamento foi aprovado e atualizará o status do pedido para `CONFIRMADO` no banco de dados.

---

## 6. Arquivos Relevantes no Código

- **Adaptador Mercado Pago:** [src/lib/psp/mercadopago.ts](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/src/lib/psp/mercadopago.ts)
- **Endpoint do Webhook:** [src/app/api/webhooks/psp/route.ts](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/src/app/api/webhooks/psp/route.ts)
- **Script de Validação:** [scripts/validate-psp.ts](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/scripts/validate-psp.ts)
- **Script de Polling:** [scripts/poll-pagamentos.ts](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/scripts/poll-pagamentos.ts)
- **Configuração de Ambiente:** [.env.local](file:///c:/Users/pedro/OneDrive/Desktop/projetos%20Sistemas/sorveteria-pedidos/.env.local)
