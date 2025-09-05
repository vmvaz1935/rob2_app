# Configuração do Firebase para RoB2

Este documento explica como configurar o Firebase para autenticação e armazenamento de artigos no sistema RoB2.

## 1. Configuração do Projeto Firebase

### 1.1 Criar Projeto no Firebase Console
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite um nome para o projeto (ex: "rob2-app")
4. Configure as opções conforme necessário
5. Aguarde a criação do projeto

### 1.2 Habilitar Authentication
1. No console do Firebase, vá para "Authentication"
2. Clique em "Começar"
3. Na aba "Sign-in method", habilite "Google"
4. Configure o domínio autorizado (ex: localhost para desenvolvimento)

### 1.3 Habilitar Firestore Database
1. No console do Firebase, vá para "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Começar no modo de teste" (para desenvolvimento)
4. Selecione uma localização (ex: us-central1)

## 2. Configuração das Credenciais

### 2.1 Gerar Chave de Serviço (Firebase Admin SDK)
1. No console do Firebase, vá para "Configurações do projeto" (ícone de engrenagem)
2. Na aba "Contas de serviço", clique em "Gerar nova chave privada"
3. Baixe o arquivo JSON com as credenciais da service account
4. **IMPORTANTE**: Use o Firebase Admin SDK, não o sistema legado de secrets

### 2.2 Configurar Credenciais no Backend

**Opção A: Arquivo de Credenciais (Recomendado)**
```bash
# Copie o arquivo baixado para o diretório backend
cp ~/Downloads/firebase-credentials.json backend/

# Configure a variável de ambiente
export FIREBASE_CREDENTIALS_FILE=./firebase-credentials.json

# Ou execute o script de configuração automática
cd backend
python setup_firebase.py
```

**Opção B: Variável de Ambiente (Produção)**
```bash
# Converta o JSON para uma linha e configure a variável
export FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"rob2-app-6421e",...}'
```

**Opção C: Configuração Automática**
```bash
# Execute o script de setup
cd backend
python setup_firebase.py

# Teste a configuração
python test_firebase_admin.py
```

## 3. Estrutura de Dados no Firestore

O sistema criará automaticamente a seguinte estrutura:

```
/users/{firebase_uid}/articles/{article_id}
```

Cada artigo terá a seguinte estrutura:
```json
{
  "titulo": "Título do artigo",
  "autores": "Autor1, Autor2",
  "revista": "Nome da revista",
  "ano": 2024,
  "doi": "10.1000/example",
  "url": "https://example.com",
  "resumo": "Resumo do artigo...",
  "palavras_chave": ["palavra1", "palavra2"],
  "tipo_estudo": "Ensaio clínico randomizado",
  "desenho": "Paralelo",
  "desfechos": ["desfecho1", "desfecho2"],
  "observacoes": "Observações adicionais...",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 4. Configuração do Frontend

### 4.1 Instalar Firebase SDK
```bash
cd frontend
npm install firebase
```

### 4.2 Configurar Firebase no Frontend
Crie um arquivo `src/firebase/config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMT64mXXhFvPXzE5P-JfknrzDnDHd2liI",
  authDomain: "rob2-app-6421e.firebaseapp.com",
  projectId: "rob2-app-6421e",
  storageBucket: "rob2-app-6421e.firebasestorage.app",
  messagingSenderId: "871511141871",
  appId: "1:871511141871:web:93f41e7e85c96fd8049a1a",
  measurementId: "G-L6B5K36SR3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 4.3 Implementar Login com Google
```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase/config';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    return token;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
};
```

## 5. Uso da API

### 5.1 Autenticação
Todas as rotas de artigos requerem autenticação via Firebase. Inclua o token no cabeçalho:

```bash
curl -H "Authorization: Bearer SEU_FIREBASE_TOKEN" \
     -H "Content-Type: application/json" \
     -X GET "http://localhost:8000/api/articles"
```

### 5.2 Endpoints Disponíveis

- `GET /api/articles` - Lista artigos do usuário
- `POST /api/articles` - Cria novo artigo
- `GET /api/articles/{id}` - Obtém artigo específico
- `PUT /api/articles/{id}` - Atualiza artigo
- `DELETE /api/articles/{id}` - Remove artigo

### 5.3 Exemplo de Criação de Artigo
```bash
curl -H "Authorization: Bearer SEU_FIREBASE_TOKEN" \
     -H "Content-Type: application/json" \
     -X POST "http://localhost:8000/api/articles" \
     -d '{
       "titulo": "Eficácia da intervenção X",
       "autores": "Silva, J. et al.",
       "revista": "Revista Médica",
       "ano": 2024,
       "doi": "10.1000/example",
       "resumo": "Este estudo avaliou...",
       "palavras_chave": ["intervenção", "eficácia"],
       "tipo_estudo": "Ensaio clínico randomizado"
     }'
```

## 6. Regras de Segurança do Firestore

Configure as regras de segurança no console do Firebase:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem acessar seus próprios artigos
    match /users/{userId}/articles/{articleId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 7. Troubleshooting

### 7.1 Erro de Credenciais
- Verifique se o arquivo de credenciais está no local correto
- Confirme se as variáveis de ambiente estão configuradas
- Teste com `firebase_admin.initialize_app()` em um script Python

### 7.2 Erro de Permissão
- Verifique as regras de segurança do Firestore
- Confirme se o usuário está autenticado
- Verifique se o token Firebase é válido

### 7.3 Erro de CORS
- Configure CORS no Firebase se necessário
- Verifique se o domínio está autorizado no console do Firebase
