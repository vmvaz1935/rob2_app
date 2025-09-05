import React, { useState } from 'react';
import { Article, ArticleCreate, ArticleUpdate } from '../services/articles';

interface ArticleFormProps {
  article?: Article;
  onSubmit: (data: ArticleCreate | ArticleUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ 
  article, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    titulo: article?.titulo || '',
    autores: article?.autores || '',
    revista: article?.revista || '',
    ano: article?.ano || '',
    doi: article?.doi || '',
    url: article?.url || '',
    resumo: article?.resumo || '',
    palavras_chave: article?.palavras_chave?.join(', ') || '',
    tipo_estudo: article?.tipo_estudo || '',
    desenho: article?.desenho || '',
    desfechos: article?.desfechos?.join(', ') || '',
    observacoes: article?.observacoes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      ano: formData.ano ? parseInt(formData.ano.toString()) : undefined,
      palavras_chave: formData.palavras_chave 
        ? formData.palavras_chave.split(',').map(k => k.trim()).filter(k => k)
        : undefined,
      desfechos: formData.desfechos 
        ? formData.desfechos.split(',').map(d => d.trim()).filter(d => d)
        : undefined,
    };

    // Remove campos vazios
    Object.keys(submitData).forEach(key => {
      if (submitData[key as keyof typeof submitData] === '' || submitData[key as keyof typeof submitData] === undefined) {
        delete submitData[key as keyof typeof submitData];
      }
    });

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
            Título *
          </label>
          <input
            type="text"
            id="titulo"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="autores" className="block text-sm font-medium text-gray-700">
            Autores *
          </label>
          <input
            type="text"
            id="autores"
            name="autores"
            value={formData.autores}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="revista" className="block text-sm font-medium text-gray-700">
            Revista
          </label>
          <input
            type="text"
            id="revista"
            name="revista"
            value={formData.revista}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="ano" className="block text-sm font-medium text-gray-700">
            Ano
          </label>
          <input
            type="number"
            id="ano"
            name="ano"
            value={formData.ano}
            onChange={handleChange}
            min="1900"
            max="2030"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="doi" className="block text-sm font-medium text-gray-700">
            DOI
          </label>
          <input
            type="text"
            id="doi"
            name="doi"
            value={formData.doi}
            onChange={handleChange}
            placeholder="10.1000/example"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="tipo_estudo" className="block text-sm font-medium text-gray-700">
            Tipo de Estudo
          </label>
          <select
            id="tipo_estudo"
            name="tipo_estudo"
            value={formData.tipo_estudo}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="Ensaio clínico randomizado">Ensaio clínico randomizado</option>
            <option value="Estudo observacional">Estudo observacional</option>
            <option value="Revisão sistemática">Revisão sistemática</option>
            <option value="Meta-análise">Meta-análise</option>
            <option value="Estudo de coorte">Estudo de coorte</option>
            <option value="Estudo caso-controle">Estudo caso-controle</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label htmlFor="desenho" className="block text-sm font-medium text-gray-700">
            Desenho
          </label>
          <select
            id="desenho"
            name="desenho"
            value={formData.desenho}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="Paralelo">Paralelo</option>
            <option value="Cruzado">Cruzado</option>
            <option value="Fatorial">Fatorial</option>
            <option value="Cluster">Cluster</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="palavras_chave" className="block text-sm font-medium text-gray-700">
          Palavras-chave
        </label>
        <input
          type="text"
          id="palavras_chave"
          name="palavras_chave"
          value={formData.palavras_chave}
          onChange={handleChange}
          placeholder="palavra1, palavra2, palavra3"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">Separe as palavras-chave por vírgula</p>
      </div>

      <div>
        <label htmlFor="desfechos" className="block text-sm font-medium text-gray-700">
          Desfechos
        </label>
        <input
          type="text"
          id="desfechos"
          name="desfechos"
          value={formData.desfechos}
          onChange={handleChange}
          placeholder="desfecho1, desfecho2, desfecho3"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">Separe os desfechos por vírgula</p>
      </div>

      <div>
        <label htmlFor="resumo" className="block text-sm font-medium text-gray-700">
          Resumo
        </label>
        <textarea
          id="resumo"
          name="resumo"
          value={formData.resumo}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          value={formData.observacoes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isLoading ? 'Salvando...' : (article ? 'Atualizar' : 'Salvar')}
        </button>
      </div>
    </form>
  );
};

export default ArticleForm;
