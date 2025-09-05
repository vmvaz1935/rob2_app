#!/usr/bin/env python3
"""
Script para testar a integração completa do sistema RoB2.
"""

import requests
import json
import time
import sys
from pathlib import Path

# URLs dos serviços
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_backend_health():
    """Testa se o backend está rodando."""
    
    print("🔍 Testando backend...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend está rodando")
            return True
        else:
            print(f"❌ Backend retornou status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend não está acessível: {e}")
        return False

def test_frontend_health():
    """Testa se o frontend está rodando."""
    
    print("🔍 Testando frontend...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend está rodando")
            return True
        else:
            print(f"❌ Frontend retornou status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend não está acessível: {e}")
        return False

def test_firebase_auth():
    """Testa se a autenticação Firebase está configurada."""
    
    print("🔍 Testando configuração Firebase...")
    
    try:
        # Testar se o endpoint de artigos está protegido
        response = requests.get(f"{BACKEND_URL}/api/articles", timeout=5)
        
        if response.status_code == 401:
            print("✅ Autenticação Firebase configurada (endpoint protegido)")
            return True
        elif response.status_code == 200:
            print("⚠️  Endpoint de artigos não está protegido")
            return False
        else:
            print(f"❌ Resposta inesperada: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao testar Firebase: {e}")
        return False

def test_api_documentation():
    """Testa se a documentação da API está acessível."""
    
    print("🔍 Testando documentação da API...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Documentação da API acessível")
            return True
        else:
            print(f"❌ Documentação não acessível: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao acessar documentação: {e}")
        return False

def print_summary(results):
    """Imprime resumo dos testes."""
    
    print("\n" + "="*50)
    print("📊 RESUMO DOS TESTES")
    print("="*50)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for test_name, result in results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{test_name}: {status}")
    
    print(f"\n🎯 Resultado: {passed_tests}/{total_tests} testes passaram")
    
    if passed_tests == total_tests:
        print("🎉 Todos os testes passaram! Sistema está funcionando.")
        print("\n📋 Próximos passos:")
        print("1. Acesse http://localhost:3000")
        print("2. Faça login com Google")
        print("3. Teste a criação de artigos")
    else:
        print("⚠️  Alguns testes falharam. Verifique a configuração.")
        print("\n🔧 Soluções:")
        print("1. Verifique se os serviços estão rodando")
        print("2. Execute: python backend/setup_firebase.py")
        print("3. Verifique as credenciais do Firebase")

def main():
    """Função principal."""
    
    print("🧪 Teste de Integração - Sistema RoB2")
    print("="*50)
    
    # Aguardar um pouco para os serviços iniciarem
    print("⏳ Aguardando serviços iniciarem...")
    time.sleep(2)
    
    # Executar testes
    results = {
        "Backend Health": test_backend_health(),
        "Frontend Health": test_frontend_health(),
        "Firebase Auth": test_firebase_auth(),
        "API Documentation": test_api_documentation()
    }
    
    # Imprimir resumo
    print_summary(results)
    
    # Retornar código de saída
    if all(results.values()):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
