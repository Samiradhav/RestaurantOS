import { create } from 'zustand'
import { supabaseDataService } from './supabase-data-service'

// Enhanced cache system for better performance
interface CacheData {
  data: {
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
  }
  timestamp: number
  userId: string | null
}

let dashboardCache: CacheData | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 50 // Maximum number of cached items to prevent memory leaks

// Simple LRU cache implementation
const cacheMap = new Map<string, CacheData>()

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
  lastUpdated: number | null
  
  // Actions
  loadDashboardData: (forceRefresh?: boolean) => Promise<void>
  refreshData: () => Promise<void>
  clearCache: () => void
  loadMoreOrders: () => Promise<void>
  loadMoreCustomers: () => Promise<void>
}

// Optimized data processing functions
const calculateStats = (orders: any[], customers: any[], inventory: any[]) => {
  const today = new Date().toISOString().split('T')[0]
  
  // Calculate basic stats
  const totalSales = orders.reduce((acc, order) => acc + order.total_amount, 0)
  const totalCustomers = customers.length
  const pendingOrders = orders.filter(order => 
    ['pending', 'confirmed', 'preparing'].includes(order.status)
  ).length
  
  // Today's orders
  const todayOrders = orders.filter(order => 
    order.created_at.split('T')[0] === today
  ).length

  // Monthly revenue
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyRevenue = orders
    .filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate.getMonth() === currentMonth && 
             orderDate.getFullYear() === currentYear
    })
    .reduce((acc, order) => acc + order.total_amount, 0)

  // Average order value
  const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0

  // Top selling item calculation (optimized)
  const itemCounts: Record<string, number> = {}
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (item && item.name && typeof item.quantity === 'number') {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
        }
      })
    }
  })
  
  const topItem = Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A"

  // Low stock items count
  const lowStockItems = inventory.filter((item: any) => 
    item && typeof item.current_stock === 'number' && 
    typeof item.min_stock_level === 'number' &&
    item.current_stock < item.min_stock_level
  ).length

  return {
    totalSales,
    totalCustomers,
    pendingOrders,
    lowStockItems,
    todayOrders,
    monthlyRevenue,
    topSellingItem: topItem,
    averageOrderValue
  }
}

// Cache management functions
const getCacheKey = (userId: string | null) => `dashboard_${userId || 'anonymous'}`
const setCache = (userId: string | null, data: any) => {
  const key = getCacheKey(userId)
  const cacheData: CacheData = {
    data,
    timestamp: Date.now(),
    userId
  }
  
  // Implement simple LRU by removing oldest entries if cache is full
  if (cacheMap.size >= MAX_CACHE_SIZE) {
    const firstKey = cacheMap.keys().next().value
    if (firstKey) {
      cacheMap.delete(firstKey)
    }
  }
  
  cacheMap.set(key, cacheData)
}

const getCache = (userId: string | null): CacheData | null => {
  const key = getCacheKey(userId)
  const cached = cacheMap.get(key)
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached
  }
  
  // Remove expired cache
  if (cached) {
    cacheMap.delete(key)
  }
  
  return null
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
  lastUpdated: null,

  clearCache: () => {
    cacheMap.clear()
  },

  loadDashboardData: async (forceRefresh = false) => {
    const currentUserId = await supabaseDataService.getCurrentUser()
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cached = getCache(currentUserId)
      if (cached) {
        set({
          ...cached.data,
          loading: false,
          lastUpdated: cached.timestamp
        })
        return
      }
    }

    set({ loading: true, error: null })
    
    try {
      // Load data with optimized queries
      const summary = await supabaseDataService.getDashboardSummary()
      
      if (!summary) {
        throw new Error('Failed to load dashboard data')
      }

      // Filter low stock items efficiently
      const lowStockItems = summary.inventory?.filter((item: any) => 
        item && typeof item.current_stock === 'number' && 
        typeof item.min_stock_level === 'number' &&
        item.current_stock < item.min_stock_level
      ) || []

      // Calculate stats using optimized function
      const stats = calculateStats(summary.orders || [], summary.customers || [], summary.inventory || [])

      const dashboardData = {
        orders: summary.orders || [],
        customers: summary.customers || [],
        inventory: lowStockItems,
        menuItems: [], // Not needed for dashboard
        stats,
        loading: false,
        lastUpdated: Date.now()
      }

      // Update state
      set(dashboardData)
      
      // Cache the data
      setCache(currentUserId, dashboardData)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load dashboard data', 
        loading: false 
      })
    }
  },

  refreshData: async () => {
    await get().loadDashboardData(true) // Force refresh
  },

  loadMoreOrders: async () => {
    // Implementation for pagination if needed
    // This would load additional orders beyond the initial dashboard load
  },

  loadMoreCustomers: async () => {
    // Implementation for pagination if needed
    // This would load additional customers beyond the initial dashboard load
  }
}))

// Auto-refresh mechanism
let refreshTimer: NodeJS.Timeout | null = null

export const startAutoRefresh = (intervalMinutes: number = 5) => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  refreshTimer = setInterval(() => {
    useDashboardStore.getState().refreshData()
  }, intervalMinutes * 60 * 1000)
}

export const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Cleanup function
export const cleanupDashboardStore = () => {
  stopAutoRefresh()
  useDashboardStore.getState().clearCache()
}