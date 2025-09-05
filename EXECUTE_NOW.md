# 🚀 EXECUTE AGORA - Guia de Configuração Completa

## 📋 **Checklist de Execução**

### **1. Baixar Chave Privada do Firebase Admin SDK** ⚠️ **OBRIGATÓRIO**

1. **Acesse**: https://console.firebase.google.com/
2. **Selecione**: Projeto `rob2-app-6421e`
3. **Vá para**: Configurações (ícone ⚙️) > Aba "Contas de serviço"
4. **Clique**: "Gerar nova chave privada"
5. **Salve como**: `backend/firebase-credentials.json`
6. **⚠️ IMPORTANTE**: Use o Firebase Admin SDK, não o sistema legado de secrets!

### **2. Configurar Backend**

```bash
# Navegar para o backend
cd backend

# Instalar dependências
pip install -r requirements.txt

# Configurar Firebase Admin SDK
python setup_firebase.py

# Testar configuração
python test_firebase_admin.py

# Iniciar servidor
python start_server.py
```

### **3. Configurar Frontend** (em outro terminal)

```bash
# Navegar para o frontend
cd frontend

# Instalar dependências e iniciar
node start_dev.js
```

### **4. Testar Integração**

```bash
# Na raiz do projeto
python test_integration.py
```

## 🎯 **Resultado Esperado**

Após executar todos os passos, você deve ver:

```
🧪 Teste de Integração - Sistema RoB2
==================================================
🔍 Testando backend...
✅ Backend está rodando
🔍 Testando frontend...
✅ Frontend está rodando
🔍 Testando configuração Firebase...
✅ Autenticação Firebase configurada (endpoint protegido)
🔍 Testando documentação da API...
✅ Documentação da API acessível

==================================================
📊 RESUMO DOS TESTES
==================================================
Backend Health: ✅ PASSOU
Frontend Health: ✅ PASSOU
Firebase Auth: ✅ PASSOU
API Documentation: ✅ PASSOU

🎯 Resultado: 4/4 testes passaram
🎉 Todos os testes passaram! Sistema está funcionando.
```

## 🌐 **URLs de Acesso**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔐 **Teste de Login**

1. **Acesse**: http://localhost:3000
2. **Clique**: "Entrar com Google"
3. **Autorize**: Acesso à sua conta Google
4. **Resultado**: Deve redirecionar para a página de artigos

## 📝 **Teste de Criação de Artigo**

1. **Após login**, clique em "Novo Artigo"
2. **Preencha**:
   - Título: "Teste de Integração"
   - Autores: "Seu Nome"
   - Revista: "Revista Teste"
   - Ano: 2024
3. **Clique**: "Salvar"
4. **Resultado**: Artigo deve aparecer na lista

## 🔍 **Verificar no Firebase Console**

1. **Acesse**: https://console.firebase.google.com/
2. **Vá para**: Firestore Database
3. **Verifique**: Coleção `users/{seu-uid}/articles`

## 🚨 **Solução de Problemas**

### **Erro: "firebase-credentials.json não encontrado"**
```bash
# Execute novamente o setup
cd backend
python setup_firebase.py
```

### **Erro: "Backend não está acessível"**
```bash
# Verifique se o backend está rodando
cd backend
python start_server.py
```

### **Erro: "Frontend não está acessível"**
```bash
# Verifique se o frontend está rodando
cd frontend
node start_dev.js
```

### **Erro de CORS**
- Verifique se o backend está em `http://localhost:8000`
- Verifique se o frontend está em `http://localhost:3000`

### **Erro de Autenticação**
- Verifique se o domínio `localhost` está autorizado no Firebase
- Verifique se o Google Auth está habilitado

## 📞 **Suporte**

Se encontrar problemas:

1. **Execute**: `python test_integration.py` para diagnóstico
2. **Verifique**: Logs dos serviços
3. **Confirme**: Credenciais do Firebase estão corretas

## 🎉 **Próximos Passos Após Sucesso**

1. ✅ **Sistema funcionando**
2. 🔄 **Testar todas as funcionalidades**
3. 🔄 **Adicionar mais artigos**
4. 🔄 **Testar avaliação RoB2**
5. 🔄 **Fazer deploy (opcional)**

---

**⚡ EXECUTE AGORA**: Siga os passos acima para ter o sistema funcionando em poucos minutos!
