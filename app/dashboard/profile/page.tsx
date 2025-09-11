"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Phone, MapPin, Building, Edit, Save, X, Camera, CheckCircle, DollarSign, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { supabaseDataService } from "@/lib/supabase-data-service"
import { useToast } from "@/hooks/use-toast"

// Define the correct User type based on your auth provider
interface AppUser {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  // Add other properties your auth user might have
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Cast user to AppUser type to access the properties
  const appUser = user as unknown as AppUser;
  
  const [profileData, setProfileData] = useState({
    name: appUser?.displayName || "",
    email: appUser?.email || "",
    phone: "",
    address: "",
    restaurantName: "",
    bio: "",
    avatar: appUser?.photoURL || "/placeholder-user.jpg",
  })

  // ✅ NEW - Real data from Supabase
  const [realStats, setRealStats] = useState({
    totalSales: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    todayOrders: 0,
    monthlyRevenue: 0,
    topSellingItem: "",
    averageOrderValue: 0,
  })

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await supabaseDataService.getUserProfile()
      if (profile) {
        setProfileData({
          name: profile.name || appUser?.displayName || "",
          email: profile.email || appUser?.email || "",
          phone: profile.phone || "",
          address: profile.address || "",
          restaurantName: profile.restaurant_name || "",
          bio: "",
          avatar: appUser?.photoURL || "/placeholder-user.jpg",
        })
      }
    }
    loadProfile()
  }, [appUser])

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const [customersData, menuData, ordersData, inventoryData] = await Promise.all([
          supabaseDataService.getCustomers(),
          supabaseDataService.getMenuItems(),
          supabaseDataService.getOrders(),
          supabaseDataService.getInventoryItems(),
        ])

        // Calculate real statistics - FIXED: Use correct status comparison
        const totalSales = ordersData
          .filter(order => order.status === 'delivered') // Use 'delivered' instead of 'completed'
          .reduce((sum, order) => sum + order.total_amount, 0)

        const totalCustomers = customersData.length
        const pendingOrders = ordersData.filter(order => 
          order.status === 'pending' || order.status === 'confirmed'
        ).length

        const lowStockItems = inventoryData.filter(item => 
          item.current_stock <= item.min_stock_level
        ).length

        // FIXED: Parse date strings properly
        const today = new Date().toDateString();
        const todayOrders = ordersData.filter(order => {
          const orderDate = new Date(order.created_at).toDateString();
          return orderDate === today;
        }).length

        // ... calculate other stats

        setRealStats({
          totalSales,
          totalCustomers,
          pendingOrders,
          lowStockItems,
          todayOrders,
          monthlyRevenue: totalSales,
          topSellingItem: menuData.length > 0 ? menuData[0].name : "No items",
          averageOrderValue: ordersData.length > 0 ? totalSales / ordersData.length : 0,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      }
    }

    loadRealData()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedProfile = await supabaseDataService.updateUserProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        restaurant_name: profileData.restaurantName,
      })

      if (updatedProfile) {
        toast({
          title: "✅ Profile Updated Successfully!",
          description: "Your profile information has been saved and synced.",
          duration: 4000,
        })
        setIsEditing(false)
      } else {
        toast({
          title: "❌ Save Failed",
          description: "Unable to save profile. Please check your connection and try again.",
          variant: "destructive",
          duration: 4000,
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred while saving your profile.",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original data by reloading from Supabase
    const loadProfile = async () => {
      const profile = await supabaseDataService.getUserProfile()
      if (profile) {
        setProfileData({
          name: profile.name || appUser?.displayName || "",
          email: profile.email || appUser?.email || "",
          phone: profile.phone || "",
          address: profile.address || "",
          restaurantName: profile.restaurant_name || "",
          bio: "",
          avatar: appUser?.photoURL || "/placeholder-user.jpg",
        })
      }
    }
    loadProfile()
    setIsEditing(false)
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setProfileData((prev) => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
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
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal and restaurant information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Save className="h-4 w-4" />
                </motion.div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="gap-2 bg-transparent">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border rounded-lg p-6"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg">
                <img
                  src={profileData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">{profileData.name || "Restaurant Owner"}</h2>
              <p className="text-muted-foreground">Restaurant Owner</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-foreground font-medium">{profileData.name || "Not set"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-foreground font-medium">{profileData.email || "Not set"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-foreground font-medium">{profileData.phone || "Not set"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Restaurant Name
                </Label>
                {isEditing ? (
                  <Input
                    id="restaurant"
                    value={profileData.restaurantName}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, restaurantName: e.target.value }))}
                    placeholder="Enter restaurant name"
                  />
                ) : (
                  <p className="text-foreground font-medium">{profileData.restaurantName || "Not set"}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your address"
                />
              ) : (
                <p className="text-foreground font-medium">{profileData.address || "Not set"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  placeholder="Tell us about yourself and your restaurant..."
                />
              ) : (
                <p className="text-foreground">{profileData.bio || "Not set"}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}