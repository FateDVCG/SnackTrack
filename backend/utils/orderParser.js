const menuItemModel = require("../models/menuItemModel");

/**
 * Common words to ignore when parsing orders
 */
const FILTER_WORDS = {
  english: [
    "i",
    "want",
    "to",
    "order",
    "please",
    "and",
    "with",
    "also",
    "get",
    "would",
    "like",
    "a",
    "an",
    "the",
    "can",
    "me",
    "for",
  ],
  tagalog: [
    "po",
    "nga",
    "sana",
    "ako",
    "gusto",
    "ko",
    "ng",
    "at",
    "pati",
    "rin",
    "din",
    "mag",
    "order",
    "pa",
    "yung",
    "na",
    "lang",
    "akin",
    "para",
    "sa",
    "dito",
  ],
};

/**
 * Address indicators
 */
const ADDRESS_INDICATORS = {
  english: ["deliver", "address", "location", "send", "to"],
  tagalog: [
    "address",
    "lugar",
    "lokasyon",
    "dito",
    "sa",
    "padala",
    "deliver",
    "ipadala",
    "punta",
    "doon",
    "diyan",
  ],
};

/**
 * Customer info indicators
 */
const CUSTOMER_INFO_INDICATORS = {
  name: {
    english: ["name:", "name is", "this is", "i am", "caller:", "from:"],
    tagalog: ["pangalan:", "ako si", "ito si", "tawag:", "mula kay:"],
  },
  phone: {
    english: ["phone:", "contact:", "number:", "cell:", "mobile:"],
    tagalog: ["numero:", "telepono:", "contact:", "cellphone:"],
  },
};

/**
 * Quantity indicators and their values
 */
const QUANTITY_INDICATORS = {
  english: {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  },
  tagalog: {
    isa: 1,
    dalawa: 2,
    tatlo: 3,
    apat: 4,
    lima: 5,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  },
};

/**
 * Special instruction indicators
 */
const SPECIAL_INSTRUCTION_INDICATORS = {
  english: ["with", "no", "extra", "without", "add", "less", "more"],
  tagalog: ["na may", "walang", "dagdagan", "kulangan", "dagdag", "konti"],
};

/**
 * Pickup order indicators
 */
const PICKUP_INDICATORS = {
  english: [
    "pick up",
    "pickup",
    "collect",
    "will get",
    "i'll get",
    "i will get",
  ],
  tagalog: ["kunin", "susunduin", "kukunin", "pipick up", "kukuha"],
};

/**
 * Time indicators
 */
const TIME_INDICATORS = {
  english: ["at", "by", "around", "before", "after"],
  tagalog: ["alas", "mga", "bago", "pagkatapos", "sa"],
};

/**
 * Payment method indicators
 */
const PAYMENT_METHODS = {
  english: {
    cash: ["cash", "money", "pay with cash", "in cash"],
    card: ["card", "credit card", "debit card", "visa", "mastercard"],
    gcash: ["gcash", "g-cash", "g cash"],
    paymaya: ["paymaya", "pay maya", "maya"],
  },
  tagalog: {
    cash: ["cash", "pera", "bayad", "bayaran"],
    card: ["card", "credit card", "debit card"],
    gcash: ["gcash", "g-cash", "g cash"],
    paymaya: ["paymaya", "pay maya", "maya"],
  },
};

/**
 * Discount code indicators
 */
const DISCOUNT_INDICATORS = {
  english: ["discount", "code", "promo", "coupon", "voucher"],
  tagalog: ["discount", "code", "promo", "kupon", "voucher"],
};

/**
 * Compound phrases to preserve
 */
const COMPOUND_PHRASES = [
  "pritong manok",
  "pritong patatas",
  "pakpak ng manok",
  "ice cream",
  "soft drink",
  "french fries",
  "fried chicken",
];

/**
 * Parse natural language order text
 */
async function parseOrderText(text) {
  try {
    // Extract customer information
    const { customerName, customerPhone, remainingText } =
      extractCustomerInfo(text);

    // Split remaining text into potential order and address parts
    const { orderText, address } = extractAddress(remainingText || text);

    // Determine if this is a pickup order
    const { isPickup, cleanedText } = checkForPickup(orderText);

    // Extract special instructions
    const { instructions, textWithoutInstructions } =
      extractSpecialInstructions(cleanedText);

    // Extract requested time
    const { requestedTime, textWithoutTime } = extractRequestedTime(
      textWithoutInstructions
    );

    // Extract payment method
    const { paymentMethod, textWithoutPayment } =
      extractPaymentMethod(textWithoutTime);

    // Extract discount code
    const { discountCode, finalText } = extractDiscountCode(textWithoutPayment);

    // Clean and tokenize the order text
    const tokens = cleanText(finalText);

    // Find quantities and menu items in the text
    const items = await findMenuItemsWithQuantities(tokens);

    // Check for errors
    const errors = validateOrder(items, text);

    return {
      items,
      deliveryAddress: address,
      customerName,
      customerPhone,
      originalText: text,
      orderType: isPickup ? "pickup" : "delivery",
      specialInstructions: instructions,
      requestedTime,
      paymentMethod,
      discountCode,
      errors: errors || [],
    };
  } catch (error) {
    console.error("Error parsing order text:", error);
    // Return a basic structure even if parsing fails
    return {
      items: [],
      deliveryAddress: null,
      customerName: null,
      customerPhone: null,
      originalText: text,
      orderType: "delivery",
      specialInstructions: null,
      requestedTime: null,
      paymentMethod: null,
      discountCode: null,
      errors: ["Failed to parse order text"],
    };
  }
}

