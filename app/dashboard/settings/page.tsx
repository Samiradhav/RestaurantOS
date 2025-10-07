"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import {
  Save,
  Upload,
  Bell,
  Palette,
  Building,
  User,
  Shield,
  ExternalLink,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Modal } from "@/components/ui/modal"
import { supabaseDataService, type UserProfile, type Setting } from "@/lib/supabase-data-service"
import { useCurrency, type Currency } from "@/lib/currency-store"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { currency } = useCurrency()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Business settings interface for type safety
  interface BusinessSettings {
    currency: Currency
    timezone: string
    taxRate: string
    serviceCharge: string
  }

  // Notification settings interface
  interface NotificationSettings {
    lowStock: boolean
    newOrders: boolean
    customerUpdates: boolean
    systemUpdates: boolean
  }

  const [settings, setSettings] = useState({
    restaurantName: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    logo: "",
    theme: "dark",
    notifications: {
      lowStock: true,
      newOrders: true,
      customerUpdates: false,
      systemUpdates: true,
    } as NotificationSettings,
    business: {
      currency: currency,
      timezone: "America/New_York",
      taxRate: "8.5",
      serviceCharge: "15",
    } as BusinessSettings,
  })

  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Memoized load settings function to prevent unnecessary re-renders
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)

      // Load user profile first (fastest operation)
      const profile = await supabaseDataService.getUserProfile()
      if (profile) {
        setSettings(prev => ({
          ...prev,
          restaurantName: profile.restaurant_name || "",
          address: profile.address || "",
          phone: profile.phone || "",
          email: profile.email || "",
        }))
      }

      // Load settings from database in parallel
      const dbSettings = await supabaseDataService.getSettings()

      // Create a map of settings from database
      const settingsMap: Record<string, any> = {}
      dbSettings.forEach(setting => {
        try {
          // Try to parse JSON values, fallback to string if parsing fails
          settingsMap[setting.setting_key] = typeof setting.setting_value === 'string'
            ? JSON.parse(setting.setting_value)
            : setting.setting_value
        } catch {
          settingsMap[setting.setting_key] = setting.setting_value
        }
      })

      // Apply saved settings with proper defaults
      setSettings(prev => ({
        ...prev,
        description: settingsMap.description || "",
        logo: settingsMap.logo || "",
        theme: settingsMap.theme || "dark",
        notifications: {
          ...prev.notifications,
          ...(settingsMap.notifications || {}),
        } as NotificationSettings,
        business: {
          currency: (settingsMap.business?.currency as Currency) || currency || "INR",
          timezone: settingsMap.business?.timezone || "America/New_York",
          taxRate: settingsMap.business?.taxRate || "8.5",
          serviceCharge: settingsMap.business?.serviceCharge || "15",
        } as BusinessSettings,
      }))

      // Apply theme if saved and different from current theme
      if (settingsMap.theme && settingsMap.theme !== theme) {
        setTheme(settingsMap.theme)
      }

    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error Loading Settings",
        description: "Failed to load your restaurant settings. Using defaults.",
        variant: "destructive",
      })
    } finally {
      // Always set loading to false, even if there are errors
      setIsLoading(false)
    }
  }, [toast, setTheme, currency, theme])

  // Load settings only once on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!settings.restaurantName.trim()) {
      errors.restaurantName = "Restaurant name is required"
    }

    if (!settings.email.trim()) {
      errors.email = "Email is required"
    } else if (!validateEmail(settings.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (settings.phone && !validatePhone(settings.phone)) {
      errors.phone = "Please enter a valid phone number"
    }

    const taxRate = parseFloat(settings.business.taxRate)
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      errors.taxRate = "Tax rate must be between 0 and 100"
    }

    const serviceCharge = parseFloat(settings.business.serviceCharge)
    if (isNaN(serviceCharge) || serviceCharge < 0 || serviceCharge > 100) {
      errors.serviceCharge = "Service charge must be between 0 and 100"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: "" }))
    }
  }

  const updateNestedSetting = (section: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] && typeof prev[section as keyof typeof prev] === 'object' ? prev[section as keyof typeof prev] as Record<string, any> : {}),
        [key]: value
      },
    }))

    // Special handling for currency changes
    if (section === "business" && key === "currency") {
      const validCurrencies: Currency[] = ["INR"]
      if (validCurrencies.includes(value)) {
        toast({
          title: "Currency Setting Saved",
          description: `Currency setting updated to ${value}. All prices are displayed in INR.`,
        })
      }
    }

    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: "" }))
    }
  }

  // Theme change handler - simplified and robust
  const handleThemeChange = async (value: string) => {
    try {
      // Update local state immediately
      updateSetting("theme", value)

      // Apply theme immediately for instant feedback
      setTheme(value)

      // Try to save to database (async) - use upsert to handle both insert and update
      const saved = await supabaseDataService.upsertSetting("theme", value)

      if (saved) {
        toast({
          title: "Theme Updated",
          description: `Theme changed to ${value}.`,
        })
      } else {
        toast({
          title: "Theme Applied",
          description: `Theme changed to ${value}. Will sync when connection is restored.`,
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error('handleThemeChange: Error occurred:', error?.message || 'Unknown error')

      // Theme change was applied locally, so show success message
      toast({
        title: "Theme Changed",
        description: `Theme changed to ${value}.`,
        variant: "default",
      })
    }
  }

  // Logo upload with proper error handling
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Data = event.target.result as string
          updateSetting("logo", base64Data)

          // Save to database immediately using upsert
          await supabaseDataService.upsertSetting("logo", base64Data)

          toast({
            title: "Logo Uploaded Successfully",
            description: "Your restaurant logo has been updated.",
          })
        }
      }
      reader.onerror = () => {
        throw new Error("Failed to read file")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Password change with Supabase Auth
  const handlePasswordChangeSubmit = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated.",
      })
      setIsChangePasswordModalOpen(false)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // CSV conversion helper functions
  const convertToCSV = (data: any[], headers?: string[]): string => {
    if (!data || data.length === 0) return ''

    // Get headers from data keys if not provided
    const csvHeaders = headers || Object.keys(data[0])

    // Create CSV header row
    const headerRow = csvHeaders.join(',')

    // Create CSV data rows
    const dataRows = data.map(row =>
      csvHeaders.map(header => {
        const value = row[header]
        // Handle different data types and escape commas/quotes
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )

    return [headerRow, ...dataRows].join('\n')
  }

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Enhanced export data functionality with CSV support
  const handleExportData = async () => {
    setIsSaving(true)
    try {
      toast({
        title: "Exporting Data",
        description: "Fetching data from database...",
      })

      // Fetch all data from database in parallel
      const [dbCustomers, dbMenuItems, dbOrders, dbInventory, dbStaff] = await Promise.all([
        supabaseDataService.getCustomers(),
        supabaseDataService.getMenuItems(),
        supabaseDataService.getOrders(),
        supabaseDataService.getInventoryItems(),
        supabaseDataService.getStaffMembers(),
      ])

      // Transform and format data for CSV export
      const exportDate = new Date().toISOString().split('T')[0]

      // 1. Export Customers
      if (dbCustomers.length > 0) {
        const customerHeaders = ['id', 'name', 'email', 'phone', 'address', 'loyalty_points', 'total_orders', 'last_order_date', 'notes', 'created_at', 'updated_at']
        const customerCSV = convertToCSV(
          dbCustomers.map(customer => ({
            ...customer,
            last_order_date: customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : '',
            created_at: new Date(customer.created_at).toLocaleDateString(),
            updated_at: new Date(customer.updated_at).toLocaleDateString(),
          })),
          customerHeaders
        )
        downloadCSV(customerCSV, `customers-${exportDate}.csv`)
      }

      // 2. Export Menu Items
      if (dbMenuItems.length > 0) {
        const menuHeaders = ['id', 'name', 'description', 'price', 'category', 'image_url', 'is_available', 'preparation_time', 'ingredients', 'allergens', 'created_at', 'updated_at']
        const menuCSV = convertToCSV(
          dbMenuItems.map(item => ({
            ...item,
            ingredients: Array.isArray(item.ingredients) ? item.ingredients.join('; ') : item.ingredients,
            allergens: Array.isArray(item.allergens) ? item.allergens.join('; ') : item.allergens,
            created_at: new Date(item.created_at).toLocaleDateString(),
            updated_at: new Date(item.updated_at).toLocaleDateString(),
          })),
          menuHeaders
        )
        downloadCSV(menuCSV, `menu-items-${exportDate}.csv`)
      }

      // 3. Export Orders
      if (dbOrders.length > 0) {
        const orderHeaders = ['id', 'order_number', 'customer_id', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'status', 'payment_status', 'payment_method', 'delivery_address', 'delivery_fee', 'notes', 'created_at', 'updated_at']
        const orderCSV = convertToCSV(
          dbOrders.map(order => ({
            ...order,
            items: JSON.stringify(order.items), // Store items as JSON string
            created_at: new Date(order.created_at).toLocaleDateString(),
            updated_at: new Date(order.updated_at).toLocaleDateString(),
          })),
          orderHeaders
        )
        downloadCSV(orderCSV, `orders-${exportDate}.csv`)
      }

      // 4. Export Inventory
      if (dbInventory.length > 0) {
        const inventoryHeaders = ['id', 'name', 'category', 'current_stock', 'min_stock_level', 'max_stock_level', 'unit', 'cost_per_unit', 'selling_price', 'supplier', 'supplier_contact', 'expiry_date', 'location', 'barcode', 'created_at', 'updated_at']
        const inventoryCSV = convertToCSV(
          dbInventory.map(item => ({
            ...item,
            expiry_date: item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '',
            created_at: new Date(item.created_at).toLocaleDateString(),
            updated_at: new Date(item.updated_at).toLocaleDateString(),
          })),
          inventoryHeaders
        )
        downloadCSV(inventoryCSV, `inventory-${exportDate}.csv`)
      }

      // 5. Export Staff Members
      if (dbStaff.length > 0) {
        const staffHeaders = ['id', 'employee_id', 'name', 'email', 'phone', 'position', 'department', 'hourly_rate', 'salary', 'hire_date', 'is_active', 'emergency_contact', 'emergency_phone', 'address', 'skills', 'created_at', 'updated_at']
        const staffCSV = convertToCSV(
          dbStaff.map(staff => ({
            ...staff,
            hire_date: staff.hire_date ? new Date(staff.hire_date).toLocaleDateString() : '',
            skills: Array.isArray(staff.skills) ? staff.skills.join('; ') : staff.skills,
            created_at: new Date(staff.created_at).toLocaleDateString(),
            updated_at: new Date(staff.updated_at).toLocaleDateString(),
          })),
          staffHeaders
        )
        downloadCSV(staffCSV, `staff-${exportDate}.csv`)
      }

      // 6. Export Settings Summary
      const settingsSummary = {
        export_date: exportDate,
        total_customers: dbCustomers.length,
        total_menu_items: dbMenuItems.length,
        total_orders: dbOrders.length,
        total_inventory_items: dbInventory.length,
        total_staff_members: dbStaff.length,
        user_id: user?.id,
        restaurant_name: settings.restaurantName,
        currency: settings.business.currency,
        timezone: settings.business.timezone,
      }

      const settingsCSV = convertToCSV([settingsSummary])
      downloadCSV(settingsCSV, `export-summary-${exportDate}.csv`)

      toast({
        title: "Export Complete! 🎉",
        description: `Successfully exported ${dbCustomers.length + dbMenuItems.length + dbOrders.length + dbInventory.length + dbStaff.length + 1} records across 6 CSV files`,
        duration: 5000,
      })

    } catch (error: any) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Account deletion with proper confirmation
  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== "DELETE") return

    setIsSaving(true)
    try {
      // Delete all user data first
      await Promise.all([
        supabaseDataService.getMenuItems().then(items =>
          Promise.all(items.map(item => supabaseDataService.deleteMenuItem(item.id)))
        ),
        supabaseDataService.getCustomers().then(customers =>
          Promise.all(customers.map(customer => supabaseDataService.deleteCustomer(customer.id)))
        ),
        supabaseDataService.getOrders().then(orders =>
          Promise.all(orders.map(order => supabaseDataService.deleteOrder(order.id)))
        ),
        supabaseDataService.getInventoryItems().then(items =>
          Promise.all(items.map(item => supabaseDataService.deleteInventoryItem(item.id)))
        ),
      ])

      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user!.id)
      if (error) throw error

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      })

      // Logout user
      await logout()
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Save all settings to database with improved error handling and sequential processing
  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Save user profile first
      const profileUpdates: Partial<UserProfile> = {
        restaurant_name: settings.restaurantName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
      }
      await supabaseDataService.updateUserProfile(profileUpdates)

      // Save settings sequentially to avoid conflicts
      const settingsToSave = [
        { key: "description", value: settings.description },
        { key: "logo", value: settings.logo },
        { key: "notifications", value: JSON.stringify(settings.notifications) },
        { key: "business", value: JSON.stringify(settings.business) },
      ]

      // Save settings one by one with retry logic
      for (const setting of settingsToSave) {
        let retries = 3
        while (retries > 0) {
          try {
            // Use upsert instead of setSetting to handle both insert and update
            await supabaseDataService.upsertSetting(setting.key, setting.value)
            break // Success, exit retry loop
          } catch (error: any) {
            console.error(`Error saving setting ${setting.key}:`, error)
            retries--
            if (retries === 0) {
              throw new Error(`Failed to save setting: ${setting.key}`)
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      toast({
        title: "✅ Settings Saved Successfully!",
        description: "Your restaurant settings have been updated and synced.",
        duration: 4000,
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "❌ Save Failed",
        description: error.message || "Unable to save settings. Please check your connection and try again.",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Account management states
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your restaurant settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Restaurant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurantName">Restaurant Name *</Label>
                    <Input
                      id="restaurantName"
                      value={settings.restaurantName}
                      onChange={(e) => updateSetting("restaurantName", e.target.value)}
                      className={validationErrors.restaurantName ? "border-red-500" : ""}
                    />
                    {validationErrors.restaurantName && (
                      <p className="text-sm text-red-500">{validationErrors.restaurantName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => updateSetting("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className={validationErrors.phone ? "border-red-500" : ""}
                    />
                    {validationErrors.phone && (
                      <p className="text-sm text-red-500">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting("email", e.target.value)}
                    className={validationErrors.email ? "border-red-500" : ""}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => updateSetting("address", e.target.value)}
                    rows={3}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={settings.description}
                    onChange={(e) => updateSetting("description", e.target.value)}
                    rows={3}
                    placeholder="Tell customers about your restaurant..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo Upload</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => document.getElementById('logo')?.click()}
                      disabled={isSaving}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {settings.logo && (
                    <div className="mt-2">
                      <img
                        src={settings.logo}
                        alt="Restaurant Logo"
                        className="h-16 w-16 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Business Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={settings.business.currency}
                      onValueChange={(value) => updateNestedSetting("business", "currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      All prices and revenue will be displayed in the selected currency
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.business.timezone}
                      onValueChange={(value) => updateNestedSetting("business", "timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                        <SelectItem value="Europe/London">London Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.business.taxRate}
                      onChange={(e) => updateNestedSetting("business", "taxRate", e.target.value)}
                      className={validationErrors.taxRate ? "border-red-500" : ""}
                    />
                    {validationErrors.taxRate && (
                      <p className="text-sm text-red-500">{validationErrors.taxRate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceCharge">Service Charge (%)</Label>
                    <Input
                      id="serviceCharge"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.business.serviceCharge}
                      onChange={(e) => updateNestedSetting("business", "serviceCharge", e.target.value)}
                      className={validationErrors.serviceCharge ? "border-red-500" : ""}
                    />
                    {validationErrors.serviceCharge && (
                      <p className="text-sm text-red-500">{validationErrors.serviceCharge}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleExportData}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Export Data to CSV
                </Button>
                <p className="text-xs text-muted-foreground px-2">
                  Export all restaurant data (customers, menu, orders, inventory, staff) as CSV files that can be opened in Excel
                </p>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setIsDeleteAccountModalOpen(true)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred theme for the application
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when items are running low</p>
                  </div>
                  <Switch
                    checked={settings.notifications.lowStock}
                    onCheckedChange={(checked) => updateNestedSetting("notifications", "lowStock", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Orders</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new orders</p>
                  </div>
                  <Switch
                    checked={settings.notifications.newOrders}
                    onCheckedChange={(checked) => updateNestedSetting("notifications", "newOrders", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Customer Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about customer changes</p>
                  </div>
                  <Switch
                    checked={settings.notifications.customerUpdates}
                    onCheckedChange={(checked) => updateNestedSetting("notifications", "customerUpdates", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about system updates</p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemUpdates}
                    onCheckedChange={(checked) => updateNestedSetting("notifications", "systemUpdates", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Legal & Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/terms" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Terms of Service
                  </Button>
                </Link>
                <Link href="/privacy" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </Button>
                </Link>
                <Link href="/refund-policy" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Refund Policy
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handlePasswordChangeSubmit}
              disabled={isSaving || !passwordForm.newPassword || !passwordForm.confirmPassword}
              className="flex-1"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Change Password
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangePasswordModalOpen(false)
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Are you sure you want to delete your account?
            </h3>
            <p className="text-muted-foreground mb-4">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
            </p>
            <ul className="text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
              <li>Restaurant profile and settings</li>
              <li>All menu items and categories</li>
              <li>Customer information and history</li>
              <li>Order records and history</li>
              <li>Inventory data</li>
              <li>Staff information</li>
              <li>All uploaded files and images</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deleteConfirmation">
              Type "DELETE" to confirm:
            </Label>
            <Input
              id="deleteConfirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleAccountDeletion}
              disabled={isSaving || deleteConfirmation !== "DELETE"}
              className="flex-1"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Account
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteAccountModalOpen(false)
                setDeleteConfirmation("")
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}