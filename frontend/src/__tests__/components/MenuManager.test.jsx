import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../src/setupTests";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { menuService } from "../../services/menuService";
import MenuManager from "../MenuManager";

vi.mock("../../services/menuService");

describe("MenuManager Component", () => {
  const mockMenuItems = [
    {
      id: 1,
      name: "Burger",
      name_tagalog: "Hamburger",
      price: 120.99,
      category: "Main Dish",
    },
    {
      id: 2,
      name: "Fries",
      name_tagalog: "Pritong Patatas",
      price: 40.99,
      category: "Sides",
    },
  ];

  beforeEach(() => {
    menuService.getMenuItems.mockResolvedValue(mockMenuItems);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render menu items table", async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
      expect(screen.getByText("Fries")).toBeInTheDocument();
    });

    expect(screen.getByText("Hamburger")).toBeInTheDocument();
    expect(screen.getByText("Pritong Patatas")).toBeInTheDocument();
    expect(screen.getByText("₱120.99")).toBeInTheDocument();
    expect(screen.getByText("₱40.99")).toBeInTheDocument();
  });

  it("should open dialog with empty form for new item", async () => {
    render(<MenuManager />);

    const addButton = screen.getByText("Add Menu Item");
    fireEvent.click(addButton);

    expect(screen.getByText("Add Menu Item")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Name (Tagalog)")).toHaveValue("");
    expect(screen.getByLabelText("Price")).toHaveValue("");
    expect(screen.getByLabelText("Category")).toHaveValue("");
  });

  it("should open dialog with item data for editing", async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTestId("edit-button");
    fireEvent.click(editButtons[0]);

    expect(screen.getByLabelText("Name")).toHaveValue("Burger");
    expect(screen.getByLabelText("Name (Tagalog)")).toHaveValue("Hamburger");
    expect(screen.getByLabelText("Price")).toHaveValue("120.99");
    expect(screen.getByLabelText("Category")).toHaveValue("Main Dish");
  });

  it("should create new menu item", async () => {
    const newItem = {
      name: "Pizza",
      name_tagalog: "Pizza",
      price: "199.99",
      category: "Main Dish",
    };

    menuService.createMenuItem.mockResolvedValueOnce({
      id: 3,
      ...newItem,
      price: parseFloat(newItem.price),
    });

    render(<MenuManager />);

    // Open dialog
    fireEvent.click(screen.getByText("Add Menu Item"));

    // Fill form
    await userEvent.type(screen.getByLabelText("Name"), newItem.name);
    await userEvent.type(
      screen.getByLabelText("Name (Tagalog)"),
      newItem.name_tagalog
    );
    await userEvent.type(screen.getByLabelText("Price"), newItem.price);
    await userEvent.type(screen.getByLabelText("Category"), newItem.category);

    // Submit form
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(menuService.createMenuItem).toHaveBeenCalledWith({
        ...newItem,
        price: parseFloat(newItem.price),
      });
    });
  });

  it("should update existing menu item", async () => {
    const updatedItem = {
      id: 1,
      name: "Cheeseburger",
      name_tagalog: "Hamburger na may Keso",
      price: "129.99",
      category: "Main Dish",
    };

    menuService.updateMenuItem.mockResolvedValueOnce({
      ...updatedItem,
      price: parseFloat(updatedItem.price),
    });

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    // Open edit dialog
    const editButtons = screen.getAllByTestId("edit-button");
    fireEvent.click(editButtons[0]);

    // Update form
    const nameInput = screen.getByLabelText("Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, updatedItem.name);

    const tagalogInput = screen.getByLabelText("Name (Tagalog)");
    await userEvent.clear(tagalogInput);
    await userEvent.type(tagalogInput, updatedItem.name_tagalog);

    const priceInput = screen.getByLabelText("Price");
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, updatedItem.price);

    // Submit form
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(menuService.updateMenuItem).toHaveBeenCalledWith(1, {
        ...updatedItem,
        price: parseFloat(updatedItem.price),
      });
    });
  });

  it("should delete menu item after confirmation", async () => {
    menuService.deleteMenuItem.mockResolvedValueOnce({});
    window.confirm = vi.fn(() => true);

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTestId("delete-button");
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(menuService.deleteMenuItem).toHaveBeenCalledWith(1);
    });
  });

  it("should validate required fields", async () => {
    render(<MenuManager />);

    // Open dialog
    fireEvent.click(screen.getByText("Add Menu Item"));

    // Try to submit empty form
    fireEvent.click(screen.getByText("Create"));

    // Check for required field validation
    expect(screen.getByLabelText("Name")).toBeInvalid();
    expect(screen.getByLabelText("Name (Tagalog)")).toBeInvalid();
    expect(screen.getByLabelText("Price")).toBeInvalid();
  });

  it("should handle API errors gracefully", async () => {
    const error = new Error("Failed to fetch menu items");
    menuService.getMenuItems.mockRejectedValueOnce(error);

    render(<MenuManager />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load menu items. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("should format prices correctly", async () => {
    render(<MenuManager />);

    await waitFor(() => {
      const priceElements = screen.getAllByText(/₱\d+\.\d{2}/);
      expect(priceElements).toHaveLength(2);
      expect(priceElements[0]).toHaveTextContent("₱120.99");
      expect(priceElements[1]).toHaveTextContent("₱40.99");
    });
  });

  it("should add new menu item", async () => {
    const newItem = {
      name: "Pizza",
      name_tagalog: "Pizza",
      price: 199.99,
      category: "Main Dishes",
      available: true,
    };

    menuService.createItem.mockResolvedValue({ id: 3, ...newItem });

    render(<MenuManager />);

    // Click add item button
    await userEvent.click(screen.getByText("Add Item"));

    // Fill form
    await userEvent.type(screen.getByLabelText(/Name/), newItem.name);
    await userEvent.type(
      screen.getByLabelText(/Tagalog Name/),
      newItem.name_tagalog
    );
    await userEvent.type(
      screen.getByLabelText(/Price/),
      newItem.price.toString()
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/Category/),
      newItem.category
    );

    // Submit form
    await userEvent.click(screen.getByText("Save"));

    expect(menuService.createItem).toHaveBeenCalledWith(newItem);

    // Should refresh list
    expect(menuService.getAllItems).toHaveBeenCalled();
  });

  it("should edit existing menu item", async () => {
    const updatedItem = {
      ...mockMenuItems[0],
      price: 129.99,
    };

    menuService.updateItem.mockResolvedValue(updatedItem);

    render(<MenuManager />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    // Click edit button on first item
    await userEvent.click(screen.getAllByLabelText("Edit")[0]);

    // Update price
    const priceInput = screen.getByLabelText(/Price/);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "129.99");

    // Save changes
    await userEvent.click(screen.getByText("Save"));

    expect(menuService.updateItem).toHaveBeenCalledWith(
      updatedItem.id,
      updatedItem
    );
    expect(menuService.getAllItems).toHaveBeenCalled();
  });

  it("should toggle item availability", async () => {
    const toggledItem = {
      ...mockMenuItems[0],
      available: false,
    };

    menuService.updateItem.mockResolvedValue(toggledItem);

    render(<MenuManager />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    // Click availability toggle
    await userEvent.click(screen.getAllByLabelText("Toggle availability")[0]);

    expect(menuService.updateItem).toHaveBeenCalledWith(
      toggledItem.id,
      toggledItem
    );
    expect(menuService.getAllItems).toHaveBeenCalled();
  });

  it("should delete menu item", async () => {
    menuService.deleteItem.mockResolvedValue({ success: true });

    render(<MenuManager />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    // Click delete button on first item
    await userEvent.click(screen.getAllByLabelText("Delete")[0]);

    // Confirm deletion
    await userEvent.click(screen.getByText("Confirm"));

    expect(menuService.deleteItem).toHaveBeenCalledWith(mockMenuItems[0].id);
    expect(menuService.getAllItems).toHaveBeenCalled();
  });

  it("should filter items by category", async () => {
    render(<MenuManager />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    // Select Sides category
    await userEvent.selectOptions(
      screen.getByLabelText(/Filter by Category/),
      "Sides"
    );

    // Should only show Fries
    expect(screen.queryByText("Burger")).not.toBeInTheDocument();
    expect(screen.getByText("Fries")).toBeInTheDocument();
  });

  it("should search items by name", async () => {
    render(<MenuManager />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    // Search for "Burger"
    await userEvent.type(screen.getByPlaceholderText(/Search/), "Burger");

    // Should only show Burger
    expect(screen.getByText("Burger")).toBeInTheDocument();
    expect(screen.queryByText("Fries")).not.toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    const error = new Error("Failed to fetch menu items");
    menuService.getAllItems.mockRejectedValue(error);

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading menu items/)).toBeInTheDocument();
    });
  });

  it("should validate required fields", async () => {
    render(<MenuManager />);

    // Click add item button
    await userEvent.click(screen.getByText("Add Item"));

    // Try to save without filling required fields
    await userEvent.click(screen.getByText("Save"));

    // Should show validation errors
    expect(screen.getByText(/Name is required/)).toBeInTheDocument();
    expect(screen.getByText(/Price is required/)).toBeInTheDocument();
  });

  describe("MenuManager", () => {
    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();

      // Setup default mock responses
      menuService.getMenuItems.mockResolvedValue([
        {
          id: 1,
          name: "Burger",
          price: 120.99,
          category: "Main",
          available: true,
        },
        {
          id: 2,
          name: "Fries",
          price: 40.99,
          category: "Sides",
          available: true,
        },
      ]);
    });

    describe("Menu Item Display", () => {
      it("should render menu items correctly", async () => {
        render(<MenuManager />);

        await waitFor(() => {
          expect(screen.getByText("Burger")).toBeInTheDocument();
          expect(screen.getByText("₱120.99")).toBeInTheDocument();
          expect(screen.getByText("Fries")).toBeInTheDocument();
          expect(screen.getByText("₱40.99")).toBeInTheDocument();
        });
      });

      it("should display items grouped by category", async () => {
        menuService.getMenuItems.mockResolvedValue([
          {
            id: 1,
            name: "Burger",
            price: 120.99,
            category: "Main",
            available: true,
          },
          {
            id: 2,
            name: "Pizza",
            price: 150.99,
            category: "Main",
            available: true,
          },
          {
            id: 3,
            name: "Fries",
            price: 40.99,
            category: "Sides",
            available: true,
          },
          {
            id: 4,
            name: "Cola",
            price: 25.99,
            category: "Drinks",
            available: true,
          },
        ]);

        render(<MenuManager />);

        await waitFor(() => {
          const mainSection = screen.getByText("Main").closest("section");
          const sidesSection = screen.getByText("Sides").closest("section");
          const drinksSection = screen.getByText("Drinks").closest("section");

          expect(mainSection).toContainElement(screen.getByText("Burger"));
          expect(mainSection).toContainElement(screen.getByText("Pizza"));
          expect(sidesSection).toContainElement(screen.getByText("Fries"));
          expect(drinksSection).toContainElement(screen.getByText("Cola"));
        });
      });
    });

    describe("Add Menu Item", () => {
      it("should add new menu item successfully", async () => {
        const newItem = {
          name: "New Burger",
          price: 130.99,
          category: "Main",
          available: true,
        };

        menuService.addMenuItem.mockResolvedValue({ id: 3, ...newItem });

        render(<MenuManager />);

        // Open add item form
        fireEvent.click(screen.getByText("Add Item"));

        // Fill form
        await userEvent.type(screen.getByLabelText(/name/i), newItem.name);
        await userEvent.type(
          screen.getByLabelText(/price/i),
          newItem.price.toString()
        );
        await userEvent.selectOptions(
          screen.getByLabelText(/category/i),
          newItem.category
        );

        // Submit form
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
          expect(menuService.addMenuItem).toHaveBeenCalledWith(
            expect.objectContaining(newItem)
          );
          expect(screen.getByText(newItem.name)).toBeInTheDocument();
        });
      });

      it("should validate required fields", async () => {
        render(<MenuManager />);

        // Open add item form
        fireEvent.click(screen.getByText("Add Item"));

        // Try to submit empty form
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
          expect(screen.getByText(/name is required/i)).toBeInTheDocument();
          expect(screen.getByText(/price is required/i)).toBeInTheDocument();
          expect(screen.getByText(/category is required/i)).toBeInTheDocument();
        });
      });

      it("should validate price format", async () => {
        render(<MenuManager />);

        // Open add item form
        fireEvent.click(screen.getByText("Add Item"));

        // Enter invalid price
        await userEvent.type(screen.getByLabelText(/price/i), "invalid");

        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
          expect(
            screen.getByText(/price must be a number/i)
          ).toBeInTheDocument();
        });
      });
    });

    describe("Edit Menu Item", () => {
      it("should edit existing menu item", async () => {
        const updatedItem = {
          id: 1,
          name: "Super Burger",
          price: 140.99,
          category: "Main",
          available: true,
        };

        menuService.updateMenuItem.mockResolvedValue(updatedItem);

        render(<MenuManager />);

        // Wait for items to load
        await waitFor(() => {
          expect(screen.getByText("Burger")).toBeInTheDocument();
        });

        // Click edit button
        fireEvent.click(screen.getByTestId("edit-item-1"));

        // Update form fields
        await userEvent.clear(screen.getByLabelText(/name/i));
        await userEvent.type(screen.getByLabelText(/name/i), updatedItem.name);
        await userEvent.clear(screen.getByLabelText(/price/i));
        await userEvent.type(
          screen.getByLabelText(/price/i),
          updatedItem.price.toString()
        );

        // Save changes
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
          expect(menuService.updateMenuItem).toHaveBeenCalledWith(
            updatedItem.id,
            expect.objectContaining({
              name: updatedItem.name,
              price: updatedItem.price,
            })
          );
          expect(screen.getByText(updatedItem.name)).toBeInTheDocument();
        });
      });
    });

    describe("Toggle Item Availability", () => {
      it("should toggle item availability", async () => {
        const item = {
          id: 1,
          name: "Burger",
          price: 120.99,
          category: "Main",
          available: true,
        };

        menuService.updateMenuItem.mockResolvedValue({
          ...item,
          available: false,
        });

        render(<MenuManager />);

        // Wait for items to load
        await waitFor(() => {
          expect(screen.getByText("Burger")).toBeInTheDocument();
        });

        // Toggle availability
        fireEvent.click(screen.getByTestId("toggle-availability-1"));

        await waitFor(() => {
          expect(menuService.updateMenuItem).toHaveBeenCalledWith(
            item.id,
            expect.objectContaining({ available: false })
          );
        });

        // Visual indicator should change
        expect(screen.getByTestId("item-1")).toHaveClass("unavailable");
      });
    });

    describe("Delete Menu Item", () => {
      it("should delete menu item after confirmation", async () => {
        render(<MenuManager />);

        // Wait for items to load
        await waitFor(() => {
          expect(screen.getByText("Burger")).toBeInTheDocument();
        });

        // Click delete button
        fireEvent.click(screen.getByTestId("delete-item-1"));

        // Confirm deletion in dialog
        fireEvent.click(screen.getByText("Confirm Delete"));

        await waitFor(() => {
          expect(menuService.deleteMenuItem).toHaveBeenCalledWith(1);
          expect(screen.queryByText("Burger")).not.toBeInTheDocument();
        });
      });

      it("should not delete item if cancelled", async () => {
        render(<MenuManager />);

        // Wait for items to load
        await waitFor(() => {
          expect(screen.getByText("Burger")).toBeInTheDocument();
        });

        // Click delete button
        fireEvent.click(screen.getByTestId("delete-item-1"));

        // Cancel deletion
        fireEvent.click(screen.getByText("Cancel"));

        expect(menuService.deleteMenuItem).not.toHaveBeenCalled();
        expect(screen.getByText("Burger")).toBeInTheDocument();
      });
    });

    describe("Error Handling", () => {
      it("should display error when loading menu items fails", async () => {
        const error = new Error("Failed to load menu items");
        menuService.getMenuItems.mockRejectedValue(error);

        render(<MenuManager />);

        await waitFor(() => {
          expect(
            screen.getByText(/error loading menu items/i)
          ).toBeInTheDocument();
        });
      });

      it("should display error when adding item fails", async () => {
        const error = new Error("Failed to add item");
        menuService.addMenuItem.mockRejectedValue(error);

        render(<MenuManager />);

        // Open add item form
        fireEvent.click(screen.getByText("Add Item"));

        // Fill form
        await userEvent.type(screen.getByLabelText(/name/i), "New Item");
        await userEvent.type(screen.getByLabelText(/price/i), "100");
        await userEvent.selectOptions(
          screen.getByLabelText(/category/i),
          "Main"
        );

        // Submit form
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
          expect(
            screen.getByText(/error adding menu item/i)
          ).toBeInTheDocument();
        });
      });
    });

    describe("Price Formatting", () => {
      it("should format prices with PHP currency symbol", async () => {
        render(<MenuManager />);

        await waitFor(() => {
          expect(screen.getByText("₱120.99")).toBeInTheDocument();
          expect(screen.getByText("₱40.99")).toBeInTheDocument();
        });
      });

      it("should handle decimal places correctly", async () => {
        menuService.getMenuItems.mockResolvedValue([
          {
            id: 1,
            name: "Item 1",
            price: 100,
            category: "Main",
            available: true,
          },
          {
            id: 2,
            name: "Item 2",
            price: 99.9,
            category: "Main",
            available: true,
          },
          {
            id: 3,
            name: "Item 3",
            price: 199.99,
            category: "Main",
            available: true,
          },
        ]);

        render(<MenuManager />);

        await waitFor(() => {
          expect(screen.getByText("₱100.00")).toBeInTheDocument();
          expect(screen.getByText("₱99.90")).toBeInTheDocument();
          expect(screen.getByText("₱199.99")).toBeInTheDocument();
        });
      });
    });
  });
});
