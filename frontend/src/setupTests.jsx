import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { CurrencyContext } from './App';

// Mock services
vi.mock('./services/analyticsService', () => ({
  analyticsService: {
    getAnalytics: vi.fn(),
    clearCache: vi.fn(), // Add stub for clearCache
  },
}));

vi.mock('./services/menuService', () => ({
  menuService: {
    getMenuItems: vi.fn().mockResolvedValue([]), // Return empty array by default
    createMenuItem: vi.fn(),
    updateMenuItem: vi.fn(),
    deleteMenuItem: vi.fn(),
  },
}));

vi.mock('./services/orderService', () => ({
  orderService: {
    getOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
    createOrder: vi.fn(),
    convertCurrency: vi.fn(), // Add stub for convertCurrency
  },
}));

// Mock currency context value
export const mockCurrencyContext = {
  currency: '₱',
  setCurrency: vi.fn(),
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
export * from '@testing-library/react';

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
