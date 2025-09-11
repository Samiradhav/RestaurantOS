"use client"

import { useState, useEffect } from "react"
import { supabaseDataService, type MenuItem } from "@/lib/supabase-data-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"

export default function SupabaseMenuExample() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    is_available: "true"
  })

  const categories = ["Pizza", "Salads", "Main Course", "Desserts", "Beverages", "Appetizers"]

  // Load menu items from Supabase
  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      const items = await supabaseDataService.getMenuItems()
      setMenuItems(items)
    } catch (error) {
      console.error('Error loading menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingItem) {
        // Update existing item
        const updatedItem = await supabaseDataService.updateMenuItem(editingItem.id, {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          is_available: formData.is_available === "true"
        })
        
        if (updatedItem) {
          setMenuItems(prev => 
            prev.map(item => item.id === editingItem.id ? updatedItem : item)
          )
          setEditingItem(null)
        }
      } else {
        // Create new item
        const newItem = await supabaseDataService.createMenuItem({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          is_available: formData.is_available === "true"
        })
        
        if (newItem) {
          setMenuItems(prev => [...prev, newItem])
        }
      }
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        is_available: "true"
      })
      setIsAdding(false)
    } catch (error) {
      console.error('Error saving menu item:', error)
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category,
      is_available: item.is_available.toString()
    })
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const success = await supabaseDataService.deleteMenuItem(id)
        if (success) {
          setMenuItems(prev => prev.filter(item => item.id !== id))
        }
      } catch (error) {
        console.error('Error deleting menu item:', error)
      }
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingItem(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      is_available: "true"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading menu items...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Menu Management (Supabase)</h2>
          <p className="text-muted-foreground">
            Manage your menu items with real Supabase data storage
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter item name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
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
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_available">Availability</Label>
                  <Select 
                    value={formData.is_available} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, is_available: value }))}
                  >
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
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Menu Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <Badge variant={item.is_available ? "default" : "secondary"}>
                  {item.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <Badge variant="outline" className="w-fit">
                {item.category}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">${item.price.toFixed(2)}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(item)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No menu items yet. Add your first item!</p>
        </div>
      )}
    </div>
  )
}
