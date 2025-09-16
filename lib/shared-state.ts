import { create } from "zustand"

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  totalOrders: number
  lastOrder: string
}

interface CustomerStore {
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
}

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  stock: number
  description: string
  image: string
}

interface Order {
  id: string
  orderNo: string
  customer: string
  customerId: string
  items: string[]
  total: number
  status: string
  time: string
  date: string
}

interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  supplier: string
  lastRestocked: string
  cost: number
}

interface RestaurantStore {
  customers: Customer[]
  menuItems: MenuItem[]
  orders: Order[]
  inventory: InventoryItem[]
  setCustomers: (customers: Customer[]) => void
  setMenuItems: (menuItems: MenuItem[]) => void
  setOrders: (orders: Order[]) => void
  setInventory: (inventory: InventoryItem[]) => void
  addCustomer: (customer: Customer) => void
  addMenuItem: (menuItem: MenuItem) => void
  addOrder: (order: Order) => void
  addInventoryItem: (item: InventoryItem) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  updateMenuItem: (id: string, menuItem: Partial<MenuItem>) => void
  updateOrder: (id: string, order: Partial<Order>) => void
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void
  deleteCustomer: (id: string) => void
  deleteMenuItem: (id: string) => void
  deleteOrder: (id: string) => void
  deleteInventoryItem: (id: string) => void
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],
  setCustomers: (customers) => set({ customers }),
  addCustomer: (customer) =>
    set((state) => ({
      customers: [...state.customers, customer],
    })),
  updateCustomer: (id, updatedCustomer) =>
    set((state) => ({
      customers: state.customers.map((customer) =>
        customer.id === id ? { ...customer, ...updatedCustomer } : customer,
      ),
    })),
  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((customer) => customer.id !== id),
    })),
}))

export const useRestaurantStore = create<RestaurantStore>((set) => ({
  customers: [],
  menuItems: [],
  orders: [],
  inventory: [],
  setCustomers: (customers) => set({ customers }),
  setMenuItems: (menuItems) => set({ menuItems }),
  setOrders: (orders) => set({ orders }),
  setInventory: (inventory) => set({ inventory }),
  addCustomer: (customer) =>
    set((state) => ({
      customers: [...state.customers, customer],
    })),
  addMenuItem: (menuItem) =>
    set((state) => ({
      menuItems: [...state.menuItems, menuItem],
    })),
  addOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),
  addInventoryItem: (item) =>
    set((state) => ({
      inventory: [...state.inventory, item],
    })),
  updateCustomer: (id, updatedCustomer) =>
    set((state) => ({
      customers: state.customers.map((customer) =>
        customer.id === id ? { ...customer, ...updatedCustomer } : customer,
      ),
    })),
  updateMenuItem: (id, updatedMenuItem) =>
    set((state) => ({
      menuItems: state.menuItems.map((item) => (item.id === id ? { ...item, ...updatedMenuItem } : item)),
    })),
  updateOrder: (id, updatedOrder) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === id ? { ...order, ...updatedOrder } : order)),
    })),
  updateInventoryItem: (id, updatedItem) =>
    set((state) => ({
      inventory: state.inventory.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)),
    })),
  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((customer) => customer.id !== id),
    })),
  deleteMenuItem: (id) =>
    set((state) => ({
      menuItems: state.menuItems.filter((item) => item.id !== id),
    })),
  deleteOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== id),
    })),
  deleteInventoryItem: (id) =>
    set((state) => ({
      inventory: state.inventory.filter((item) => item.id !== id),
    })),
}))

// Sidebar open/close state for mobile navigation
interface SidebarState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useSidebar = create<SidebarState>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}))