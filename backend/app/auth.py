"""Módulo de autenticação e autorização.

Fornece utilitários para hashing de senhas, geração e verificação de tokens JWT
e dependências do FastAPI para extrair o usuário atual a partir do cabeçalho
Authorization. O RBAC básico é implementado por meio da verificação de papéis
no modelo `ProjectMember`.
"""

from datetime import datetime, timedelta
import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import models, database

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 8)))  # default 8h


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.senha_hash):
        return None
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_identifier = payload.get("sub")
        if user_identifier is None:
            raise credentials_exception
        user_id = int(user_identifier)
    except (JWTError, ValueError):
        raise credentials_exception
    user = db.get(models.User, user_id)
    if user is None:
        raise credentials_exception
    return user


def check_project_role(db: Session, user: models.User, project_id: int, allowed_roles: list) -> None:
    """Verifica se o usuário possui um papel permitido num projeto específico.

    Lança HTTPException(403) se não autorizado.
    """
    membro = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.projeto_id == project_id, models.ProjectMember.usuario_id == user.id)
        .first()
    )
    if not membro or membro.papel.value not in allowed_roles:
        raise HTTPException(status_code=403, detail="Sem permissão para acessar este recurso")