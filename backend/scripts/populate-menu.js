require("dotenv").config();
const menuItemModel = require("../models/menuItemModel");

const sampleMenuItems = [
  {
    name: "Burger",
    name_tagalog: "Hamburger",
    price: 120.99,
    category: "Main Dishes",
    aliases: ["burger", "hamburger", "beefburger", "cheeseburger"],
  },
  {
    name: "French Fries",
    name_tagalog: "Pritong Patatas",
    price: 40.99,
    category: "Sides",
    aliases: ["fries", "chips", "patatas"],
  },
  {
    name: "Fried Chicken",
    name_tagalog: "Pritong Manok",
    price: 150.99,
    category: "Main Dishes",
    aliases: ["chicken", "manok"],
  },
  {
    name: "Spaghetti",
    name_tagalog: "Espageti",
    price: 90.99,
    category: "Main Dishes",
    aliases: ["pasta", "noodles"],
  },
  {
    name: "Ice Cream",
    name_tagalog: "Sorbetes",
    price: 35.99,
    category: "Desserts",
    aliases: ["dessert", "ice cream", "sorbetes"],
  },
  {
    name: "Soft Drink",
    name_tagalog: "Softdrinks",
    price: 25.99,
    category: "Beverages",
    aliases: ["soda", "cola", "drink", "softdrink"],
  },
  {
    name: "Rice",
    name_tagalog: "Kanin",
    price: 20.99,
    category: "Sides",
    aliases: ["rice", "kanin", "bigas"],
  },
  {
    name: "Pancit",
    name_tagalog: "Pancit",
    price: 80.99,
    category: "Main Dishes",
    aliases: ["noodles", "bihon", "canton"],
  },
];

async function populateMenu() {
  try {
    console.log("Starting menu population...");

    for (const item of sampleMenuItems) {
      console.log(`Adding ${item.name}...`);
      await menuItemModel.createMenuItem(item);
    }

    console.log("Menu population completed successfully!");
  } catch (error) {
    console.error("Error populating menu:", error);
  } finally {
    process.exit();
  }
}

populateMenu();
