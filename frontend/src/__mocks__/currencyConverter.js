// Mock implementation for CurrencyConverter
class CurrencyConverter {
  constructor() {
    this.rates = {
      PHP: 1,
      USD: 0.02,
      EUR: 0.017,
      JPY: 2.2,
      SGD: 0.025
    };
    this.initialized = true;
    this.initialize = jest.fn().mockResolvedValue(undefined);
    this.updateRates = jest.fn().mockResolvedValue(undefined);
  }

  isInitialized() {
    return this.initialized;
  }

  convert(amount, from = "PHP", to = "USD") {
    if (!this.rates[from]) throw new Error(`Unsupported currency: ${from}`);
    if (!this.rates[to]) throw new Error(`Unsupported currency: ${to}`);
    
    if (from === to) return amount;
    if (amount < 0) return -this.convert(Math.abs(amount), from, to);
    if (amount === 0) return 0;
    
    const amountInPHP = from === "PHP" ? amount : amount / this.rates[from];
    const converted = to === "PHP" ? amountInPHP : amountInPHP * this.rates[to];
    
    return to === "JPY" ? Math.round(converted) : Math.round(converted * 100) / 100;
  }

  format(amount, currency) {
    if (!this.rates[currency]) throw new Error(`Unsupported currency: ${currency}`);
    
    const abs = Math.abs(amount);
    let formatted;
    
    switch (currency) {
      case "USD":
        formatted = `$${abs.toFixed(2)}`;
        break;
      case "PHP":
        formatted = `₱${abs.toFixed(2)}`;
        break;
      case "EUR":
        formatted = `€${abs.toFixed(2)}`;
        break;
      case "JPY":
        formatted = `¥${Math.round(abs)}`;
        break;
      case "SGD":
        formatted = `S$${abs.toFixed(2)}`;
        break;
      default:
        formatted = `${abs}`;
    }
    
    return amount < 0 ? `-${formatted}` : formatted;
  }
}

export default CurrencyConverter;