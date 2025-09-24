"""Ponto de entrada da API FastAPI.

Define as rotas públicas e privadas da aplicação RoB 2. A API está
versionada implicitamente no prefixo `/api`. Para documentação automática,
acessar `/docs` ou `/openapi.json` após iniciar o servidor.
"""

import json
import os
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from fastapi.responses import StreamingResponse
from . import (
    database,
    models,
    schemas,
    auth,
    rule_engine,
    docx_generator,
    import_export,
    firebase_auth,
    firebase_config,
)


ROOT_DIR = Path(__file__).resolve().parents[2]

app = FastAPI(title="RoB2 API", openapi_url="/openapi.json", docs_url="/docs")

allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()] or ["http://localhost:3000"]
allow_credentials = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
if "*" in allowed_origins:
    allow_credentials = False

# Habilitar CORS para permitir o frontend acessar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Accept-Language"],
)


@app.post("/api/auth/login", summary="Realiza login e retorna um token JWT")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais incorretas")
    access_token = auth.create_access_token({"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/domains/questions", summary="Lista perguntas e respostas por domínio")
def list_domain_questions():
    perguntas_path = ROOT_DIR / "domain" / "perguntas.json"
    with open(perguntas_path, "r", encoding="utf-8") as arquivo:
        return json.load(arquivo)


@app.get("/api/i18n/{locale}", summary="Retorna traduções por idioma")
def get_translations(locale: str):
    arquivo = ROOT_DIR / "domain" / "i18n" / f"{locale}.json"
    if not arquivo.exists():
        raise HTTPException(status_code=404, detail="Arquivo de tradução não encontrado")
    with open(arquivo, "r", encoding="utf-8") as handle:
        return json.load(handle)


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
    resultado = db.get(models.Result, eval_in.resultado_id)
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
    domain_justifications = []
    domain_directions = []
    # Para cada domínio recebido, calcular julgamento e persistir
    for dominio_in in eval_in.dominios:
        julgamento, justificativa = rule_engine.evaluate_domain(dominio_in.tipo, dominio_in.respostas)
        direcao_bruta = dominio_in.direcao or "NA"
        try:
            direcao_enum = models.DirectionType(direcao_bruta) if direcao_bruta else models.DirectionType.NA
        except ValueError:
            direcao_enum = models.DirectionType.NA
        domain = models.Domain(
            avaliacao_id=avaliacao.id,
            tipo=dominio_in.tipo,
            respostas=dominio_in.respostas,
            comentarios=dominio_in.comentarios,
            observacoes_itens=dominio_in.observacoes_itens or {},
            julgamento=julgamento,
            justificativa=justificativa,
            direcao=direcao_enum,
        )
        db.add(domain)
        judgments.append(julgamento)
        if justificativa:
            domain_justifications.append(f"Domínio {dominio_in.tipo}: {justificativa}")
        if direcao_enum and direcao_enum != models.DirectionType.NA:
            domain_directions.append(direcao_enum)
    # Calcular julgamento global
    global_judgment = rule_engine.evaluate_global(judgments)
    avaliacao.julgamento_global = global_judgment
    avaliacao.direcao_global = domain_directions[0] if domain_directions else models.DirectionType.NA
    avaliacao.justificativa_global = "
".join(domain_justifications) if domain_justifications else None

    db.commit()
    db.refresh(avaliacao)
    return avaliacao


@app.get("/api/results/{result_id}/evaluation", response_model=schemas.Evaluation, summary="Obtém avaliação de um resultado")
def get_evaluation(result_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    resultado = db.get(models.Result, result_id)
    if not resultado or not resultado.avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    projeto_id = resultado.estudo.projeto_id
    auth.check_project_role(db, current_user, projeto_id, [models.RoleType.LEITOR.value, models.RoleType.EDITOR.value, models.RoleType.ADMIN.value])
    return resultado.avaliacao


@app.post("/api/import", summary="Importa avaliações a partir de arquivo Excel")
async def import_excel(
    result_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    resultado = db.get(models.Result, result_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado não encontrado")

    projeto_id = resultado.estudo.projeto_id
    auth.check_project_role(db, current_user, projeto_id, [models.RoleType.EDITOR.value, models.RoleType.ADMIN.value])

    from tempfile import NamedTemporaryFile

    uploaded_bytes = await file.read()
    if not uploaded_bytes:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    suffix = Path(file.filename or "avaliacao.xlsx").suffix or ".xlsx"
    with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(uploaded_bytes)
        temp_path = Path(temp_file.name)

    try:
        evaluation_payload, warnings = import_export.import_workbook(temp_path)
        avaliacao = import_export.persist_imported_evaluation(db, current_user, resultado, evaluation_payload)
    finally:
        temp_path.unlink(missing_ok=True)

    return {
        "resultado_id": resultado.id,
        "avaliacao_id": avaliacao.id,
        "julgamento_global": avaliacao.julgamento_global,
        "warnings": warnings,
    }


@app.get("/api/results/{result_id}/export", summary="Exporta avaliação para PDF ou DOCX")
async def export_evaluation(result_id: int, format: str = "pdf", db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    resultado = db.get(models.Result, result_id)
    if not resultado or not resultado.avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    projeto_id = resultado.estudo.projeto_id
    auth.check_project_role(db, current_user, projeto_id, [models.RoleType.LEITOR.value, models.RoleType.EDITOR.value, models.RoleType.ADMIN.value])

    avaliacao = resultado.avaliacao
    if format.lower() == "pdf":
        pdf_bytes = docx_generator.generate_pdf_report(avaliacao)
        filename = f"avaliacao_resultado_{resultado.id}.pdf"
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf", headers=headers)
    elif format.lower() == "docx":
        docx_bytes = docx_generator.generate_docx_report(avaliacao)
        filename = f"avaliacao_resultado_{resultado.id}.docx"
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return StreamingResponse(
            iter([docx_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers=headers,
        )
    elif format.lower() == "xlsx":
        workbook_bytes, warnings = import_export.export_workbook(resultado)
        headers = {"Content-Disposition": f"attachment; filename=avaliacao_resultado_{resultado.id}.xlsx"}
        if warnings:
            headers["X-RoB2-Warnings"] = \"; \".join(warnings)
        return StreamingResponse(
            iter([workbook_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers,
        )
    else:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use 'pdf', 'docx' ou 'xlsx'.")


# Rotas para gerenciar artigos no Firestore
@app.get("/api/articles", response_model=List[schemas.Article], summary="Lista artigos do usuário")
def list_user_articles(current_user: firebase_auth.FirebaseUser = Depends(firebase_auth.get_current_firebase_user)):
    """Lista todos os artigos salvos pelo usuário autenticado."""
    articles = firebase_config.get_user_articles(current_user.firebase_uid)
    return articles


@app.post("/api/articles", response_model=schemas.Article, status_code=201, summary="Salva um novo artigo")
def create_article(
    article: schemas.ArticleCreate,
    current_user: firebase_auth.FirebaseUser = Depends(firebase_auth.get_current_firebase_user)
):
    """Salva um novo artigo para o usuário autenticado."""
    article_data = article.dict()
    article_id = firebase_config.save_user_article(current_user.firebase_uid, article_data)
    
    # Retornar o artigo criado
    created_article = firebase_config.get_user_article(current_user.firebase_uid, article_id)
    if not created_article:
        raise HTTPException(status_code=500, detail="Erro ao recuperar artigo criado")
    
    return created_article


@app.get("/api/articles/{article_id}", response_model=schemas.Article, summary="Obtém um artigo específico")
def get_article(
    article_id: str,
    current_user: firebase_auth.FirebaseUser = Depends(firebase_auth.get_current_firebase_user)
):
    """Recupera um artigo específico do usuário autenticado."""
    article = firebase_config.get_user_article(current_user.firebase_uid, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    return article


@app.put("/api/articles/{article_id}", response_model=schemas.Article, summary="Atualiza um artigo")
def update_article(
    article_id: str,
    article_update: schemas.ArticleUpdate,
    current_user: firebase_auth.FirebaseUser = Depends(firebase_auth.get_current_firebase_user)
):
    """Atualiza um artigo existente do usuário autenticado."""
    # Verificar se o artigo existe
    existing_article = firebase_config.get_user_article(current_user.firebase_uid, article_id)
    if not existing_article:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    
    # Atualizar apenas os campos fornecidos
    update_data = {k: v for k, v in article_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar fornecido")
    
    success = firebase_config.update_user_article(current_user.firebase_uid, article_id, update_data)
    if not success:
        raise HTTPException(status_code=500, detail="Erro ao atualizar artigo")
    
    # Retornar o artigo atualizado
    updated_article = firebase_config.get_user_article(current_user.firebase_uid, article_id)
    return updated_article


@app.delete("/api/articles/{article_id}", summary="Remove um artigo")
def delete_article(
    article_id: str,
    current_user: firebase_auth.FirebaseUser = Depends(firebase_auth.get_current_firebase_user)
):
    """Remove um artigo do usuário autenticado."""
    # Verificar se o artigo existe
    existing_article = firebase_config.get_user_article(current_user.firebase_uid, article_id)
    if not existing_article:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    
    success = firebase_config.delete_user_article(current_user.firebase_uid, article_id)
    if not success:
        raise HTTPException(status_code=500, detail="Erro ao remover artigo")
    
    return {"message": "Artigo removido com sucesso"}


@app.get("/health", summary="Health check")
def health():
    return {"status": "ok"}