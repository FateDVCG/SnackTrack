require("dotenv").config();
const assert = require("assert");
const menuItemModel = require("../models/menuItemModel");
const orderParser = require("../utils/orderParser");
const orderController = require("../controllers/orderController");

// Override the Messenger API with our mock
const messengerAPI = require("../utils/messengerAPI.mock");
orderController.__set__messengerAPI(messengerAPI);

describe("SnackTrack System Tests", () => {
  // Set timeout for all tests
  before(function () {
    this.timeout(10000);
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
      assert(
        manok[0].name_tagalog.toLowerCase().includes("manok"),
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
          parsed.address.includes("123 Main St"),
          "Should extract address"
        );
      });

      it("should parse Tagalog order", async () => {
        const orderText =
          "Gusto ko po ng burger at softdrinks, address po sa 456 Side St";
        const parsed = await orderParser.parseOrderText(orderText);
        assert(parsed.items.length === 2, "Should find 2 items");
        assert(
          parsed.address.includes("456 Side St"),
          "Should extract address"
        );
      });
    });

    describe("Customer Information Parsing", () => {
      it("should parse customer name and phone in English format", async () => {
        const orderText =
          "name: John Doe\nphone: +639123456789\nI want 2 burger and 1 fries deliver to 123 Main St";
        const parsed = await orderParser.parseOrderText(orderText);
        assert.strictEqual(parsed.customerName, "John Doe");
        assert.strictEqual(parsed.customerPhone, "+639123456789");
      });

      it("should parse customer name and phone in Tagalog format", async () => {
        const orderText =
          "pangalan: Juan Dela Cruz\nnumero: 09123456789\n2 burger at 1 fries address sa 123 Main St";
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
        const orderText =
          "name: Test User\nphone: 0912-345-6789\n1 burger deliver to Test St";
        const parsed = await orderParser.parseOrderText(orderText);
        assert.strictEqual(parsed.customerPhone, "09123456789");
      });
    });
  });

  describe("Order Creation", () => {
    beforeEach(() => {
      // Clear any previous mock messages
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
    });
  });
});
