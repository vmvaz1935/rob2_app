"""SQLAlchemy models for the RoB 2 backend."""

import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum,
    JSON,
    UniqueConstraint,
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

    projetos = relationship("Project", secondary="membros_projeto", back_populates="usuarios", overlaps="membros")
    auditorias = relationship("Audit", back_populates="usuario")


class Project(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)

    membros = relationship("ProjectMember", back_populates="projeto", cascade="all, delete-orphan", overlaps="usuarios")
    estudos = relationship("Study", back_populates="projeto", cascade="all, delete-orphan")
    usuarios = relationship("User", secondary="membros_projeto", back_populates="projetos", overlaps="membros")


class ProjectMember(Base):
    __tablename__ = "membros_projeto"
    __table_args__ = (
        UniqueConstraint("usuario_id", "projeto_id", name="uq_membros_projeto_usuario_projeto"),
    )

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    projeto_id = Column(Integer, ForeignKey("projetos.id", ondelete="CASCADE"), nullable=False)
    papel = Column(Enum(RoleType), nullable=False, default=RoleType.EDITOR)

    usuario = relationship("User", overlaps="projetos,usuarios")
    projeto = relationship("Project", back_populates="membros", overlaps="usuarios,projetos")


class Study(Base):
    __tablename__ = "estudos"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id", ondelete="CASCADE"), nullable=False)
    referencia = Column(String(255), nullable=False)
    desenho = Column(String(255))

    projeto = relationship("Project", back_populates="estudos")
    resultados = relationship("Result", back_populates="estudo", cascade="all, delete-orphan")


class Result(Base):
    __tablename__ = "resultados"

    id = Column(Integer, primary_key=True, index=True)
    estudo_id = Column(Integer, ForeignKey("estudos.id", ondelete="CASCADE"), nullable=False)
    desfecho = Column(String(255), nullable=False)
    medida_efeito = Column(String(255))
    efeito_interesse = Column(String(50))
    resultado_numerico = Column(String(255))
    fontes = Column(JSON)

    estudo = relationship("Study", back_populates="resultados")
    avaliacao = relationship("Evaluation", back_populates="resultado", uselist=False, cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "avaliacoes"

    id = Column(Integer, primary_key=True, index=True)
    resultado_id = Column(Integer, ForeignKey("resultados.id", ondelete="CASCADE"), nullable=False)
    pre_consideracoes = Column(Text)
    julgamento_global = Column(String(50))
    direcao_global = Column(Enum(DirectionType))
    justificativa_global = Column(Text)
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"))
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
    respostas = Column(JSON, nullable=False)
    comentarios = Column(Text)
    observacoes_itens = Column(JSON)
    julgamento = Column(String(50))
    justificativa = Column(Text)
    direcao = Column(Enum(DirectionType))

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
