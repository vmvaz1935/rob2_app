import { getAuthToken } from '../firebase/auth';

const API_BASE_URL = 'http://localhost:8000/api';

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
  private async getHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getArticles(): Promise<Article[]> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar artigos: ${response.statusText}`);
    }

    return response.json();
  }

  async getArticle(id: string): Promise<Article> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar artigo: ${response.statusText}`);
    }

    return response.json();
  }

  async createArticle(article: ArticleCreate): Promise<Article> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar artigo: ${response.statusText}`);
    }

    return response.json();
  }

  async updateArticle(id: string, article: ArticleUpdate): Promise<Article> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar artigo: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteArticle(id: string): Promise<void> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar artigo: ${response.statusText}`);
    }
  }
}

export const articlesService = new ArticlesService();
