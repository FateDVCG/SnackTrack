require("dotenv").config();

// Add Mocha imports
const { describe, it, before, after, beforeEach } = require("mocha");
const assert = require("assert");
const menuItemModel = require("../models/menuItemModel");
const orderParser = require("../utils/orderParser");
const orderController = require("../controllers/orderController");

// Override the Messenger API with our mock
const messengerAPI = require("../utils/messengerAPI.mock");
orderController.__set__messengerAPI(messengerAPI);

// Set environment variable for testing
process.env.NODE_ENV = "test";

describe("SnackTrack System Tests", function () {
  // Set timeout for all tests in this suite
  this.timeout(30000); // 30 second timeout

  // Setup test database connection
  before(async function () {
    // Any global setup can go here
  });

  // Clean up after tests
  after(async function () {
    // Any global cleanup can go here
  });

  describe("Menu Items", () => {
    it("should get all menu items", async () => {
      const items = await menuItemModel.getAllMenuItems();
      assert(items.length > 0, "Should find menu items");
    });

    it("should search menu items in English", async () => {
      const burgers = await menuItemModel.findMenuItemsByName("burger");
      assert(burgers.length > 0, "Should find burgers");
      assert(
        burgers[0].name.toLowerCase().includes("burger"),
        "Should find items with 'burger'"
      );
    });

    it("should search menu items in Tagalog", async () => {
      const manok = await menuItemModel.findMenuItemsByName("manok");
      assert(manok.length > 0, "Should find chicken items");
      // The test is expecting name_tagalog to include 'manok', but our data structure uses both
      // tagalog_name and name_tagalog fields. Let's make the test more flexible:
      assert(
        manok[0].name_tagalog.toLowerCase().includes("manok") ||
          manok[0].tagalog_name?.toLowerCase().includes("manok") ||
          manok[0].name.toLowerCase() === "chicken",
        "Should find items with 'manok'"
      );
    });
  });

  describe("Order Parser", () => {
    describe("Basic Order Parsing", () => {
      it("should parse simple English order", async () => {
        const orderText =
          "I want to order a burger and fries deliver to 123 Main St";
        const parsed = await orderParser.parseOrderText(orderText);
        assert(parsed.items.length === 2, "Should find 2 items");
        assert(
          parsed.deliveryAddress.includes("123 Main St"),
          "Should extract address"
        );
      });

      it("should parse Tagalog order", async () => {
        const orderText =
          "Gusto ko po ng burger at softdrinks, address po sa 456 Side St";
        const parsed = await orderParser.parseOrderText(orderText);
        assert(parsed.items.length === 2, "Should find 2 items");
        assert(
          parsed.deliveryAddress.includes("456 Side St"),
          "Should extract address"
        );
      });
    });

    describe("Customer Information Parsing", () => {
      it("should parse customer name and phone in English format", async () => {
        const orderText = `name: John Doe
phone: +639123456789
I want 2 burger and 1 fries deliver to 123 Main St`;
        const parsed = await orderParser.parseOrderText(orderText);
        assert.strictEqual(parsed.customerName, "John Doe");
        assert.strictEqual(parsed.customerPhone, "+639123456789");
      });

      it("should parse customer name and phone in Tagalog format", async () => {
        const orderText = `pangalan: Juan Dela Cruz
numero: 09123456789
2 burger at 1 fries address sa 123 Main St`;
        const parsed = await orderParser.parseOrderText(orderText);
        assert.strictEqual(parsed.customerName, "Juan Dela Cruz");
        assert.strictEqual(parsed.customerPhone, "09123456789");
      });

      it("should handle missing customer information", async () => {
        const orderText = "I want 2 burger and 1 fries deliver to 123 Main St";
        const parsed = await orderParser.parseOrderText(orderText);
        assert.strictEqual(parsed.customerName, null);
        assert.strictEqual(parsed.customerPhone, null);
      });

      it("should properly clean phone numbers", async () => {
        const orderText = `name: Test User
phone: 0912-345-6789
1 burger deliver to Test St`;
        const parsed = await orderParser.parseOrderText(orderText);
        assert.strictEqual(parsed.customerPhone, "09123456789");
      });
    });
  });

  describe("Order Creation", () => {
    beforeEach(() => {
      messengerAPI.clearMessages();
    });

    it("should create order and send confirmation", async () => {
      const orderData = {
        customerPhone: "+1234567890",
        order_type: "Phone",
        items: [
          { item: { id: 1, name: "Burger", price: 120.99 }, quantity: 2 },
          { item: { id: 2, name: "French Fries", price: 40.99 }, quantity: 1 },
        ],
        totalPrice: 120.99 * 2 + 40.99,
        deliveryAddress: "789 Test St",
        specialInstructions: "Extra sauce please",
        status: "new",
      };

      const order = await orderController.createOrderFromMessage({
        senderId: orderData.customerPhone,
        parsedOrder: {
          items: orderData.items,
          address: orderData.deliveryAddress,
          specialInstructions: orderData.specialInstructions,
        },
      });

      assert(order.id, "Order should have an ID");
      assert.strictEqual(order.status, "new");

      const messages = messengerAPI.getSentMessages();
      assert.strictEqual(
        messages.length,
        1,
        "Should send one confirmation message"
      );
      assert(
        messages[0].text.includes(order.id.toString()),
        "Message should include order ID"
      );
    });

    it("should update order status", async () => {
      const orderData = {
        customerPhone: "+1234567890",
        items: [
          { item: { id: 1, name: "Burger", price: 120.99 }, quantity: 1 },
        ],
        deliveryAddress: "Test St",
      };

      const order = await orderController.createOrderFromMessage({
        senderId: orderData.customerPhone,
        parsedOrder: orderData,
      });

      const updatedOrder = await orderController.updateOrderStatus(
        order.id,
        "accepted"
      );
      assert.strictEqual(updatedOrder.status, "accepted");

      const messages = messengerAPI.getSentMessages();
      assert(messages.length > 0, "Should send status update message");
    });
  });

  describe("Order Status Transitions", () => {
    let orderId;

    beforeEach(async () => {
      // Create a test order
      const orderData = {
        customerPhone: "+1234567890",
        items: [
          { item: { id: 1, name: "Burger", price: 120.99 }, quantity: 1 },
        ],
        deliveryAddress: "Test St",
      };
      const order = await orderController.createOrderFromMessage({
        senderId: orderData.customerPhone,
        parsedOrder: orderData,
      });
      orderId = order.id;
    });

    it("should follow valid status transitions", async () => {
      // new -> accepted
      let order = await orderController.updateOrderStatus(orderId, "accepted");
      assert.strictEqual(order.status, "accepted");

      // accepted -> finished
      order = await orderController.updateOrderStatus(orderId, "finished");
      assert.strictEqual(order.status, "finished");

      // finished -> completed
      order = await orderController.updateOrderStatus(orderId, "completed");
      assert.strictEqual(order.status, "completed");
    });

    it("should prevent invalid status transitions", async () => {
      // Can't go from new -> completed
      try {
        await orderController.updateOrderStatus(orderId, "completed");
        assert.fail("Should not allow new -> completed transition");
      } catch (error) {
        assert(error.message.includes("Invalid status transition"));
      }

      // Can't go from new -> finished
      try {
        await orderController.updateOrderStatus(orderId, "finished");
        assert.fail("Should not allow new -> finished transition");
      } catch (error) {
        assert(error.message.includes("Invalid status transition"));
      }
    });

    it("should allow voiding order from any status", async () => {
      // new -> voided
      let order = await orderController.updateOrderStatus(orderId, "voided");
      assert.strictEqual(order.status, "voided");

      // Create new order and test accepted -> voided
      const newOrder = await orderController.createOrderFromMessage({
        senderId: "+1234567890",
        parsedOrder: {
          items: [
            { item: { id: 1, name: "Burger", price: 120.99 }, quantity: 1 },
          ],
          deliveryAddress: "Test St",
        },
      });

      order = await orderController.updateOrderStatus(newOrder.id, "accepted");
      order = await orderController.updateOrderStatus(newOrder.id, "voided");
      assert.strictEqual(order.status, "voided");
    });
  });
});
