import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Currency = "INR"  // Only INR now

interface CurrencyState {
  currency: Currency
  convertPrice: (price: number) => string
  formatPrice: (price: number) => string
  getSymbol: () => string
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "INR",  // Default to INR
      convertPrice: (price: number) => {
        return `₹${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
      },
      formatPrice: (price: number) => {
        return `₹${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
      },
      getSymbol: () => "₹",
    }),
    {
      name: "currency-storage",
    },
  ),
)
