import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import OrderCard from "../../components/OrderCard";
import { CurrencyContext } from "../../App";
import { ThemeProvider, createTheme } from "@mui/material";
import { mockCurrencyContext } from "../../setupTests.js";

const theme = createTheme({
  palette: {
    orderStatus: {
      new: "#ff4444",
      accepted: "#ff8c00",
      finished: "#00C853",
      completed: "#2196F3",
      voided: "#757575",
    },
  },
});

const defaultOrder = {
  id: 1,
  status: "new",
  customer_name: "John Doe",
  customer_phone: "123-456-7890",
  delivery_address: "123 Test St",
  total_price: 100.0,
  created_at: "2025-05-24T10:00:00Z",
  items: [
    { name: "Burger", price: 50.0, quantity: 1 },
    { name: "Fries", price: 25.0, quantity: 2 },
  ],
};

const renderOrderCard = (props = {}) => {
  const defaultProps = {
    order: defaultOrder,
    onStatusChange: vi.fn(),
    onAccept: vi.fn(),
    onVoid: vi.fn(),
  };

  const mergedProps = {
    ...defaultProps,
    ...props,
    order: { ...defaultOrder, ...props.order },
  };

  return render(
    <CurrencyContext.Provider value={mockCurrencyContext}>
      <ThemeProvider theme={theme}>
        <OrderCard {...mergedProps} />
      </ThemeProvider>
    </CurrencyContext.Provider>
  );
};

describe("OrderCard", () => {
  it("renders order details correctly", () => {
    renderOrderCard();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("123-456-7890")).toBeInTheDocument();
    expect(screen.getByText("📍 123 Test St")).toBeInTheDocument();
    expect(screen.getByText("₱ 100.00")).toBeInTheDocument();
  });

  it("renders order items correctly", () => {
    renderOrderCard();
    expect(screen.getByText("Burger")).toBeInTheDocument();
    expect(screen.getByText("Fries")).toBeInTheDocument();
    expect(screen.getByText("x2")).toBeInTheDocument();
  });

  it("calls onAccept when Accept Order button is clicked", () => {
    const onAccept = vi.fn();
    renderOrderCard({ onAccept });
    fireEvent.click(screen.getByText("Accept Order"));
    expect(onAccept).toHaveBeenCalled();
  });

  it("calls onVoid when Void button is clicked", () => {
    const onVoid = vi.fn();
    renderOrderCard({ onVoid });
    fireEvent.click(screen.getByText("Void"));
    expect(onVoid).toHaveBeenCalled();
  });

  it("calls onStatusChange with correct status when status button is clicked", () => {
    const onStatusChange = vi.fn();
    renderOrderCard({
      onStatusChange,
      order: {
        status: "accepted",
      },
    });
    fireEvent.click(screen.getByText("Mark Finished"));
    expect(onStatusChange).toHaveBeenCalledWith(1, "finished");
  });

  it("displays special instructions when present", () => {
    renderOrderCard({
      order: {
        ...renderOrderCard.defaultProps?.order,
        special_instructions: "Extra spicy please",
      },
    });
    expect(screen.getByText("Extra spicy please")).toBeInTheDocument();
  });

  it("does not show status change buttons for voided orders", () => {
    renderOrderCard({
      order: {
        status: "voided",
      },
    });
    expect(screen.queryByText("Mark Finished")).not.toBeInTheDocument();
    expect(screen.queryByText("Mark Completed")).not.toBeInTheDocument();
  });
});
