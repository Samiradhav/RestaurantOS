"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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

// Mapping functions between local and Supabase interfaces
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
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "card" | "online">("cash")

  // Use currency hook
  const { formatPrice } = useCurrency()

  // Load data on component mount
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
        
        // Map orders to local format
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

  const filteredOrders = statusFilter === "all" ? orderList : orderList.filter((order) => order.status === statusFilter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "preparing":
        return <AlertCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500/20 text-blue-500"
      case "preparing":
        return "bg-orange-500/20 text-orange-500"
      case "completed":
        return "bg-green-500/20 text-green-500"
      case "cancelled":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-gray-500/20 text-gray-500"
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: LocalOrder["status"]) => {
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
  }

  const deleteOrder = async (orderId: string) => {
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
  }

  const addItemToOrder = (menuItem: MenuItem) => {
    if (!menuItem.is_available) {
      toast.error(`${menuItem.name} is not available`)
      return
    }

    const existingItem = orderItems.find((item) => item.menuItemId === menuItem.id)
    if (existingItem) {
      setOrderItems((prev) =>
        prev.map((item) => (item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item))
      )
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ])
    }
  }

  const removeItemFromOrder = (menuItemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.menuItemId !== menuItemId))
  }

  const updateItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(menuItemId)
      return
    }
    setOrderItems((prev) => prev.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item)))
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleCreateOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) {
      toast.error("Please select a customer and add items to the order")
      return
    }

    try {
      setIsCreatingOrder(true)
      
      // Find customer
      const selectedCustomerData = customers.find(c => c.id === selectedCustomer)
      if (!selectedCustomerData) {
        toast.error("Selected customer not found")
        return
      }

      // Create order data for Supabase
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
        // Add to local state
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
  }

  const openViewModal = (order: LocalOrder) => {
    setViewingOrder(order)
    setIsViewModalOpen(true)
  }

  const handleCancelNewOrder = () => {
    setIsNewOrderModalOpen(false)
    setSelectedCustomer("")
    setOrderItems([])
  }

  // Handle update payment status
  const updatePaymentStatus = async (orderId: string, paymentStatus: "pending" | "paid" | "refunded") => {
    try {
      const success = await supabaseDataService.updateOrder(orderId, { 
        payment_status: paymentStatus 
      })
      
      if (success) {
        // Update local state
        setOrderList(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, payment_status: paymentStatus }
              : order
          )
        )
        
        // Update viewing order if it's the current one
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
  }

  // Handle update payment method
  const updatePaymentMethod = async (orderId: string, paymentMethod: "cash" | "online" | "card") => {
    try {
      const success = await supabaseDataService.updateOrder(orderId, { 
        payment_method: paymentMethod 
      })
      
      if (success) {
        // Update local state
        setOrderList(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, paymentMethod: paymentMethod }
              : order
          )
        )
        
        // Update viewing order if it's the current one
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
  }

  const columns = [
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
  ]

  const statusCounts = {
    all: orderList.length,
    pending: orderList.filter((o) => o.status === "pending").length,
    preparing: orderList.filter((o) => o.status === "preparing").length,
    completed: orderList.filter((o) => o.status === "completed").length,
    cancelled: orderList.filter((o) => o.status === "cancelled").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
          <p className="text-muted-foreground">Track and manage all restaurant orders</p>
        </div>
        <Button onClick={() => setIsNewOrderModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </motion.div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusCounts).map(([status, count], index) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                statusFilter === status ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setStatusFilter(status)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {status === "all" ? "Total Orders" : status}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Orders Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading orders...</span>
          </div>
        ) : (
          <DataTable
            data={filteredOrders}
            columns={columns}
            searchKey="orderNo"
            title={`${statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`}
            onAdd={() => setIsNewOrderModalOpen(true)}
            addButtonText="New Order"
          />
        )}
      </motion.div>

      {/* New Order Modal */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={handleCancelNewOrder}
        title="Create New Order"
        size="xl"
      >
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>Select Customer *</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone || customer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Menu Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Menu Items</h3>
              {isLoadingMenuItems ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading menu items...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {menuItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No menu items available
                    </div>
                  ) : (
                    menuItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(item.price)} • {item.category}
                            {!item.is_available && (
                              <span className="ml-2 text-red-500">(Unavailable)</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addItemToOrder(item)}
                          disabled={!item.is_available}
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Order Items</h3>
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No items added yet</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {orderItems.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                      <div className="flex-1">
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{formatPrice(item.price)} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          +
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItemFromOrder(item.menuItemId)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

                            {/* Order Total */}
                            {orderItems.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select value={selectedPaymentMethod} onValueChange={(value: "cash" | "card" | "online") => setSelectedPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash"> Cash</SelectItem>
                <SelectItem value="card">💳 Card</SelectItem>
                <SelectItem value="online">📱 Online/UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreateOrder}
              disabled={!selectedCustomer || orderItems.length === 0 || isCreatingOrder}
              className="flex-1"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Order Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Order Details" size="lg">
        {viewingOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Order Number</Label>
                <div className="font-medium">{viewingOrder.orderNo}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Customer</Label>
                <div className="font-medium">{viewingOrder.customer}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Date & Time</Label>
                <div className="font-medium">
                  {viewingOrder.date} at {viewingOrder.time}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Badge className={`gap-1 ${getStatusColor(viewingOrder.status)}`}>
                  {getStatusIcon(viewingOrder.status)}
                  {viewingOrder.status.charAt(0).toUpperCase() + viewingOrder.status.slice(1)}
                </Badge>
              </div>
              {viewingOrder.status === 'completed' && (
                <div className="col-span-2">
                  <Label className="text-sm text-muted-foreground">Payment Method</Label>
                  <Select 
                    value={viewingOrder.paymentMethod || ''} 
                    onValueChange={(value) => {
                      setViewingOrder(prev => prev ? { ...prev, paymentMethod: value as "cash" | "online" | "card" } : null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                      <SelectItem value="card">Card Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Items</Label>
              <div className="space-y-2 mt-2">
                {viewingOrder.items.map((item, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Status & Method */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Payment Information</Label>
              
              {/* Payment Status */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Payment Status</Label>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant={viewingOrder.payment_status === 'paid' ? 'default' : 'outline'}
                    onClick={() => updatePaymentStatus(viewingOrder.id, 'paid')}
                    className="flex-1"
                  >
                    ✅ Paid
                  </Button>
                  <Button 
                    size="sm"
                    variant={viewingOrder.payment_status === 'pending' ? 'destructive' : 'outline'}
                    onClick={() => updatePaymentStatus(viewingOrder.id, 'pending')}
                    className="flex-1"
                  >
                    ⏳ Pending
                  </Button>
                  <Button 
                    size="sm"
                    variant={viewingOrder.payment_status === 'refunded' ? 'secondary' : 'outline'}
                    onClick={() => updatePaymentStatus(viewingOrder.id, 'refunded')}
                    className="flex-1"
                  >
                    ↩️ Refunded
                  </Button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Payment Method</Label>
                <Select 
                  value={viewingOrder.paymentMethod || 'cash'} 
                  onValueChange={(value: "cash" | "online" | "card") => updatePaymentMethod(viewingOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="card">💳 Card</SelectItem>
                    <SelectItem value="online">📱 Online/UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>{formatPrice(viewingOrder.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}