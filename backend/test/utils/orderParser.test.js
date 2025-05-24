const assert = require("assert");
const { describe, it, beforeEach } = require("mocha");
const orderParser = require("../../utils/orderParser");
const menuItemModel = require("../../models/menuItemModel");

describe("Order Parser", () => {
  const mockMenuItems = [
    { id: 1, name: "Burger", name_tagalog: "Burger", price: 120.99 },
    {
      id: 2,
      name: "French Fries",
      name_tagalog: "Pritong Patatas",
      price: 40.99,
    },
    {
      id: 3,
      name: "Fried Chicken",
      name_tagalog: "Pritong Manok",
      price: 150.99,
    },
    { id: 4, name: "Soda", name_tagalog: "Softdrinks", price: 25.99 },
  ];

  beforeEach(() => {
    // Mock menu item lookup
    menuItemModel.findMenuItemsByName = async (name) => {
      return mockMenuItems.filter(
        (item) =>
          item.name.toLowerCase().includes(name.toLowerCase()) ||
          item.name_tagalog.toLowerCase().includes(name.toLowerCase())
      );
    };
  });

  describe("English Order Parsing", () => {
    it("should parse simple English order", async () => {
      const orderText =
        "I want to order 2 burger and 1 fries, deliver to 123 Main St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 2);
      assert.deepStrictEqual(result.items[0], {
        item: mockMenuItems[0],
        quantity: 2,
      });
      assert.deepStrictEqual(result.items[1], {
        item: mockMenuItems[1],
        quantity: 1,
      });
      assert.strictEqual(result.deliveryAddress, "123 Main St");
    });

    it("should handle multiple quantity formats", async () => {
      const orderText =
        "order two burgers, one french fries and 3 soda to 456 Side St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 3);
      assert.strictEqual(result.items[0].quantity, 2);
      assert.strictEqual(result.items[1].quantity, 1);
      assert.strictEqual(result.items[2].quantity, 3);
    });

    it("should parse customer information", async () => {
      const orderText = `name: John Smith
phone: +639123456789
deliver 1 burger and 2 fries to 789 Test Ave`;

      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.customerName, "John Smith");
      assert.strictEqual(result.customerPhone, "+639123456789");
      assert.strictEqual(result.items.length, 2);
    });

    it("should handle special instructions", async () => {
      const orderText =
        "order 1 burger with extra cheese and 1 fries no salt to 123 Main St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 2);
      assert.strictEqual(result.specialInstructions, "extra cheese, no salt");
    });
  });

  describe("Tagalog Order Parsing", () => {
    it("should parse simple Tagalog order", async () => {
      const orderText =
        "gusto ko po ng 2 pritong manok at 1 softdrinks, address sa 123 Main St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 2);
      assert.deepStrictEqual(result.items[0], {
        item: mockMenuItems[2],
        quantity: 2,
      });
      assert.deepStrictEqual(result.items[1], {
        item: mockMenuItems[3],
        quantity: 1,
      });
      assert.strictEqual(result.deliveryAddress, "123 Main St");
    });

    it("should handle Tagalog quantity words", async () => {
      const orderText =
        "dalawang burger at isang pritong patatas sa 456 Side St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 2);
      assert.strictEqual(result.items[0].quantity, 2);
      assert.strictEqual(result.items[1].quantity, 1);
    });

    it("should parse Filipino customer information", async () => {
      const orderText = `pangalan: Juan Dela Cruz
numero: 09123456789
pabili po ng 1 burger at 2 softdrinks sa 789 Test Ave`;

      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.customerName, "Juan Dela Cruz");
      assert.strictEqual(result.customerPhone, "09123456789");
      assert.strictEqual(result.items.length, 2);
    });

    it("should handle Taglish orders", async () => {
      const orderText =
        "order po ng 2 burger at isang pritong patatas with extra sauce sa 123 Main St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 2);
      assert.strictEqual(result.items[0].quantity, 2);
      assert.strictEqual(result.items[1].quantity, 1);
      assert.strictEqual(result.specialInstructions, "extra sauce");
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown menu items", async () => {
      const orderText = "I want 1 pizza deliver to 123 Main St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 0);
      assert.strictEqual(result.errors.length, 1);
      assert(result.errors[0].includes("pizza"));
    });

    it("should handle missing quantities", async () => {
      const orderText = "burger and fries to 123 Main St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 2);
      // Default to quantity 1 when not specified
      assert.strictEqual(result.items[0].quantity, 1);
      assert.strictEqual(result.items[1].quantity, 1);
    });

    it("should handle missing delivery address", async () => {
      const orderText = "order 1 burger and 1 fries";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 2);
      assert.strictEqual(result.deliveryAddress, null);
      assert.strictEqual(result.errors.length, 1);
      assert(result.errors[0].includes("address"));
    });

    it("should handle invalid phone numbers", async () => {
      const orderText = `name: John Smith
phone: invalid
1 burger to 123 Main St`;

      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.customerPhone, null);
      assert.strictEqual(result.errors.length, 1);
      assert(result.errors[0].includes("phone"));
    });
  });

  describe("Advanced Features", () => {
    it("should normalize phone numbers", async () => {
      const testCases = [
        { input: "09123456789", expected: "+639123456789" },
        { input: "9123456789", expected: "+639123456789" },
        { input: "+639123456789", expected: "+639123456789" },
        { input: "0912-345-6789", expected: "+639123456789" },
      ];

      for (const test of testCases) {
        const orderText = `phone: ${test.input}\n1 burger to 123 Main St`;
        const result = await orderParser.parseOrderText(orderText);
        assert.strictEqual(result.customerPhone, test.expected);
      }
    });

    it("should handle multiple special instructions per item", async () => {
      const orderText =
        "order 1 burger no onions extra cheese and 1 fries extra crispy no salt";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 2);
      assert(result.specialInstructions.includes("no onions"));
      assert(result.specialInstructions.includes("extra cheese"));
      assert(result.specialInstructions.includes("extra crispy"));
      assert(result.specialInstructions.includes("no salt"));
    });

    it("should deduplicate similar items", async () => {
      const orderText = "2 burger and 1 burger and 3 burger to 123 Main St";
      const result = await orderParser.parseOrderText(orderText);

      assert.strictEqual(result.items.length, 1);
      assert.strictEqual(result.items[0].quantity, 6);
    });
  });
});
