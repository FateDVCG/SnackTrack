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

    // Clean and tokenize the order text
    const tokens = cleanText(orderText);

    // Find quantities and menu items in the text
    const items = await findMenuItemsWithQuantities(tokens);

    return {
      items,
      address,
      customerName,
      customerPhone,
      originalText: text,
    };
  } catch (error) {
    console.error("Error parsing order text:", error);
    // Return a basic structure even if parsing fails
    return {
      items: [],
      address: "",
      customerName: null,
      customerPhone: null,
      originalText: text,
    };
  }
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
  return { orderText: text, address: "" };
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