/**
 * Validate the order and return any errors
 */
function validateOrder(items, text) {
  const errors = [];

  // Check for zero quantity items
  if (text.match(/\b0\s+\w+/i)) {
    errors.push("Order contains items with zero quantity");
  }

  // Check if no items were found
  if (items.length === 0) {
    // Try to identify what might have been ordered but not found
    const words = text.toLowerCase().split(/\s+/);
    const potentialItems = words.filter(
      (word) =>
        !FILTER_WORDS.english.includes(word) &&
        !FILTER_WORDS.tagalog.includes(word) &&
        word.length > 3
    );

    if (potentialItems.length > 0) {
      errors.push(`Unknown menu items: ${potentialItems.join(", ")}`);
    } else {
      errors.push("No menu items found in order");
    }
  }

  return errors;
}

/**
 * Check if this is a pickup order
 */
function checkForPickup(text) {
  const lowerText = text.toLowerCase();

  for (const lang of ["english", "tagalog"]) {
    for (const indicator of PICKUP_INDICATORS[lang]) {
      if (lowerText.includes(indicator.toLowerCase())) {
        return {
          isPickup: true,
          cleanedText: lowerText.replace(new RegExp(indicator, "gi"), ""),
        };
      }
    }
  }

  return { isPickup: false, cleanedText: text };
}

/**
 * Extract special instructions from text
 */
function extractSpecialInstructions(text) {
  const instructions = [];
  let textWithoutInstructions = text;

  for (const lang of ["english", "tagalog"]) {
    for (const indicator of SPECIAL_INSTRUCTION_INDICATORS[lang]) {
      const regex = new RegExp(`${indicator}\\s+([\\w\\s]+)`, "gi");
      const matches = text.matchAll(regex);

      for (const match of matches) {
        if (match[1]) {
          instructions.push(match[0].trim());
          textWithoutInstructions = textWithoutInstructions.replace(
            match[0],
            ""
          );
        }
      }
    }
  }

  return {
    instructions: instructions.length > 0 ? instructions.join(", ") : null,
    textWithoutInstructions,
  };
}

/**
 * Extract requested time from text
 */
function extractRequestedTime(text) {
  const timeRegex =
    /\b(at|by|around|before|after|alas|mga)\s+([0-9]{1,2}[:.][0-9]{2}(?:\s*[ap]\.?m\.?)?|\d{1,2}\s*[ap]\.?m\.?)\b/i;
  const match = text.match(timeRegex);

  if (match) {
    return {
      requestedTime: match[2].trim(),
      textWithoutTime: text.replace(match[0], ""),
    };
  }

  return { requestedTime: null, textWithoutTime: text };
}

/**
 * Extract payment method from text
 */
function extractPaymentMethod(text) {
  const lowerText = text.toLowerCase();

  for (const lang of ["english", "tagalog"]) {
    for (const [method, indicators] of Object.entries(PAYMENT_METHODS[lang])) {
      for (const indicator of indicators) {
        if (lowerText.includes(indicator.toLowerCase())) {
          return {
            paymentMethod: method,
            textWithoutPayment: lowerText.replace(
              new RegExp(indicator, "gi"),
              ""
            ),
          };
        }
      }
    }
  }

  return { paymentMethod: null, textWithoutPayment: text };
}

/**
 * Extract discount code from text
 */
function extractDiscountCode(text) {
  let discountCode = null;
  let finalText = text;

  // Look for patterns like "discount code: ABC123" or "promo: SAVE50"
  for (const lang of ["english", "tagalog"]) {
    for (const indicator of DISCOUNT_INDICATORS[lang]) {
      const regex = new RegExp(`${indicator}(?:\\s*:?\\s*)([A-Za-z0-9]+)`, "i");
      const match = text.match(regex);

      if (match && match[1]) {
        discountCode = match[1].toUpperCase();
        finalText = finalText.replace(match[0], "");
        break;
      }
    }
    if (discountCode) break;
  }

  return { discountCode, finalText };
}

/**
 * Extract customer information from text
 */
