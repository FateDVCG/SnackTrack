import { describe, it, expect, vi, beforeEach } from "vitest";
import { CurrencyConverter } from "../currencyConverter";

describe("CurrencyConverter", () => {
  let currencyConverter;

  const mockRates = {
    PHP: 1,
    USD: 0.02,
    EUR: 0.017,
    JPY: 2.2,
    SGD: 0.025,
  };

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: mockRates }),
    });
    currencyConverter = new CurrencyConverter();
  });

  describe("Initialization", () => {
    it("should load exchange rates on initialization", async () => {
      await currencyConverter.initialize();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/exchange-rates"),
        expect.any(Object)
      );
    });

    it("should handle initialization errors gracefully", async () => {
      global.fetch.mockRejectedValueOnce(new Error("API Error"));

      await expect(currencyConverter.initialize()).rejects.toThrow("API Error");
      expect(currencyConverter.isInitialized()).toBe(false);
    });
  });

  describe("Currency Conversion", () => {
    beforeEach(async () => {
      await currencyConverter.initialize();
    });

    it("should convert PHP to USD correctly", () => {
      const phpAmount = 1000;
      const usdAmount = currencyConverter.convert(phpAmount, "PHP", "USD");
      expect(usdAmount).toBe(20); // 1000 * 0.02
    });

    it("should convert USD to PHP correctly", () => {
      const usdAmount = 20;
      const phpAmount = currencyConverter.convert(usdAmount, "USD", "PHP");
      expect(phpAmount).toBe(1000); // 20 / 0.02
    });

    it("should handle conversion between any supported currencies", () => {
      const eurAmount = 100;
      const jpyAmount = currencyConverter.convert(eurAmount, "EUR", "JPY");
      // EUR -> PHP -> JPY
      // 100 / 0.017 = PHP amount
      // PHP amount * 2.2 = JPY amount
      expect(jpyAmount).toBeCloseTo(12941.18, 2);
    });

    it("should return same amount when converting to same currency", () => {
      const amount = 1000;
      const converted = currencyConverter.convert(amount, "PHP", "PHP");
      expect(converted).toBe(amount);
    });

    it("should handle decimal precision correctly", () => {
      const phpAmount = 99.99;
      const usdAmount = currencyConverter.convert(phpAmount, "PHP", "USD");
      expect(usdAmount).toBeCloseTo(2, 2);
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      await currencyConverter.initialize();
    });

    it("should throw error for unsupported source currency", () => {
      expect(() => {
        currencyConverter.convert(100, "XXX", "USD");
      }).toThrow("Unsupported currency: XXX");
    });

    it("should throw error for unsupported target currency", () => {
      expect(() => {
        currencyConverter.convert(100, "USD", "XXX");
      }).toThrow("Unsupported currency: XXX");
    });

    it("should handle negative amounts", () => {
      const phpAmount = -1000;
      const usdAmount = currencyConverter.convert(phpAmount, "PHP", "USD");
      expect(usdAmount).toBe(-20);
    });

    it("should handle zero amounts", () => {
      const phpAmount = 0;
      const usdAmount = currencyConverter.convert(phpAmount, "PHP", "USD");
      expect(usdAmount).toBe(0);
    });
  });

  describe("Rate Updates", () => {
    beforeEach(async () => {
      await currencyConverter.initialize();
    });

    it("should update rates periodically", async () => {
      vi.useFakeTimers();

      const newRates = { ...mockRates, USD: 0.021 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rates: newRates }),
      });

      // Advance time by 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);
      await vi.runAllTimersAsync();

      // Check if rates were updated
      const converted = currencyConverter.convert(1000, "PHP", "USD");
      expect(converted).toBe(21); // Using new rate

      vi.useRealTimers();
    });

    it("should handle rate update failures", async () => {
      vi.useFakeTimers();

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      global.fetch.mockRejectedValueOnce(new Error("Update failed"));

      // Advance time by 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error updating exchange rates:",
        expect.any(Error)
      );

      // Should still work with old rates
      const converted = currencyConverter.convert(1000, "PHP", "USD");
      expect(converted).toBe(20);

      vi.useRealTimers();
      consoleSpy.mockRestore();
    });
  });

  describe("Format Display", () => {
    beforeEach(async () => {
      await currencyConverter.initialize();
    });

    it("should format currency display correctly", () => {
      expect(currencyConverter.format(1000, "USD")).toBe("$1,000.00");
      expect(currencyConverter.format(1000, "PHP")).toBe("₱1,000.00");
      expect(currencyConverter.format(1000, "EUR")).toBe("€1,000.00");
      expect(currencyConverter.format(1000, "JPY")).toBe("¥1,000");
    });

    it("should handle negative amounts in formatting", () => {
      expect(currencyConverter.format(-1000, "USD")).toBe("-$1,000.00");
    });

    it("should handle decimal places appropriately per currency", () => {
      expect(currencyConverter.format(1000.5, "JPY")).toBe("¥1,001");
      expect(currencyConverter.format(1000.5, "USD")).toBe("$1,000.50");
    });

    it("should throw error for unsupported currency in formatting", () => {
      expect(() => {
        currencyConverter.format(1000, "XXX");
      }).toThrow("Unsupported currency: XXX");
    });
  });
});
