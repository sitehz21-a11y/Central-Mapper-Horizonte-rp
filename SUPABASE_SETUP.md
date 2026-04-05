# Migração para Supabase

O projeto foi migrado do Firebase Firestore para Supabase para resolver os problemas de sincronização.

## Passos para configurar:

1. **Crie uma conta no Supabase**: Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.

2. **Crie um novo projeto**:
   - Dê um nome ao projeto (ex: "Site Mapper")
   - Escolha uma região próxima
   - Defina uma senha para o banco

3. **Crie a tabela `mapper_members`**:
   - No painel do Supabase, vá para "Table Editor"
   - Clique em "New table"
   - Nome: `mapper_members`
   - Adicione as colunas:
     - `id` (int8, primary key, auto-increment)
     - `nick` (text, not null)
     - `rg` (text, not null)
     - `role` (text, not null)
     - `level` (int4)
     - `levelExp` (int4)
     - `levelCatalog` (int4)
     - `orgCorp` (text)
     - `discord` (text, not null)
     - `numero` (text)
     - `idade` (int4)
     - `by` (text)
     - `registered` (text)

4. **Configure as permissões (RLS)**:
   - Vá para "Authentication" > "Policies"
   - Para a tabela `mapper_members`, crie políticas para permitir leitura e escrita anônima (para desenvolvimento):
     - Enable RLS
     - Create policy: SELECT for anon
     - Create policy: INSERT for anon
     - Create policy: UPDATE for anon
     - Create policy: DELETE for anon

5. **Obtenha as credenciais**:
   - No painel, vá para "Settings" > "API"
   - Copie a "Project URL" e "anon public" key

6. **Atualize os arquivos HTML**:
   - Em todos os arquivos HTML (index.html, add_*.html, etc.), substitua:
     - `YOUR_SUPABASE_URL` pela Project URL
     - `YOUR_SUPABASE_ANON_KEY` pela anon key

7. **Teste**:
   - Inicie o servidor: `python -m http.server 8000`
   - Acesse http://localhost:8000/index.html
   - Adicione um membro via formulário e veja se aparece na tabela (atualiza a cada 10 segundos)

## Diferenças do Firestore:
- Supabase usa PostgreSQL, então queries são SQL-like
- Não há listeners em tempo real automáticos como Firestore; implementei polling a cada 10s
- Para tempo real verdadeiro, seria necessário configurar Supabase Realtime, mas polling é suficiente para este caso

## Limitações do plano gratuito:
- 500MB de banco
- 50MB de arquivos
- Suficiente para desenvolvimento</content>
<parameter name="filePath">c:\Users\carlo\OneDrive\Documentos\SITE MAPPER\SUPABASE_SETUP.md