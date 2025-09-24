# 🚀 EXECUTE AGORA - Guia de Configuração Completa

## ✅ Checklist de Execução

1. **Configurar Banco de Dados**
   - Suba um PostgreSQL local (`docker-compose up db` na pasta `infra/`, por exemplo).
   - Garanta que as variáveis `DATABASE_URL`, `SECRET_KEY` estejam definidas (veja `backend/env.example`).
2. **Aplicar migrações**
   ```bash
   cd backend
   psql postgresql://rob2_user:rob2_pass@localhost/rob2_db -f migrations/001_create_tables.sql
   psql postgresql://rob2_user:rob2_pass@localhost/rob2_db -f migrations/002_adjust_tables.sql
   psql postgresql://rob2_user:rob2_pass@localhost/rob2_db -f migrations/003_create_articles.sql
   ```
3. **Criar usuário inicial** (exemplo via psql):
   ```sql
   INSERT INTO usuarios (nome, email, senha_hash)
   VALUES ('Admin', 'admin@example.com', '$2b$12$u01DqCYC5sO2HYBK4SlMQeY4RyPgjDyqzGJlQuMPjpiKFFitvolG6');
   -- senha: admin123
   ```
4. **Iniciar backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python start_server.py
   ```
5. **Iniciar frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔐 Autenticação

O login agora é feito com JWT emitido pelo próprio backend:

```bash
curl -X POST http://localhost:8000/api/auth/login   -d "username=admin@example.com"   -d "password=admin123"
```

Copie o `access_token` retornado e cole nos campos "Token JWT" da interface web. O token será usado para sincronizar avaliações e a biblioteca de artigos.

## 📚 Armazenamento de Artigos

- Os artigos ficam na tabela `artigos`, vinculados ao usuário (`usuario_id`).
- As rotas disponíveis são:
  - `GET /api/articles`
  - `POST /api/articles`
  - `GET /api/articles/{id}`
  - `PUT /api/articles/{id}`
  - `DELETE /api/articles/{id}`

Todos requerem o header `Authorization: Bearer <token>`.

## 🧪 Testes rápidos

```bash
cd backend
python -m pytest -q backend/tests
```

## 🧭 Próximos passos

1. Ajuste as variáveis de ambiente para produção (SECRET_KEY forte, banco gerenciado etc.).
2. Defina usuários reais via script ou painel administrativo.
3. Gere tokens JWT para cada membro da equipe e compartilhe pelo canal seguro.

Bom trabalho e boas avaliações com o RoB2! 🎯
