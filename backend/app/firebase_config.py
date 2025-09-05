"""Configuração do Firebase Admin SDK.

Este módulo inicializa o Firebase Admin SDK usando o arquivo de chave privada
gerado pelo console do Firebase. Utiliza as melhores práticas atuais do Firebase.
"""

import os
import json
from typing import Optional, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from google.cloud.firestore_v1.base_query import FieldFilter

# Inicialização global do Firebase
_firebase_app = None
_firestore_client = None


def initialize_firebase():
    """Inicializa o Firebase Admin SDK usando chave privada."""
    global _firebase_app, _firestore_client
    
    if _firebase_app is not None:
        return _firebase_app
    
    # Verificar se já existe uma app inicializada
    try:
        _firebase_app = firebase_admin.get_app()
        print("✅ Firebase Admin SDK já inicializado")
    except ValueError:
        # Não existe app, criar uma nova
        cred = None
        
        # Prioridade 1: Arquivo de chave privada (recomendado)
        service_account_file = os.getenv("FIREBASE_CREDENTIALS_FILE", "firebase-credentials.json")
        if os.path.exists(service_account_file):
            try:
                cred = credentials.Certificate(service_account_file)
                print(f"✅ Carregando credenciais do arquivo: {service_account_file}")
            except Exception as e:
                print(f"❌ Erro ao carregar arquivo de credenciais: {e}")
        
        # Prioridade 2: Credenciais via variável de ambiente (JSON)
        elif os.getenv("FIREBASE_CREDENTIALS"):
            try:
                cred_dict = json.loads(os.getenv("FIREBASE_CREDENTIALS"))
                cred = credentials.Certificate(cred_dict)
                print("✅ Carregando credenciais da variável de ambiente")
            except (json.JSONDecodeError, ValueError) as e:
                print(f"❌ Erro ao decodificar FIREBASE_CREDENTIALS: {e}")
        
        # Prioridade 3: Credenciais padrão do Google Cloud
        else:
            try:
                cred = credentials.ApplicationDefault()
                print("✅ Usando credenciais padrão do Google Cloud")
            except Exception as e:
                print(f"❌ Erro ao carregar credenciais padrão: {e}")
                print("📋 Configure o arquivo firebase-credentials.json ou a variável FIREBASE_CREDENTIALS")
        
        if cred:
            try:
                _firebase_app = firebase_admin.initialize_app(cred, {
                    'projectId': 'rob2-app-6421e'  # Especificar o projeto
                })
                _firestore_client = firestore.client(_firebase_app)
                print("✅ Firebase Admin SDK inicializado com sucesso")
            except Exception as e:
                print(f"❌ Erro ao inicializar Firebase Admin SDK: {e}")
                raise
        else:
            raise Exception("Não foi possível inicializar o Firebase. Configure as credenciais.")
    
    return _firebase_app


def get_firestore_client():
    """Retorna o cliente Firestore."""
    if _firestore_client is None:
        initialize_firebase()
    return _firestore_client


def verify_firebase_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifica um token Firebase e retorna os dados do usuário."""
    try:
        if _firebase_app is None:
            initialize_firebase()
        
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Erro ao verificar token Firebase: {e}")
        return None


def get_user_articles(user_id: str) -> list:
    """Recupera todos os artigos de um usuário do Firestore."""
    try:
        db = get_firestore_client()
        articles_ref = db.collection('users').document(user_id).collection('articles')
        docs = articles_ref.stream()
        
        articles = []
        for doc in docs:
            article_data = doc.to_dict()
            article_data['id'] = doc.id
            articles.append(article_data)
        
        return articles
    except Exception as e:
        print(f"Erro ao recuperar artigos do usuário {user_id}: {e}")
        return []


def save_user_article(user_id: str, article_data: Dict[str, Any]) -> str:
    """Salva um artigo para um usuário no Firestore."""
    try:
        db = get_firestore_client()
        articles_ref = db.collection('users').document(user_id).collection('articles')
        
        # Adicionar timestamp
        article_data['created_at'] = firestore.SERVER_TIMESTAMP
        article_data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        doc_ref = articles_ref.add(article_data)
        return doc_ref[1].id  # Retorna o ID do documento criado
    except Exception as e:
        print(f"Erro ao salvar artigo para usuário {user_id}: {e}")
        raise


def update_user_article(user_id: str, article_id: str, article_data: Dict[str, Any]) -> bool:
    """Atualiza um artigo existente no Firestore."""
    try:
        db = get_firestore_client()
        article_ref = db.collection('users').document(user_id).collection('articles').document(article_id)
        
        # Adicionar timestamp de atualização
        article_data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        article_ref.update(article_data)
        return True
    except Exception as e:
        print(f"Erro ao atualizar artigo {article_id} do usuário {user_id}: {e}")
        return False


def delete_user_article(user_id: str, article_id: str) -> bool:
    """Remove um artigo do Firestore."""
    try:
        db = get_firestore_client()
        article_ref = db.collection('users').document(user_id).collection('articles').document(article_id)
        article_ref.delete()
        return True
    except Exception as e:
        print(f"Erro ao deletar artigo {article_id} do usuário {user_id}: {e}")
        return False


def get_user_article(user_id: str, article_id: str) -> Optional[Dict[str, Any]]:
    """Recupera um artigo específico do Firestore."""
    try:
        db = get_firestore_client()
        article_ref = db.collection('users').document(user_id).collection('articles').document(article_id)
        doc = article_ref.get()
        
        if doc.exists:
            article_data = doc.to_dict()
            article_data['id'] = doc.id
            return article_data
        return None
    except Exception as e:
        print(f"Erro ao recuperar artigo {article_id} do usuário {user_id}: {e}")
        return None
