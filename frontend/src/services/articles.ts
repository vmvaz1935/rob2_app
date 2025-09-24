import { api } from './api';

export interface Article {
  id: number;
  titulo: string;
  autores: string;
  revista?: string;
  ano?: number;
  doi?: string;
  url?: string;
  resumo?: string;
  palavras_chave?: string[];
  tipo_estudo?: string;
  desenho?: string;
  desfechos?: string[];
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleCreate {
  titulo: string;
  autores: string;
  revista?: string;
  ano?: number;
  doi?: string;
  url?: string;
  resumo?: string;
  palavras_chave?: string[];
  tipo_estudo?: string;
  desenho?: string;
  desfechos?: string[];
  observacoes?: string;
}

export interface ArticleUpdate {
  titulo?: string;
  autores?: string;
  revista?: string;
  ano?: number;
  doi?: string;
  url?: string;
  resumo?: string;
  palavras_chave?: string[];
  tipo_estudo?: string;
  desenho?: string;
  desfechos?: string[];
  observacoes?: string;
}

class ArticlesService {
  async getArticles(): Promise<Article[]> {
    const response = await api.get<Article[]>('/articles');
    return response.data;
  }

  async getArticle(id: number): Promise<Article> {
    const response = await api.get<Article>(`/articles/${id}`);
    return response.data;
  }

  async createArticle(article: ArticleCreate): Promise<Article> {
    const response = await api.post<Article>('/articles', article);
    return response.data;
  }

  async updateArticle(id: number, article: ArticleUpdate): Promise<Article> {
    const response = await api.put<Article>(`/articles/${id}`, article);
    return response.data;
  }

  async deleteArticle(id: number): Promise<void> {
    await api.delete(`/articles/${id}`);
  }
}

export const articlesService = new ArticlesService();
