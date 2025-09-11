"use client"

import {
  CalendarIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabaseDataService, type Order, type Customer, type Expense } from "@/lib/supabase-data-service"
import { useCurrency } from "@/lib/currency-store"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import React from "react"
import { motion } from "framer-motion"

interface DailyReportData {
  date: string
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  cashPayments: number
  cardPayments: number
  onlinePayments: number
  totalExpenses: number
  netProfit: number
  totalCustomers: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  topSellingItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  paymentMethodBreakdown: {
    cash: number
    card: number
    online: number
  }
}

const ReportsPage = () => {
  const { toast } = useToast()
  const { convertPrice } = useCurrency()
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<DailyReportData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  // Load data for selected date
  const loadReportData = async (date: Date) => {
    try {
      setIsLoading(true)
      
      const dateString = date.toISOString().split('T')[0]
      
      // Load all necessary data
      const [ordersData, customersData, expensesData] = await Promise.all([
        supabaseDataService.getOrders(),
        supabaseDataService.getCustomers(),
        supabaseDataService.getExpenses()
      ])

      setOrders(ordersData)
      setCustomers(customersData)
      setExpenses(expensesData)

      // Filter data for selected date
      const dayOrders = ordersData.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0]
        return orderDate === dateString
      })

      const dayExpenses = expensesData.filter(expense => {
        return expense.date === dateString
      })

      // Calculate report metrics
      const totalSales = dayOrders.reduce((sum, order) => sum + order.total_amount, 0)
      const totalExpenses = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const netProfit = totalSales - totalExpenses

      // Payment method breakdown
      const paymentBreakdown = dayOrders.reduce((acc, order) => {
        const method = order.payment_method?.toLowerCase() || 'cash'
        acc[method] = (acc[method] || 0) + order.total_amount
        return acc
      }, {} as Record<string, number>)

      // Order status breakdown
      const orderStatuses = dayOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Top selling items
      const itemSales: Record<string, { quantity: number; revenue: number }> = {}
      dayOrders.forEach(order => {
        order.items.forEach(item => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = { quantity: 0, revenue: 0 }
          }
          itemSales[item.name].quantity += item.quantity
          itemSales[item.name].revenue += item.price * item.quantity
        })
      })

      const topSellingItems = Object.entries(itemSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Count unique customers for the day
      const uniqueCustomerIds = new Set(dayOrders.map(order => order.customer_id).filter(Boolean))
      const dayCustomers = customersData.filter(customer => uniqueCustomerIds.has(customer.id))

      const report: DailyReportData = {
        date: dateString,
        totalSales,
        totalOrders: dayOrders.length,
        averageOrderValue: dayOrders.length > 0 ? totalSales / dayOrders.length : 0,
        cashPayments: paymentBreakdown.cash || 0,
        cardPayments: paymentBreakdown.card || 0,
        onlinePayments: paymentBreakdown.online || 0,
        totalExpenses,
        netProfit,
        totalCustomers: dayCustomers.length,
        pendingOrders: orderStatuses.pending || 0,
        completedOrders: (orderStatuses.delivered || 0) + (orderStatuses.ready || 0),
        cancelledOrders: orderStatuses.cancelled || 0,
        topSellingItems,
        paymentMethodBreakdown: {
          cash: paymentBreakdown.cash || 0,
          card: paymentBreakdown.card || 0,
          online: paymentBreakdown.online || 0,
        }
      }

      setReportData(report)
    } catch (error) {
      console.error('Error loading report data:', error)
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when date changes
  useEffect(() => {
    loadReportData(selectedDate)
  }, [selectedDate])

  // Export report as CSV
  const exportReport = () => {
    if (!reportData) return

    const csvData = [
      ['Date', reportData.date],
      ['Total Sales', reportData.totalSales.toString()],
      ['Total Orders', reportData.totalOrders.toString()],
      ['Average Order Value', reportData.averageOrderValue.toString()],
      ['Cash Payments', reportData.cashPayments.toString()],
      ['Card Payments', reportData.cardPayments.toString()],
      ['Online Payments', reportData.onlinePayments.toString()],
      ['Total Expenses', reportData.totalExpenses.toString()],
      ['Net Profit', reportData.netProfit.toString()],
      ['Total Customers', reportData.totalCustomers.toString()],
      ['Pending Orders', reportData.pendingOrders.toString()],
      ['Completed Orders', reportData.completedOrders.toString()],
      ['Cancelled Orders', reportData.cancelledOrders.toString()],
      [''],
      ['Top Selling Items'],
      ['Item Name', 'Quantity Sold', 'Revenue'],
      ...reportData.topSellingItems.map(item => [
        item.name,
        item.quantity.toString(),
        item.revenue.toString()
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `restaurant-report-${reportData.date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            View detailed sales and income reports for any date
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Export Button */}
          <Button 
            onClick={exportReport} 
            disabled={!reportData || isLoading}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          {/* Refresh Button */}
          <Button 
            onClick={() => loadReportData(selectedDate)}
            disabled={isLoading}
            variant="outline"
            size="icon"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading report data...</span>
        </div>
      )}

      {/* Report Content */}
      {!isLoading && reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sales
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {convertPrice(reportData.totalSales)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.totalOrders} orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
                {reportData.netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  reportData.netProfit >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {convertPrice(reportData.netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  After expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Order
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {convertPrice(reportData.averageOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {reportData.totalCustomers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Served today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cash</span>
                  <span className="font-medium text-foreground">
                    {convertPrice(reportData.cashPayments)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Card</span>
                  <span className="font-medium text-foreground">
                    {convertPrice(reportData.cardPayments)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Online</span>
                  <span className="font-medium text-foreground">
                    {convertPrice(reportData.onlinePayments)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium text-orange-500">
                    {reportData.pendingOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-medium text-green-500">
                    {reportData.completedOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cancelled</span>
                  <span className="font-medium text-red-500">
                    {reportData.cancelledOrders}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.topSellingItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data for this date
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData.topSellingItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} units sold
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">
                          {convertPrice(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Expenses Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-2xl font-bold text-foreground">
                  {convertPrice(reportData.totalExpenses)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total expenses for {format(selectedDate, "MMMM d, yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No Data State */}
      {!isLoading && !reportData && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Data Available
            </h3>
            <p className="text-muted-foreground">
              Select a date to view reports
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage