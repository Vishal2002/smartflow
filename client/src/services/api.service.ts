import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[API Error]', error.message);
        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, params?: Record<string, unknown>) {
    return this.api.get<T>(url, { params });
  }

  public post<T>(url: string, data?: unknown) {
    return this.api.post<T>(url, data);
  }

  public put<T>(url: string, data?: unknown) {
    return this.api.put<T>(url, data);
  }

  public delete<T>(url: string) {
    return this.api.delete<T>(url);
  }
}

export default new ApiService();
