"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, IndianRupee, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { dataService, type MenuItem } from "@/lib/data-service"

const categories = ["Pizza", "Salads", "Main Course", "Desserts", "Beverages", "Appetizers"]

const MenuForm = ({
  formData,
  updateFormData,
  onSubmit,
  submitText,
  onCancel,
}: {
  formData: any
  updateFormData: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitText: string
  onCancel: () => void
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        updateFormData("image_url", result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name</Label>
          <Input
            id="name"
            placeholder="Enter item name"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => updateFormData("price", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="is_available">Availability</Label>
          <Select value={formData.is_available} onValueChange={(value) => updateFormData("is_available", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Available</SelectItem>
              <SelectItem value="false">Not Available</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter item description"
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Upload Image</Label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input id="image" type="file" accept="image/*" onChange={handleFileUpload} className="cursor-pointer" />
          </div>
          {formData.image_url && (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted border">
              <img src={formData.image_url || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Upload an image for your menu item (optional)</p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {submitText}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function MenuPageWithSupabase() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    image_url: "",
    is_available: "true",
  })

  // Load menu items from Supabase
  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true)
      const menuItems = await dataService.getMenuItems()
      setItems(menuItems)
    } catch (error) {
      console.error('Error loading menu items:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMenuItems()
  }, [loadMenuItems])

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      category: "",
      price: "",
      description: "",
      image_url: "",
      is_available: "true",
    })
  }, [])

  const updateFormData = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleAddItem = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        const newItem = await dataService.createMenuItem({
          name: formData.name,
          category: formData.category,
          price: Number.parseFloat(formData.price),
          description: formData.description,
          image_url: formData.image_url || undefined,
          is_available: formData.is_available === "true",
        })

        if (newItem) {
          setItems((prev) => [...prev, newItem])
          setIsAddModalOpen(false)
          resetForm()
        }
      } catch (error) {
        console.error('Error creating menu item:', error)
      }
    },
    [formData, resetForm],
  )

  const handleEditItem = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingItem) return

      try {
        const updatedItem = await dataService.updateMenuItem(editingItem.id, {
          name: formData.name,
          category: formData.category,
          price: Number.parseFloat(formData.price),
          description: formData.description,
          image_url: formData.image_url || undefined,
          is_available: formData.is_available === "true",
        })

        if (updatedItem) {
          setItems((prev) =>
            prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
          )
          setIsEditModalOpen(false)
          setEditingItem(null)
          resetForm()
        }
      } catch (error) {
        console.error('Error updating menu item:', error)
      }
    },
    [formData, editingItem, resetForm],
  )

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      const success = await dataService.deleteMenuItem(id)
      if (success) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }, [])

  const openEditModal = useCallback((item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image_url: item.image_url || "",
      is_available: item.is_available.toString(),
    })
    setIsEditModalOpen(true)
  }, [])

  const handleCancel = useCallback(() => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    resetForm()
  }, [resetForm])

  const columns = [
    {
      key: "image_url" as keyof MenuItem,
      label: "Image",
      render: (value: string) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
          <img src={value || "/placeholder.svg"} alt="Menu item" className="w-full h-full object-cover" />
        </div>
      ),
    },
    {
      key: "name" as keyof MenuItem,
      label: "Name",
      render: (value: string, item: MenuItem) => (
        <div>
          <div className="font-medium text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{item.description}</div>
        </div>
      ),
    },
    {
      key: "category" as keyof MenuItem,
      label: "Category",
      render: (value: string) => (
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {value}
        </Badge>
      ),
    },
    {
      key: "price" as keyof MenuItem,
      label: "Price",
      render: (value: number) => <div className="font-medium text-foreground">${value.toFixed(2)}</div>,
    },
    {
      key: "is_available" as keyof MenuItem,
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"} className={value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
          {value ? "Available" : "Not Available"}
        </Badge>
      ),
    },
    {
      key: "id" as keyof MenuItem,
      label: "Actions",
      render: (value: string, item: MenuItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditModal(item)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteItem(value)}
            className="h-8 w-8 text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading menu items...</div>
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
          <h1 className="text-3xl font-bold text-foreground">Menu Management (Supabase)</h1>
          <p className="text-muted-foreground">Manage your restaurant's menu items with Supabase storage</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Menu Item
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border rounded-lg p-4"
        >
          <div className="text-2xl font-bold text-foreground">{items.length}</div>
          <div className="text-sm text-muted-foreground">Total Items</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-lg p-4"
        >
          <div className="text-2xl font-bold text-foreground">{categories.length}</div>
          <div className="text-sm text-muted-foreground">Categories</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border rounded-lg p-4"
        >
          <div className="text-2xl font-bold text-green-500">
            ${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Total Value</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border rounded-lg p-4"
        >
          <div className="text-2xl font-bold text-orange-500">{items.filter((item) => !item.is_available).length}</div>
          <div className="text-sm text-muted-foreground">Unavailable</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <DataTable
          data={items}
          columns={columns}
          searchKey="name"
          title="Menu Items"
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Item"
        />
      </motion.div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Menu Item" size="lg">
        <MenuForm
          formData={formData}
          updateFormData={updateFormData}
          onSubmit={handleAddItem}
          submitText="Add Item"
          onCancel={handleCancel}
        />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Menu Item" size="lg">
        <MenuForm
          formData={formData}
          updateFormData={updateFormData}
          onSubmit={handleEditItem}
          submitText="Update Item"
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  )
}

