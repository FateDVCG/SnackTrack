/**
 * Parses a text message from the messaging event
 */
function parseTextMessage(message) {
  return {
    type: "text",
    text: message.text,
    senderId: message.sender.id,
    timestamp: message.timestamp,
  };
}

/**
 * Parses a quick reply from the messaging event
 */
function parseQuickReply(message) {
  return {
    type: "quick_reply",
    payload: message.quick_reply.payload,
    text: message.text,
    senderId: message.sender.id,
    timestamp: message.timestamp,
  };
}

/**
 * Parses a postback from the messaging event
 */
function parsePostback(message) {
  return {
    type: "postback",
    payload: message.postback.payload,
    senderId: message.sender.id,
    timestamp: message.timestamp,
  };
}

/**
 * Main function to parse messaging events from webhook
 */
function parseMessagingEvent(event) {
  console.log("Processing event:", JSON.stringify(event, null, 2));

  // Get the sender PSID
  const senderId = event.sender.id;
  console.log("Message from sender:", senderId);

  // Check if message contains text
  if (event.message && event.message.text) {
    // Check if message has quick_reply
    if (event.message.quick_reply) {
      return parseQuickReply(event.message);
    }
    // Regular text message
    return parseTextMessage(event.message);
  }

  // Check if event is a postback
  if (event.postback) {
    return parsePostback(event);
  }

  console.log("Unknown event type:", event);
  return null;
}

/**
 * Process the webhook event from Facebook
 */
function processWebhook(body) {
  const { object, entry } = body;

  // Checks if this is a page webhook
  if (object === "page") {
    // Iterates over each entry - there may be multiple if batched
    return entry
      .flatMap((pageEntry) => {
        // Gets the message. entry.messaging is an array, but
        // will only ever contain one message, so we get index 0
        return pageEntry.messaging.map((messagingEvent) => {
          return parseMessagingEvent(messagingEvent);
        });
      })
      .filter(Boolean); // Remove null values
  }

  return [];
}

module.exports = {
  processWebhook,
  parseMessagingEvent,
};
