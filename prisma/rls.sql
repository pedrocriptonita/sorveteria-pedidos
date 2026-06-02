-- ============================================================================
-- Row Level Security (RLS) — Fase 2
-- ----------------------------------------------------------------------------
-- Modelo de segurança deste projeto:
--   * TODO acesso legítimo aos dados passa pelo servidor Next.js via Prisma,
--     que conecta como a role privilegiada do Postgres (ignora RLS).
--   * O Supabase, porém, expõe automaticamente uma API REST (PostgREST) em
--     /rest/v1/<tabela> acessível com a chave anon pública (que vai pro
--     browser). Sem RLS, as roles `anon`/`authenticated` poderiam ler/gravar.
--
-- Estratégia: habilitar RLS em TODAS as tabelas SEM criar policies permissivas.
-- Sem policy => deny-by-default para anon/authenticated. O servidor (Prisma)
-- continua funcionando normalmente.
--
-- Policies específicas (ex.: leitura de `pedidos`/`fila_impressao` no KDS via
-- Supabase Realtime) serão adicionadas na Fase 6, quando houver acesso direto
-- pelo client autenticado.
--
-- Como aplicar: copie e rode no Supabase → SQL Editor (ou psql via DIRECT_URL).
-- É idempotente: ENABLE ROW LEVEL SECURITY pode ser re-executado sem erro.
-- ============================================================================

ALTER TABLE public.categorias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tamanhos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_opcoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_opcao      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enderecos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_entrega    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_loja      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fila_impressao   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_admin   ENABLE ROW LEVEL SECURITY;
