import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Currency = "USD" | "INR"  // Only USD and INR now

interface CurrencyState {
  currency: Currency
  exchangeRates: Record<Currency, number>
  setCurrency: (currency: Currency) => void
  convertPrice: (price: number, fromCurrency?: Currency) => string
  formatPrice: (price: number) => string
  getSymbol: (currency?: Currency) => string
}

const exchangeRates: Record<Currency, number> = {
  USD: 1,
  INR: 83.12,
  EUR: 0.85,
  GBP: 0.73,
}

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      exchangeRates,
      setCurrency: (currency: Currency) => set({ currency }),
      convertPrice: (price: number, fromCurrency: Currency = "USD") => {
        const { currency: toCurrency, exchangeRates } = get()
        const usdPrice = price / exchangeRates[fromCurrency]
        const convertedPrice = usdPrice * exchangeRates[toCurrency]
        const symbol = currencySymbols[toCurrency]

        if (toCurrency === "INR") {
          return `${symbol}${convertedPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
        }

        return `${symbol}${convertedPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      formatPrice: (price: number) => {
        const { currency } = get()
        const symbol = currencySymbols[currency]

        if (currency === "INR") {
          return `${symbol}${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
        }

        return `${symbol}${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      getSymbol: (currency?: Currency) => {
        const curr = currency || get().currency
        return currencySymbols[curr]
      },
    }),
    {
      name: "currency-storage",
    },
  ),
)
