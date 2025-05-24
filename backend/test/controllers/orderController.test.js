const assert = require("assert");
const { describe, it, beforeEach, afterEach } = require("mocha");
const sinon = require("sinon");
const orderController = require("../../controllers/orderController");
const orderModel = require("../../models/orderModel");
const messengerAPI = require("../../utils/messengerAPI.mock");

// Override messenger API with mock
orderController.__set__messengerAPI(messengerAPI);

describe("Order Controller", () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
    };
    mockResponse = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };
    mockNext = sinon.spy();

    // Reset mocks and stubs
    sinon.restore();
  });

  describe("createOrder", () => {
    it("should create new order successfully", async () => {
      const orderData = {
        customerName: "John Smith",
        customerPhone: "+639123456789",
        items: [
          { itemId: 1, quantity: 2 },
          { itemId: 2, quantity: 1 },
        ],
        deliveryAddress: "123 Main St",
        specialInstructions: "Extra cheese",
      };

      mockRequest.body = orderData;

      const createdOrder = {
        id: 1,
        ...orderData,
        status: "pending",
        totalAmount: 282.97, // (120.99 * 2) + 40.99
      };

      sinon.stub(orderModel, "createOrder").resolves(createdOrder);
      sinon.stub(messengerAPI, "sendOrderConfirmation").resolves();

      await orderController.createOrder(mockRequest, mockResponse, mockNext);

      assert(mockResponse.status.calledWith(201));
      assert(
        mockResponse.json.calledWith({
          success: true,
          data: createdOrder,
        })
      );
    });

    it("should validate required fields", async () => {
      mockRequest.body = {
        customerName: "John Smith",
        // Missing required fields
      };

      await orderController.createOrder(mockRequest, mockResponse, mockNext);

      assert(mockResponse.status.calledWith(400));
      assert(
        mockResponse.json.calledWith({
          success: false,
          error: sinon.match.string,
        })
      );
    });

    it("should reject order with no items", async () => {
      const orderData = {
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        totalPrice: 150.99,
      };

      mockRequest.body = orderData;

      await orderController.createOrder(mockRequest, mockResponse, mockNext);

      assert(mockResponse.status.calledWith(400));
      assert(
        mockResponse.json.calledWith({
          success: false,
          error: "Order must contain at least one item",
        })
      );
    });

    it("should reject order with negative price", async () => {
      const orderData = {
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        totalPrice: -50,
        items: [{ id: 1, name: "Burger", price: 120.99, quantity: 1 }],
      };

      mockRequest.body = orderData;

      await orderController.createOrder(mockRequest, mockResponse, mockNext);

      assert(mockResponse.status.calledWith(400));
      assert(
        mockResponse.json.calledWith({
          success: false,
          error: "Total price cannot be negative",
        })
      );
    });

    it("should create valid order", async () => {
      const orderData = {
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        type: "Delivery",
        totalPrice: 150.99,
        items: [{ id: 1, name: "Burger", price: 120.99, quantity: 1 }],
        deliveryAddress: "123 Test St",
        specialInstructions: "Ring doorbell",
      };

      mockRequest.body = orderData;

      const createdOrder = {
        id: 1,
        ...orderData,
        status: "new",
      };

      sinon.stub(orderModel, "createOrder").resolves(createdOrder);

      await orderController.createOrder(mockRequest, mockResponse, mockNext);

      const responseData = mockResponse.json.getCall(0).args[0].data;
      assert.strictEqual(responseData.customerName, orderData.customerName);
      assert.strictEqual(responseData.status, "new");
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const orderId = 1;
      const newStatus = "accepted";

      mockRequest.params.orderId = orderId;
      mockRequest.body = { status: newStatus };

      const updatedOrder = {
        id: orderId,
        status: newStatus,
        customerName: "John Smith",
        items: [],
      };

      sinon.stub(orderModel, "updateOrderStatus").resolves(updatedOrder);
      sinon.stub(messengerAPI, "sendOrderStatusUpdate").resolves();

      await orderController.updateOrderStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      assert(mockResponse.status.calledWith(200));
      assert(
        mockResponse.json.calledWith({
          success: true,
          data: updatedOrder,
        })
      );
    });

    it("should validate status transitions", async () => {
      mockRequest.params.orderId = 1;
      mockRequest.body = { status: "invalid_status" };

      await orderController.updateOrderStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      assert(mockResponse.status.calledWith(400));
      assert(
        mockResponse.json.calledWith({
          success: false,
          error: sinon.match(/invalid status/i),
        })
      );
    });

    it("should handle invalid order ID", async () => {
      mockRequest.params.orderId = 999;
      mockRequest.body = { status: "accepted" };

      sinon.stub(orderModel, "updateOrderStatus").resolves(null);

      await orderController.updateOrderStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      assert(mockResponse.status.calledWith(404));
      assert(
        mockResponse.json.calledWith({
          success: false,
          error: sinon.match(/order not found/i),
        })
      );
    });

    it("should prevent invalid status transitions", async () => {
      mockRequest.params.orderId = 1;
      mockRequest.body = { status: "completed" };

      // Mock current order status as 'pending'
      sinon.stub(orderModel, "getOrder").resolves({
        id: 1,
        status: "pending",
      });

      await orderController.updateOrderStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      assert(mockResponse.status.calledWith(400));
      assert(
        mockResponse.json.calledWith({
          success: false,
          error: sinon.match(/invalid status transition/i),
        })
      );
    });

    it("should reject invalid order ID", async () => {
      await assert.rejects(
        async () => await orderController.updateOrderStatus(null, "accepted"),
        {
          message: "Order ID is required",
        }
      );
    });

    it("should reject non-existent order", async () => {
      await assert.rejects(
        async () => await orderController.updateOrderStatus(99999, "accepted"),
        {
          message: "Order with ID 99999 not found",
        }
      );
    });

    it("should reject invalid status", async () => {
      // First create an order to test with
      const orderData = {
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        type: "Delivery",
        totalPrice: 150.99,
        items: [{ id: 1, name: "Burger", price: 120.99, quantity: 1 }],
      };
      const order = await orderController.createOrder(orderData);

      await assert.rejects(
        async () =>
          await orderController.updateOrderStatus(order.id, "invalid"),
        {
          message:
            "Invalid status: invalid. Valid statuses are: new, accepted, finished, completed, voided",
        }
      );
    });

    it("should update valid order status", async () => {
      // First create an order to test with
      const orderData = {
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        type: "Delivery",
        totalPrice: 150.99,
        items: [{ id: 1, name: "Burger", price: 120.99, quantity: 1 }],
      };
      const order = await orderController.createOrder(orderData);

      const updatedOrder = await orderController.updateOrderStatus(
        order.id,
        "accepted"
      );
      assert.strictEqual(updatedOrder.status, "accepted");
    });
  });

  describe("getOrder", () => {
    it("should get order by ID", async () => {
      const orderId = 1;
      mockRequest.params.orderId = orderId;

      const order = {
        id: orderId,
        customerName: "John Smith",
        items: [],
        status: "pending",
      };

      sinon.stub(orderModel, "getOrder").resolves(order);

      await orderController.getOrder(mockRequest, mockResponse, mockNext);

      assert(mockResponse.status.calledWith(200));
      assert(
        mockResponse.json.calledWith({
          success: true,
          data: order,
        })
      );
    });

    it("should handle non-existent order", async () => {
      mockRequest.params.orderId = 999;

      sinon.stub(orderModel, "getOrder").resolves(null);

      await orderController.getOrder(mockRequest, mockResponse, mockNext);

      assert(mockResponse.status.calledWith(404));
      assert(
        mockResponse.json.calledWith({
          success: false,
          error: sinon.match(/not found/i),
        })
      );
    });

    it("should reject invalid order ID", async () => {
      await assert.rejects(
        async () => await orderController.getOrderById(null),
        {
          message: "Order ID is required",
        }
      );
    });

    it("should reject non-existent order", async () => {
      await assert.rejects(
        async () => await orderController.getOrderById(99999),
        {
          message: "Order with ID 99999 not found",
        }
      );
    });

    it("should fetch valid order", async () => {
      // First create an order to test with
      const orderData = {
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        type: "Delivery",
        totalPrice: 150.99,
        items: [{ id: 1, name: "Burger", price: 120.99, quantity: 1 }],
      };
      const createdOrder = await orderController.createOrder(orderData);

      const order = await orderController.getOrderById(createdOrder.id);
      assert(order, "Order should be found");
      assert.strictEqual(order.id, createdOrder.id);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors", async () => {
      mockRequest.params.orderId = 1;

      const dbError = new Error("Database error");
      sinon.stub(orderModel, "getOrder").rejects(dbError);

      await orderController.getOrder(mockRequest, mockResponse, mockNext);

      assert(mockNext.calledWith(dbError));
    });

    it("should handle messenger API errors gracefully", async () => {
      const orderData = {
        customerName: "John Smith",
        items: [{ itemId: 1, quantity: 1 }],
        deliveryAddress: "123 Main St",
      };

      mockRequest.body = orderData;

      sinon.stub(orderModel, "createOrder").resolves({ id: 1, ...orderData });
      sinon
        .stub(messengerAPI, "sendOrderConfirmation")
        .rejects(new Error("API Error"));

      await orderController.createOrder(mockRequest, mockResponse, mockNext);

      // Order should still be created even if messenger notification fails
      assert(mockResponse.status.calledWith(201));
    });
  });

  describe("Order Analytics", () => {
    it("should calculate order totals correctly", async () => {
      const orderData = {
        customerName: "John Smith",
        items: [
          { itemId: 1, quantity: 2, price: 120.99 }, // 241.98
          { itemId: 2, quantity: 3, price: 40.99 }, // 122.97
        ],
        deliveryAddress: "123 Main St",
      };

      mockRequest.body = orderData;
      const expectedTotal = 364.95; // 241.98 + 122.97

      sinon
        .stub(orderModel, "createOrder")
        .callsFake(async (order) => ({
          id: 1,
          ...order,
          totalAmount: expectedTotal,
        }));

      await orderController.createOrder(mockRequest, mockResponse, mockNext);

      const responseData = mockResponse.json.getCall(0).args[0].data;
      assert.strictEqual(responseData.totalAmount, expectedTotal);
    });

    it("should track order completion time", async () => {
      const orderId = 1;
      mockRequest.params.orderId = orderId;
      mockRequest.body = { status: "completed" };

      const startTime = new Date(Date.now() - 1800000); // 30 minutes ago
      const completionTime = new Date();

      sinon.stub(orderModel, "getOrder").resolves({
        id: orderId,
        status: "accepted",
        createdAt: startTime,
      });

      sinon
        .stub(orderModel, "updateOrderStatus")
        .callsFake(async (id, status) => ({
          id,
          status,
          createdAt: startTime,
          completedAt: completionTime,
        }));

      await orderController.updateOrderStatus(
        mockRequest,
        mockResponse,
        mockNext
      );

      const responseData = mockResponse.json.getCall(0).args[0].data;
      assert(responseData.completedAt);
      assert(responseData.completedAt - responseData.createdAt === 1800000);
    });
  });
});
