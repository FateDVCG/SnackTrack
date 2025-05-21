const express = require("express");
const router = express.Router();
const messengerController = require("../controllers/messengerController");
const orderController = require("../controllers/orderController");
const messengerAPI = require("../utils/messengerAPI");

// GET endpoint for webhook verification
router.get("/", (req, res) => {
  console.log("Received GET request to webhook");
  console.log("Query params:", req.query);

  // Your verify token. Should be a string you created and saved as FB_VERIFY_TOKEN in .env
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
  console.log("Verify token from env:", VERIFY_TOKEN);

  // Parse the query params
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Check if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      console.log(
        "Failed verification. Mode:",
        mode,
        "Token match:",
        token === VERIFY_TOKEN
      );
      res.sendStatus(403);
    }
  } else {
    // Return a '404 Not Found' if mode or token are missing
    console.log("Missing mode or token. Mode:", mode, "Token:", token);
    res.sendStatus(404);
  }
});

// POST endpoint for receiving Messenger webhook events
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    // Process the message through our controller
    const parsedMessages = messengerController.processWebhook(body);

    // Log the parsed messages
    console.log("Parsed messages:", JSON.stringify(parsedMessages, null, 2));

    // Always return a 200 OK to Facebook quickly
    res.status(200).send("EVENT_RECEIVED");

    // Process messages after sending response
    for (const message of parsedMessages) {
      try {
        // Create an order from the message
        await orderController.createOrderFromMessage(message);
      } catch (error) {
        console.error(`Failed to process order for message:`, message, error);

        // Send error message to user
        await messengerAPI.sendTextMessage(
          message.senderId,
          "Sorry, we couldn't process your order at this time. Please try again later."
        );
      }
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
