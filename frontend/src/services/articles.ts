import { getAuthToken } from '../firebase/auth';
import { api } from './api';

export interface Article {
  id: string;
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
  private async getAuthConfig() {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async getArticles(): Promise<Article[]> {
    const config = await this.getAuthConfig();
    const response = await api.get<Article[]>('/articles', config);
    return response.data;
  }

  async getArticle(id: string): Promise<Article> {
    const config = await this.getAuthConfig();
    const response = await api.get<Article>(`/articles/${id}`, config);
    return response.data;
  }

  async createArticle(article: ArticleCreate): Promise<Article> {
    const config = await this.getAuthConfig();
    const response = await api.post<Article>('/articles', article, config);
    return response.data;
  }

  async updateArticle(id: string, article: ArticleUpdate): Promise<Article> {
    const config = await this.getAuthConfig();
    const response = await api.put<Article>(`/articles/${id}`, article, config);
    return response.data;
  }

  async deleteArticle(id: string): Promise<void> {
    const config = await this.getAuthConfig();
    await api.delete(`/articles/${id}`, config);
  }
}

export const articlesService = new ArticlesService();
