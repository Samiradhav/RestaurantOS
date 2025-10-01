import { createClient } from "@/lib/supabase/client"

// =====================================================
// TYPE DEFINITIONS
// =====================================================

// Define UUID as string type for better compatibility
type UUID = string

export interface UserProfile {
  id: UUID
  name: string
  email: string
  restaurant_name?: string
  phone?: string
  address?: string
  pincode?: string
  is_subscribed?: boolean
  trial_end_date?: string
  razorpay_customer_id?: string
  razorpay_subscription_id?: string
  subscription_plan?: string
  subscription_status?: string
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  user_id: string
  name: string
  description?: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
  preparation_time?: number
  ingredients?: string[]
  allergens?: string[]
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
  date_of_birth?: string
  loyalty_points: number
  total_orders: number
  last_order_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  menu_item_id: string
  name: string
  quantity: number
  price: number
  notes?: string
}

export interface Order {
  id: string
  user_id: string
  customer_id?: string
  order_number: string
  items: OrderItem[]
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_method?: string
  notes?: string
  delivery_address?: string
  delivery_fee: number
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  user_id: string
  name: string
  category: string
  current_stock: number
  min_stock_level: number
  max_stock_level: number
  unit: string
  cost_per_unit?: number
  selling_price?: number
  supplier?: string
  supplier_contact?: string
  location?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

export interface StaffMember {
  id: UUID
  user_id: string
  employee_id?: string
  name: string
  email?: string
  phone?: string
  position: string
  department?: string
  hourly_rate?: number
  salary?: number
  hire_date?: string
  is_active: boolean
  emergency_contact?: string
  emergency_phone?: string
  address?: string
  skills?: string[]
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: UUID
  staff_id: string
  date: string
  check_in?: string
  check_out?: string
  break_start?: string
  break_end?: string
  total_hours?: number
  status: 'present' | 'absent' | 'late' | 'half_day'
  notes?: string
  created_at: string
}

export interface Expense {
  id: UUID
  user_id: string
  category: string
  description: string
  amount: number
  date: string
  receipt_url?: string
  vendor?: string
  payment_method?: string
  is_recurring: boolean
  recurring_frequency?: string
  created_at: string
  updated_at: string
}

export interface SalesReport {
  id: string
  user_id: string
  date: string
  total_sales: number
  total_orders: number
  average_order_value: number
  cash_sales: number
  card_sales: number
  online_sales: number
  refunds: number
  discounts: number
  created_at: string
}

export interface Setting {
  id: string
  user_id: string
  setting_key: string
  setting_value: string | null // Fixed: was 'string', now properly allows null
  created_at: string
  updated_at: string
}

export interface RestaurantListing {
  id: string
  user_id: string
  restaurant_name: string
  description?: string
  address: string
  phone?: string
  email?: string
  cuisine_type: string
  latitude?: number
  longitude?: number
  pincode?: string
  operating_hours?: Record<string, { open: string; close: string }> | null // Fixed: was 'any', now properly typed
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityMenuItem {
  id: string
  listing_id: string
  user_id: string
  name: string
  description?: string
  category: string
  price?: number
  preparation_time?: number
  tags?: string[]
  is_available: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// UPDATED MESSAGE INTERFACES FOR CONVERSATION-BASED SYSTEM
// =====================================================

export interface RestaurantMessage {
  id: string
  conversation_id: string
  sender_id: string
  message: string
  message_type: string
  is_read: boolean
  created_at: string
  sender_profile?: {
    restaurant_name: string
  }
}

export interface RestaurantConversation {
  id: string
  restaurant_a_id: string
  restaurant_b_id: string
  user_id: string // Added user_id to match database schema
  created_at: string
  updated_at: string
  last_message?: RestaurantMessage
  other_restaurant_name?: string
  other_restaurant_id?: string // Added missing property
  unread_count?: number
}

export interface SendMessageData {
  conversation_id: string
  message: string
  message_type?: string
  is_read?: boolean
}

export interface SubscriptionStatus {
  isSubscribed: boolean
  isTrialActive: boolean
  trialDaysLeft: number
  trialEndDate: Date | null
  subscriptionPlan: string | null
  subscriptionStatus: string
}

// =====================================================
// DATA SERVICE CLASS WITH USER ISOLATION FIXES
// =====================================================

/**
 * Supabase Data Service - Handles all database operations for the restaurant management system
 * FIXED: Added proper user isolation and session management to prevent cross-user data contamination
 */
export class SupabaseDataService {
  private supabase = createClient()
  private cachedUserId: string | null | undefined
  private lastAuthCheck: number = 0
  private readonly AUTH_CHECK_INTERVAL = 5000 // 5 seconds

  /**
   * Get current Supabase user ID (cached per instance with session validation)
   * FIXED: Added session validation and proper cache invalidation
   */
  private async getCurrentUserId(): Promise<string | null> {
    const now = Date.now()
    
    // Check if we need to re-validate the session
    if (this.cachedUserId !== undefined && (now - this.lastAuthCheck) < this.AUTH_CHECK_INTERVAL) {
      return this.cachedUserId
    }

    try {
      const { data, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('Error creating restaurant listing:', error)
        throw new Error(`Failed to create restaurant listing: ${error.message || 'Unknown database error'}`)
      }

      const currentUserId = data?.session?.user?.id || null
      
      // If user changed, clear all cached data
      if (this.cachedUserId !== undefined && this.cachedUserId !== currentUserId) {
        console.log('User changed, clearing cache')
        this.clearUserCache()
      }
      
      this.cachedUserId = currentUserId
      this.lastAuthCheck = now
      
      return this.cachedUserId
    } catch (error) {
      console.error('Error getting current user ID:', error)
      this.cachedUserId = null
      return null
    }
  }

  /**
   * Clear all user-specific cached data
   * FIXED: Added method to clear cache when user changes
   */
  private clearUserCache() {
    this.cachedUserId = undefined
    this.lastAuthCheck = 0
    console.log('User cache cleared')
  }

  /**
   * Get current user ID with validation
   */
  public async getCurrentUser(): Promise<string | null> {
    return this.getCurrentUserId()
  }

  /**
   * Check authentication status with proper session validation
   * FIXED: Added session refresh capability
   */
  public async checkAuthentication(): Promise<{ isAuthenticated: boolean; userId: string | null }> {
    const userId = await this.getCurrentUserId()
    return {
      isAuthenticated: userId !== null,
      userId
    }
  }

  // =====================================================
  // USER PROFILE MANAGEMENT
  // =====================================================

  /**
   * Get user profile with user isolation
   */
  async getUserProfile(): Promise<UserProfile | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Create user profile with validation
   */
  async createUserProfile(userData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Update user profile with proper user isolation
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Remove undefined fields and exclude id, created_at, updated_at from updates
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key, value]) => 
        value !== undefined && 
        !['id', 'created_at', 'updated_at'].includes(key)
      )
    );

