const BASE_URL = "http://localhost:3000/api";

export const menuService = {
  // Get all menu items
  async getMenuItems() {
    try {
      const response = await fetch(`${BASE_URL}/menu-items`);
      if (!response.ok) throw new Error("Failed to fetch menu items");
      return response.json();
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return [];
    }
  },

  // Create a new menu item
  async createMenuItem(itemData) {
    const response = await fetch(`${BASE_URL}/menu-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) throw new Error("Failed to create menu item");
    return response.json();
  },

  // Update a menu item
  async updateMenuItem(id, itemData) {
    const response = await fetch(`${BASE_URL}/menu-items/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) throw new Error("Failed to update menu item");
    return response.json();
  },

  // Delete a menu item
  async deleteMenuItem(id) {
    const response = await fetch(`${BASE_URL}/menu-items/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete menu item");
    return response.json();
  },
};
