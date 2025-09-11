import { createClient } from "@/lib/supabase/client"
import { UUID } from "crypto"

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface UserProfile {
  id: UUID
  name: string
  email: string
  restaurant_name?: string
  phone?: string
  address?: string
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
  expiry_date?: string
  location?: string
  barcode?: string
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
  setting_value: any
  created_at: string
  updated_at: string
}

// =====================================================
// DATA SERVICE CLASS
// =====================================================

class SupabaseDataService {
  private supabase = createClient()
  private cachedUserId: string | null | undefined

  // Get current Supabase user ID (cached per instance)
  private async getCurrentUserId(): Promise<string | null> {
    if (this.cachedUserId !== undefined) return this.cachedUserId
    const { data } = await this.supabase.auth.getUser()
    this.cachedUserId = data.user?.id ?? null
    return this.cachedUserId
  }
  // =====================================================
  // USER PROFILE MANAGEMENT
  // =====================================================

 // In your supabase-data-service.ts, replace the updateUserProfile method with this:

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

  async getMenuItems(): Promise<MenuItem[]> {
    const userId = await this.getCurrentUserId()
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

  async setSetting(key: string, value: any): Promise<Setting | null> {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        throw new Error('User not authenticated')
      }

      console.log('setSetting: Saving setting:', key, 'for user:', userId)

      // Store value directly (no JSON serialization for any settings)
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
  // Add this method to your supabase-data-service.ts file
async upsertSetting(key: string, value: any): Promise<boolean> {
  try {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { error } = await this.supabase
      .from('settings')
      .upsert({
        user_id: user.id,
        setting_key: key,
        setting_value: typeof value === 'object' ? JSON.stringify(value) : value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,setting_key'
      });

    if (error) {
      console.error('Error upserting setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in upsertSetting:', error);
    return false;
  }
}

  // Simplified theme setting method
  async setThemeSetting(value: string): Promise<boolean> {
    try {
      console.log('setThemeSetting: Setting theme to:', value)
      await this.setSetting('theme', value)
      return true
    } catch (error) {
      console.warn('setThemeSetting: Database save failed:', error?.message || 'Unknown error')
      return false
    }
  }

  // Add a method to check if settings table exists and create it if needed
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

  // Add a method to test Supabase connection
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
}

// Export singleton instance
export const supabaseDataService = new SupabaseDataService()

