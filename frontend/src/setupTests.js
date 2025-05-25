import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { CurrencyContext } from "./App";

// Mock currency context value
export const mockCurrencyContext = {
  currency: "PHP",
  setCurrency: vi.fn(),
  formatCurrency: vi.fn((amount) => `₱${parseFloat(amount).toFixed(2)}`),
  convertCurrency: vi.fn((amount) => amount)
};

// Custom render that wraps components with necessary providers
const customRender = (ui, options = {}) => {
  return render(
    <CurrencyContext.Provider value={mockCurrencyContext}>
      {ui}
    </CurrencyContext.Provider>,
    options
  );
};

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Mock ResizeObserver for jsdom (needed by recharts/MUI)
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

// Mock Notification as a constructor for tests
beforeAll(() => {
  global.Notification = global.Notification || function () {
    this.close = vi.fn();
  };
  global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
  global.Notification.permission = 'granted';
});
