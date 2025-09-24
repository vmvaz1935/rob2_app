#!/usr/bin/env python3
"""Script simples para subir o backend RoB2 em modo de desenvolvimento."""

import os
import sys
import subprocess
from pathlib import Path


def check_requirements() -> bool:
    """Verifica dependências essenciais do backend."""
    print("🔍 Verificando dependências...")
    try:
        import fastapi  # noqa: F401
        import sqlalchemy  # noqa: F401
        print("✅ Dependências principais instaladas")
        return True
    except ImportError as exc:  # pragma: no cover - feedback interativo
        print(f"❌ Dependência não encontrada: {exc}")
        print("📋 Execute: pip install -r requirements.txt")
        return False


def setup_environment() -> None:
    """Define variáveis de ambiente padrão para desenvolvimento."""
    print("⚙️ Configurando ambiente...")
    os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://rob2_user:rob2_pass@localhost:5432/rob2_db")
    os.environ.setdefault("SECRET_KEY", "change-me")
    print("✅ Variáveis definidas (ajuste conforme necessário)")


def start_server() -> None:
    """Inicializa o servidor Uvicorn em modo reload."""
    print("🚀 Iniciando servidor backend...")
    print("🌐 URL: http://localhost:8000")
    print("📄 Docs: http://localhost:8000/docs")
    print("—" * 50)

    try:
        subprocess.run(
            [
                "uvicorn",
                "app.main:app",
                "--reload",
                "--host",
                "0.0.0.0",
                "--port",
                "8000",
            ],
            check=False,
        )
    except KeyboardInterrupt:  # pragma: no cover - feedback interativo
        print("
👋 Servidor interrompido pelo usuário")


def main() -> None:
    """Função principal do script."""
    print("🚀 Backend RoB2")
    print("=" * 30)

    if not Path("app").exists():
        print("❌ Execute este script dentro da pasta backend/")
        sys.exit(1)

    if not check_requirements():
        sys.exit(1)

    setup_environment()
    start_server()


if __name__ == "__main__":
    main()
