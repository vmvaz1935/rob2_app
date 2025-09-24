"""Configuração de banco de dados usando SQLAlchemy.

Este módulo inicializa o motor de conexão com Postgres e provê uma sessão
de banco para ser utilizada pelos repositórios. As credenciais são lidas
das variáveis de ambiente, com valores padrão para uso em desenvolvimento.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import os

# URL de conexão (exemplo: postgresql://usuario:senha@db:5432/rob2)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://rob2_user:rob2_pass@db:5432/rob2_db",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))


def get_db():
    """Provedor de dependência para FastAPI.

    Utiliza um gerador para abrir uma sessão no início de cada request e
    finalizá‑la ao final. Caso ocorra uma exceção, a transação é revertida.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()