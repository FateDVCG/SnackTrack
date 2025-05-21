import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

export const analyticsService = {
  async getAnalytics(timeRange) {
    const response = await axios.get(`${API_BASE_URL}/analytics`, {
      params: { range: timeRange },
    });
    return response.data;
  },
};