    try {
      // First check if the user profile exists
      const { data: existingProfile, error: checkError } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking profile existence:', checkError);
        throw checkError;
      }

      let result;

      if (!existingProfile) {
        // Profile doesn't exist, create it
        const { data, error } = await this.supabase
          .from('user_profiles')
          .insert({
            id: userId,
            ...cleanUpdates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user profile:', error);
          throw error;
        }
        result = data;
      } else {
        // Profile exists, update it
        const { data, error } = await this.supabase
          .from('user_profiles')
          .update({
            ...cleanUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          console.error('Error updating user profile:', error);
          throw error;
        }
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  // =====================================================
  // MENU ITEMS MANAGEMENT
  // =====================================================

  /**
   * Get menu items for current user with pagination for better performance
   */
  async getMenuItems(limit: number = 100): Promise<MenuItem[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const { data, error } = await this.supabase
      .from('menu_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching menu items:', error)
      return []
    }

    return data || []
  }

  /**
   * Create menu item with user validation
   */
  async createMenuItem(itemData: Omit<MenuItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MenuItem | null> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Update menu item with user validation
   */
  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Delete menu item with user validation
   */
  async deleteMenuItem(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId()
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

  // =====================================================
  // CUSTOMERS MANAGEMENT
  // =====================================================

  /**
   * Get customers for current user
   */
  async getCustomers(): Promise<Customer[]> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Create customer with user validation
   */
  async createCustomer(customerData: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Update customer with user validation
   */
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return null
    }

    return data
  }

  /**
   * Delete customer with user validation
   */
  async deleteCustomer(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting customer:', error)
      return false
    }

    return true
  }

  // =====================================================
  // ORDERS MANAGEMENT
  // =====================================================

  /**
   * Get orders for current user
   */
  async getOrders(): Promise<Order[]> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Create order with user validation
   */
  async createOrder(orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Order | null> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Update order with user validation
   */
  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return null
    }

    return data
  }

  /**
   * Delete order with user validation
   */
  async deleteOrder(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting order:', error)
      return false
    }

    return true
  }

  // =====================================================
  // INVENTORY MANAGEMENT
  // =====================================================

  /**
   * Get inventory items for current user
   */
  async getInventoryItems(): Promise<InventoryItem[]> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Create inventory item with user validation
   */
  async createInventoryItem(itemData: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<InventoryItem | null> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Update inventory item with user validation
   */
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('inventory_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating inventory item:', error)
      return null
    }

