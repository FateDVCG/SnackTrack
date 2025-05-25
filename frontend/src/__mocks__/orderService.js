// Mock implementation for orderService
export const orderService = {
  getOrders: jest.fn().mockResolvedValue([
    {
      id: 1,
      customerName: "John Doe",
      items: [{ id: 1, name: "Burger", quantity: 2, price: 120.99 }],
      totalPrice: 241.98,
      status: "completed",
      type: "Delivery"
    }
  ]),
  updateOrderStatus: jest.fn().mockImplementation((id, status) => 
    Promise.resolve({ id, status, updated: true })
  ),
  createOrder: jest.fn().mockImplementation((orderData) => 
    Promise.resolve({ id: 123, ...orderData })
  ),
  convertCurrency: jest.fn().mockImplementation((amount, from = "PHP", to = "USD") => {
    if (from === "PHP" && to === "USD") return amount * 0.02;
    if (from === "USD" && to === "PHP") return amount * 50;
    return amount;
  })
};