#!/usr/bin/env python3
"""
Script para iniciar o servidor backend com configurações corretas.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Verifica se os requisitos estão instalados."""
    
    print("🔍 Verificando dependências...")
    
    try:
        import fastapi
        import firebase_admin
        import sqlalchemy
        print("✅ Dependências principais instaladas")
        return True
    except ImportError as e:
        print(f"❌ Dependência não encontrada: {e}")
        print("📦 Execute: pip install -r requirements.txt")
        return False

def check_firebase_credentials():
    """Verifica se as credenciais do Firebase estão configuradas."""
    
    print("🔍 Verificando credenciais do Firebase...")
    
    credentials_file = Path("firebase-credentials.json")
    if not credentials_file.exists():
        print("❌ Arquivo firebase-credentials.json não encontrado!")
        print("📋 Execute: python setup_firebase.py")
        return False
    
    print("✅ Credenciais do Firebase encontradas")
    return True

def setup_environment():
    """Configura as variáveis de ambiente."""
    
    print("🔧 Configurando ambiente...")
    
    # Configurar variáveis de ambiente
    os.environ["FIREBASE_CREDENTIALS_FILE"] = "./firebase-credentials.json"
    os.environ["DATABASE_URL"] = "postgresql://rob2_user:rob2_pass@localhost:5432/rob2_db"
    os.environ["SECRET_KEY"] = "CHANGE_THIS_SECRET"
    
    print("✅ Variáveis de ambiente configuradas")

def start_server():
    """Inicia o servidor FastAPI."""
    
    print("🚀 Iniciando servidor backend...")
    print("📍 URL: http://localhost:8000")
    print("📚 Documentação: http://localhost:8000/docs")
    print("🔄 Pressione Ctrl+C para parar")
    print("-" * 50)
    
    try:
        # Iniciar servidor com uvicorn
        subprocess.run([
            "uvicorn", 
            "app.main:app", 
            "--reload", 
            "--host", "0.0.0.0", 
            "--port", "8000"
        ])
    except KeyboardInterrupt:
        print("\n👋 Servidor parado pelo usuário")
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")

def main():
    """Função principal."""
    
    print("🚀 Iniciando Backend RoB2")
    print("=" * 30)
    
    # Verificar se estamos na pasta correta
    if not Path("app").exists():
        print("❌ Execute este script na pasta backend/")
        sys.exit(1)
    
    # Verificar dependências
    if not check_requirements():
        sys.exit(1)
    
    # Verificar credenciais
    if not check_firebase_credentials():
        sys.exit(1)
    
    # Configurar ambiente
    setup_environment()
    
    # Iniciar servidor
    start_server()

if __name__ == "__main__":
    main()