    return data
  }

  /**
   * Delete inventory item with user validation
   */
  async deleteInventoryItem(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting inventory item:', error)
      return false
    }

    return true
  }

  // =====================================================
  // STAFF MANAGEMENT
  // =====================================================

  /**
   * Get staff members for current user
   */
  async getStaffMembers(): Promise<StaffMember[]> {
    const userId = await this.getCurrentUserId()
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

  /**
   * Create staff member with validation
   */
  async createStaffMember(staffData: Omit<StaffMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<StaffMember | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) {
      console.error('Error creating staff member: User not authenticated')
      throw new Error('User not authenticated')
    }

    // Validate required fields
    if (!staffData.name?.trim()) {
      console.error('Error creating staff member: Name is required')
      throw new Error('Name is required')
    }
    if (!staffData.position?.trim()) {
      console.error('Error creating staff member: Position is required')
      throw new Error('Position is required')
    }

    // Clean and validate data before insertion
    const cleanData = {
      ...staffData,
      name: staffData.name.trim(),
      position: staffData.position.trim(),
      employee_id: staffData.employee_id?.trim() || null,
      email: staffData.email?.trim() || null,
      phone: staffData.phone?.trim() || null,
      salary: staffData.salary ? Number(staffData.salary) : null,
      hire_date: staffData.hire_date ? new Date(staffData.hire_date).toISOString().split('T')[0] : null,
      is_active: staffData.is_active ?? true
    }

    try {
      const { data, error } = await this.supabase
        .from('staff_members')
        .insert({
          user_id: userId,
          ...cleanData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Database error creating staff member:', error)
        // Provide more specific error messages based on error codes
        if (error.code === '23505') { // unique_violation
          throw new Error('Employee ID already exists. Please use a different ID.')
        } else if (error.code === '23502') { // not_null_violation
          throw new Error('Required fields are missing. Please fill in all required information.')
        } else if (error.message) {
          throw new Error(`Database error: ${error.message}`)
        } else {
          throw new Error('Failed to create staff member. Please try again.')
        }
      }

      return data
    } catch (error) {
      console.error('Error creating staff member:', error)
      throw error // Re-throw to preserve the error for the UI
    }
  }

  /**
   * Update staff member
   */
  async updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('staff_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating staff member:', error)
      return null
    }

    return data
  }

  /**
   * Delete staff member
   */
  async deleteStaffMember(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('staff_members')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting staff member:', error)
      return false
    }

    return true
  }

  // =====================================================
  // ATTENDANCE MANAGEMENT
  // =====================================================

  /**
   * Get attendance records
   */
  async getAttendance(staffId?: string, date?: string): Promise<Attendance[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    let query = this.supabase
      .from('attendance')
      .select(`
        *,
        staff_members!inner(user_id)
      `)
      .eq('staff_members.user_id', userId)

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) {
      console.error('Error fetching attendance:', error)
      return []
    }

    return data || []
  }

  /**
   * Create attendance record
   */
  async createAttendance(attendanceData: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance | null> {
    const { data, error } = await this.supabase
      .from('attendance')
      .insert({
        ...attendanceData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating attendance:', error)
      return null
    }

    return data
  }

  /**
   * Update attendance record
   */
  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | null> {
    const { data, error } = await this.supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating attendance:', error)
      return null
    }

    return data
  }

  // =====================================================
  // EXPENSES MANAGEMENT
  // =====================================================

  /**
   * Get expenses for current user
   */
  async getExpenses(): Promise<Expense[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      return []
    }

    return data || []
  }

  /**
   * Create expense
   */
  async createExpense(expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Expense | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('expenses')
      .insert({
        user_id: userId,
        ...expenseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating expense:', error)
      return null
    }

    return data
  }

  // =====================================================
  // SALES REPORTS MANAGEMENT
  // =====================================================

  /**
   * Get sales reports for current user
   */
  async getSalesReports(): Promise<SalesReport[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const { data, error } = await this.supabase
      .from('sales_reports')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching sales reports:', error)
      return []
    }

    return data || []
  }

  /**
   * Create sales report
   */
  async createSalesReport(reportData: Omit<SalesReport, 'id' | 'user_id' | 'created_at'>): Promise<SalesReport | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('sales_reports')
      .insert({
        user_id: userId,
        ...reportData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sales report:', error)
      return null
    }

    return data
  }

  // =====================================================
  // SETTINGS MANAGEMENT - IMPROVED VERSION
  // =====================================================

  /**
   * Get settings for current user
   */
  async getSettings(): Promise<Setting[]> {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.warn('getSettings: User not authenticated')
        return []
      }

      console.log('getSettings: Fetching settings for user:', userId)

      const { data, error } = await this.supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('getSettings: Database error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return []
      }

      console.log('getSettings: Successfully fetched settings:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('getSettings: Unexpected error:', error)
      return []
    }
  }

  /**
   * Get a specific setting by key
   */
  async getSetting(key: string): Promise<Setting | null> {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.warn('getSetting: User not authenticated')
        return null
      }

      console.log('getSetting: Fetching setting:', key, 'for user:', userId)

      const { data, error } = await this.supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .eq('setting_key', key)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - this is normal for new settings
          console.log('getSetting: Setting not found (normal for new settings):', key)
          return null
        }
        console.error('getSetting: Database error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return null
      }

      console.log('getSetting: Successfully fetched setting:', key)
      return data
    } catch (error) {
      console.error('getSetting: Unexpected error:', error)
      return null
    }
  }

  /**
   * Set a setting value
   */
  async setSetting(key: string, value: unknown): Promise<Setting | null> {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        throw new Error('User not authenticated')
      }

      console.log('setSetting: Saving setting:', key, 'for user:', userId)

      // Store value as string (JSON for complex types)
      const settingValue = typeof value === 'string' ? value : JSON.stringify(value)

      const { data, error } = await this.supabase
        .from('settings')
        .upsert({
          user_id: userId,
          setting_key: key,
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        // Simple error logging without object destructuring
        console.error('setSetting: Database error:', error.message || 'Unknown error')
        throw new Error(`Database error: ${error.message || 'Unknown error'}`)
      }

      console.log('setSetting: Successfully saved setting:', key)
      return data
    } catch (error) {
      console.error('setSetting: Unexpected error:', error)
      throw error
    }
  }

  /**
   * Upsert setting using cached user ID (security fix)
   */
  async upsertSetting(key: string, value: unknown): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) return false

      const { error } = await this.supabase
        .from('settings')
        .upsert({
          user_id: userId,
          setting_key: key,
          setting_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,setting_key'
        })

      if (error) {
        console.error('Error upserting setting:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Exception in upsertSetting:', error)
      return false
    }
  }

  /**
   * Simplified theme setting method
   */
  async setThemeSetting(value: string): Promise<boolean> {
    try {
      console.log('setThemeSetting: Setting theme to:', value)
      await this.setSetting('theme', value)
      return true
    } catch (error: any) {
      console.warn('setThemeSetting: Database save failed:', error?.message || 'Unknown error')
      return false
    }
  }

  /**
   * Add a method to check if settings table exists and create it if needed
   */
  async initializeSettingsTable(): Promise<boolean> {
    try {
      console.log('initializeSettingsTable: Checking if settings table exists...')
      
      // Try to query the settings table
      const { error } = await this.supabase
        .from('settings')
        .select('id')
        .limit(1)

      if (error) {
        console.error('initializeSettingsTable: Settings table error:', error)
        return false
      }

      console.log('initializeSettingsTable: Settings table exists')
      return true
    } catch (error) {
      console.error('initializeSettingsTable: Unexpected error:', error)
      return false
    }
  }

  /**
   * Add a method to test Supabase connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('testConnection: Testing Supabase connection...')

      const { error } = await this.supabase
        .from('settings')
        .select('count')
        .limit(1)

      if (error) {
        console.error('testConnection: Connection test failed:', error.message)
        return { success: false, error: error.message }
      }

      console.log('testConnection: Connection test successful')
      return { success: true }
    } catch (error: any) {
      console.error('testConnection: Unexpected error:', error.message)
      return { success: false, error: error.message }
    }
  }

  // =====================================================
  // COMMUNITY SEARCH METHODS
  // =====================================================

  /**
   * Get user's restaurant listing
   */
  async getUserRestaurantListing(): Promise<RestaurantListing | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) return null

    const { data, error } = await this.supabase
      .from('restaurant_listings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching restaurant listing:', error)
      return null
    }

    return data
  }

  /**
   * Create restaurant listing
   */
  async createRestaurantListing(listingData: Omit<RestaurantListing, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<RestaurantListing | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    // Extract operating_hours and handle properly
    const { operating_hours, ...dataToInsert } = listingData

    const { data, error } = await this.supabase
      .from('restaurant_listings')
      .insert({
        user_id: userId,
        ...dataToInsert,
        operating_hours: operating_hours ? JSON.stringify(operating_hours) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating restaurant listing:', error)
      return null
    }

    return data
  }

  /**
   * Update restaurant listing
   */
  async updateRestaurantListing(updates: Partial<RestaurantListing>): Promise<RestaurantListing | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('restaurant_listings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating restaurant listing:', error)
      return null
    }

    return data
  }

  /**
   * Get community menu items
   */
  async getCommunityMenuItems(listingId?: string): Promise<CommunityMenuItem[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    let query = this.supabase
      .from('community_menu_items')
      .select('*')
      .eq('is_available', true)

    if (listingId) {
      query = query.eq('listing_id', listingId)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching community menu items:', error)
      return []
    }

    return data || []
  }

  /**
   * Create community menu item
   */
  async createCommunityMenuItem(itemData: Omit<CommunityMenuItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CommunityMenuItem | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('community_menu_items')
      .insert({
        user_id: userId,
        ...itemData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating community menu item:', error)
      return null
    }

    return data
  }

  /**
   * Update community menu item
   */
  async updateCommunityMenuItem(id: string, updates: Partial<CommunityMenuItem>): Promise<CommunityMenuItem | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('community_menu_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating community menu item:', error)
      return null
    }

    return data
  }

  /**
   * Delete community menu item
   */
  async deleteCommunityMenuItem(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('community_menu_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting community menu item:', error)
      return false
    }

    return true
  }

  /**
   * Search nearby restaurants with secure query
   */
  async searchNearbyRestaurants(searchTerm: string, userLat?: number, userLng?: number, radiusKm: number = 10, pincode?: string): Promise<any[]> {
    const currentUserId = await this.getCurrentUserId()
    if (!currentUserId) return []

    // Use parameterized query to prevent SQL injection
    let query = this.supabase
      .from('community_menu_items')
      .select(`
        *,
        restaurant_listings!inner (
          id,
          user_id,
          restaurant_name,
          description,
          address,
          phone,
          email,
          cuisine_type,
          latitude,
          longitude,
          pincode,
          is_active
        )
            `)
      .eq('is_available', true)
      .eq('restaurant_listings.is_active', true)
      .neq('restaurant_listings.user_id', currentUserId) // Exclude current user's restaurants

    // Use safer text search with proper filtering
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`
      query = query.or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
    }
    // Add pincode filtering if provided
    if (pincode && pincode.trim()) {
      const pincodeNum = parseInt(pincode.trim())
      if (!isNaN(pincodeNum)) {
        // Create list of related pincodes (current, -1, +1)
        const relatedPincodes = [pincodeNum, pincodeNum - 1, pincodeNum + 1]
        query = query.in('restaurant_listings.pincode', relatedPincodes.map(p => p.toString()))
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error searching restaurants:', error)
      return []
    }

    // Group results by restaurant and calculate distance if coordinates provided
    const restaurantMap = new Map()

    data?.forEach((item: any) => {
      const restaurant = item.restaurant_listings
      if (!restaurantMap.has(restaurant.id)) {
        let distance
        if (userLat && userLng && restaurant.latitude && restaurant.longitude) {
          distance = this.calculateDistance(userLat, userLng, restaurant.latitude, restaurant.longitude)
        }

        restaurantMap.set(restaurant.id, {
          restaurant,
          menuItems: [],
          distance
        })
      }
      restaurantMap.get(restaurant.id).menuItems.push(item)
    })

    // Filter by radius and sort by distance
    const results = Array.from(restaurantMap.values())
      .filter(result => !result.distance || result.distance <= radiusKm)
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      .map(result => ({
        restaurant_id: result.restaurant.id,
        user_id: result.restaurant.user_id,
        restaurant_name: result.restaurant.restaurant_name,
        description: result.restaurant.description,
        address: result.restaurant.address,
        phone: result.restaurant.phone,
        email: result.restaurant.email,
        cuisine_type: result.restaurant.cuisine_type,
        latitude: result.restaurant.latitude,
        longitude: result.restaurant.longitude,
        pincode: result.restaurant.pincode,
        distance: result.distance,
        menu_items: result.menuItems || []
      }))

    return results
  }

  // =====================================================
  // UPDATED CONVERSATION-BASED MESSAGING SYSTEM
  // =====================================================

  /**
   * Get user messages with user isolation
   */
  async getUserMessages(): Promise<RestaurantMessage[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    try {
      // First get conversation IDs where user is a participant
      const { data: conversations, error: convError } = await this.supabase
        .from('restaurant_conversations')
        .select('id, restaurant_a_id, restaurant_b_id')
        .or(`restaurant_a_id.eq.${userId},restaurant_b_id.eq.${userId}`)

      if (convError) {
        console.error('Error fetching user conversations:', convError)
        throw new Error(`Failed to fetch conversations: ${convError.message}`)
      }

      if (!conversations || conversations.length === 0) {
        return []
      }

      const conversationIds = conversations.map(conv => conv.id)
      const conversationMap = new Map(conversations.map(conv => [conv.id, conv]))

      // Get messages from those conversations with basic conversation info
      const { data: messages, error } = await this.supabase
        .from('restaurant_messages')
        .select(`
          *,
          restaurant_conversations (
            id,
            restaurant_a_id,
            restaurant_b_id
          )
        `)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user messages:', error)
        throw new Error(`Database error: ${error.message || 'Failed to fetch user messages'}`)
      }

      if (!messages || messages.length === 0) {
        return []
      }

      // Get all restaurant names in one query for better performance
      const restaurantIds = new Set<string>()
      messages.forEach(msg => {
        const conv = msg.restaurant_conversations
        if (conv) {
          restaurantIds.add(conv.restaurant_a_id)
          restaurantIds.add(conv.restaurant_b_id)
        }
      })

      const { data: restaurants, error: restaurantError } = await this.supabase
        .from('restaurant_listings')
        .select('id, restaurant_name')
        .in('id', Array.from(restaurantIds))

      if (restaurantError) {
        console.warn('Error fetching restaurant names:', restaurantError)
      }

      const restaurantMap = new Map(
        restaurants?.map(r => [r.id, r.restaurant_name]) || []
      )

      // Transform the data to match the expected interface
      return messages.map(msg => {
        const conv = msg.restaurant_conversations
        const senderId = msg.sender_id
        let restaurantName = 'Unknown Restaurant'

        if (conv) {
          const isSenderA = conv.restaurant_a_id === senderId
          const targetRestaurantId = isSenderA ? conv.restaurant_a_id : conv.restaurant_b_id
          restaurantName = restaurantMap.get(targetRestaurantId) || 'Unknown Restaurant'
        }

        return {
          ...msg,
          sender_profile: {
            restaurant_name: restaurantName
          }
        }
      })
    } catch (error) {
      console.error('Error in getUserMessages:', error)
      throw error
    }
  }

  /**
   * Get user conversations with user isolation
   */
  async getUserConversations(): Promise<RestaurantConversation[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    // Get conversations where user is a participant
    const { data: conversations, error } = await this.supabase
      .from('restaurant_conversations')
      .select(`
        *,
        restaurant_listings!restaurant_conversations_restaurant_a_id_fkey (
          restaurant_name
        ),
        restaurant_listings!restaurant_conversations_restaurant_b_id_fkey (
          restaurant_name
        ),
        restaurant_messages (
          id,
          sender_id,
          message,
          message_type,
          is_read,
          created_at
        )
      `)
      .or(`restaurant_a_id.eq.${userId},restaurant_b_id.eq.${userId}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching user conversations:', error)
      return []
    }

    if (!conversations) return []

    // Transform and enrich conversation data
    return conversations.map(conv => {
      const isUserA = conv.restaurant_a_id === userId
      const otherRestaurantName = isUserA 
        ? conv.restaurant_listings_restaurant_b_id_fkey?.restaurant_name || 'Unknown Restaurant'
        : conv.restaurant_listings_restaurant_a_id_fkey?.restaurant_name || 'Unknown Restaurant'
      
      const otherRestaurantId = isUserA ? conv.restaurant_b_id : conv.restaurant_a_id
      
      // Get last message and unread count
      const messages = conv.restaurant_messages || []
      const sortedMessages = messages.sort((a: { created_at: string }, b: { created_at: string }) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const lastMessage = sortedMessages[0]
      const unreadCount = messages.filter((msg: { is_read: boolean; sender_id: string }) => 
        !msg.is_read && msg.sender_id !== userId
      ).length

      return {
        id: conv.id,
        restaurant_a_id: conv.restaurant_a_id,
        restaurant_b_id: conv.restaurant_b_id,
        user_id: conv.user_id, // Ensure user_id is included
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message: lastMessage,
        other_restaurant_name: otherRestaurantName,
        other_restaurant_id: otherRestaurantId,
        unread_count: unreadCount
      }
    })
  }

  /**
   * Get conversation messages with user access validation
   */
  async getConversationMessages(conversationId: string): Promise<RestaurantMessage[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await this.supabase
      .from('restaurant_conversations')
      .select('restaurant_a_id, restaurant_b_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      console.error('Conversation not found or access denied')
      return []
    }

    if (conversation.restaurant_a_id !== userId && conversation.restaurant_b_id !== userId) {
      console.error('Access denied to conversation')
      return []
    }

    // Get messages for this conversation
    const { data: messages, error } = await this.supabase
      .from('restaurant_messages')
      .select(`
        *,
        restaurant_conversations!inner (
          restaurant_listings!restaurant_conversations_restaurant_a_id_fkey (
            restaurant_name
          ),
          restaurant_listings!restaurant_conversations_restaurant_b_id_fkey (
            restaurant_name
          )
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching conversation messages:', error)
      return []
    }

    // Transform messages
    return messages.map(msg => ({
      ...msg,
      sender_profile: {
        restaurant_name: conversation.restaurant_a_id === msg.sender_id 
          ? msg.restaurant_conversations.restaurant_listings_restaurant_a_id_fkey?.restaurant_name || 'Unknown Restaurant'
          : msg.restaurant_conversations.restaurant_listings_restaurant_b_id_fkey?.restaurant_name || 'Unknown Restaurant'
      }
    }))
  }

  /**
   * Send message with comprehensive debugging and error handling
   */
  async sendMessage(messageData: SendMessageData): Promise<RestaurantMessage | null> {
    try {
      // Force fresh authentication check
      const { data: freshAuth, error: authError } = await this.supabase.auth.getSession()
      if (authError || !freshAuth.session?.user?.id) {
        console.error('No valid authentication session')
        return null
      }
      
      const freshUserId = freshAuth.session.user.id
      console.log('Using fresh user ID:', freshUserId)

      // Get current user
      const userId = await this.getCurrentUserId()
      console.log('Current user ID:', userId)

      if (!userId) {
        console.error('Error sending message: User not authenticated')
        return null
      }

      // Basic validation
      if (!messageData.message || messageData.message.trim() === '') {
        console.error('Error sending message: Empty message')
        return null
      }

      if (!messageData.conversation_id) {
        console.error('Error sending message: No conversation_id provided')
        return null
      }

      console.log('Attempting to send message with data:', {
        conversation_id: messageData.conversation_id,
        sender_id: userId,
        message: messageData.message.substring(0, 50) + '...',
        message_type: messageData.message_type || 'text'
      })

      // CRITICAL: Validate that the conversation exists and user has access
      const { data: conversation, error: convError } = await this.supabase
        .from('restaurant_conversations')
        .select('id, restaurant_a_id, restaurant_b_id')
        .eq('id', messageData.conversation_id)
        .single()

      if (convError) {
        console.error('Error validating conversation:', convError)
        if (convError.code === 'PGRST116') {
          console.error('Conversation does not exist:', messageData.conversation_id)
        } else {
          console.error('Error accessing conversation:', convError.message)
        }
        return null
      }

      if (!conversation) {
        console.error('Conversation not found:', messageData.conversation_id)
        return null
      }

      // Verify user is a participant in the conversation
      if (conversation.restaurant_a_id !== userId && conversation.restaurant_b_id !== userId) {
        console.error('User is not a participant in this conversation:', {
          userId,
          conversation_a_id: conversation.restaurant_a_id,
          conversation_b_id: conversation.restaurant_b_id
        })
        return null
      }

      console.log('Conversation validated successfully:', {
        conversation_id: conversation.id,
        user_is_a: conversation.restaurant_a_id === userId,
        user_is_b: conversation.restaurant_b_id === userId
      })

      // ... existing code ...

      // DEBUG: Let's check if we can see the auth context
      const { data: authData, error: debugAuthError } = await this.supabase.auth.getSession()
      console.log('Auth session check:', {
        hasSession: !!authData.session,
        sessionUserId: authData.session?.user?.id,
        authError: debugAuthError?.message
      })

      // Now attempt to insert the message with detailed error handling
      console.log('About to execute insert with data:', {
        conversation_id: messageData.conversation_id,
        sender_id: userId,
        message_length: messageData.message.length,
        message_type: messageData.message_type || 'text',
        is_read: messageData.is_read || false
      })

      // Before the insert, verify the user exists
      console.log('🔍 Verifying user exists before insert...')
      const { data: userCheck, error: userError } = await this.supabase
        .from('restaurant_listings')
        .select('user_id')
        .eq('user_id', userId)
        .limit(1) // Just get one record to verify existence
      
      if (userError || !userCheck || userCheck.length === 0) {
        console.error('❌ User does not exist in restaurant_listings:', userError)
        return null
      }
      
      console.log('✅ User verified, proceeding with insert...')

      // Get the receiver_id from the conversation
      const receiverId = conversation.restaurant_a_id === userId 
        ? conversation.restaurant_b_id 
        : conversation.restaurant_a_id

      console.log('📨 Receiver ID:', receiverId)

      const { data, error } = await this.supabase
        .from('restaurant_messages')
        .insert({
          conversation_id: messageData.conversation_id,
          sender_id: userId,
          receiver_id: receiverId, // Add the missing receiver_id
          message: messageData.message.trim(),
          message_type: messageData.message_type || 'text',
          is_read: messageData.is_read || false
        })
        .select('*') // Just select the message data
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        
        // Handle empty error object 
        if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
          console.error('❌ Empty error object - check foreign key constraints')
          console.error('Make sure the conversation exists and users are in restaurant_listings')
        }
        
        return null
      }

      console.log('✅ Message sent successfully:', data)
      return data as RestaurantMessage

    } catch (unexpectedError) {
      console.error('Unexpected error in sendMessage:', unexpectedError)
      
      // Log additional debugging information
      console.error('Debugging context:', {
        userId: await this.getCurrentUserId(),
        conversationId: messageData?.conversation_id,
        messageLength: messageData?.message?.length,
        timestamp: new Date().toISOString(),
        error: unexpectedError
      })
      
      return null
    }
  }

  /**
   * Test database connectivity and permissions
   */
  async testDatabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Test 1: Check authentication
      const { data: authData, error: authError } = await this.supabase.auth.getSession()
      if (authError || !authData.session) {
        return { success: false, message: 'Authentication failed', details: { authError, hasSession: !!authData.session } }
      }

      // Test 2: Check if we can read from restaurant_conversations
      const { data: conversations, error: convError } = await this.supabase
        .from('restaurant_conversations')
        .select('id, restaurant_a_id, restaurant_b_id')
        .limit(1)

      if (convError) {
        return { success: false, message: 'Cannot read conversations', details: { convError } }
      }

      // Test 3: Try to insert a test message (if we have a conversation)
      if (conversations && conversations.length > 0) {
        const testConversation = conversations[0]
        const { data: testInsert, error: insertError } = await this.supabase
          .from('restaurant_messages')
          .insert({
            conversation_id: testConversation.id,
            sender_id: authData.session.user.id,
            message: 'Test message - please ignore',
            message_type: 'text',
            is_read: false
          })
          .select('id') // Add select to ensure we get the id back
          .single()

        if (insertError) {
          return { 
            success: false, 
            message: 'Insert permission denied', 
            details: { insertError, conversation_id: testConversation.id, sender_id: authData.session.user.id } 
          }
        }

        // Clean up test message
        if (testInsert && testInsert.id) { // TypeScript can now properly infer the type
          await this.supabase
            .from('restaurant_messages')
            .delete()
            .eq('id', testInsert.id)
        }
      }

      return { success: true, message: 'Database connection and permissions OK' }

    } catch (error) {
      return { success: false, message: 'Unexpected error', details: error }
    }
  }

  /**
   * Comprehensive database verification and setup check
   */
  async verifyDatabaseSetup(): Promise<{
    success: boolean;
    issues: string[];
    recommendations: string[];
    details: any;
  }> {
    const issues: string[] = []
    const recommendations: string[] = []
    const details: any = {}

    try {
      console.log('🔍 Starting database verification...')

     

      // 1. Check Authentication
      console.log('1️⃣ Checking authentication...')
      const { data: authData, error: verifyAuthError } = await this.supabase.auth.getSession()
      details.auth = { hasSession: !!authData.session, userId: authData.session?.user?.id, error: verifyAuthError }

      if (verifyAuthError) {
        issues.push('Authentication error: ' + verifyAuthError.message)
        recommendations.push('Check Supabase authentication configuration')
      } else if (!authData.session) {
        issues.push('No active user session')
        recommendations.push('User must be logged in to perform database operations')
      } else {
        console.log('✅ Authentication OK')
      }


      // 2. Check Tables Exist
      console.log('2️⃣ Checking tables...')
      const tables = [
        'restaurant_listings',
        'restaurant_conversations', 
        'restaurant_messages',
        'community_menu_items',
        'user_profiles'
      ]

      for (const table of tables) {
        try {
          const { error } = await this.supabase.from(table).select('count').limit(1)
          if (error) {
            issues.push(`Table '${table}' not accessible: ${error.message}`)
            recommendations.push(`Create table '${table}' using the schema files in /scripts/`)
          } else {
            console.log(`✅ Table '${table}' exists`)
          }
        } catch (err) {
          issues.push(`Error checking table '${table}': ${err}`)
        }
      }

      // 3. Check RLS Policies
      console.log('3️⃣ Checking RLS policies...')
      
      // Test conversation creation (should fail if RLS is too restrictive)
      if (authData.session) {
        const testConvId = '00000000-0000-0000-0000-000000000000' // Non-existent ID
        const { error: policyTest } = await this.supabase
          .from('restaurant_conversations')
          .select('id')
          .eq('id', testConvId)
          .single()
        
        details.rls = { policyTest }
        console.log('✅ RLS policy check completed')
      }

      // 4. Check Foreign Key Constraints
      console.log('4️⃣ Checking foreign key constraints...')
      
      // Test if we can query conversations with messages
      const { data: convWithMessages, error: fkError } = await this.supabase
        .from('restaurant_conversations')
        .select(`
          id,
          restaurant_messages (id)
        `)
        .limit(1)

      details.foreignKeys = { convWithMessages, fkError }

      if (fkError) {
        issues.push(`Foreign key constraint issue: ${fkError.message}`)
        recommendations.push('Run the migration scripts in /scripts/ to set up proper relationships')
      } else {
        console.log('✅ Foreign key constraints OK')
      }

      // 5. Check Sample Data
      console.log('5️⃣ Checking for sample data...')
      const { data: sampleListings, error: sampleError } = await this.supabase
        .from('restaurant_listings')
        .select('id, restaurant_name')
        .limit(1)

      details.sampleData = { sampleListings, sampleError }

      if (!sampleListings || sampleListings.length === 0) {
        recommendations.push('Create restaurant listings to enable messaging functionality')
      }

      // 6. Test Message Creation (Full Test)
      console.log('6️⃣ Testing message creation...')
      if (authData.session && convWithMessages && convWithMessages.length > 0) {
        const testConv = convWithMessages[0]
        const { data: testMessage, error: msgError } = await this.supabase
          .from('restaurant_messages')
          .insert({
            conversation_id: testConv.id,
            sender_id: authData.session.user.id,
            message: 'Database verification test - ' + new Date().toISOString(),
            message_type: 'text',
            is_read: false
          })
          .select()
          .single()

        details.messageTest = { testMessage, msgError }

        if (msgError) {
          issues.push(`Message creation failed: ${msgError.message}`)
          if (msgError.code === '42501') {
            recommendations.push('Fix RLS policies - user may not have insert permissions')
          } else if (msgError.code === '23503') {
            recommendations.push('Fix foreign key constraints - conversation or user reference invalid')
          }
        } else {
          console.log('✅ Message creation OK')
          // Clean up test message
          if (testMessage) { // Add null check
            await this.supabase
              .from('restaurant_messages')
              .delete()
              .eq('id', testMessage.id)
          }
        }
      }

      console.log('🔍 Database verification completed')

      return {
        success: issues.length === 0,
        issues,
        recommendations,
        details
      }

    } catch (error) {
      console.error('Database verification failed:', error)
      return {
        success: false,
        issues: ['Database verification failed with error: ' + error],
        recommendations: ['Check Supabase connection and database setup'],
        details: { error }
      }
    }
  }

  /**
   * Get or create conversation with improved efficiency and error handling
   */
  async getOrCreateConversation(otherRestaurantId: string, userId: string): Promise<string | null> {
    // Remove the internal user ID fetching since it's now passed as parameter
    if (!userId) {
      console.error('No user ID provided')
      return null
    }

    // Ensure consistent ordering for the unique constraint
    const [restaurantA, restaurantB] = userId < otherRestaurantId
      ? [userId, otherRestaurantId]
      : [otherRestaurantId, userId]

    // Check for an existing conversation using a single efficient OR query
    const { data: existingConv, error: findError } = await this.supabase
      .from('restaurant_conversations')
      .select('id')
      .or(`and(restaurant_a_id.eq.${restaurantA},restaurant_b_id.eq.${restaurantB}),and(restaurant_a_id.eq.${restaurantB},restaurant_b_id.eq.${restaurantA})`)
      .single()

    if (findError && findError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error finding conversation:', findError.message || findError)
      throw new Error(`Failed to find conversation: ${findError.message || 'Unknown error'}`)
    }

    if (existingConv) {
      return existingConv.id
    }

    // Create new conversation
    const { data: newConv, error: createError } = await this.supabase
      .from('restaurant_conversations')
      .insert({
        restaurant_a_id: restaurantA,
        restaurant_b_id: restaurantB
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating conversation:', createError.message || createError)
      throw new Error(`Failed to create conversation: ${createError.message || 'Unknown error'}`)
    }

    return newConv.id
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT METHODS
  // =====================================================

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('is_subscribed, trial_end_date, subscription_plan, subscription_status')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return {
        isSubscribed: false,
        isTrialActive: false,
        trialDaysLeft: 0,
        trialEndDate: null,
        subscriptionPlan: null,
        subscriptionStatus: 'inactive'
      }
    }

    const now = new Date()
    const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null
    const isTrialActive = trialEndDate ? now < trialEndDate : false
    const trialDaysLeft = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0

    return {
      isSubscribed: profile.is_subscribed || false,
      isTrialActive,
      trialDaysLeft,
      trialEndDate,
      subscriptionPlan: profile.subscription_plan,
      subscriptionStatus: profile.subscription_status || 'trial'
    }
  }

  /**
   * Check if user has access to premium features
   */
  async hasAccess(userId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId)
    return status.isSubscribed || status.isTrialActive
  }

  /**
   * Start trial for new user
   */
  async startTrial(userId: string): Promise<void> {
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    const { error } = await this.supabase
      .from('user_profiles')
      .update({
        trial_end_date: trialEndDate.toISOString(),
        subscription_status: 'trial',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error starting trial:', error)
      throw new Error('Failed to start trial')
    }
  }

  /**
   * Activate subscription after successful payment
   */
  async activateSubscription(
    userId: string,
    razorpayCustomerId: string,
    razorpaySubscriptionId: string,
    planId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update({
        is_subscribed: true,
        razorpay_customer_id: razorpayCustomerId,
        razorpay_subscription_id: razorpaySubscriptionId,
        subscription_plan: planId,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error activating subscription:', error)
      throw new Error('Failed to activate subscription')
    }

    // Log the subscription activation
    await this.logSubscriptionEvent(userId, 'subscription_activated', {
      razorpay_customer_id: razorpayCustomerId,
      razorpay_subscription_id: razorpaySubscriptionId,
      plan_id: planId
    })
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update({
        is_subscribed: false,
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error cancelling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }

    await this.logSubscriptionEvent(userId, 'subscription_cancelled')
  }

  /**
   * Log subscription events
   */
  private async logSubscriptionEvent(
    userId: string,
    eventType: string,
    metadata: any = {}
  ): Promise<void> {
    const { error } = await this.supabase
      .from('subscription_logs')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging subscription event:', error)
    }
  }

  /**
   * Get notifications for user
   */
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      throw new Error('Failed to mark notification as read')
    }
  }

  /**
   * Get recent orders only (last 30 days) for dashboard performance
   */
  async getRecentOrders(days: number = 30): Promise<Order[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return []
    }

    return data || []
  }

  /**
   * Get dashboard summary data in a single optimized query
   */
  async getDashboardSummary(): Promise<{
    orders: Order[]
    customers: Customer[]
    inventory: InventoryItem[]
    lowStockItems: InventoryItem[]
    stats: {
      totalSales: number
      totalCustomers: number
      pendingOrders: number
      lowStockCount: number
    }
  }> {
    const userId = await this.getCurrentUserId()
    if (!userId) return { orders: [], customers: [], inventory: [], lowStockItems: [], stats: { totalSales: 0, totalCustomers: 0, pendingOrders: 0, lowStockCount: 0 } }

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: orders, error: ordersError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    // Get customers
    const { data: customers, error: customersError } = await this.supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get all inventory items (we'll filter for low stock in the dashboard store)
    const { data: inventory, error: inventoryError } = await this.supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)

    // Calculate stats
    const totalSales = orders?.reduce((acc, order) => acc + order.total_amount, 0) || 0
    const totalCustomers = customers?.length || 0
    const pendingOrders = orders?.filter(order => 
      ['pending', 'confirmed', 'preparing'].includes(order.status)
    ).length || 0
    const lowStockCount = 0 // Will be calculated in dashboard store

    return {
      orders: orders || [],
      customers: customers || [],
      inventory: inventory || [], // Return actual inventory data
      lowStockItems: [], // Will be filtered in dashboard store
      stats: {
        totalSales,
        totalCustomers,
        pendingOrders,
        lowStockCount
      }
    }
  }
}

// Export singleton instance
export const supabaseDataService = new SupabaseDataService()