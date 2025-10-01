import { create } from 'zustand'
import { supabaseDataService } from './supabase-data-service'

interface DashboardState {
  orders: any[]
  customers: any[]
  inventory: any[]
  menuItems: any[]
  stats: {
    totalSales: number
    totalCustomers: number
    pendingOrders: number
    lowStockItems: number
    todayOrders: number
    monthlyRevenue: number
    topSellingItem: string
    averageOrderValue: number
  }
  loading: boolean
  error: string | null
  
  // Actions
  loadDashboardData: () => Promise<void>
  refreshData: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  orders: [],
  customers: [],
  inventory: [],
  menuItems: [],
  stats: {
    totalSales: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    todayOrders: 0,
    monthlyRevenue: 0,
    topSellingItem: "N/A",
    averageOrderValue: 0,
  },
  loading: false,
  error: null,

  loadDashboardData: async () => {
    set({ loading: true, error: null })
    
    try {
      const summary = await supabaseDataService.getDashboardSummary()
      
      // Filter low stock items (current_stock < min_stock_level)
      const lowStockItems = summary.inventory?.filter((item: any) => 
        item.current_stock < item.min_stock_level
      ) || []

      // Calculate additional stats
      const today = new Date().toISOString().split('T')[0]
      const todayOrders = summary.orders.filter(order => 
        order.created_at.split('T')[0] === today
      ).length

      const monthlyRevenue = summary.orders
        .filter(order => {
          const orderDate = new Date(order.created_at)
          const now = new Date()
          return orderDate.getMonth() === now.getMonth() && 
                 orderDate.getFullYear() === now.getFullYear()
        })
        .reduce((acc, order) => acc + order.total_amount, 0)

      const averageOrderValue = summary.orders.length > 0 
        ? summary.stats.totalSales / summary.orders.length 
        : 0

      // Calculate top selling item
      const itemCounts: Record<string, number> = {}
      summary.orders.forEach(order => {
        order.items.forEach((item: any) => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
        })
      })
      const topItem = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A"

      set({
        orders: summary.orders,
        customers: summary.customers,
        inventory: lowStockItems,
        stats: {
          ...summary.stats,
          lowStockItems: lowStockItems.length,
          todayOrders,
          monthlyRevenue,
          averageOrderValue,
          topSellingItem: topItem,
        },
        loading: false
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      set({ error: 'Failed to load dashboard data', loading: false })
    }
  },

  refreshData: async () => {
    await get().loadDashboardData()
  }
}))
