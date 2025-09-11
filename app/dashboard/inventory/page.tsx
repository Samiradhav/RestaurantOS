"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus, AlertTriangle, Package, TrendingUp, Edit, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { inventoryItems } from "@/lib/dummy-data"

interface InventoryItem {
  id: number
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  supplier: string
  lastRestocked: string
}

const categories = ["Vegetables", "Dairy", "Seafood", "Baking", "Meat", "Beverages", "Spices"]

interface InventoryFormProps {
  onSubmit: (e: React.FormEvent) => void
  submitText: string
  formData: {
    name: string
    category: string
    currentStock: string
    minStock: string
    unit: string
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
}) => (
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
        <Label htmlFor="currentStock">Current Stock</Label>
        <Input
          id="currentStock"
          type="number"
          placeholder="0"
          value={formData.currentStock}
          onChange={(e) => updateFormData("currentStock", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minStock">Minimum Stock</Label>
        <Input
          id="minStock"
          type="number"
          placeholder="0"
          value={formData.minStock}
          onChange={(e) => updateFormData("minStock", e.target.value)}
          required
        />
      </div>
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
    </div>

    <div className="space-y-2">
      <Label htmlFor="supplier">Supplier</Label>
      <Input
        id="supplier"
        placeholder="Enter supplier name"
        value={formData.supplier}
        onChange={(e) => updateFormData("supplier", e.target.value)}
        required
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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(inventoryItems)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null)
  const [restockQuantity, setRestockQuantity] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    currentStock: "",
    minStock: "",
    unit: "",
    supplier: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      currentStock: "",
      minStock: "",
      unit: "",
      supplier: "",
    })
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    const newItem: InventoryItem = {
      id: inventory.length + 1,
      name: formData.name,
      category: formData.category,
      currentStock: Number.parseInt(formData.currentStock),
      minStock: Number.parseInt(formData.minStock),
      unit: formData.unit,
      supplier: formData.supplier,
      lastRestocked: new Date().toISOString().split("T")[0],
    }
    setInventory([...inventory, newItem])
    setIsAddModalOpen(false)
    resetForm()
  }

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    const updatedInventory = inventory.map((item) =>
      item.id === editingItem.id
        ? {
            ...item,
            name: formData.name,
            category: formData.category,
            currentStock: Number.parseInt(formData.currentStock),
            minStock: Number.parseInt(formData.minStock),
            unit: formData.unit,
            supplier: formData.supplier,
          }
        : item,
    )
    setInventory(updatedInventory)
    setIsEditModalOpen(false)
    setEditingItem(null)
    resetForm()
  }

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!restockingItem || !restockQuantity) return

    const updatedInventory = inventory.map((item) =>
      item.id === restockingItem.id
        ? {
            ...item,
            currentStock: item.currentStock + Number.parseInt(restockQuantity),
            lastRestocked: new Date().toISOString().split("T")[0],
          }
        : item,
    )
    setInventory(updatedInventory)
    setIsRestockModalOpen(false)
    setRestockingItem(null)
    setRestockQuantity("")
  }

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock.toString(),
      minStock: item.minStock.toString(),
      unit: item.unit,
      supplier: item.supplier,
    })
    setIsEditModalOpen(true)
  }

  const openRestockModal = (item: InventoryItem) => {
    setRestockingItem(item)
    setRestockQuantity("")
    setIsRestockModalOpen(true)
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { status: "out", color: "bg-red-500/20 text-red-500", label: "Out of Stock" }
    if (current <= min) return { status: "low", color: "bg-orange-500/20 text-orange-500", label: "Low Stock" }
    if (current <= min * 1.5) return { status: "medium", color: "bg-yellow-500/20 text-yellow-500", label: "Medium" }
    return { status: "good", color: "bg-green-500/20 text-green-500", label: "Good Stock" }
  }

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
        key: "currentStock" as keyof InventoryItem,
        label: "Stock Level",
        render: (value: number, item: InventoryItem) => {
          const stockStatus = getStockStatus(value, item.minStock)
          return (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {value} {item.unit}
                </div>
                <div className="text-xs text-muted-foreground">Min: {item.minStock}</div>
              </div>
              <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
            </div>
          )
        },
      },
      {
        key: "supplier" as keyof InventoryItem,
        label: "Supplier",
        render: (value: string, item: InventoryItem) => (
          <div>
            <div className="font-medium text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground">
              Last: {new Date(item.lastRestocked).toLocaleDateString()}
            </div>
          </div>
        ),
      },
      {
        key: "id" as keyof InventoryItem,
        label: "Actions",
        render: (value: number, item: InventoryItem) => (
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
    [inventory]
  )

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStock)
  const outOfStockItems = inventory.filter((item) => item.currentStock === 0)
  const totalItems = inventory.length
  const totalValue = inventory.reduce((sum, item) => sum + item.currentStock * 5, 0) // Assuming avg cost of $5 per unit

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
              <div className="text-2xl font-bold text-green-500">${totalValue.toLocaleString()}</div>
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
                        {item.currentStock} {item.unit} left
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
          key={inventory.length} 
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
          submitText="Add Item"
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
          submitText="Update Item"
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
                Current Stock: {restockingItem.currentStock} {restockingItem.unit}
              </div>
              <div className="text-sm text-muted-foreground">
                Minimum Stock: {restockingItem.minStock} {restockingItem.unit}
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
              />
            </div>

            {restockQuantity && (
              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="text-sm text-green-600">
                  New Stock Level: {restockingItem.currentStock + Number.parseInt(restockQuantity || "0")}{" "}
                  {restockingItem.unit}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={!restockQuantity} className="flex-1">
                Restock Item
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