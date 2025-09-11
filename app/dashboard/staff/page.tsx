"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Clock, UserCheck, UserX, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { DataTable } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrency } from "@/lib/currency-store"
import { supabaseDataService, StaffMember } from "@/lib/supabase-data-service"
import { useToast } from "@/hooks/use-toast"

const roles = ["Head Chef", "Sous Chef", "Cook", "Waitress", "Waiter", "Kitchen Helper", "Cashier", "Manager"]

interface StaffFormData {
  employee_id: string
  name: string
  position: string
  email: string
  phone: string
  salary: number
  hire_date: string
  is_active: boolean
}

interface StaffFormProps {
  staff: StaffFormData | StaffMember
  onStaffChange: (field: string, value: string | number | boolean) => void
  isEdit?: boolean
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { currency, formatPrice } = useCurrency()
  const { toast } = useToast()

  const [newStaff, setNewStaff] = useState<StaffFormData>({
    employee_id: "",
    name: "",
    position: "",
    email: "",
    phone: "",
    salary: 0,
    hire_date: "",
    is_active: true,
  })

  // Load staff from Supabase
  useEffect(() => {
    const loadStaff = async () => {
      setIsLoading(true)
      try {
        const staffData = await supabaseDataService.getStaffMembers()
        setStaff(staffData || [])
      } catch (error) {
        console.error("Error loading staff:", error)
        toast({
          title: "Error loading staff",
          description: "Failed to load staff members. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadStaff()
  }, [toast])

  const handleAddStaff = useCallback(async () => {
    try {
      // Basic form validation before submission
      if (!newStaff.name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter the staff member's name.",
          variant: "destructive",
        })
        return
      }
      if (!newStaff.position?.trim()) {
        toast({
          title: "Validation Error", 
          description: "Please select a position for the staff member.",
          variant: "destructive",
        })
        return
      }
      if (!newStaff.salary || newStaff.salary <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid salary greater than 0.",
          variant: "destructive",
        })
        return
      }

      // Convert empty string to undefined for date fields
      const hireDate = newStaff.hire_date === "" ? undefined : newStaff.hire_date;
      
      const created = await supabaseDataService.createStaffMember({
        employee_id: newStaff.employee_id?.trim() || undefined,
        name: newStaff.name.trim(),
        position: newStaff.position.trim(),
        email: newStaff.email?.trim() || undefined,
        phone: newStaff.phone?.trim() || undefined,
        salary: newStaff.salary,
        hire_date: hireDate,
        is_active: newStaff.is_active,
      })

      if (created) {
        setStaff((prev) => [...prev, created])
        setNewStaff({
          employee_id: "",
          name: "",
          position: "",
          email: "",
          phone: "",
          salary: 0,
          hire_date: "",
          is_active: true,
        })
        setIsAddModalOpen(false)
        
        toast({
          title: "Staff member added successfully!",
          description: `${newStaff.name} has been added to your staff.`,
        })
      }
    } catch (error) {
      console.error("Error adding staff:", error)
      
      const errorMessage = error instanceof Error ? error.message : "Please check all fields and try again."
      
      toast({
        title: "Error adding staff",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [newStaff, toast])

  const handleEditStaff = useCallback(async () => {
    if (!selectedStaff) return
    
    try {
      // Convert empty string to undefined for date fields
      const hireDate = selectedStaff.hire_date === "" ? undefined : selectedStaff.hire_date;
      
      const updated = await supabaseDataService.updateStaffMember(selectedStaff.id, {
        employee_id: selectedStaff.employee_id?.trim() || undefined,
        name: selectedStaff.name.trim(),
        position: selectedStaff.position.trim(),
        email: selectedStaff.email?.trim() || undefined,
        phone: selectedStaff.phone?.trim() || undefined,
        salary: selectedStaff.salary,
        hire_date: hireDate,
        is_active: selectedStaff.is_active,
      })

      if (updated) {
        setStaff((prev) => prev.map((s) => (s.id === selectedStaff.id ? updated : s)))
        setIsEditModalOpen(false)
        setSelectedStaff(null)
        
        toast({
          title: "Staff member updated successfully!",
          description: `${selectedStaff.name}'s details have been updated.`,
        })
      }
    } catch (error) {
      console.error("Error updating staff:", error)
      const errorMessage = error instanceof Error ? error.message : "Please check all fields and try again."
      
      toast({
        title: "Error updating staff",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [selectedStaff, toast])

  const handleDeleteStaff = useCallback(async (id: string) => {
    try {
      const success = await supabaseDataService.deleteStaffMember(id)
      if (success) {
        setStaff((prev) => prev.filter((s) => s.id !== id))
        toast({
          title: "Staff member deleted successfully!",
          description: "The staff member has been removed from your system.",
        })
      } else {
        throw new Error("Failed to delete staff member")
      }
    } catch (error) {
      console.error("Error deleting staff:", error)
      toast({
        title: "Error deleting staff",
        description: "Failed to delete staff member. Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

  const updateNewStaff = useCallback((field: string, value: string | number | boolean) => {
    setNewStaff((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateSelectedStaff = useCallback((field: string, value: string | number | boolean) => {
    if (selectedStaff) {
      setSelectedStaff((prev) => {
        if (!prev) return null
        return { ...prev, [field]: value }
      })
    }
  }, [selectedStaff])

  const totalStaff = staff.length
  const activeStaff = staff.filter((s) => s.is_active).length
  const totalSalary = staff.reduce((sum, s) => sum + (s.salary || 0), 0)
  
  // Safe calculation to avoid division by zero
  const avgAttendance =
    staff.length > 0
      ? staff.reduce((sum, s) => sum + 100, 0) / staff.length // Simplified for now
      : 0

  // Properly typed columns for DataTable
  const columns = [
    { 
      key: "employee_id" as const, 
      label: "Staff ID",
      render: (value: string) => value || "N/A"
    },
    { key: "name" as const, label: "Name" },
    { 
      key: "position" as const, 
      label: "Role" 
    },
    { 
      key: "hire_date" as const, 
      label: "Joining Date",
      render: (value: string) => value ? new Date(value).toLocaleDateString() : "N/A"
    },
    { 
      key: "salary" as const, 
      label: "Salary",
      render: (value: number) => formatPrice(value || 0)
    },
    { 
      key: "is_active" as const, 
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      key: "actions" as const,
      label: "Actions",
      render: (_: any, item: StaffMember) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedStaff(item)
              setIsAttendanceModalOpen(true)
            }}
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedStaff(item)
              setIsEditModalOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleDeleteStaff(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const StaffForm = useCallback(({ staff: staffData, onStaffChange, isEdit = false }: StaffFormProps) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium mb-2">Staff ID</Label>
          <Input
            value={staffData.employee_id || ""}
            onChange={(e) => onStaffChange("employee_id", e.target.value)}
            placeholder="EMP001"
            disabled={isEdit}
            autoFocus={!isEdit}
          />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-2">Full Name *</Label>
          <Input
            value={staffData.name || ""}
            onChange={(e) => onStaffChange("name", e.target.value)}
            placeholder="Enter full name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium mb-2">Role *</Label>
          <Select 
            value={staffData.position || ""}
            onValueChange={(value) => onStaffChange("position", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="block text-sm font-medium mb-2">Joining Date</Label>
          <Input
            type="date"
            value={staffData.hire_date || ""}
            onChange={(e) => onStaffChange("hire_date", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium mb-2">Phone</Label>
          <Input
            value={staffData.phone || ""}
            onChange={(e) => onStaffChange("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-2">Email</Label>
          <Input
            type="email"
            value={staffData.email || ""}
            onChange={(e) => onStaffChange("email", e.target.value)}
            placeholder="staff@restaurant.com"
          />
        </div>
      </div>

      <div>
        <Label className="block text-sm font-medium mb-2">Monthly Salary ({currency}) *</Label>
        <Input
          type="number"
          value={staffData.salary || ""}
          onChange={(e) => onStaffChange("salary", e.target.value === "" ? 0 : Number(e.target.value))}
          placeholder="25000"
          min="0"
          step="0.01"
          required
        />
      </div>
    </div>
  ), [currency])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading staff data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage your restaurant staff and attendance</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStaff}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeStaff}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Salary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalSalary)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{avgAttendance.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={staff}
            columns={columns}
            searchKey="name"
            onAdd={() => setIsAddModalOpen(true)}
            addButtonText="Add Staff"
          />
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Staff Member">
        <StaffForm staff={newStaff} onStaffChange={updateNewStaff} />
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddStaff}>Add Staff</Button>
        </div>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Staff Member">
        {selectedStaff && (
          <>
            <StaffForm staff={selectedStaff} onStaffChange={updateSelectedStaff} isEdit={true} />
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditStaff}>Update Staff</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title={`Attendance - ${selectedStaff?.name || ""}`}
      >
        {selectedStaff && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-yellow-600">Late</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center text-muted-foreground">
              Attendance tracking will be implemented in a future update.
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}