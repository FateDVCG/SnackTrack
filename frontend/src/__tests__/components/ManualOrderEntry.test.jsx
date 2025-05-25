import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManualOrderEntry from "../ManualOrderEntry";
import { CurrencyContext } from "../../App";
import { menuService } from "../../services/menuService";

// Mock menuService
vi.mock("../../services/menuService", () => ({
  menuService: {
    getMenuItems: vi.fn(),
  },
}));

describe("ManualOrderEntry", () => {
  const mockOnOrderSubmit = vi.fn();
  const mockOnClose = vi.fn();

  const mockMenuItems = [
    { id: 1, name: "Burger", price: 120.99 },
    { id: 2, name: "Fries", price: 40.99 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    menuService.getMenuItems.mockResolvedValue(mockMenuItems);
  });

  const renderComponent = (currency = "₱") => {
    return render(
      <CurrencyContext.Provider value={{ currency }}>
        <ManualOrderEntry
          onOrderSubmit={mockOnOrderSubmit}
          onClose={mockOnClose}
        />
      </CurrencyContext.Provider>
    );
  };

  it("should render form fields correctly", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Customer Phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Delivery Address/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Special Instructions/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Add Menu Item/i)).toBeInTheDocument();
    });
  });

  it("should calculate total price correctly", async () => {
    renderComponent();

    await waitFor(() => {
      expect(menuService.getMenuItems).toHaveBeenCalled();
    });

    // Fill customer info
    await userEvent.type(screen.getByLabelText(/Customer Name/i), "John Doe");
    await userEvent.type(
      screen.getByLabelText(/Customer Phone/i),
      "1234567890"
    );
    await userEvent.type(
      screen.getByLabelText(/Delivery Address/i),
      "123 Test St"
    );

    // Add items
    const itemInput = screen.getByLabelText(/Add Menu Item/i);
    await userEvent.type(itemInput, "Burger");
    await userEvent.click(screen.getByText(/Burger - ₱120.99/i));

    await userEvent.type(itemInput, "Fries");
    await userEvent.click(screen.getByText(/Fries - ₱40.99/i));

    // Check total price
    expect(screen.getByText("Total: ₱161.98")).toBeInTheDocument();
  });

  it("should submit order with correct data", async () => {
    renderComponent();

    await waitFor(() => {
      expect(menuService.getMenuItems).toHaveBeenCalled();
    });

    // Fill form
    await userEvent.type(screen.getByLabelText(/Customer Name/i), "John Doe");
    await userEvent.type(
      screen.getByLabelText(/Customer Phone/i),
      "1234567890"
    );
    await userEvent.type(
      screen.getByLabelText(/Delivery Address/i),
      "123 Test St"
    );
    await userEvent.type(
      screen.getByLabelText(/Special Instructions/i),
      "Extra sauce"
    );

    // Add an item
    const itemInput = screen.getByLabelText(/Add Menu Item/i);
    await userEvent.type(itemInput, "Burger");
    await userEvent.click(screen.getByText(/Burger - ₱120.99/i));

    // Submit form
    await userEvent.click(screen.getByText(/Create Order/i));

    // Verify submission
    expect(mockOnOrderSubmit).toHaveBeenCalledWith({
      customerName: "John Doe",
      customerPhone: "1234567890",
      type: "Phone",
      items: [{ id: 1, name: "Burger", price: 120.99, quantity: 1 }],
      totalPrice: 120.99,
      deliveryAddress: "123 Test St",
      specialInstructions: "Extra sauce",
      status: "new",
    });
  });

  it("should disable submit button when no items selected", () => {
    renderComponent();
    const submitButton = screen.getByText(/Create Order/i);
    expect(submitButton).toBeDisabled();
  });
});
