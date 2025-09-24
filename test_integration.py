#!/usr/bin/env python3
"""Script para testar a integração básica do sistema RoB2."""

from pathlib import Path
import requests

BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"


def test_backend_health() -> bool:
    print("🔍 Testando backend...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        ok = response.status_code == 200
        print("✅ Backend OK" if ok else f"❌ Backend retornou {response.status_code}")
        return ok
    except requests.RequestException as exc:
        print(f"❌ Backend inacessível: {exc}")
        return False


def test_frontend_health() -> bool:
    print("🔍 Testando frontend...")
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        ok = response.status_code == 200
        print("✅ Frontend OK" if ok else f"❌ Frontend retornou {response.status_code}")
        return ok
    except requests.RequestException as exc:
        print(f"❌ Frontend inacessível: {exc}")
        return False


def test_articles_require_auth() -> bool:
    print("🔍 Verificando proteção da API de artigos...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/articles", timeout=5)
        if response.status_code == 401:
            print("✅ Endpoint protegido por JWT")
            return True
        print(f"❌ Resposta inesperada: {response.status_code}")
        return False
    except requests.RequestException as exc:
        print(f"❌ Erro ao acessar /api/articles: {exc}")
        return False


def test_api_documentation() -> bool:
    print("🔍 Testando documentação da API...")
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=5)
        ok = response.status_code == 200
        print("✅ Documentação acessível" if ok else f"❌ Status {response.status_code}")
        return ok
    except requests.RequestException as exc:
        print(f"❌ Erro ao acessar documentação: {exc}")
        return False


def print_summary(results):
    print("
" + "=" * 50)
    print("📊 RESUMO DOS TESTES")
    print("=" * 50)

    total = len(results)
    passed = sum(1 for value in results.values() if value)

    for name, value in results.items():
        status = "✅" if value else "❌"
        print(f"{status} {name}")

    print(f"
Resultado: {passed}/{total} testes passaram")
    if passed == total:
        print("🎯 Ambiente pronto! Lembre-se de gerar um token JWT em /api/auth/login.")
    else:
        print("⚠️ Ajuste os itens acima antes de continuar.")


def main():
    print("🚀 Teste de integração RoB2")
    results = {
        "Backend /health": test_backend_health(),
        "Frontend": test_frontend_health(),
        "Artigos protegidos": test_articles_require_auth(),
        "API docs": test_api_documentation(),
    }
    print_summary(results)


if __name__ == "__main__":
    main()
