"use client"

import {
  DollarSign,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Star,
  Package,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { FloatingChatbot } from "@/components/chatbot/floating-chatbot"
import { useCurrency } from "@/lib/currency-store"
import { supabaseDataService, type Order, type Customer, type MenuItem, type InventoryItem } from "@/lib/supabase-data-service"
import React from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"

// Local interfaces for dashboard calculations
interface DashboardStats {
  totalSales: number
  totalCustomers: number
  pendingOrders: number
  lowStockItems: number
  todayOrders: number
  monthlyRevenue: number
  topSellingItem: string
  averageOrderValue: number
}

interface DashboardOrder {
  id: string
  orderNo: string
  customer: string
  items: string[]
  total: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  time: string
  date: string
}

const InventoryForm = React.memo(({
  formData,
  onFormDataChange,
  onSubmit,
  submitText,
  onCancel,
}: {
  formData: any
  onFormDataChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitText: string
  onCancel: () => void
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Item Name</Label>
        <Input
          id="name"
          placeholder="Enter item name"
          value={formData.name}
          onChange={(e) => onFormDataChange("name", e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          placeholder="Enter category"
          value={formData.category}
          onChange={(e) => onFormDataChange("category", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currentStock">Current Stock</Label>
        <Input
          id="currentStock"
          type="number"
          placeholder="Enter current stock"
          value={formData.currentStock}
          onChange={(e) => onFormDataChange("currentStock", e.target.value)}
          required
          min="0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minStock">Min Stock Level</Label>
        <Input
          id="minStock"
          type="number"
          placeholder="Enter min stock level"
          value={formData.minStock}
          onChange={(e) => onFormDataChange("minStock", e.target.value)}
          required
          min="0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxStock">Max Stock Level (Optional)</Label>
        <Input
          id="maxStock"
          type="number"
          placeholder="Enter max stock level"
          value={formData.maxStock}
          onChange={(e) => onFormDataChange("maxStock", e.target.value)}
          min="0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">Unit</Label>
        <Input
          id="unit"
          placeholder="Enter unit (e.g., kg, pcs, liters)"
          value={formData.unit}
          onChange={(e) => onFormDataChange("unit", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supplier">Supplier (Optional)</Label>
        <Input
          id="supplier"
          placeholder="Enter supplier"
          value={formData.supplier}
          onChange={(e) => onFormDataChange("supplier", e.target.value)}
        />
      </div>
    </div>
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button type="submit">{submitText}</Button>
    </div>
  </form>
))

export default function DashboardPage() {
  const { toast: shadcnToast } = useToast()
  const { convertPrice } = useCurrency()

  const [isClient, setIsClient] = useState(false)

  // ✅ Fix: Use Supabase as single source of truth for all data
    // ✅ Fix: Use Supabase as single source of truth for all data
    const [orders, setOrders] = useState<Order[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dataError, setDataError] = useState<string | null>(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    unit: "",
    supplier: "",
  })

  // ✅ Fix: Load all data from Supabase consistently
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true)
        setDataError(null)

        // Load all data in parallel for better performance
        const [ordersData, customersData, menuItemsData, inventoryData] = await Promise.all([
          supabaseDataService.getOrders(),
          supabaseDataService.getCustomers(),
          supabaseDataService.getMenuItems(),
          supabaseDataService.getInventoryItems()
        ])

        setOrders(ordersData)
        setCustomers(customersData)
        setMenuItems(menuItemsData)
        setInventory(inventoryData)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setDataError("Failed to load dashboard data. Please refresh the page.")
        toast.error("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [])

    // ✅ Fix: Only render framer-motion components after hydration
    useEffect(() => {
      setIsClient(true)
    }, [])

    // ✅ Fix: Map Supabase orders to dashboard format
    const dashboardOrders = useMemo((): DashboardOrder[] => {
      return orders.map(order => {
        const customer = customers.find(c => c.id === order.customer_id)
        const orderDate = new Date(order.created_at)
        
        return {
          id: order.id,
          orderNo: order.order_number,
          customer: customer?.name || "Unknown Customer",
          items: order.items.map(item => `${item.name} (${item.quantity})`),
          total: order.total_amount,
          status: order.status,
          time: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: orderDate.toISOString().split('T')[0]
        }
      })
    }, [orders, customers])

  // ✅ Fix: Calculate stats with proper data validation and error handling
  const stats = useMemo((): DashboardStats => {
    try {
      // Total sales
      const totalSales = orders.reduce((acc, order) => acc + order.total_amount, 0)

      // Total customers
      const totalCustomers = customers.length

      // Pending orders (including confirmed, preparing, ready but not delivered/cancelled)
      const pendingOrders = orders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
      ).length

      // Low stock items
      const lowStockItems = inventory.filter(item => 
        item.current_stock < item.min_stock_level
      ).length

      // Today's orders
      const today = new Date().toISOString().split('T')[0]
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0]
        return orderDate === today
      }).length

      // Monthly revenue
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyRevenue = orders.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate >= monthStart
      }).reduce((acc, order) => acc + order.total_amount, 0)

      // Average order value
      const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0

      // Top selling item
      const itemCounts: Record<string, number> = {}
      orders.forEach(order => {
        order.items.forEach(item => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
        })
      })

      const topItem = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A"

      return {
        totalSales,
        totalCustomers,
        pendingOrders,
        lowStockItems,
        todayOrders,
        monthlyRevenue,
        topSellingItem: topItem,
        averageOrderValue,
      }
    } catch (error) {
      console.error("Error calculating dashboard stats:", error)
      return {
        totalSales: 0,
        totalCustomers: 0,
        pendingOrders: 0,
        lowStockItems: 0,
        todayOrders: 0,
        monthlyRevenue: 0,
        topSellingItem: "N/A",
        averageOrderValue: 0,
      }
    }
  }, [orders, customers, inventory])

  // ✅ Fix: Recent orders with proper mapping
  const recentOrders = useMemo(() => {
    return dashboardOrders.slice(0, 5)
  }, [dashboardOrders])

  // ✅ Fix: Low stock items with proper mapping
  const lowStockItemsList = useMemo(() => {
    return inventory.filter(item => item.current_stock < item.min_stock_level)
  }, [inventory])

  // ✅ Fix: Stat cards with proper formatting and validation
  const statCards = [
    {
      title: "Total Sales",
      value: stats.totalSales > 0 ? convertPrice(stats.totalSales) : "$0.00",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      change: "+8.2%",
      changeType: "positive" as const,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      change: "-2.1%",
      changeType: "negative" as const,
      icon: ShoppingCart,
      color: "text-orange-500",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: stats.lowStockItems > 0 ? "Needs attention" : "All good",
      changeType: stats.lowStockItems > 0 ? "negative" : "positive" as const,
      icon: AlertTriangle,
      color: stats.lowStockItems > 0 ? "text-red-500" : "text-green-500",
    },
  ]

  const handleFormFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      category: "",
      currentStock: "",
      minStock: "",
      maxStock: "",
      unit: "",
      supplier: "",
    })
  }, [])

  const handleAddItem = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        const minStock = Number.parseInt(formData.minStock)
        const currentStock = Number.parseInt(formData.currentStock)
        const maxStockValue = formData.maxStock ? Number.parseInt(formData.maxStock) : minStock * 2

        // Validate that max stock is greater than min stock
        if (maxStockValue <= minStock) {
          toast.error("Max stock level must be greater than min stock level")
          return
        }

        const created = await supabaseDataService.createInventoryItem({
          name: formData.name,
          category: formData.category,
          current_stock: currentStock,
          min_stock_level: minStock,
          max_stock_level: maxStockValue,
          unit: formData.unit,
          supplier: formData.supplier || undefined,
        })

        if (created) {
          setInventory((prev) => [...prev, created])
          setIsAddModalOpen(false)
          resetForm()
          toast.success("Inventory item added successfully")
        }
      } catch (error) {
        console.error("Error adding inventory item:", error)
        toast.error("Failed to add inventory item")
      }
    },
    [formData, resetForm],
  )

  const handleCancel = useCallback(() => {
    setIsAddModalOpen(false)
    resetForm()
  }, [resetForm])

  if (dataError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground mb-4">{dataError}</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at your restaurant.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Calendar className="h-4 w-4" />
            Today
          </Button>
          <Button className="gap-2" onClick={() => (window.location.href = "/dashboard/reports")}>
            <TrendingUp className="h-4 w-4" />
            View Reports
          </Button>
        </div>
      </motion.div>

           {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeleton for stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                <div className="h-3 w-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={
                        stat.changeType === "positive" ? "text-green-500" : "text-red-500"
                      }
                    >
                      {stat.change}
                    </span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

           {/* Main Content Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading orders...</span>
                </div>
              ) : dashboardOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-foreground">{order.orderNo}</div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              order.status === "delivered" || order.status === "cancelled"
                                ? "bg-green-500/20 text-green-500"
                                : order.status === "preparing" || order.status === "ready"
                                ? "bg-orange-500/20 text-orange-500"
                                : "bg-blue-500/20 text-blue-500"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">{order.customer}</div>
                        <div className="text-xs text-muted-foreground">{order.items.join(", ")}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">
                          {convertPrice(order.total)}
                        </div>
                        <div className="text-xs text-muted-foreground">{order.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </motion.div>

               {/* Quick Stats & Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Orders Today</span>
                <span className="font-medium text-foreground">{stats.todayOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Order</span>
                <span className="font-medium text-foreground">
                  {stats.averageOrderValue > 0 ? convertPrice(stats.averageOrderValue) : "$0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Top Selling</span>
                <span className="font-medium text-foreground">{stats.topSellingItem}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <span className="font-medium text-primary">
                  {convertPrice(stats.monthlyRevenue)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : lowStockItemsList.length === 0 ? (
                <div className="text-center py-4 text-green-600">
                  All items are well stocked! 🎉
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItemsList.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center justify-between p-2 bg-orange-500/10 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-foreground text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-orange-500">
                          {item.current_stock} {item.unit} left
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Min: {item.min_stock_level} {item.unit}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
                Restock Items
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => (window.location.href = "/dashboard/orders")}
              >
                <ShoppingCart className="h-4 w-4" />
                New Order
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => (window.location.href = "/dashboard/customers")}
              >
                <Users className="h-4 w-4" />
                Add Customer
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => (window.location.href = "/dashboard/menu")}
              >
                <Package className="h-4 w-4" />
                Add Menu Item
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Package className="h-4 w-4" />
                Add Inventory
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCancel}
        title="Add Inventory Item"
      >
        <InventoryForm
          formData={formData}
          onFormDataChange={handleFormFieldChange}
          onSubmit={handleAddItem}
          submitText="Add Item"
          onCancel={handleCancel}
        />
      </Modal>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  )
}