# Frontend RoB2 - Interface de Usuário

Interface React para o sistema de avaliação de risco de viés RoB2, com autenticação Firebase e gerenciamento de artigos.

## 🚀 Funcionalidades

- **Autenticação Google**: Login seguro via Firebase Auth
- **Gerenciamento de Artigos**: Salvar, editar e organizar artigos científicos
- **Avaliação RoB2**: Interface para avaliação de risco de viés
- **Interface Responsiva**: Design moderno com Tailwind CSS

## 📦 Instalação

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

A aplicação estará disponível em `http://localhost:3000`

## 🔧 Configuração do Firebase

O Firebase já está configurado com as credenciais do projeto `rob2-app-6421e`. Se precisar alterar:

1. Edite `src/firebase/config.ts`
2. Atualize as credenciais do Firebase
3. Configure as regras de segurança no console do Firebase

## 📱 Como Usar

### 1. Login
- Acesse a aplicação
- Clique em "Entrar com Google"
- Autorize o acesso à sua conta Google

### 2. Gerenciar Artigos
- **Adicionar**: Clique em "Novo Artigo" e preencha os dados
- **Editar**: Clique em "Editar" em qualquer artigo
- **Excluir**: Clique em "Excluir" e confirme
- **Visualizar**: Todos os artigos são exibidos em cards organizados

### 3. Avaliação RoB2
- Navegue para "Avaliação RoB2" no menu
- Preencha as pré-considerações
- Responda as perguntas de cada domínio
- Visualize o resumo final

## 🏗️ Estrutura do Projeto

```
frontend/src/
├── components/          # Componentes React
│   ├── LoginButton.tsx  # Botão de login Google
│   ├── ArticleForm.tsx  # Formulário de artigos
│   ├── ArticleList.tsx  # Lista de artigos
│   └── ArticlesManager.tsx # Gerenciador principal
├── firebase/           # Configuração Firebase
│   ├── config.ts       # Configuração do Firebase
│   └── auth.ts         # Serviços de autenticação
├── services/           # Serviços da API
│   └── articles.ts     # API de artigos
├── App.tsx            # Componente principal
└── main.tsx           # Ponto de entrada
```

## 🎨 Estilos

O projeto usa **Tailwind CSS** para estilização:
- Classes utilitárias para layout e design
- Componentes responsivos
- Tema consistente em toda a aplicação

## 🔌 Integração com Backend

A aplicação se conecta ao backend via:
- **Autenticação**: Tokens Firebase para autenticação
- **API REST**: Endpoints para CRUD de artigos
- **CORS**: Configurado para desenvolvimento local

## 📋 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se o backend está rodando em `http://localhost:8000`
- Confirme se CORS está habilitado no backend

### Erro de Autenticação
- Verifique se o Firebase está configurado corretamente
- Confirme se o domínio está autorizado no console Firebase

### Erro de API
- Verifique se o backend está rodando
- Confirme se a variável `VITE_API_BASE_URL` está correta

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
# Faça upload da pasta dist/ para Vercel
```

### Netlify
```bash
npm run build
# Faça upload da pasta dist/ para Netlify
```

### Docker
```bash
# Use o Dockerfile existente
docker build -t rob2-frontend .
docker run -p 3000:3000 rob2-frontend
```

## 📝 Notas de Desenvolvimento

- **TypeScript**: Tipagem estática para melhor desenvolvimento
- **React Hooks**: Gerenciamento de estado moderno
- **Firebase SDK**: Integração nativa com Firebase
- **Responsive Design**: Funciona em desktop e mobile
