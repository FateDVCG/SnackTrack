const assert = require("assert");
const messengerController = require("../../controllers/messengerController");
const messengerAPI = require("../../utils/messengerAPI.mock");

describe("Messenger Controller Tests", () => {
  describe("Webhook Verification", () => {
    it("should verify valid webhook challenge", () => {
      const body = {
        object: "page",
        entry: [
          {
            messaging: [
              {
                sender: { id: "test_sender" },
                message: { text: "Hello" },
              },
            ],
          },
        ],
      };

      const result = messengerController.processWebhook(body);
      assert(result instanceof Promise, "Should return a promise");
    });
  });

  describe("Message Processing", () => {
    beforeEach(() => {
      messengerAPI.clearMessages();
    });

    it("should parse order text messages", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: { text: "I want 1 burger and fries deliver to 123 Test St" },
      };

      const result = await messengerController.parseMessagingEvent(
        messagingEvent
      );
      assert(result, "Should process the message");

      const messages = messengerAPI.getSentMessages();
      assert(messages.length > 0, "Should send a response message");
    });

    it("should parse Tagalog order messages", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: {
          text: "Gusto ko po ng burger at fries, address sa 123 Test St",
        },
      };

      const result = await messengerController.parseMessagingEvent(
        messagingEvent
      );
      assert(result, "Should process Tagalog message");

      const messages = messengerAPI.getSentMessages();
      assert(messages.length > 0, "Should send a response message");
    });

    it("should handle invalid order messages", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: { text: "This is not a valid order message" },
      };

      const result = await messengerController.parseMessagingEvent(
        messagingEvent
      );

      const messages = messengerAPI.getSentMessages();
      assert(messages.length > 0, "Should send error message");
      assert(
        messages[0].text.toLowerCase().includes("sorry") ||
          messages[0].text.toLowerCase().includes("invalid"),
        "Should indicate invalid order"
      );
    });

    it("should handle messages with special instructions", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: {
          text: "1 burger and fries to 123 Test St. Extra sauce please!",
        },
      };

      const result = await messengerController.parseMessagingEvent(
        messagingEvent
      );
      assert(result, "Should process message with special instructions");

      const messages = messengerAPI.getSentMessages();
      assert(messages.length > 0, "Should send confirmation with instructions");
      assert(
        messages[0].text.toLowerCase().includes("sauce"),
        "Should acknowledge special instructions"
      );
    });

    it("should handle empty or undefined messages", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: {},
      };

      try {
        await messengerController.parseMessagingEvent(messagingEvent);
        assert.fail("Should reject empty message");
      } catch (error) {
        assert(error.message.includes("message"));
      }
    });
  });

  describe("Customer Information Extraction", () => {
    it("should extract customer name and phone", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: {
          text: "name: John Smith\nphone: +639123456789\n1 burger to 123 Test St",
        },
      };

      const result = await messengerController.parseMessagingEvent(
        messagingEvent
      );
      const messages = messengerAPI.getSentMessages();

      assert(messages.length > 0, "Should confirm order with customer info");
      assert(
        messages[0].text.includes("John Smith"),
        "Should include customer name in confirmation"
      );
    });

    it("should handle missing customer information", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: { text: "1 burger to 123 Test St" },
      };

      const result = await messengerController.parseMessagingEvent(
        messagingEvent
      );
      const messages = messengerAPI.getSentMessages();

      assert(messages.length > 0, "Should process order without customer info");
    });
  });

  describe("Order Item Processing", () => {
    it("should handle multiple items with quantities", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: {
          text: "2 burgers, 3 fries, and 1 soda to 123 Test St",
        },
      };

      const result = await messengerController.parseMessagingEvent(
        messagingEvent
      );
      const messages = messengerAPI.getSentMessages();

      assert(messages.length > 0, "Should confirm multiple items");
      assert(
        messages[0].text.includes("2") && messages[0].text.includes("3"),
        "Should include quantities in confirmation"
      );
    });

    it("should handle unknown menu items", async () => {
      const messagingEvent = {
        sender: { id: "test_sender" },
        message: {
          text: "1 invaliditem to 123 Test St",
        },
      };

      const result = await messengerController.parseMessagingEvent(
        messagingEvent
      );
      const messages = messengerAPI.getSentMessages();

      assert(messages.length > 0, "Should respond to unknown items");
      assert(
        messages[0].text.toLowerCase().includes("not available") ||
          messages[0].text.toLowerCase().includes("unknown"),
        "Should indicate unknown item"
      );
    });
  });
});
