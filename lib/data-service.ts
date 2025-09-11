import { createClient } from "@/lib/supabase/client"
import { auth } from "@/lib/firebase"
import { User } from "firebase/auth"

// Types for our restaurant data
export interface UserProfile {
  id: string
  name: string
  email: string
  restaurant_name: string
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  user_id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  customer_id?: string
  items: OrderItem[]
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  menu_item_id: string
  quantity: number
  price: number
  notes?: string
}

export interface InventoryItem {
  id: string
  user_id: string
  name: string
  category: string
  current_stock: number
  min_stock_level: number
  unit: string
  cost_per_unit: number
  supplier?: string
  created_at: string
  updated_at: string
}

export interface StaffMember {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  position: string
  hourly_rate?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

class DataService {
  private supabase = createClient()

  // Get current Firebase user
  private getCurrentUser(): User | null {
    return auth.currentUser
  }

  // Get current user ID
  private getCurrentUserId(): string | null {
    const user = this.getCurrentUser()
    return user?.uid || null
  }

  // User Profile Management
  async createUserProfile(userData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }

    return data
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    return data
  }

  // Menu Items Management
  async getMenuItems(): Promise<MenuItem[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    const { data, error } = await this.supabase
      .from('menu_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching menu items:', error)
      return []
    }

    return data || []
  }

  async createMenuItem(itemData: Omit<MenuItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MenuItem | null> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('menu_items')
      .insert({
        user_id: userId,
        ...itemData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating menu item:', error)
      return null
    }

    return data
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('menu_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating menu item:', error)
      return null
    }

    return data
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting menu item:', error)
      return false
    }

    return true
  }

  // Customers Management
  async getCustomers(): Promise<Customer[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return []
    }

    return data || []
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('customers')
      .insert({
        user_id: userId,
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return null
    }

    return data
  }

  // Orders Management
  async getOrders(): Promise<Order[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return []
    }

    return data || []
  }

  async createOrder(orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Order | null> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('orders')
      .insert({
        user_id: userId,
        ...orderData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return null
    }

    return data
  }

  // Inventory Management
  async getInventoryItems(): Promise<InventoryItem[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    const { data, error } = await this.supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inventory items:', error)
      return []
    }

    return data || []
  }

  async createInventoryItem(itemData: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<InventoryItem | null> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('inventory_items')
      .insert({
        user_id: userId,
        ...itemData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating inventory item:', error)
      return null
    }

    return data
  }

  // Staff Management
  async getStaffMembers(): Promise<StaffMember[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    const { data, error } = await this.supabase
      .from('staff_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staff members:', error)
      return []
    }

    return data || []
  }

  async createStaffMember(staffData: Omit<StaffMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<StaffMember | null> {
    const userId = this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('staff_members')
      .insert({
        user_id: userId,
        ...staffData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating staff member:', error)
      return null
    }

    return data
  }
}

export const dataService = new DataService()

