import React, { useState } from 'react';
import { Article } from '../services/articles';

interface ArticleListProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const ArticleList: React.FC<ArticleListProps> = ({ 
  articles, 
  onEdit, 
  onDelete, 
  isLoading = false 
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando artigos...</span>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg mb-2">Nenhum artigo encontrado</div>
        <p className="text-gray-400">Comece adicionando seu primeiro artigo!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {article.titulo}
              </h3>
              <p className="text-gray-600 mb-2">
                <strong>Autores:</strong> {article.autores}
              </p>
              {article.revista && (
                <p className="text-gray-600 mb-2">
                  <strong>Revista:</strong> {article.revista}
                  {article.ano && ` (${article.ano})`}
                </p>
              )}
              {article.tipo_estudo && (
                <p className="text-gray-600 mb-2">
                  <strong>Tipo:</strong> {article.tipo_estudo}
                  {article.desenho && ` - ${article.desenho}`}
                </p>
              )}
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onEdit(article)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(article.id)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  deleteConfirm === article.id
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {deleteConfirm === article.id ? 'Confirmar' : 'Excluir'}
              </button>
            </div>
          </div>

          {article.resumo && (
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                <strong>Resumo:</strong> {article.resumo}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {article.doi && (
              <div>
                <strong>DOI:</strong> 
                <a 
                  href={`https://doi.org/${article.doi}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  {article.doi}
                </a>
              </div>
            )}
            {article.url && (
              <div>
                <strong>URL:</strong> 
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Acessar
                </a>
              </div>
            )}
            <div>
              <strong>Criado:</strong> {formatDate(article.created_at)}
            </div>
            {article.updated_at && article.updated_at !== article.created_at && (
              <div>
                <strong>Atualizado:</strong> {formatDate(article.updated_at)}
              </div>
            )}
          </div>

          {article.palavras_chave && article.palavras_chave.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {article.palavras_chave.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {article.desfechos && article.desfechos.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                <strong>Desfechos:</strong> {article.desfechos.join(', ')}
              </p>
            </div>
          )}

          {article.observacoes && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">
                <strong>Observações:</strong> {article.observacoes}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ArticleList;
