#!/usr/bin/env python3
"""
Script para configurar o Firebase no backend.
Execute este script após baixar as credenciais do Firebase Console.
"""

import os
import json
import sys
from pathlib import Path

def setup_firebase_credentials():
    """Configura as credenciais do Firebase Admin SDK."""
    
    print("🔧 Configurando Firebase Admin SDK para o backend...")
    
    # Verificar se o arquivo de credenciais existe
    credentials_file = Path("firebase-credentials.json")
    
    if not credentials_file.exists():
        print("❌ Arquivo firebase-credentials.json não encontrado!")
        print("\n📋 Para baixar a chave privada do Firebase Admin SDK:")
        print("1. Acesse: https://console.firebase.google.com/")
        print("2. Selecione o projeto: rob2-app-6421e")
        print("3. Vá para Configurações (ícone ⚙️)")
        print("4. Aba 'Contas de serviço'")
        print("5. Clique em 'Gerar nova chave privada'")
        print("6. Salve o arquivo JSON como 'firebase-credentials.json' na pasta backend/")
        print("\n⚠️  IMPORTANTE: Use o Firebase Admin SDK, não o sistema legado de secrets!")
        return False
    
    # Validar o arquivo JSON do Firebase Admin SDK
    try:
        with open(credentials_file, 'r') as f:
            creds = json.load(f)
        
        # Campos obrigatórios para Firebase Admin SDK
        required_fields = ['type', 'project_id', 'private_key', 'client_email', 'private_key_id']
        for field in required_fields:
            if field not in creds:
                print(f"❌ Campo obrigatório '{field}' não encontrado no arquivo de credenciais")
                return False
        
        # Verificar se é uma service account válida
        if creds.get('type') != 'service_account':
            print("❌ Arquivo de credenciais não é uma service account válida")
            return False
        
        print(f"✅ Firebase Admin SDK configurado para o projeto: {creds['project_id']}")
        print(f"✅ Service Account: {creds['client_email']}")
        
    except json.JSONDecodeError:
        print("❌ Arquivo de credenciais inválido (não é um JSON válido)")
        return False
    except Exception as e:
        print(f"❌ Erro ao ler arquivo de credenciais: {e}")
        return False
    
    # Configurar variável de ambiente
    env_file = Path(".env")
    env_content = f"""# Configuração do Firebase
FIREBASE_CREDENTIALS_FILE=./firebase-credentials.json

# Configuração do banco de dados
DATABASE_URL=postgresql://rob2_user:rob2_pass@localhost:5432/rob2_db

# Chave secreta para JWT
SECRET_KEY=CHANGE_THIS_SECRET
"""
    
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print("✅ Arquivo .env criado com as configurações")
    
    # Testar inicialização do Firebase
    try:
        from app.firebase_config import initialize_firebase
        app = initialize_firebase()
        print("✅ Firebase inicializado com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao inicializar Firebase: {e}")
        print("\n🔍 Verifique se:")
        print("- O arquivo firebase-credentials.json está correto")
        print("- As dependências estão instaladas: pip install -r requirements.txt")
        return False

def test_firebase_connection():
    """Testa a conexão com o Firebase."""
    
    print("\n🧪 Testando conexão com Firebase...")
    
    try:
        from app.firebase_config import get_firestore_client
        db = get_firestore_client()
        
        # Teste simples de conexão
        print("✅ Conexão com Firestore estabelecida")
        
        # Testar autenticação
        from app.firebase_config import verify_firebase_token
        print("✅ Módulo de autenticação carregado")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False

def main():
    """Função principal."""
    
    print("🚀 Configuração do Firebase para RoB2 Backend")
    print("=" * 50)
    
    # Verificar se estamos na pasta correta
    if not Path("app").exists():
        print("❌ Execute este script na pasta backend/")
        sys.exit(1)
    
    # Configurar credenciais
    if not setup_firebase_credentials():
        sys.exit(1)
    
    # Testar conexão
    if not test_firebase_connection():
        sys.exit(1)
    
    print("\n🎉 Configuração concluída com sucesso!")
    print("\n📋 Próximos passos:")
    print("1. Inicie o backend: uvicorn app.main:app --reload")
    print("2. Inicie o frontend: cd ../frontend && npm run dev")
    print("3. Teste o login em: http://localhost:3000")

if __name__ == "__main__":
    main()
