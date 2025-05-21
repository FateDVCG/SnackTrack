import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Add request interceptor for error handling
axios.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const orderService = {
  async getOrders() {
    const response = await axios.get(`${API_BASE_URL}/orders`);
    return response.data;
  },

  async updateOrderStatus(orderId, status) {
    const response = await axios.patch(
      `${API_BASE_URL}/orders/${orderId}/status`,
      {
        status,
      }
    );
    return response.data;
  },

  async createOrder(orderData) {
    const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
    return response.data;
  },
};
