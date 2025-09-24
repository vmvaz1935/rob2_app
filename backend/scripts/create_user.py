#!/usr/bin/env python3
"""Script CLI simples para criar usuários no backend RoB2."""

import argparse
import sys
from getpass import getpass
from pathlib import Path

from sqlalchemy.orm import Session

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app import database, models, auth


def create_user(db: Session, nome: str, email: str, senha: str) -> models.User:
    if db.query(models.User).filter(models.User.email == email).first():
        raise ValueError("E-mail já cadastrado")

    user = models.User(
        nome=nome,
        email=email,
        senha_hash=auth.get_password_hash(senha),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def main() -> None:
    parser = argparse.ArgumentParser(description="Cria um usuário local no banco de dados RoB2")
    parser.add_argument("nome", help="Nome completo")
    parser.add_argument("email", help="E-mail do usuário")
    parser.add_argument("senha", nargs="?", help="Senha (se omitida, será solicitada de forma segura)")
    args = parser.parse_args()

    senha = args.senha or getpass("Senha: ")
    if not senha:
        raise SystemExit("Senha obrigatória")

    with database.SessionLocal() as session:
        user = create_user(session, args.nome, args.email, senha)
        print(f"✅ Usuário criado com ID {user.id}")


if __name__ == "__main__":
    main()
