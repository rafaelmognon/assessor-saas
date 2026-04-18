-- ════════════════════════════════════════════════════════════
-- Row-Level Security (RLS) — Sprint 1.2
-- ════════════════════════════════════════════════════════════
-- Segunda camada de isolamento multi-tenant (a primeira é o
-- middleware da API que filtra por userId em toda query).
--
-- Como funciona:
-- 1. Habilitamos RLS em todas as tabelas com userId
-- 2. Criamos policies que só permitem acessar linhas onde
--    userId = current_setting('app.current_user_id')
-- 3. Antes de cada query, a API faz: SET app.current_user_id = '<id>'
-- 4. Mesmo se o middleware falhar, o banco bloqueia
--
-- Postgres considera o usuário do BD (assessor) como BYPASSRLS
-- por padrão. Pra forçar RLS, criamos um role app_user separado
-- que SEMPRE respeita as policies.

-- Role de aplicação (sem bypass RLS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- Função helper pra obter user atual da sessão
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT current_setting('app.current_user_id', true);
$$ LANGUAGE SQL STABLE;

-- ════════════════════════════════════════════════════════════
-- Habilita RLS em tabelas com userId
-- ════════════════════════════════════════════════════════════

ALTER TABLE categorias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromissos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens           ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- Policies: tenant isolation
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS tenant_isolation ON categorias;
CREATE POLICY tenant_isolation ON categorias
  USING ("userId" = current_user_id())
  WITH CHECK ("userId" = current_user_id());

DROP POLICY IF EXISTS tenant_isolation ON cartoes;
CREATE POLICY tenant_isolation ON cartoes
  USING ("userId" = current_user_id())
  WITH CHECK ("userId" = current_user_id());

DROP POLICY IF EXISTS tenant_isolation ON transacoes;
CREATE POLICY tenant_isolation ON transacoes
  USING ("userId" = current_user_id())
  WITH CHECK ("userId" = current_user_id());

DROP POLICY IF EXISTS tenant_isolation ON compromissos;
CREATE POLICY tenant_isolation ON compromissos
  USING ("userId" = current_user_id())
  WITH CHECK ("userId" = current_user_id());

DROP POLICY IF EXISTS tenant_isolation ON notas;
CREATE POLICY tenant_isolation ON notas
  USING ("userId" = current_user_id())
  WITH CHECK ("userId" = current_user_id());

DROP POLICY IF EXISTS tenant_isolation ON mensagens;
CREATE POLICY tenant_isolation ON mensagens
  USING ("userId" = current_user_id())
  WITH CHECK ("userId" = current_user_id());

DROP POLICY IF EXISTS tenant_isolation ON refresh_tokens;
CREATE POLICY tenant_isolation ON refresh_tokens
  USING ("userId" = current_user_id())
  WITH CHECK ("userId" = current_user_id());

DROP POLICY IF EXISTS tenant_isolation ON whatsapp_instances;
CREATE POLICY tenant_isolation ON whatsapp_instances
  USING ("userId" = current_user_id())
  WITH CHECK ("userId" = current_user_id());

-- audit_logs pode ter userId NULL (ações do sistema)
DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
CREATE POLICY tenant_isolation ON audit_logs
  USING ("userId" = current_user_id() OR "userId" IS NULL);
