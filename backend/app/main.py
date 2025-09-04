"""Ponto de entrada da API FastAPI.

Define as rotas públicas e privadas da aplicação RoB 2. A API está
versionada implicitamente no prefixo `/api`. Para documentação automática,
acessar `/docs` ou `/openapi.json` após iniciar o servidor.
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from . import database, models, schemas, auth, rule_engine


app = FastAPI(title="RoB2 API", openapi_url="/openapi.json", docs_url="/docs")

# Habilitar CORS para permitir o frontend acessar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, ajustar para origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/login", summary="Realiza login e retorna um token JWT")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais incorretas")
    access_token = auth.create_access_token({"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/projects", response_model=List[schemas.Project], summary="Lista projetos do usuário")
def list_projects(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    projects = (
        db.query(models.Project)
        .join(models.ProjectMember)
        .filter(models.ProjectMember.usuario_id == current_user.id)
        .all()
    )
    return projects


@app.post("/api/projects", response_model=schemas.Project, status_code=201, summary="Cria um novo projeto")
def create_project(proj: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Criar projeto e adicionar usuário como administrador
    project = models.Project(nome=proj.nome)
    db.add(project)
    db.flush()  # Gera id
    membro = models.ProjectMember(usuario_id=current_user.id, projeto_id=project.id, papel=models.RoleType.ADMIN)
    db.add(membro)
    db.commit()
    db.refresh(project)
    return project


@app.post("/api/evaluations", response_model=schemas.Evaluation, summary="Cria ou atualiza avaliação de um resultado")
def create_or_update_evaluation(eval_in: schemas.EvaluationCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Garantir que usuário tem permissão no projeto do resultado
    resultado = db.query(models.Result).get(eval_in.resultado_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado não encontrado")
    projeto_id = resultado.estudo.projeto_id
    auth.check_project_role(db, current_user, projeto_id, [models.RoleType.EDITOR.value, models.RoleType.ADMIN.value])

    # Recuperar ou criar avaliação
    avaliacao = resultado.avaliacao
    if not avaliacao:
        avaliacao = models.Evaluation(resultado_id=resultado.id, criado_por_id=current_user.id)
        db.add(avaliacao)
        db.flush()
    # Atualizar pré‑considerações
    avaliacao.pre_consideracoes = eval_in.pre_consideracoes

    # Limpar domínios existentes
    avaliacao.dominios.clear()
    judgments = []
    # Para cada domínio recebido, calcular julgamento e persistir
    for dominio_in in eval_in.dominios:
        julgamento, justificativa = rule_engine.evaluate_domain(dominio_in.tipo, dominio_in.respostas)
        domain = models.Domain(
            avaliacao_id=avaliacao.id,
            tipo=dominio_in.tipo,
            respostas=dominio_in.respostas,
            comentarios=dominio_in.comentarios,
            julgamento=julgamento,
            direcao=dominio_in.direcao or models.DirectionType.NA,
        )
        db.add(domain)
        judgments.append(julgamento)
    # Calcular julgamento global
    global_judgment = rule_engine.evaluate_global(judgments)
    avaliacao.julgamento_global = global_judgment
    avaliacao.direcao_global = models.DirectionType.NA
    avaliacao.justificativa_global = None

    db.commit()
    db.refresh(avaliacao)
    return avaliacao


@app.get("/api/results/{result_id}/evaluation", response_model=schemas.Evaluation, summary="Obtém avaliação de um resultado")
def get_evaluation(result_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    resultado = db.query(models.Result).get(result_id)
    if not resultado or not resultado.avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    projeto_id = resultado.estudo.projeto_id
    auth.check_project_role(db, current_user, projeto_id, [models.RoleType.LEITOR.value, models.RoleType.EDITOR.value, models.RoleType.ADMIN.value])
    return resultado.avaliacao


@app.post("/api/import", summary="Importa avaliações a partir de arquivo Excel")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Este endpoint recebe um arquivo Excel e delega ao serviço de importação
    # Para simplificação do protótipo, apenas sinalizamos que a funcionalidade não está implementada.
    raise HTTPException(status_code=501, detail="Importação de Excel ainda não implementada")


@app.get("/api/results/{result_id}/export", summary="Exporta avaliação para Excel ou DOCX")
async def export_evaluation(result_id: int, format: str = "xlsx", db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Endpoint de exportação. No protótipo não há implementação completa.
    raise HTTPException(status_code=501, detail="Exportação ainda não implementada")


@app.get("/health", summary="Health check")
def health():
    return {"status": "ok"}