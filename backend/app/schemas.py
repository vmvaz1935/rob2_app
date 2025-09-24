"""Schemas Pydantic (DTOs) usados para entradas e saídas da API.

Os modelos são alinhados com a especificação OpenAPI declarada em docs/api_spec.yaml.
"""

from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    nome: str
    email: EmailStr


class UserCreate(UserBase):
    senha: str = Field(..., min_length=6)


class User(UserBase):
    id: int
    criado_em: datetime

    class Config:
        orm_mode = True


class ProjectBase(BaseModel):
    nome: str


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int

    class Config:
        orm_mode = True


class StudyBase(BaseModel):
    projeto_id: int
    referencia: str
    desenho: Optional[str]


class StudyCreate(StudyBase):
    pass


class Study(StudyBase):
    id: int

    class Config:
        orm_mode = True


class DomainBase(BaseModel):
    tipo: int
    respostas: Dict[str, str]
    comentarios: Optional[str] = None
    observacoes_itens: Optional[Dict[str, str]] = None
    justificativa: Optional[str] = None
    direcao: Optional[str] = None


class DomainCreate(DomainBase):
    pass


class Domain(DomainBase):
    id: int
    julgamento: Optional[str] = None
    justificativa: Optional[str] = None

    class Config:
        orm_mode = True


class EvaluationBase(BaseModel):
    resultado_id: int
    pre_consideracoes: Optional[str] = None
    dominios: List[DomainCreate]


class EvaluationCreate(EvaluationBase):
    pass


class Evaluation(EvaluationBase):
    id: int
    julgamento_global: Optional[str] = None
    direcao_global: Optional[str] = None
    justificativa_global: Optional[str] = None
    dominios: List[Domain]  # override for Domain with id
    criado_por_id: Optional[int] = None
    criado_em: Optional[datetime] = None

    class Config:
        orm_mode = True


# Schemas para artigos no Firestore
class ArticleBase(BaseModel):
    titulo: str
    autores: str
    revista: Optional[str] = None
    ano: Optional[int] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    resumo: Optional[str] = None
    palavras_chave: Optional[List[str]] = None
    tipo_estudo: Optional[str] = None
    desenho: Optional[str] = None
    desfechos: Optional[List[str]] = None
    observacoes: Optional[str] = None


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    titulo: Optional[str] = None
    autores: Optional[str] = None
    revista: Optional[str] = None
    ano: Optional[int] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    resumo: Optional[str] = None
    palavras_chave: Optional[List[str]] = None
    tipo_estudo: Optional[str] = None
    desenho: Optional[str] = None
    desfechos: Optional[List[str]] = None
    observacoes: Optional[str] = None


class Article(ArticleBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True