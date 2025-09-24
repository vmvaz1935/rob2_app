# Frontend RoB2 - Interface de Usuário

Interface React para o sistema de avaliação de risco de viés RoB2. O armazenamento de artigos agora acontece diretamente na base PostgreSQL do backend, utilizando autenticação JWT emitida pela própria API.

## 🧩 Funcionalidades

- **Sincronização por token JWT**: Utilize o endpoint `/api/auth/login` para gerar tokens
- **Gerenciamento de Artigos**: Salvar, editar e organizar artigos científicos na base relacional
- **Avaliação RoB2**: Interface guiada para avaliação de risco de viés
- **Interface Responsiva**: Design moderno com Tailwind CSS

## 🚀 Instalação

### 1. Instalar Dependências
```bash
cd frontend
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na pasta `frontend`:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Executar em Desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## 🚀 Como Usar

### 1. Gerar token JWT
- Faça uma requisição `POST /api/auth/login` informando e-mail e senha de um usuário válido
- Copie o campo `access_token` retornado pela API
- Cole o token no cabeçalho "Token JWT" exibido na interface (o mesmo token é usado para avaliação e artigos)

### 2. Gerenciar Artigos
- **Adicionar**: Clique em "Novo Artigo" e preencha os dados
- **Editar**: Clique em "Editar" em qualquer artigo
- **Excluir**: Clique em "Excluir" e confirme
- **Visualizar**: Os artigos são exibidos em cards com detalhes e tags

### 3. Avaliação RoB2
- Navegue para "Formulário RoB2" no menu
- Preencha as pré-considerações
- Responda as perguntas de cada domínio
- Visualize o resumo final e envie para o backend

## 🗂️ Estrutura do Projeto

```
frontend/src/
├── components/          # Componentes React compartilhados
│   ├── AlertBanner.tsx
│   ├── ArticleForm.tsx
│   ├── ArticleList.tsx
│   ├── ArticlesManager.tsx
│   └── Stepper.tsx
├── services/           # Serviços da API
│   ├── api.ts
│   └── articles.ts
├── App.tsx             # Componente principal
└── main.tsx            # Ponto de entrada
```

## 🎨 Estilos

O projeto usa **Tailwind CSS** para estilização:
```bash
npm run build
```
O build gera CSS otimizado e pronto para produção.
