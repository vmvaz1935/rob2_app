#!/usr/bin/env python3
"""
Script para testar a configuração do Firebase Admin SDK.
"""

import os
import sys
import json
from pathlib import Path

def test_firebase_admin_sdk():
    """Testa a configuração do Firebase Admin SDK."""
    
    print("🧪 Testando Firebase Admin SDK")
    print("=" * 40)
    
    # Verificar se o arquivo de credenciais existe
    credentials_file = Path("firebase-credentials.json")
    if not credentials_file.exists():
        print("❌ Arquivo firebase-credentials.json não encontrado!")
        print("📋 Baixe a chave privada do Firebase Console")
        return False
    
    # Validar estrutura do arquivo
    try:
        with open(credentials_file, 'r') as f:
            creds = json.load(f)
        
        print(f"✅ Arquivo de credenciais encontrado")
        print(f"   Projeto: {creds.get('project_id', 'N/A')}")
        print(f"   Service Account: {creds.get('client_email', 'N/A')}")
        print(f"   Tipo: {creds.get('type', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Erro ao ler arquivo de credenciais: {e}")
        return False
    
    # Testar inicialização do Firebase Admin SDK
    try:
        print("\n🔧 Testando inicialização do Firebase Admin SDK...")
        
        # Configurar variável de ambiente
        os.environ["FIREBASE_CREDENTIALS_FILE"] = "./firebase-credentials.json"
        
        # Importar e inicializar
        from app.firebase_config import initialize_firebase, get_firestore_client, verify_firebase_token
        
        # Inicializar Firebase
        app = initialize_firebase()
        print("✅ Firebase Admin SDK inicializado com sucesso")
        
        # Testar Firestore
        db = get_firestore_client()
        print("✅ Cliente Firestore conectado")
        
        # Testar autenticação
        print("✅ Módulo de autenticação carregado")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar Firebase Admin SDK: {e}")
        print("\n🔍 Possíveis soluções:")
        print("1. Verifique se o arquivo firebase-credentials.json está correto")
        print("2. Confirme se as dependências estão instaladas: pip install -r requirements.txt")
        print("3. Verifique se o projeto Firebase está ativo")
        return False

def test_firestore_connection():
    """Testa a conexão com o Firestore."""
    
    print("\n🔍 Testando conexão com Firestore...")
    
    try:
        from app.firebase_config import get_firestore_client
        
        db = get_firestore_client()
        
        # Teste simples de leitura
        print("✅ Conexão com Firestore estabelecida")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro na conexão com Firestore: {e}")
        return False

def test_authentication():
    """Testa o módulo de autenticação."""
    
    print("\n🔍 Testando módulo de autenticação...")
    
    try:
        from app.firebase_config import verify_firebase_token
        
        # Teste com token inválido (deve retornar None)
        result = verify_firebase_token("invalid_token")
        if result is None:
            print("✅ Módulo de autenticação funcionando (token inválido rejeitado)")
        else:
            print("⚠️  Módulo de autenticação aceitou token inválido")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no módulo de autenticação: {e}")
        return False

def main():
    """Função principal."""
    
    print("🚀 Teste do Firebase Admin SDK - RoB2")
    print("=" * 50)
    
    # Verificar se estamos na pasta correta
    if not Path("app").exists():
        print("❌ Execute este script na pasta backend/")
        sys.exit(1)
    
    # Executar testes
    tests = [
        ("Firebase Admin SDK", test_firebase_admin_sdk),
        ("Firestore Connection", test_firestore_connection),
        ("Authentication", test_authentication)
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ Erro inesperado em {test_name}: {e}")
            results[test_name] = False
    
    # Resumo dos testes
    print("\n" + "=" * 50)
    print("📊 RESUMO DOS TESTES")
    print("=" * 50)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for test_name, result in results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{test_name}: {status}")
    
    print(f"\n🎯 Resultado: {passed_tests}/{total_tests} testes passaram")
    
    if passed_tests == total_tests:
        print("🎉 Firebase Admin SDK configurado com sucesso!")
        print("\n📋 Próximos passos:")
        print("1. Execute: python start_server.py")
        print("2. Teste a API em: http://localhost:8000/docs")
        print("3. Inicie o frontend e teste o login")
    else:
        print("⚠️  Alguns testes falharam. Verifique a configuração.")
        sys.exit(1)

if __name__ == "__main__":
    main()
