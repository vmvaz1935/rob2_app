import React, { useEffect, useMemo, useState } from 'react';
import { Article, ArticleCreate, ArticleUpdate, articlesService } from '../services/articles';
import ArticleList from './ArticleList';
import ArticleForm from './ArticleForm';
import AlertBanner from './AlertBanner';

interface ArticlesManagerProps {
  apiToken: string;
}

const ArticlesManager: React.FC<ArticlesManagerProps> = ({ apiToken }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenAvailable = useMemo(() => Boolean(apiToken), [apiToken]);

  const loadArticles = async () => {
    if (!tokenAvailable) {
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await articlesService.getArticles();
      setArticles(data);
    } catch (err: any) {
      const message = err?.response?.status === 401
        ? 'Token inválido ou expirado. Gere um novo token JWT no backend.'
        : err?.message ?? 'Erro ao carregar artigos';
      setError(message);
      console.error('Erro ao carregar artigos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setArticles([]);
    setShowForm(false);
    if (tokenAvailable) {
      loadArticles();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAvailable]);

  const handleCreateArticle = async (data: ArticleCreate) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const newArticle = await articlesService.createArticle(data);
      setArticles((prev) => [newArticle, ...prev]);
      setShowForm(false);
    } catch (err: any) {
      const message = err?.response?.status === 401
        ? 'Token inválido ou sem permissão para criar artigos.'
        : err?.message ?? 'Erro ao criar artigo';
      setError(message);
      console.error('Erro ao criar artigo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateArticle = async (data: ArticleUpdate) => {
    if (!editingArticle) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const updatedArticle = await articlesService.updateArticle(editingArticle.id, data);
      setArticles((prev) => prev.map((article) => (
        article.id === editingArticle.id ? updatedArticle : article
      )));
      setEditingArticle(undefined);
      setShowForm(false);
    } catch (err: any) {
      const message = err?.response?.status === 401
        ? 'Token inválido ou sem permissão para atualizar artigos.'
        : err?.message ?? 'Erro ao atualizar artigo';
      setError(message);
      console.error('Erro ao atualizar artigo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    try {
      setError(null);
      await articlesService.deleteArticle(id);
      setArticles((prev) => prev.filter((article) => article.id !== id));
    } catch (err: any) {
      const message = err?.response?.status === 401
        ? 'Token inválido ou sem permissão para remover artigos.'
        : err?.message ?? 'Erro ao deletar artigo';
      setError(message);
      console.error('Erro ao deletar artigo:', err);
    }
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingArticle(undefined);
  };

  const handleSubmitForm = (data: ArticleCreate | ArticleUpdate) => {
    if (editingArticle) {
      handleUpdateArticle(data as ArticleUpdate);
    } else {
      handleCreateArticle(data as ArticleCreate);
    }
  };

  if (!tokenAvailable) {
    return (
      <div className="mx-auto mt-6 max-w-3xl space-y-4 px-4">
        <AlertBanner
          type="info"
          message="Para gerenciar artigos, gere um token JWT no backend (rota /api/auth/login) e informe-o no cabeçalho da aplicação."
        />
        <p className="text-sm text-gray-600">
          Os artigos agora são armazenados diretamente na base PostgreSQL do sistema RoB2. Cada token só enxerga os registros do usuário autenticado.
        </p>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
          </h2>
          <p className="text-gray-600 mt-1">
            {editingArticle ? 'Atualize as informações do artigo' : 'Adicione um novo artigo à biblioteca relacional'}
          </p>
        </div>

        {error && (
          <AlertBanner type="error" message={error} onClose={() => setError(null)} />
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ArticleForm
            article={editingArticle}
            onSubmit={handleSubmitForm}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Artigos</h1>
          <p className="text-gray-600 mt-1">
            Os registros são salvos em PostgreSQL e associados ao seu usuário do RoB2.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Artigo
        </button>
      </div>

      {error && (
        <AlertBanner type="error" message={error} onClose={() => setError(null)} />
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ArticleList
          articles={articles}
          onEdit={handleEditArticle}
          onDelete={(id) => handleDeleteArticle(id)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ArticlesManager;
