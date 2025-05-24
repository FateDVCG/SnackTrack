/**
 * Mock implementation of the Messenger API for testing
 */

let sentMessages = [];

/**
 * Send a text message to a user
 */
async function sendTextMessage(recipientId, text) {
  console.log("\nMock Messenger API - Message sent:");
  console.log("To:", recipientId);
  console.log("Message:", text);

  sentMessages.push({
    recipientId,
    text,
    timestamp: new Date(),
  });

  return {
    recipient_id: recipientId,
    message_id: `mock_msg_${Date.now()}`,
  };
}

/**
 * Clear sent messages (useful for test setup)
 */
function clearMessages() {
  sentMessages = [];
}

/**
 * Get all sent messages (useful for test verification)
 */
function getSentMessages() {
  return sentMessages;
}

module.exports = {
  sendTextMessage,
  clearMessages,
  getSentMessages,
};
