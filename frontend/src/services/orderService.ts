import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

export interface OrderItem {
  name: string;
  price: number;
}

export interface Order {
  id: string;
  customer_id: string;
  status: "pending" | "confirmed" | "ready" | "completed" | "cancelled";
  total_price: number;
  items: OrderItem[];
  created_at: string;
  special_instructions?: string;
}

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const response = await axios.get(`${API_BASE_URL}/orders`);
    return response.data;
  },

  async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<Order> {
    const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}`, {
      status,
    });
    return response.data;
  },

  async createOrder(
    orderData: Omit<Order, "id" | "created_at">
  ): Promise<Order> {
    const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
    return response.data;
  },
};
