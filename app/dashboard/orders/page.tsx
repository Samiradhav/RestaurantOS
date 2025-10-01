"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { supabaseDataService, type Order as SupabaseOrder, type MenuItem, type Customer } from "@/lib/supabase-data-service"
import { useCustomerStore } from "@/lib/shared-state"
import { useCurrency } from "@/lib/currency-store"

// Local interfaces for UI state management
interface LocalOrder {
  id: string // Changed to string to match Supabase
  orderNo: string
  customer: string
  customerId?: string
  items: string[]
  total: number
  status: "pending" | "preparing" | "completed" | "cancelled"
  paymentMethod?: "cash" | "online" | "card"
  payment_status?: "pending" | "paid" | "refunded"
  date: string
  time: string
}

interface LocalOrderItem {
  menuItemId: string // Changed to string to match Supabase
  name: string
  price: number
  quantity: number
}

// Mapping functions between local and Supabase interfaces - moved outside component to avoid recreation

const mapSupabaseOrderToLocal = (supabaseOrder: SupabaseOrder, customers: Customer[]): LocalOrder => {
  const customer = customers.find(c => c.id === supabaseOrder.customer_id)
  return {
    id: supabaseOrder.id,
    orderNo: supabaseOrder.order_number,
    customer: customer?.name || "Unknown Customer",
    customerId: supabaseOrder.customer_id,
    items: supabaseOrder.items.map((item) => `${item.name} (${item.quantity})`),
    total: supabaseOrder.total_amount,
    status: mapSupabaseStatusToLocal(supabaseOrder.status),
    paymentMethod: supabaseOrder.payment_method as "cash" | "online" | "card" | undefined,
    payment_status: supabaseOrder.payment_status,
    date: new Date(supabaseOrder.created_at).toISOString().split('T')[0],
    time: new Date(supabaseOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}

const mapLocalStatusToSupabase = (localStatus: string): SupabaseOrder['status'] => {
  switch (localStatus) {
    case 'pending': return 'pending'
    case 'preparing': return 'preparing'
    case 'completed': return 'ready'
    case 'cancelled': return 'cancelled'
    default: return 'pending'
  }
}

const mapSupabaseStatusToLocal = (supabaseStatus: SupabaseOrder['status']): LocalOrder['status'] => {
  switch (supabaseStatus) {
    case 'pending': return 'pending'
    case 'confirmed': return 'pending'
    case 'preparing': return 'preparing'
    case 'ready': return 'completed'
    case 'delivered': return 'completed'
    case 'cancelled': return 'cancelled'
    default: return 'pending'
  }
}

export default function OrdersPage() {
  const [orderList, setOrderList] = useState<LocalOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<LocalOrder | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orderItems, setOrderItems] = useState<LocalOrderItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedCustomerName, setSelectedCustomerName] = useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "card" | "online">("cash")

  // Add new customer form state
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  })
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)

  // Use currency hook
  const { formatPrice } = useCurrency()

  // Load data on component mount - optimized with error boundaries
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load orders, customers, and menu items in parallel
        const [supabaseOrders, customersData, menuItemsData] = await Promise.all([
          supabaseDataService.getOrders(),
          supabaseDataService.getCustomers(),
          supabaseDataService.getMenuItems()
        ])
        
        setCustomers(customersData)
        setMenuItems(menuItemsData)
        
        // Map orders to local format - moved outside setState for better performance
        const mappedOrders = supabaseOrders.map(order => mapSupabaseOrderToLocal(order, customersData))
        setOrderList(mappedOrders)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Enhanced customer search with multiple filters - memoized
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return customers

    const term = customerSearchTerm.toLowerCase().trim()
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term) ||
      customer.address?.toLowerCase().includes(term)
    )
  }, [customers, customerSearchTerm])

  // Memoized filtered orders - major performance improvement
  const filteredOrders = useMemo(() => {
    return statusFilter === "all" ? orderList : orderList.filter((order) => order.status === statusFilter)
  }, [orderList, statusFilter])

  // Memoized status counts - prevents recalculation on every render
  const statusCounts = useMemo(() => ({
    all: orderList.length,
    pending: orderList.filter((o) => o.status === "pending").length,
    preparing: orderList.filter((o) => o.status === "preparing").length,
    completed: orderList.filter((o) => o.status === "completed").length,
    cancelled: orderList.filter((o) => o.status === "cancelled").length,
  }), [orderList])

  // Memoized icon/color getters
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "preparing": return <AlertCircle className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "cancelled": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "pending": return "bg-blue-500/20 text-blue-500"
      case "preparing": return "bg-orange-500/20 text-orange-500"
      case "completed": return "bg-green-500/20 text-green-500"
      case "cancelled": return "bg-red-500/20 text-red-500"
      default: return "bg-gray-500/20 text-gray-500"
    }
  }, [])

  // Memoized event handlers
  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer.id)
    setSelectedCustomerName(customer.name)
    setCustomerSearchTerm(customer.name)
    setIsCustomerDropdownOpen(false)
  }, [])

  const handleCustomerSearchChange = useCallback((value: string) => {
    setCustomerSearchTerm(value)
    setSelectedCustomer("")
    setSelectedCustomerName("")
    setIsCustomerDropdownOpen(true)
    setIsAddingNewCustomer(false)
  }, [])

  const clearCustomerSelection = useCallback(() => {
    setSelectedCustomer("")
    setSelectedCustomerName("")
    setCustomerSearchTerm("")
    setIsCustomerDropdownOpen(false)
    setIsAddingNewCustomer(false)
    setNewCustomerData({ name: "", email: "", phone: "", address: "" })
  }, [])

  const handleCreateNewCustomer = useCallback(async () => {
    if (!newCustomerData.name.trim()) {
      toast.error("Customer name is required")
      return
    }

    try {
      setIsCreatingCustomer(true)
      
      const customerData = {
        name: newCustomerData.name.trim(),
        email: newCustomerData.email?.trim() || undefined,
        phone: newCustomerData.phone?.trim() || undefined,
        address: newCustomerData.address?.trim() || undefined,
        loyalty_points: 0,
        total_orders: 0,
        last_order_date: undefined,
        notes: undefined
      }

      const createdCustomer = await supabaseDataService.createCustomer(customerData)
      
      if (createdCustomer) {
        setCustomers(prev => [...prev, createdCustomer])
        handleCustomerSelect(createdCustomer)
        setIsAddingNewCustomer(false)
        setNewCustomerData({ name: "", email: "", phone: "", address: "" })
        toast.success("Customer created successfully!")
      } else {
        toast.error("Failed to create customer")
      }
    } catch (error) {
      console.error("Error creating customer:", error)
      toast.error("Failed to create customer")
    } finally {
      setIsCreatingCustomer(false)
    }
  }, [newCustomerData, handleCustomerSelect])

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: LocalOrder["status"]) => {
    try {
      const supabaseStatus = mapLocalStatusToSupabase(newStatus)
      const success = await supabaseDataService.updateOrder(orderId, { status: supabaseStatus })
      
      if (success) {
        setOrderList((prev) => prev.map((order) => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
        toast.success(`Order status updated to ${newStatus}`)
      } else {
        toast.error("Failed to update order status")
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast.error("Failed to update order status")
    }
  }, [])

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      const success = await supabaseDataService.deleteOrder(orderId)
      if (success) {
        setOrderList((prev) => prev.filter((order) => order.id !== orderId))
        toast.success("Order deleted successfully")
      } else {
        toast.error("Failed to delete order")
      }
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error("Failed to delete order")
    }
  }, [])

  const addItemToOrder = useCallback((menuItem: MenuItem) => {
    if (!menuItem.is_available) {
      toast.error(`${menuItem.name} is not available`)
      return
    }

    setOrderItems((prev) => {
      const existingItem = prev.find((item) => item.menuItemId === menuItem.id)
      if (existingItem) {
        return prev.map((item) => (item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [
          ...prev,
          {
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
          },
        ]
      }
    })
  }, [])

  const removeItemFromOrder = useCallback((menuItemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.menuItemId !== menuItemId))
  }, [])

  const updateItemQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(menuItemId)
      return
    }
    setOrderItems((prev) => prev.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item)))
  }, [removeItemFromOrder])

  const calculateTotal = useCallback(() => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [orderItems])

  const handleCreateOrder = useCallback(async () => {
    if (!selectedCustomer || orderItems.length === 0) {
      toast.error("Please select a customer and add items to the order")
      return
    }

    try {
      setIsCreatingOrder(true)
      
      const selectedCustomerData = customers.find(c => c.id === selectedCustomer)
      if (!selectedCustomerData) {
        toast.error("Selected customer not found")
        return
      }

      const orderData = {
        order_number: `ORD-${Date.now()}`,
        customer_id: selectedCustomerData.id,
        items: orderItems.map(item => ({
          menu_item_id: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: calculateTotal(),
        tax_amount: 0,
        discount_amount: 0,
        total_amount: calculateTotal(),
        status: 'pending' as const,
        payment_status: 'pending' as const,
        notes: '',
        delivery_address: '',
        delivery_fee: 0
      }

      const createdOrder = await supabaseDataService.createOrder(orderData)
      
      if (createdOrder) {
        const newLocalOrder: LocalOrder = {
          id: createdOrder.id,
          orderNo: createdOrder.order_number,
          customer: selectedCustomerData.name,
          customerId: selectedCustomerData.id,
          items: orderItems.map((item) => `${item.name} (${item.quantity})`),
          total: calculateTotal(),
          status: "pending",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        
        setOrderList([newLocalOrder, ...orderList])
        setIsNewOrderModalOpen(false)
        setSelectedCustomer("")
        setSelectedCustomerName("")
        setCustomerSearchTerm("")
        setOrderItems([])
        toast.success("Order created successfully!")
      } else {
        toast.error("Failed to create order")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to create order")
    } finally {
      setIsCreatingOrder(false)
    }
  }, [selectedCustomer, orderItems, customers, calculateTotal, orderList])

  const openViewModal = useCallback((order: LocalOrder) => {
    setViewingOrder(order)
    setIsViewModalOpen(true)
  }, [])

  const handleCancelNewOrder = useCallback(() => {
    setIsNewOrderModalOpen(false)
    setSelectedCustomer("")
    setSelectedCustomerName("")
    setCustomerSearchTerm("")
    setOrderItems([])
    setIsAddingNewCustomer(false)
    setNewCustomerData({ name: "", email: "", phone: "", address: "" })
  }, [])

  const updatePaymentStatus = useCallback(async (orderId: string, paymentStatus: "pending" | "paid" | "refunded") => {
    try {
      const success = await supabaseDataService.updateOrder(orderId, { 
        payment_status: paymentStatus 
      })
      
      if (success) {
        setOrderList(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, payment_status: paymentStatus }
              : order
          )
        )
        
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder(prev => prev ? { ...prev, payment_status: paymentStatus } : null)
        }
        
        toast.success(`Payment status updated to ${paymentStatus}`)
      } else {
        toast.error("Failed to update payment status")
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error("Failed to update payment status")
    }
  }, [viewingOrder])

  const updatePaymentMethod = useCallback(async (orderId: string, paymentMethod: "cash" | "online" | "card") => {
    try {
      const success = await supabaseDataService.updateOrder(orderId, { 
        payment_method: paymentMethod 
      })
      
      if (success) {
        setOrderList(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, paymentMethod: paymentMethod }
              : order
          )
        )
        
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder(prev => prev ? { ...prev, paymentMethod: paymentMethod } : null)
        }
        
        toast.success(`Payment method updated to ${paymentMethod}`)
      } else {
        toast.error("Failed to update payment method")
      }
    } catch (error) {
      console.error("Error updating payment method:", error)
      toast.error("Failed to update payment method")
    }
  }, [viewingOrder])

  // Memoized columns array - prevents recreation on every render
  const columns = useMemo(() => [
    {
      key: "orderNo" as keyof LocalOrder,
      label: "Order",
      render: (value: string, order: LocalOrder) => (
        <div>
          <div className="font-medium text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">
            {order.date} at {order.time}
          </div>
        </div>
      ),
    },
    {
      key: "customer" as keyof LocalOrder,
      label: "Customer",
      render: (value: string) => <div className="font-medium text-foreground">{value}</div>,
    },
    {
      key: "items" as keyof LocalOrder,
      label: "Items",
      render: (value: string[]) => (
        <div className="max-w-xs">
          <div className="text-sm text-foreground">{value.length} items</div>
          <div className="text-xs text-muted-foreground line-clamp-2">{value.join(", ")}</div>
        </div>
      ),
    },
    {
      key: "total" as keyof LocalOrder,
      label: "Total",
      render: (value: number) => <div className="font-medium text-foreground">{formatPrice(value)}</div>,
    },
    {
      key: "status" as keyof LocalOrder,
      label: "Status",
      render: (value: string) => (
        <Badge className={`gap-1 ${getStatusColor(value)}`}>
          {getStatusIcon(value)}
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: "paymentMethod" as keyof LocalOrder,
      label: "Payment",
      render: (value: string, order: LocalOrder) => (
        <div>
          {order.status === 'completed' ? (
            <Badge variant={value ? "default" : "secondary"}>
              {value ? value.charAt(0).toUpperCase() + value.slice(1) : "Not Set"}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </div>
      ),
    },
    {
      key: "id" as keyof LocalOrder,
      label: "Actions",
      render: (value: string, order: LocalOrder) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openViewModal(order)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Select
            value={order.status}
            onValueChange={(newStatus: LocalOrder["status"]) => updateOrderStatus(value, newStatus)}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteOrder(value)}
            className="h-8 w-8 text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [formatPrice, getStatusColor, getStatusIcon, openViewModal, updateOrderStatus, deleteOrder])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Orders Management</h1>
            <p className="text-muted-foreground text-lg">Track and manage all restaurant orders efficiently</p>
          </div>
          <Button 
            onClick={() => setIsNewOrderModalOpen(true)} 
            className="gap-2 px-6 py-3 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            New Order
          </Button>
        </motion.div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {Object.entries(statusCounts).map(([status, count], index) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full"
            >
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${
                  statusFilter === status 
                    ? "ring-2 ring-primary border-primary shadow-lg" 
                    : "hover:border-primary/50"
                }`}
                onClick={() => setStatusFilter(status)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-foreground mb-2">{count}</div>
                  <div className="text-sm font-medium text-muted-foreground capitalize">
                    {status === "all" ? "Total Orders" : status}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Orders Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="bg-card rounded-lg border shadow-sm"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="ml-3 text-lg text-muted-foreground">Loading orders...</span>
            </div>
          ) : (
            <div className="p-6">
              <DataTable
                data={filteredOrders}
                columns={columns}
                searchKey="orderNo"
                title={`${statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`}
                onAdd={() => setIsNewOrderModalOpen(true)}
                addButtonText="New Order"
              />
            </div>
          )}
        </motion.div>

        {/* New Order Modal */}
        <Modal
          isOpen={isNewOrderModalOpen}
          onClose={handleCancelNewOrder}
          title="Create New Order"
          size="xl"
        >
          <div className="space-y-8 max-h-[90vh] overflow-y-auto">
            {/* Customer Selection with Search */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">Select Customer *</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone, or address..."
                    value={customerSearchTerm}
                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="pl-12 pr-12 h-12 text-base border-2 focus:border-primary"
                  />
                  {customerSearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={clearCustomerSelection}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                
                {/* Customer Search Results Dropdown */}
                {isCustomerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4">
                        {customerSearchTerm ? (
                          <div className="space-y-4">
                            <div>
                              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                              <p className="text-lg font-medium text-center">No customers found</p>
                              <p className="text-sm text-center text-muted-foreground mb-4">"{customerSearchTerm}"</p>
                            </div>
                            
                            {!isAddingNewCustomer ? (
                              <div className="space-y-3">
                                <Button
                                  onClick={() => setIsAddingNewCustomer(true)}
                                  className="w-full gap-2 h-10 font-medium"
                                  variant="default"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add New Customer
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                  Create a new customer profile for "{customerSearchTerm}"
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4 border-t pt-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-foreground">Add New Customer</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsAddingNewCustomer(false)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-sm font-medium">Name *</Label>
                                    <Input
                                      placeholder="Customer name"
                                      value={newCustomerData.name}
                                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                      className="mt-1"
                                      disabled={isCreatingCustomer}
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-sm font-medium">Phone</Label>
                                      <Input
                                        placeholder="Phone number"
                                        value={newCustomerData.phone}
                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="mt-1"
                                        disabled={isCreatingCustomer}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <Input
                                        placeholder="Email address"
                                        type="email"
                                        value={newCustomerData.email}
                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                                        className="mt-1"
                                        disabled={isCreatingCustomer}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium">Address</Label>
                                    <Input
                                      placeholder="Customer address"
                                      value={newCustomerData.address}
                                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                                      className="mt-1"
                                      disabled={isCreatingCustomer}
                                    />
                                  </div>
                                  
                                  <div className="flex gap-3 pt-2">
                                    <Button
                                      onClick={handleCreateNewCustomer}
                                      disabled={isCreatingCustomer || !newCustomerData.name.trim()}
                                      className="flex-1"
                                    >
                                      {isCreatingCustomer ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          Creating...
                                        </>
                                      ) : (
                                        "Create & Select Customer"
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsAddingNewCustomer(false)}
                                      disabled={isCreatingCustomer}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-lg font-medium">No customers available</p>
                            <p className="text-sm text-muted-foreground mt-1">Start by adding your first customer</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-1">
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            className="w-full text-left px-4 py-3 hover:bg-muted rounded-md transition-colors focus:bg-muted focus:outline-none"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-foreground text-base">{customer.name}</div>
                                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                                  {customer.phone && <span>📱 {customer.phone}</span>}
                                  {customer.email && <span>✉️ {customer.email}</span>}
                                </div>
                              </div>
                              {customer.loyalty_points > 0 && (
                                <div className="text-sm bg-primary/15 text-primary px-3 py-1 rounded-full font-medium">
                                  {customer.loyalty_points} pts
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected Customer Display */}
              {selectedCustomer && selectedCustomerName && (
                <div className="flex items-center justify-between p-4 bg-primary/10 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="font-semibold text-foreground text-lg">{selectedCustomerName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCustomerSelection}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Menu Items */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-foreground border-b pb-3">Menu Items</h3>
                {isLoadingMenuItems ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-lg">Loading menu items...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {menuItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="text-lg font-medium">No menu items available</div>
                        <div className="text-sm mt-2">Add items to your menu first</div>
                      </div>
                    ) : (
                      menuItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted border hover:border-primary/50 transition-all duration-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground text-base mb-1">{item.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="font-medium">{formatPrice(item.price)}</span>
                              <span>•</span>
                              <span>{item.category}</span>
                              {!item.is_available && (
                                <span className="ml-2 text-red-500 font-medium">(Unavailable)</span>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => addItemToOrder(item)}
                            disabled={!item.is_available}
                            className="ml-4 px-6 py-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            Add
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-foreground border-b pb-3">Order Items</h3>
                {orderItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-lg font-medium">No items added yet</div>
                    <div className="text-sm mt-2">Select items from the menu to add to this order</div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {orderItems.map((item) => (
                      <div 
                        key={item.menuItemId} 
                        className="flex items-center gap-4 p-4 bg-card border-2 rounded-xl hover:border-primary/50 transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground text-base">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{formatPrice(item.price)} each</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.menuItemId, item.quantity - 1)}
                            className="h-9 w-9 p-0 border-2 hover:border-destructive hover:text-destructive"
                          >
                            -
                          </Button>
                          <span className="w-10 text-center font-semibold text-lg">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.menuItemId, item.quantity + 1)}
                            className="h-9 w-9 p-0 border-2 hover:border-primary hover:text-primary"
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItemFromOrder(item.menuItemId)}
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Total */}
                {orderItems.length > 0 && (
                  <div className="border-t-2 pt-6 mt-6">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span className="text-foreground">Total:</span>
                      <span className="text-primary">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-lg font-semibold text-foreground">Payment Method *</Label>
              <Select value={selectedPaymentMethod} onValueChange={(value: "cash" | "card" | "online") => setSelectedPaymentMethod(value)}>
                <SelectTrigger className="h-12 text-base border-2">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash" className="text-base py-3">💵 Cash</SelectItem>
                  <SelectItem value="card" className="text-base py-3">💳 Card</SelectItem>
                  <SelectItem value="online" className="text-base py-3">📱 Online/UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button
                onClick={handleCreateOrder}
                disabled={!selectedCustomer || orderItems.length === 0 || isCreatingOrder}
                className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Creating Order...
                  </>
                ) : (
                  "Create Order"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelNewOrder}
                disabled={isCreatingOrder}
                className="flex-1 h-12 text-base font-semibold border-2 hover:bg-destructive/5 hover:border-destructive hover:text-destructive transition-all duration-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Order Modal */}
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Order Details" size="lg">
          {viewingOrder && (
            <div className="space-y-8 max-h-[90vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Order Number</Label>
                  <div className="font-bold text-foreground text-lg">{viewingOrder.orderNo}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                  <div className="font-bold text-foreground text-lg">{viewingOrder.customer}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
                  <div className="font-bold text-foreground text-lg">
                    {viewingOrder.date} at {viewingOrder.time}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={`gap-2 px-4 py-2 text-sm font-semibold ${getStatusColor(viewingOrder.status)}`}>
                    {getStatusIcon(viewingOrder.status)}
                    {viewingOrder.status.charAt(0).toUpperCase() + viewingOrder.status.slice(1)}
                  </Badge>
                </div>
                {viewingOrder.status === 'completed' && (
                  <div className="col-span-full space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                    <Select 
                      value={viewingOrder.paymentMethod || ''} 
                      onValueChange={(value) => {
                        setViewingOrder(prev => prev ? { ...prev, paymentMethod: value as "cash" | "online" | "card" } : null)
                      }}
                    >
                      <SelectTrigger className="h-12 text-base border-2">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash" className="text-base py-3">💵 Cash</SelectItem>
                        <SelectItem value="online" className="text-base py-3">📱 Online Payment</SelectItem>
                        <SelectItem value="card" className="text-base py-3">💳 Card Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold text-foreground">Order Items</Label>
                <div className="space-y-3">
                  {viewingOrder.items.map((item, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors">
                      <div className="font-medium text-foreground">{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Status & Method */}
              <div className="space-y-6 border-t-2 pt-6">
                <Label className="text-lg font-semibold text-foreground">Payment Information</Label>
                
                {/* Payment Status */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      size="lg"
                      variant={viewingOrder.payment_status === 'paid' ? 'default' : 'outline'}
                      onClick={() => updatePaymentStatus(viewingOrder.id, 'paid')}
                      className="flex-1 h-12 text-base font-semibold border-2"
                    >
                      ✅ Paid
                    </Button>
                    <Button 
                      size="lg"
                      variant={viewingOrder.payment_status === 'pending' ? 'destructive' : 'outline'}
                      onClick={() => updatePaymentStatus(viewingOrder.id, 'pending')}
                      className="flex-1 h-12 text-base font-semibold border-2"
                    >
                      ⏳ Pending
                    </Button>
                    <Button 
                      size="lg"
                      variant={viewingOrder.payment_status === 'refunded' ? 'secondary' : 'outline'}
                      onClick={() => updatePaymentStatus(viewingOrder.id, 'refunded')}
                      className="flex-1 h-12 text-base font-semibold border-2"
                    >
                      ↩️ Refunded
                    </Button>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <Select 
                    value={viewingOrder.paymentMethod || 'cash'} 
                    onValueChange={(value: "cash" | "online" | "card") => updatePaymentMethod(viewingOrder.id, value)}
                  >
                    <SelectTrigger className="h-12 text-base border-2">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="text-base py-3">💵 Cash</SelectItem>
                      <SelectItem value="card" className="text-base py-3">💳 Card</SelectItem>
                      <SelectItem value="online" className="text-base py-3">📱 Online/UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t-2 pt-6">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span className="text-foreground">Total Amount:</span>
                  <span className="text-primary">{formatPrice(viewingOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}