"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Phone, Mail, MapPin, FileText, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DataTable } from "@/components/ui/data-table"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { useCustomerStore } from "@/lib/shared-state"
import { supabaseDataService } from "@/lib/supabase-data-service"

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  totalOrders?: number
  lastOrder?: string
}

export default function CustomersPage() {
  const { customers: customerList, setCustomers, addCustomer, updateCustomer, deleteCustomer } = useCustomerStore()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    billNo: "",
  })

  useEffect(() => {
    (async () => {
      const data = await supabaseDataService.getCustomers()
      setCustomers(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || "",
          email: c.email || "",
          address: c.address || "",
          totalOrders: 0,
          lastOrder: "Never",
        })) as any,
      )
    })()
  }, [setCustomers])

  const generateBillNo = () => ""

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      billNo: generateBillNo(),
    })
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    const created = await supabaseDataService.createCustomer({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
    } as any)
    if (created) {
      addCustomer({
        id: created.id,
        name: created.name,
        phone: created.phone || "",
        email: created.email || "",
        address: created.address || "",
        totalOrders: 0,
        lastOrder: "Never",
      } as any)
    }
    setIsAddModalOpen(false)
    resetForm()
  }

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return
    const updated = await supabaseDataService.updateCustomer(editingCustomer.id as any, {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
    } as any)
    if (updated) {
      updateCustomer(editingCustomer.id as any, {
        name: updated.name,
        phone: updated.phone || "",
        email: updated.email || "",
        address: updated.address || "",
      })
    }
    setIsEditModalOpen(false)
    setEditingCustomer(null)
    resetForm()
  }

  const handleDeleteCustomer = async (id: string) => {
    // delete via service not implemented above; keep local delete for now
    deleteCustomer(id as any)
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      billNo: "",
    })
    setIsEditModalOpen(true)
  }

  const openAddModal = () => {
    resetForm()
    setFormData((prev) => ({ ...prev, billNo: generateBillNo() }))
    setIsAddModalOpen(true)
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const columns = [
    {
      key: "name" as keyof Customer,
      label: "Customer",
      render: (value: string, customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground">{customer.billNo}</div>
          </div>
        </div>
      ),
    },
    {
      key: "phone" as keyof Customer,
      label: "Contact",
      render: (value: string, customer: Customer) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground">{value}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{customer.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "address" as keyof Customer,
      label: "Address",
      render: (value: string) => (
        <div className="flex items-start gap-2 max-w-xs">
          <MapPin className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
          <span className="text-sm text-muted-foreground line-clamp-2">{value}</span>
        </div>
      ),
    },
    {
      key: "totalOrders" as keyof Customer,
      label: "Orders",
      render: (value: number, customer: Customer) => (
        <div className="text-center">
          <div className="font-medium text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">
            Last: {customer.lastOrder === "Never" ? "Never" : new Date(customer.lastOrder).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: "status" as keyof Customer,
      label: "Status",
      render: (value: number) => (
        <Badge
          variant={value > 10 ? "default" : value > 0 ? "secondary" : "outline"}
          className={
            value > 10
              ? "bg-green-500/20 text-green-500"
              : value > 0
                ? "bg-blue-500/20 text-blue-500"
                : "bg-gray-500/20 text-gray-500"
          }
        >
          {value > 10 ? "VIP" : value > 0 ? "Regular" : "New"}
        </Badge>
      ),
    },
    {
      key: "id" as keyof Customer,
      label: "Actions",
      render: (value: number, customer: Customer) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditModal(customer)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteCustomer(value)}
            className="h-8 w-8 text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const CustomerForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void; submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Enter customer name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="billNo">Bill Number</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="billNo"
              placeholder="Auto-generated"
              value={formData.billNo}
              onChange={(e) => updateFormData("billNo", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            id="address"
            placeholder="Enter customer address"
            value={formData.address}
            onChange={(e) => updateFormData("address", e.target.value)}
            className="pl-10 min-h-[80px]"
            required
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {submitText}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddModalOpen(false)
            setIsEditModalOpen(false)
            resetForm()
          }}
          className="flex-1 bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </form>
  )

  const totalCustomers = customerList.length
  const vipCustomers = customerList.filter((c) => c.totalOrders > 10).length
  const regularCustomers = customerList.filter((c) => c.totalOrders > 0 && c.totalOrders <= 10).length
  const newCustomers = customerList.filter((c) => c.totalOrders === 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Manage your restaurant's customer database and relationships</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border rounded-lg p-4"
        >
          <div className="text-2xl font-bold text-foreground">{totalCustomers}</div>
          <div className="text-sm text-muted-foreground">Total Customers</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-lg p-4"
        >
          <div className="text-2xl font-bold text-green-500">{vipCustomers}</div>
          <div className="text-sm text-muted-foreground">VIP Customers</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border rounded-lg p-4"
        >
          <div className="text-2xl font-bold text-blue-500">{regularCustomers}</div>
          <div className="text-sm text-muted-foreground">Regular Customers</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border rounded-lg p-4"
        >
          <div className="text-2xl font-bold text-orange-500">{newCustomers}</div>
          <div className="text-sm text-muted-foreground">New Customers</div>
        </motion.div>
      </div>

      {/* Customers Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <DataTable
          data={customerList}
          columns={columns}
          searchKey="name"
          title="Customer Database"
          onAdd={openAddModal}
          addButtonText="Add Customer"
        />
      </motion.div>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer" size="lg">
        <CustomerForm onSubmit={handleAddCustomer} submitText="Add Customer" />
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer" size="lg">
        <CustomerForm onSubmit={handleEditCustomer} submitText="Update Customer" />
      </Modal>
    </div>
  )
}
