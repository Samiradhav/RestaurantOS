"use client"

import type React from "react"

import { useState, useMemo, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, AlertTriangle, Package, TrendingUp, Edit, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseDataService, type InventoryItem } from "@/lib/supabase-data-service"
import { toast } from "sonner"
import { useCurrency } from "@/lib/currency-store"

const categories = ["Vegetables", "Dairy", "Seafood", "Baking", "Meat", "Beverages", "Spices"]

interface InventoryFormProps {
  onSubmit: (e: React.FormEvent) => void
  submitText: string
  formData: {
    name: string
    category: string
    current_stock: string
    min_stock_level: string
    max_stock_level: string
    unit: string
    cost_per_unit: string
    supplier: string
  }
  updateFormData: (field: string, value: string) => void
  onCancel: () => void
}

const InventoryForm: React.FC<InventoryFormProps> = ({ 
  onSubmit, 
  submitText, 
  formData, 
  updateFormData, 
  onCancel 
}) => {
  const { getSymbol, formatPrice } = useCurrency()

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name</Label>
          <Input
            id="name"
            placeholder="Enter item name"
            value={formData.name || ""}
            onChange={(e) => updateFormData("name", e.target.value)}
            autoComplete="off"
            required
          />
        </div>  
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="current_stock">Current Stock</Label>
          <Input
            id="current_stock"
            type="number"
            placeholder="0"
            value={formData.current_stock}
            onChange={(e) => updateFormData("current_stock", e.target.value)}
            required
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_stock_level">Minimum Stock</Label>
          <Input
            id="min_stock_level"
            type="number"
            placeholder="0"
            value={formData.min_stock_level}
            onChange={(e) => updateFormData("min_stock_level", e.target.value)}
            required
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_stock_level">Maximum Stock (Optional)</Label>
          <Input
            id="max_stock_level"
            type="number"
            placeholder=""
            value={formData.max_stock_level}
            onChange={(e) => updateFormData("max_stock_level", e.target.value)}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            placeholder="kg, pieces, liters"
            value={formData.unit}
            onChange={(e) => updateFormData("unit", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost_per_unit">Cost per Unit ({getSymbol()})</Label>
          <Input
            id="cost_per_unit"
            type="number"
            step="0.01"
            placeholder={getSymbol() === "₹" ? "0" : "0.00"}
            value={formData.cost_per_unit}
            onChange={(e) => updateFormData("cost_per_unit", e.target.value)}
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">Supplier (Optional)</Label>
        <Input
          id="supplier"
          placeholder="Enter supplier name"
          value={formData.supplier}
          onChange={(e) => updateFormData("supplier", e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {submitText}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 bg-transparent"
        > 
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function InventoryPage() {
  const { convertPrice, getSymbol } = useCurrency()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null)
  const [restockQuantity, setRestockQuantity] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    current_stock: "",
    min_stock_level: "",
    max_stock_level: "",
    unit: "",
    cost_per_unit: "",
    supplier: "",
  })

  // Load inventory data on component mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setIsLoading(true)
        const data = await supabaseDataService.getInventoryItems()
        setInventory(data)
      } catch (error) {
        console.error("Error loading inventory:", error)
        toast.error("Failed to load inventory data")
      } finally {
        setIsLoading(false)
      }
    }

    loadInventory()
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      category: "",
      current_stock: "",
      min_stock_level: "",
      max_stock_level: "",
      unit: "",
      cost_per_unit: "",
      supplier: "",
    })
  }, [])

  const handleAddItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      
      // Validate required fields
      if (!formData.name.trim() || !formData.category || !formData.unit.trim()) {
        toast.error("Please fill in all required fields")
        return
      }

      // Parse and validate numeric fields
      const currentStock = parseInt(formData.current_stock, 10)
      const minStock = parseInt(formData.min_stock_level, 10)
      
      if (isNaN(currentStock) || currentStock < 0) {
        toast.error("Current stock must be a valid non-negative number")
        return
      }
      
      if (isNaN(minStock) || minStock < 0) {
        toast.error("Minimum stock must be a valid non-negative number")
        return
      }

      const maxStockValue = formData.max_stock_level ? parseInt(formData.max_stock_level, 10) : minStock * 2
      
      if (formData.max_stock_level && (isNaN(maxStockValue) || maxStockValue < 0)) {
        toast.error("Maximum stock must be a valid non-negative number")
        return
      }

      // Validate that max stock is greater than min stock
      if (maxStockValue <= minStock) {
        toast.error("Max stock level must be greater than min stock level")
        return
      }

      // Parse cost per unit if provided
      let costPerUnit: number | undefined
      if (formData.cost_per_unit) {
        costPerUnit = parseFloat(formData.cost_per_unit)
        if (isNaN(costPerUnit) || costPerUnit < 0) {
          toast.error("Cost per unit must be a valid non-negative number")
          return
        }
      }

      const created = await supabaseDataService.createInventoryItem({
        name: formData.name.trim(),
        category: formData.category,
        current_stock: currentStock,
        min_stock_level: minStock,
        max_stock_level: maxStockValue,
        unit: formData.unit.trim(),
        cost_per_unit: costPerUnit,
        supplier: formData.supplier.trim() || undefined,
      })

      if (created) {
        setInventory((prev) => [created, ...prev])
        setIsAddModalOpen(false)
        resetForm()
        toast.success("Inventory item added successfully")
      }
    } catch (error) {
      console.error("Error adding inventory item:", error)
      toast.error("Failed to add inventory item")
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, resetForm])

  const handleEditItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      setIsSubmitting(true)

      // Validate required fields
      if (!formData.name.trim() || !formData.category || !formData.unit.trim()) {
        toast.error("Please fill in all required fields")
        return
      }

      // Parse and validate numeric fields
      const currentStock = parseInt(formData.current_stock, 10)
      const minStock = parseInt(formData.min_stock_level, 10)
      
      if (isNaN(currentStock) || currentStock < 0) {
        toast.error("Current stock must be a valid non-negative number")
        return
      }
      
      if (isNaN(minStock) || minStock < 0) {
        toast.error("Minimum stock must be a valid non-negative number")
        return
      }

      const maxStockValue = formData.max_stock_level ? parseInt(formData.max_stock_level, 10) : minStock * 2
      
      if (formData.max_stock_level && (isNaN(maxStockValue) || maxStockValue < 0)) {
        toast.error("Maximum stock must be a valid non-negative number")
        return
      }

      if (maxStockValue <= minStock) {
        toast.error("Max stock level must be greater than min stock level")
        return
      }

      // Parse cost per unit if provided
      let costPerUnit: number | undefined
      if (formData.cost_per_unit) {
        costPerUnit = parseFloat(formData.cost_per_unit)
        if (isNaN(costPerUnit) || costPerUnit < 0) {
          toast.error("Cost per unit must be a valid non-negative number")
          return
        }
      }

      const updated = await supabaseDataService.updateInventoryItem(editingItem.id, {
        name: formData.name.trim(),
        category: formData.category,
        current_stock: currentStock,
        min_stock_level: minStock,
        max_stock_level: maxStockValue,
        unit: formData.unit.trim(),
        cost_per_unit: costPerUnit,
        supplier: formData.supplier.trim() || undefined,
      })

      if (updated) {
        setInventory((prev) => prev.map((item) => 
          item.id === editingItem.id ? updated : item
        ))
        setIsEditModalOpen(false)
        setEditingItem(null)
        resetForm()
        toast.success("Inventory item updated successfully")
      }
    } catch (error) {
      console.error("Error updating inventory item:", error)
      toast.error("Failed to update inventory item")
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, resetForm, editingItem])

  const handleRestock = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restockingItem) return

    try {
      setIsSubmitting(true)
      
      // Validate restock quantity
      if (!restockQuantity.trim()) {
        toast.error("Please enter a restock quantity")
        return
      }
      
      const quantity = parseInt(restockQuantity, 10)
      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Restock quantity must be a positive number")
        return
      }
      
      const updated = await supabaseDataService.updateInventoryItem(restockingItem.id, {
        current_stock: restockingItem.current_stock + quantity,
      })

      if (updated) {
        setInventory((prev) => prev.map((item) => 
          item.id === restockingItem.id ? updated : item
        ))
        setIsRestockModalOpen(false)
        setRestockingItem(null)
        setRestockQuantity("")
        toast.success("Item restocked successfully")
      }
    } catch (error) {
      console.error("Error restocking item:", error)
      toast.error("Failed to restock item")
    } finally {
      setIsSubmitting(false)
    }
  }, [restockingItem, restockQuantity])

  const openEditModal = useCallback((item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      current_stock: item.current_stock.toString(),
      min_stock_level: item.min_stock_level.toString(),
      max_stock_level: item.max_stock_level?.toString() || "",
      unit: item.unit,
      cost_per_unit: item.cost_per_unit?.toString() || "",
      supplier: item.supplier || "",
    })
    setIsEditModalOpen(true)
  }, [])

  const openRestockModal = useCallback((item: InventoryItem) => {
    setRestockingItem(item)
    setRestockQuantity("")
    setIsRestockModalOpen(true)
  }, [])

  const updateFormData = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const getStockStatus = useCallback((current: number, min: number) => {
    if (current === 0) return { status: "out", color: "bg-red-500/20 text-red-500", label: "Out of Stock" }
    if (current <= min) return { status: "low", color: "bg-orange-500/20 text-orange-500", label: "Low Stock" }
    if (current <= min * 1.5) return { status: "medium", color: "bg-yellow-500/20 text-yellow-500", label: "Medium" }
    return { status: "good", color: "bg-green-500/20 text-green-500", label: "Good Stock" }
  }, [])

  const columns = useMemo(
    () => [
      {
        key: "name" as keyof InventoryItem,
        label: "Item",
        render: (value: string, item: InventoryItem) => (
          <div>
            <div className="font-medium text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground">{item.category}</div>
          </div>
        ),
      },
      {
        key: "current_stock" as keyof InventoryItem,
        label: "Stock Level",
        render: (value: number, item: InventoryItem) => {
          const stockStatus = getStockStatus(value, item.min_stock_level)
          return (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {value} {item.unit}
                </div>
                <div className="text-xs text-muted-foreground">Min: {item.min_stock_level}</div>
              </div>
              <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
            </div>
          )
        },
      },
      {
        key: "supplier" as keyof InventoryItem,
        label: "Supplier",
        render: (value: string | undefined, item: InventoryItem) => (
          <div>
            <div className="font-medium text-foreground">{value || "Not specified"}</div>
            {item.cost_per_unit && (
              <div className="text-sm text-muted-foreground">
                {convertPrice(item.cost_per_unit, "INR")} per {item.unit}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "id" as keyof InventoryItem,
        label: "Actions",
        render: (value: string, item: InventoryItem) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openRestockModal(item)}
              className="h-8 w-8 text-muted-foreground hover:text-green-500"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditModal(item)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [getStockStatus, openRestockModal, openEditModal]
  )

  const lowStockItems = useMemo(() => 
    inventory.filter((item) => item.current_stock <= item.min_stock_level),
    [inventory]
  )
  
  const outOfStockItems = useMemo(() => 
    inventory.filter((item) => item.current_stock === 0),
    [inventory]
  )
  
  const totalItems = inventory.length
  
  // Calculate actual inventory value based on cost_per_unit
  const totalValue = useMemo(() => 
    inventory.reduce((sum, item) => {
      if (item.cost_per_unit && item.current_stock > 0) {
        return sum + (item.cost_per_unit * item.current_stock)
      }
      return sum
    }, 0),
    [inventory]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading inventory...</span>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Track stock levels and manage your restaurant's inventory</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Inventory items</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Items need restocking</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{outOfStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Items unavailable</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {totalValue > 0 ? convertPrice(totalValue, "INR") : `${getSymbol()}0`}
              </div>
              <p className="text-xs text-muted-foreground">Estimated inventory value</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                    <div>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.current_stock} {item.unit} left
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openRestockModal(item)}>
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Inventory Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <DataTable
          data={inventory}
          columns={columns}
          searchKey="name"
          title="Inventory Items"
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Item"
        />
      </motion.div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Inventory Item" size="lg">
        <InventoryForm
          onSubmit={handleAddItem}
          submitText={isSubmitting ? "Adding..." : "Add Item"}
          formData={formData}
          updateFormData={updateFormData}
          onCancel={() => {
            setIsAddModalOpen(false)
            resetForm()
          }}
        />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Inventory Item" size="lg">
        <InventoryForm
          onSubmit={handleEditItem}
          submitText={isSubmitting ? "Updating..." : "Update Item"}
          formData={formData}
          updateFormData={updateFormData}
          onCancel={() => {
            setIsEditModalOpen(false)
            resetForm()
          }}
        />
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} title="Restock Item" size="md">
        {restockingItem && (
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="font-medium text-foreground">{restockingItem.name}</div>
              <div className="text-sm text-muted-foreground">
                Current Stock: {restockingItem.current_stock} {restockingItem.unit}
              </div>
              <div className="text-sm text-muted-foreground">
                Minimum Stock: {restockingItem.min_stock_level} {restockingItem.unit}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restockQuantity">Quantity to Add</Label>
              <Input
                id="restockQuantity"
                type="number"
                placeholder="Enter quantity"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                required
                min="1"
              />
            </div>

            {restockQuantity && !isNaN(parseInt(restockQuantity, 10)) && (
              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="text-sm text-green-600">
                  New Stock Level: {restockingItem.current_stock + parseInt(restockQuantity, 10)}{" "}
                  {restockingItem.unit}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={!restockQuantity || isSubmitting} className="flex-1">
                {isSubmitting ? "Restocking..." : "Restock Item"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRestockModalOpen(false)
                  setRestockingItem(null)
                  setRestockQuantity("")
                }}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}