import apiService from './api.service';
import type { StatsResponse } from '../types/api.types';

class StatsService {
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await apiService.get<StatsResponse>('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiService.get<{ success: boolean }>('/health');
      return response.data.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}
export default new StatsService();