function extractCustomerInfo(text) {
  if (!text)
    return { customerName: null, customerPhone: null, remainingText: "" };

  let processedText = text;
  let customerName = null;
  let customerPhone = null;
  let lines = processedText.split("\n");
  let remainingLines = [];

  for (const line of lines) {
    let isInfoLine = false;
    // Check for name
    if (!customerName) {
      for (const lang of ["english", "tagalog"]) {
        for (const indicator of CUSTOMER_INFO_INDICATORS.name[lang]) {
          if (line.toLowerCase().includes(indicator.toLowerCase())) {
            customerName = line
              .substring(line.indexOf(indicator) + indicator.length)
              .trim();
            isInfoLine = true;
            break;
          }
        }
        if (customerName) break;
      }
    }

    // Check for phone
    if (!customerPhone) {
      for (const lang of ["english", "tagalog"]) {
        for (const indicator of CUSTOMER_INFO_INDICATORS.phone[lang]) {
          if (line.toLowerCase().includes(indicator.toLowerCase())) {
            customerPhone = line
              .substring(line.indexOf(indicator) + indicator.length)
              .trim();
            // Clean up phone number
            customerPhone = customerPhone.replace(/[^\d+]/g, "");
            isInfoLine = true;
            break;
          }
        }
        if (customerPhone) break;
      }
    }

    // Keep non-info lines for further processing
    if (!isInfoLine) {
      remainingLines.push(line);
    }
  }

  return {
    customerName,
    customerPhone,
    remainingText: remainingLines.join("\n"),
  };
}

/**
 * Extract delivery address from text
 */
function extractAddress(text) {
  const lowerText = text.toLowerCase();

  // First check if any compound phrases would be mistakenly identified as address
  for (const phrase of COMPOUND_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      // Don't extract address if it would break a compound phrase
      const phraseIndex = lowerText.indexOf(phrase.toLowerCase());
      for (const lang of ["english", "tagalog"]) {
        for (const indicator of ADDRESS_INDICATORS[lang]) {
          const indicatorIndex = lowerText.indexOf(indicator);
          if (
            indicatorIndex !== -1 &&
            Math.abs(indicatorIndex - phraseIndex) < phrase.length + 5
          ) {
            // Skip this indicator as it would break a compound phrase
            continue;
          }
        }
      }
    }
  }

  // Try to find address indicators
  for (const lang of ["english", "tagalog"]) {
    for (const indicator of ADDRESS_INDICATORS[lang]) {
      const index = lowerText.indexOf(indicator);
      if (index !== -1) {
        // Verify this wouldn't break any compound phrases
        let isValid = true;
        for (const phrase of COMPOUND_PHRASES) {
          const phraseIndex = lowerText.indexOf(phrase.toLowerCase());
          if (
            phraseIndex !== -1 &&
            Math.abs(index - phraseIndex) < phrase.length + 5
          ) {
            isValid = false;
            break;
          }
        }
        if (!isValid) continue;

        // Split text at the indicator
        const orderText = text.substring(0, index).trim();
        const address = text.substring(index).trim();
        return { orderText, address };
      }
    }
  }

  // If no address found, return original text as order
  return { orderText: text, address: null };
}

/**
 * Clean and tokenize text
 */
function cleanText(text) {
  // First, preserve compound phrases by replacing spaces with underscores
  let processedText = text.toLowerCase();

  // Sort phrases by length (longest first) to handle overlapping phrases
  const sortedPhrases = [...COMPOUND_PHRASES].sort(
    (a, b) => b.length - a.length
  );

  for (const phrase of sortedPhrases) {
    const regex = new RegExp(phrase, "gi");
    processedText = processedText.replace(regex, phrase.replace(/ /g, "_"));
  }

  // Now split and filter
  const tokens = processedText
    .replace(/[.,!?]/g, "") // Remove punctuation
    .split(" ")
    .map((token) => token.replace(/_/g, " ")) // Restore spaces in preserved phrases
    .filter(
      (token) =>
        !FILTER_WORDS.english.includes(token) &&
        !FILTER_WORDS.tagalog.includes(token)
    );

  return tokens;
}

/**
 * Find menu items and their quantities from tokens
 */
async function findMenuItemsWithQuantities(tokens) {
  const items = [];
  const foundItems = new Set();
  let currentQuantity = 1;

  // Try to find menu items in the text
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check if token is a quantity indicator
    const quantity =
      QUANTITY_INDICATORS.english[token] || QUANTITY_INDICATORS.tagalog[token];
    if (quantity) {
      currentQuantity = quantity;
      continue;
    }

    // Try increasingly smaller combinations of words
    let found = false;
    for (let j = Math.min(tokens.length, i + 4); j > i; j--) {
      const phrase = tokens.slice(i, j).join(" ");

      // Skip if we already found this phrase
      if (foundItems.has(phrase)) continue;

      // Look for matching menu items
      const menuItems = await menuItemModel.findMenuItemsByName(phrase);

      if (menuItems.length > 0) {
        // Add first matching item
        items.push({
          item: menuItems[0],
          quantity: currentQuantity,
        });

        // Reset quantity for next item
        currentQuantity = 1;

        // Mark these tokens as used
        foundItems.add(phrase);
        i = j - 1; // Skip to end of found phrase
        found = true;
        break;
      }
    }

    // If no match found with compound phrases, try individual words
    if (!found) {
      const menuItems = await menuItemModel.findMenuItemsByName(token);
      if (menuItems.length > 0) {
        items.push({
          item: menuItems[0],
          quantity: currentQuantity,
        });
        currentQuantity = 1;
        foundItems.add(token);
      }
    }
  }

  return items;
}

module.exports = {
  parseOrderText,
};
