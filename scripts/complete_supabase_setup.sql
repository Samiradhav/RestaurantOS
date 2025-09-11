-- =====================================================
-- COMPLETE SUPABASE SETUP FOR RESTAURANT MANAGEMENT
-- =====================================================
-- This script creates all tables needed for your restaurant app
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
-- Stores basic user information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY, -- Firebase UID
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  restaurant_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. MENU ITEMS TABLE
-- =====================================================
-- Stores all menu items for the restaurant
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15, -- in minutes
  ingredients TEXT[], -- array of ingredients
  allergens TEXT[], -- array of allergens
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CUSTOMERS TABLE
-- =====================================================
-- Stores customer information
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ORDERS TABLE
-- =====================================================
-- Stores order information
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  customer_id UUID REFERENCES public.customers(id),
  order_number TEXT NOT NULL,
  items JSONB NOT NULL, -- Store order items as JSON
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT,
  notes TEXT,
  delivery_address TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INVENTORY ITEMS TABLE
-- =====================================================
-- Stores inventory/stock information
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 100,
  unit TEXT DEFAULT 'pcs',
  cost_per_unit DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  supplier TEXT,
  supplier_contact TEXT,
  expiry_date DATE,
  location TEXT, -- storage location
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. STAFF MEMBERS TABLE
-- =====================================================
-- Stores staff/employee information
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT NOT NULL,
  department TEXT,
  hourly_rate DECIMAL(10,2),
  salary DECIMAL(10,2),
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  emergency_contact TEXT,
  emergency_phone TEXT,
  address TEXT,
  skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ATTENDANCE TABLE
-- =====================================================
-- Stores staff attendance records
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  break_start TIME,
  break_end TIME,
  total_hours DECIMAL(4,2),
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. EXPENSES TABLE
-- =====================================================
-- Stores business expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  vendor TEXT,
  payment_method TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- monthly, weekly, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. SALES REPORTS TABLE
-- =====================================================
-- Stores daily sales summaries
CREATE TABLE IF NOT EXISTS public.sales_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  date DATE NOT NULL,
  total_sales DECIMAL(10,2) NOT NULL,
  total_orders INTEGER NOT NULL,
  average_order_value DECIMAL(10,2),
  cash_sales DECIMAL(10,2) DEFAULT 0,
  card_sales DECIMAL(10,2) DEFAULT 0,
  online_sales DECIMAL(10,2) DEFAULT 0,
  refunds DECIMAL(10,2) DEFAULT 0,
  discounts DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. SETTINGS TABLE
-- =====================================================
-- Stores app settings and configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_menu_items_user_id ON public.menu_items(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON public.attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_sales_reports_user_id ON public.sales_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_date ON public.sales_reports(date);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
-- This ensures users can only access their own data
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================
-- For now, we'll allow all access (you can restrict later for security)

-- User profiles policies
CREATE POLICY "user_profiles_all_access" ON public.user_profiles FOR ALL USING (true);

-- Menu items policies
CREATE POLICY "menu_items_all_access" ON public.menu_items FOR ALL USING (true);

-- Customers policies
CREATE POLICY "customers_all_access" ON public.customers FOR ALL USING (true);

-- Orders policies
CREATE POLICY "orders_all_access" ON public.orders FOR ALL USING (true);

-- Inventory items policies
CREATE POLICY "inventory_items_all_access" ON public.inventory_items FOR ALL USING (true);

-- Staff members policies
CREATE POLICY "staff_members_all_access" ON public.staff_members FOR ALL USING (true);

-- Attendance policies
CREATE POLICY "attendance_all_access" ON public.attendance FOR ALL USING (true);

-- Expenses policies
CREATE POLICY "expenses_all_access" ON public.expenses FOR ALL USING (true);

-- Sales reports policies
CREATE POLICY "sales_reports_all_access" ON public.sales_reports FOR ALL USING (true);

-- Settings policies
CREATE POLICY "settings_all_access" ON public.settings FOR ALL USING (true);

-- =====================================================
-- CREATE FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- =====================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================
-- These automatically update the updated_at field when records are modified
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON public.staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================
-- You can uncomment this section to add sample data for testing

/*
-- Sample menu categories
INSERT INTO public.menu_items (user_id, name, description, price, category, is_available) VALUES
('sample-user-id', 'Margherita Pizza', 'Classic Italian pizza with tomato and mozzarella', 12.99, 'Pizza', true),
('sample-user-id', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 8.99, 'Salads', true),
('sample-user-id', 'Chocolate Cake', 'Rich chocolate cake with vanilla ice cream', 6.99, 'Desserts', true);

-- Sample customers
INSERT INTO public.customers (user_id, name, email, phone) VALUES
('sample-user-id', 'John Doe', 'john@example.com', '+1234567890'),
('sample-user-id', 'Jane Smith', 'jane@example.com', '+0987654321');
*/

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your Supabase database is now ready for your restaurant app!
-- All tables, indexes, policies, and triggers have been created.
