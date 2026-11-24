# Como conectar o ReciclaBelém ao Supabase

1. **Crie o projeto no Supabase** (https://supabase.com) e abra **SQL Editor**.
2. Cole todo o conteúdo de `Source/supabase/schema.sql` e clique em **Run**.
3. No **SQL Editor**, cadastre seu primeiro operador (substituindo nome, CPF, e-mail e a chave secreta que você vai entregar a ele):
   ```sql
   INSERT INTO public.operators (name, cpf, email, access_key_hash, key_expires_at)
   VALUES (
     'Breno Oliveira',
     '000.000.000-00',
     'breno@email.com',
     encode(digest('CHAVE-DO-OPERADOR-2026', 'sha256'), 'hex'),
     NOW() + INTERVAL '30 days'
   );
   ```
4. No painel do Supabase, vá em **Project Settings → API** e copie:
   - **Project URL** (ex: `https://xyz.supabase.co`)
   - **anon public key** (segura para ir no frontend)
5. Abra `Source/js/db.js`, preencha `SUPABASE_CONFIG` no topo do arquivo e mude `enabled: true`.
6. Na primeira vez que você entrar no Dashboard com a chave do operador e salvar qualquer ponto (ou clicar em "Sincronizar"), o banco inicial completo é enviado automaticamente para a nuvem!
7. Para acompanhar tudo o que o operador fez, abra **Table Editor → `audit_logs`** no Supabase.
