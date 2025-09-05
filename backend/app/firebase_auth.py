"""Autenticação Firebase para o sistema RoB2.

Este módulo fornece autenticação via Firebase Auth com Google,
substituindo o sistema de autenticação tradicional por email/senha.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from . import database, models, firebase_config

# Esquema de autenticação Bearer para tokens Firebase
security = HTTPBearer()


class FirebaseUser:
    """Representa um usuário autenticado via Firebase."""
    
    def __init__(self, firebase_uid: str, email: str, name: str, picture: Optional[str] = None):
        self.firebase_uid = firebase_uid
        self.email = email
        self.name = name
        self.picture = picture
        self.id = firebase_uid  # Para compatibilidade com o sistema existente


async def get_current_firebase_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db)
) -> FirebaseUser:
    """Extrai e valida o usuário atual a partir do token Firebase."""
    
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar token Firebase
    decoded_token = firebase_config.verify_firebase_token(credentials.credentials)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extrair dados do usuário do token
    firebase_uid = decoded_token.get('uid')
    email = decoded_token.get('email')
    name = decoded_token.get('name', '')
    picture = decoded_token.get('picture')
    
    if not firebase_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: dados do usuário não encontrados",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Criar ou atualizar usuário no banco local (para compatibilidade com projetos)
    user = get_or_create_local_user(db, firebase_uid, email, name)
    
    return FirebaseUser(firebase_uid, email, name, picture)


def get_or_create_local_user(db: Session, firebase_uid: str, email: str, name: str) -> models.User:
    """Cria ou atualiza um usuário local baseado nos dados do Firebase."""
    
    # Buscar usuário existente por email
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if user:
        # Atualizar dados se necessário
        if user.nome != name:
            user.nome = name
            db.commit()
        return user
    
    # Criar novo usuário
    new_user = models.User(
        id=int(firebase_uid.replace('-', '').replace('_', '')[:10]) if firebase_uid else None,  # ID numérico simples
        nome=name,
        email=email,
        senha_hash="firebase_auth"  # Placeholder, não usado
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def check_project_role_firebase(db: Session, user: FirebaseUser, project_id: int, allowed_roles: list) -> None:
    """Verifica se o usuário Firebase possui um papel permitido num projeto específico."""
    
    # Buscar usuário local correspondente
    local_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not local_user:
        raise HTTPException(status_code=403, detail="Usuário não encontrado no sistema")
    
    # Usar a função existente de verificação de papel
    from . import auth
    auth.check_project_role(db, local_user, project_id, allowed_roles)
