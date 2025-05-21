const https = require("https");

/**
 * Sends message to user via Facebook Messenger API
 * @param {string} recipientId - Facebook PSID of the recipient
 * @param {object} message - Message to send
 * @returns {Promise} Response from Facebook
 */
function sendMessage(recipientId, message) {
  return new Promise((resolve, reject) => {
    // Validate page access token exists
    const pageAccessToken = process.env.FB_PAGE_TOKEN;
    if (!pageAccessToken) {
      reject(new Error("Missing FB_PAGE_TOKEN environment variable"));
      return;
    }

    // Construct the message body
    const requestBody = {
      recipient: {
        id: recipientId,
      },
      message: message,
    };

    // Convert the body to JSON string
    const jsonData = JSON.stringify(requestBody);

    // Configure the request options
    const options = {
      hostname: "graph.facebook.com",
      path: "/v18.0/me/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(jsonData),
        Authorization: `Bearer ${pageAccessToken}`,
      },
    };

    // Send the request
    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(
            new Error(
              `Failed to send message. Status: ${res.statusCode}, Response: ${responseData}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    // Write data and end request
    req.write(jsonData);
    req.end();
  });
}

/**
 * Sends a text message to a user
 * @param {string} recipientId - Facebook PSID of the recipient
 * @param {string} text - Text message to send
 */
async function sendTextMessage(recipientId, text) {
  try {
    const message = {
      text: text,
    };

    const response = await sendMessage(recipientId, message);
    console.log("Message sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
}

/**
 * Sends a quick reply message to a user
 * @param {string} recipientId - Facebook PSID of the recipient
 * @param {string} text - Text to show above quick replies
 * @param {Array} quickReplies - Array of quick reply options
 */
async function sendQuickReply(recipientId, text, quickReplies) {
  try {
    const message = {
      text: text,
      quick_replies: quickReplies.map((reply) => ({
        content_type: "text",
        title: reply.title,
        payload: reply.payload,
      })),
    };

    const response = await sendMessage(recipientId, message);
    console.log("Quick reply sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to send quick reply:", error);
    throw error;
  }
}

module.exports = {
  sendMessage,
  sendTextMessage,
  sendQuickReply,
};
