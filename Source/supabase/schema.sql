-- ============================================================================
-- ReciclaBelém - Schema Supabase (PostgreSQL + RLS + Chave de Operador + Auditoria)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Armazena o estado oficial do banco (points, materialsGuide, incentives, news)
CREATE TABLE IF NOT EXISTS public.app_database (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NULL
);

-- 2. Operadores autorizados (cadastrados por você no painel do Supabase)
CREATE TABLE IF NOT EXISTS public.operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  access_key_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  key_expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Sessões temporárias do APK do Operador (expiram automaticamente)
CREATE TABLE IF NOT EXISTS public.operator_sessions (
  token TEXT PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Log de Auditoria (mostra tudo o que cada operador alterou)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEGURANÇA (RLS): Bloqueia escrita direta pela API pública!
-- Ninguém consegue alterar ou apagar tabelas usando a anon key.
-- ============================================================================
ALTER TABLE public.app_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Leitura pública apenas da tabela app_database
DROP POLICY IF EXISTS "Leitura publica do app_database" ON public.app_database;
CREATE POLICY "Leitura publica do app_database"
  ON public.app_database
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- FUNÇÕES SEGURAS (RPCs)
-- ============================================================================

-- A) Leitura pública do banco JSON
CREATE OR REPLACE FUNCTION public.get_public_db()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT data FROM public.app_database WHERE id = 'main' LIMIT 1;
$$;

-- B) Login do Operador via Chave de Acesso (sessão expira em 8 horas)
CREATE OR REPLACE FUNCTION public.operator_login(p_access_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op RECORD;
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  IF p_access_key IS NULL OR length(trim(p_access_key)) < 6 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Chave de acesso inválida.');
  END IF;

  SELECT * INTO v_op
  FROM public.operators
  WHERE access_key_hash = encode(digest(trim(p_access_key), 'sha256'), 'hex')
    AND active = TRUE
    AND (key_expires_at IS NULL OR key_expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Chave inválida, expirada ou operador desativado.');
  END IF;

  -- Remove sessões expiradas antigas
  DELETE FROM public.operator_sessions WHERE expires_at <= NOW();

  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := NOW() + INTERVAL '8 hours';

  INSERT INTO public.operator_sessions (token, operator_id, expires_at)
  VALUES (v_token, v_op.id, v_expires);

  INSERT INTO public.audit_logs (operator_id, operator_name, action, summary)
  VALUES (v_op.id, v_op.name, 'LOGIN', 'Operador autenticou no painel Admin');

  RETURN jsonb_build_object(
    'ok', true,
    'token', v_token,
    'operatorName', v_op.name,
    'expiresAt', v_expires
  );
END;
$$;

-- C) Validação da sessão ativa do operador
CREATE OR REPLACE FUNCTION public.operator_validate_session(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT s.expires_at, o.id AS operator_id, o.name AS operator_name, o.active, o.key_expires_at
  INTO v_row
  FROM public.operator_sessions s
  JOIN public.operators o ON o.id = s.operator_id
  WHERE s.token = p_token
  LIMIT 1;

  IF NOT FOUND OR v_row.expires_at <= NOW() OR v_row.active = FALSE
     OR (v_row.key_expires_at IS NOT NULL AND v_row.key_expires_at <= NOW()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sessão expirada.');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'operatorName', v_row.operator_name,
    'expiresAt', v_row.expires_at
  );
END;
$$;

-- D) Salvar alterações do Dashboard + registrar Auditoria
CREATE OR REPLACE FUNCTION public.operator_save_db(
  p_token TEXT,
  p_data JSONB,
  p_action TEXT DEFAULT 'UPDATE',
  p_summary TEXT DEFAULT 'Atualização via Painel do Operador'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT s.expires_at, o.id AS operator_id, o.name AS operator_name, o.active, o.key_expires_at
  INTO v_row
  FROM public.operator_sessions s
  JOIN public.operators o ON o.id = s.operator_id
  WHERE s.token = p_token
  LIMIT 1;

  IF NOT FOUND OR v_row.expires_at <= NOW() OR v_row.active = FALSE
     OR (v_row.key_expires_at IS NOT NULL AND v_row.key_expires_at <= NOW()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sessão expirada ou operador não autorizado.');
  END IF;

  INSERT INTO public.app_database (id, data, updated_at, updated_by)
  VALUES ('main', p_data, NOW(), v_row.operator_id)
  ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data,
        updated_at = NOW(),
        updated_by = v_row.operator_id;

  INSERT INTO public.audit_logs (operator_id, operator_name, action, summary)
  VALUES (v_row.operator_id, v_row.operator_name, COALESCE(p_action, 'UPDATE'), COALESCE(p_summary, 'Atualização no banco'));

  RETURN jsonb_build_object('ok', true, 'updatedAt', NOW());
END;
$$;

-- Permissões de chamada apenas para as RPCs públicas
REVOKE ALL ON FUNCTION public.get_public_db() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.operator_login(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.operator_validate_session(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.operator_save_db(TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_public_db() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.operator_login(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.operator_validate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.operator_save_db(TEXT, JSONB, TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- EXEMPLO: Como cadastrar o primeiro Operador (execute substituindo os dados!)
-- ============================================================================
-- INSERT INTO public.operators (name, cpf, email, access_key_hash, key_expires_at)
-- VALUES (
--   'Operador Exemplo',
--   '000.000.000-00',
--   'operador@email.com',
--   encode(digest('SUA-CHAVE-SECRETA-AQUI', 'sha256'), 'hex'),
--   NOW() + INTERVAL '30 days'
-- );
