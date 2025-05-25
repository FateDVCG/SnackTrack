// Mock implementation for menuService
export const menuService = {
  // Functions used in original implementation
  getMenuItems: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: "Burger",
      name_tagalog: "Hamburger",
      price: 120.99,
      category: "Main",
      isAvailable: true,
      description: "Delicious beef burger with cheese"
    },
    {
      id: 2,
      name: "Fries",
      name_tagalog: "Pritong Patatas",
      price: 40.99,
      category: "Sides",
      isAvailable: true,
      description: "Crispy golden fries"
    }
  ]),
  createMenuItem: jest.fn().mockImplementation((itemData) => 
    Promise.resolve({ id: 3, ...itemData })
  ),
  updateMenuItem: jest.fn().mockImplementation((id, itemData) => 
    Promise.resolve({ id, ...itemData })
  ),
  deleteMenuItem: jest.fn().mockResolvedValue({ success: true }),

  // Additional aliases used in tests
  getAllItems: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: "Burger",
      name_tagalog: "Hamburger",
      price: 120.99,
      category: "Main",
      available: true,
      description: "Delicious beef burger with cheese"
    },
    {
      id: 2,
      name: "Fries",
      name_tagalog: "Pritong Patatas",
      price: 40.99,
      category: "Sides",
      available: true,
      description: "Crispy golden fries"
    }
  ]),
  createItem: jest.fn().mockImplementation((itemData) => 
    Promise.resolve({ id: 3, ...itemData })
  ),
  updateItem: jest.fn().mockImplementation((id, itemData) => 
    Promise.resolve({ id, ...itemData })
  ),
  deleteItem: jest.fn().mockResolvedValue({ success: true }),
  addMenuItem: jest.fn().mockImplementation((itemData) => 
    Promise.resolve({ id: 3, ...itemData })
  )
};