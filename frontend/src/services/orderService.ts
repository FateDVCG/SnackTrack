import axios, { AxiosError } from "axios";

const API_BASE_URL = "http://localhost:3000/api";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  type: "Delivery" | "Pickup" | "Messenger";
  status: "new" | "accepted" | "finished" | "completed" | "voided";
  totalPrice: number;
  items: OrderItem[];
  deliveryAddress?: string;
  specialInstructions?: string;
  created_at: string;
}

export class OrderService {
  async getOrders(): Promise<Order[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 500) {
          throw new Error("Server error while fetching orders");
        }
      }
      throw new Error("Network error while fetching orders");
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<Order> {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/orders/${orderId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw new Error(`Order with ID ${orderId} not found`);
        }
        if (error.response?.status === 400) {
          throw new Error(
            error.response.data.error || "Invalid status transition"
          );
        }
        if (error.response?.status === 500) {
          throw new Error("Server error while updating order status");
        }
      }
      throw new Error("Network error while updating order status");
    }
  }

  async createOrder(
    orderData: Omit<Order, "id" | "created_at">
  ): Promise<Order> {
    try {
      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          throw new Error(
            error.response.data.error || "Missing required fields"
          );
        }
        if (error.response?.status === 500) {
          throw new Error("Server error while creating order");
        }
      }
      throw new Error("Network error while creating order");
    }
  }
}
