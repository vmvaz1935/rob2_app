import React, { useState, useEffect } from 'react';
import { Article, ArticleCreate, ArticleUpdate, articlesService } from '../services/articles';
import ArticleList from './ArticleList';
import ArticleForm from './ArticleForm';

const ArticlesManager: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await articlesService.getArticles();
      setArticles(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar artigos');
      console.error('Erro ao carregar artigos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleCreateArticle = async (data: ArticleCreate) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const newArticle = await articlesService.createArticle(data);
      setArticles(prev => [newArticle, ...prev]);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar artigo');
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
      setArticles(prev => prev.map(article => 
        article.id === editingArticle.id ? updatedArticle : article
      ));
      setEditingArticle(undefined);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar artigo');
      console.error('Erro ao atualizar artigo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      setError(null);
      await articlesService.deleteArticle(id);
      setArticles(prev => prev.filter(article => article.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar artigo');
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

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
          </h2>
          <p className="text-gray-600 mt-1">
            {editingArticle ? 'Atualize as informações do artigo' : 'Adicione um novo artigo à sua biblioteca'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Artigos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie sua biblioteca de artigos científicos
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Artigo
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadArticles}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ArticleList
          articles={articles}
          onEdit={handleEditArticle}
          onDelete={handleDeleteArticle}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ArticlesManager;
