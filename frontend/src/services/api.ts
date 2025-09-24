import axios from 'axios';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api';
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
const rootUrl = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl.slice(0, -4)
  : normalizedBaseUrl;

export const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiRootUrl = rootUrl;

export function setDefaultAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}
