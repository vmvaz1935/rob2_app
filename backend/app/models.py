"""Modelos de dados utilizando SQLAlchemy.

Esta camada define as tabelas e relacionamentos conforme o modelo ER
descrito nos documentos de arquitetura. Enumeradores são utilizados
para papéis de usuário e direções de viés.
"""

import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func


Base = declarative_base()


class RoleType(str, enum.Enum):
    LEITOR = "LEITOR"
    EDITOR = "EDITOR"
    ADMIN = "ADMIN"


class DirectionType(str, enum.Enum):
    NA = "NA"
    FAVORECE_EXPERIMENTAL = "Favorece experimental"
    FAVORECE_COMPARADOR = "Favorece comparador"
    EM_DIRECAO_AO_NULO = "Em direção ao nulo"
    AFASTANDO_DO_NULO = "Afastando do nulo"
    IMPREVISIVEL = "Imprevisível"


class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    projetos = relationship("Project", secondary="membros_projeto", back_populates="usuarios")
    auditorias = relationship("Audit", back_populates="usuario")


class Project(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)

    membros = relationship("ProjectMember", back_populates="projeto")
    estudos = relationship("Study", back_populates="projeto")

    usuarios = relationship("User", secondary="membros_projeto", back_populates="projetos")


class ProjectMember(Base):
    __tablename__ = "membros_projeto"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    projeto_id = Column(Integer, ForeignKey("projetos.id", ondelete="CASCADE"), nullable=False)
    papel = Column(Enum(RoleType), nullable=False, default=RoleType.EDITOR)

    usuario = relationship("User")
    projeto = relationship("Project", back_populates="membros")


class Study(Base):
    __tablename__ = "estudos"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id", ondelete="CASCADE"), nullable=False)
    referencia = Column(String(255), nullable=False)
    desenho = Column(String(255), nullable=True)

    projeto = relationship("Project", back_populates="estudos")
    resultados = relationship("Result", back_populates="estudo")


class Result(Base):
    __tablename__ = "resultados"

    id = Column(Integer, primary_key=True, index=True)
    estudo_id = Column(Integer, ForeignKey("estudos.id", ondelete="CASCADE"), nullable=False)
    desfecho = Column(String(255), nullable=False)
    medida_efeito = Column(String(255), nullable=True)
    efeito_interesse = Column(String(50), nullable=True)  # assignment | adherence
    resultado_numerico = Column(String(255), nullable=True)
    fontes = Column(JSON, nullable=True)

    estudo = relationship("Study", back_populates="resultados")
    avaliacao = relationship("Evaluation", back_populates="resultado", uselist=False)


class Evaluation(Base):
    __tablename__ = "avaliacoes"

    id = Column(Integer, primary_key=True, index=True)
    resultado_id = Column(Integer, ForeignKey("resultados.id", ondelete="CASCADE"), nullable=False)
    pre_consideracoes = Column(Text, nullable=True)
    julgamento_global = Column(String(50), nullable=True)
    direcao_global = Column(Enum(DirectionType), nullable=True)
    justificativa_global = Column(Text, nullable=True)
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    resultado = relationship("Result", back_populates="avaliacao")
    dominios = relationship("Domain", back_populates="avaliacao", cascade="all, delete-orphan")
    auditorias = relationship("Audit", back_populates="avaliacao")
    criado_por = relationship("User")


class Domain(Base):
    __tablename__ = "dominios"

    id = Column(Integer, primary_key=True, index=True)
    avaliacao_id = Column(Integer, ForeignKey("avaliacoes.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(Integer, nullable=False)
    respostas = Column(JSON, nullable=False)  # dict {questionId: answer}
    comentarios = Column(Text, nullable=True)
    observacoes_itens = Column(JSON, nullable=True)  # dict {questionId: observation}
    julgamento = Column(String(50), nullable=True)
    direcao = Column(Enum(DirectionType), nullable=True)

    avaliacao = relationship("Evaluation", back_populates="dominios")


class Audit(Base):
    __tablename__ = "auditorias"

    id = Column(Integer, primary_key=True, index=True)
    avaliacao_id = Column(Integer, ForeignKey("avaliacoes.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    acao = Column(String(255), nullable=False)
    data_hora = Column(DateTime(timezone=True), server_default=func.now())

    avaliacao = relationship("Evaluation", back_populates="auditorias")
    usuario = relationship("User", back_populates="auditorias")