-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  bill_no TEXT,
  status TEXT DEFAULT 'Regular',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  order_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  max_stock INTEGER DEFAULT 100,
  unit TEXT DEFAULT 'pcs',
  supplier TEXT,
  cost_per_unit DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  salary DECIMAL(10,2),
  joining_date DATE NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'Present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create RLS policies for customers
CREATE POLICY "customers_select_own" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_own" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update_own" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "customers_delete_own" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for menu_items
CREATE POLICY "menu_items_select_own" ON public.menu_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "menu_items_insert_own" ON public.menu_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "menu_items_update_own" ON public.menu_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "menu_items_delete_own" ON public.menu_items FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for orders
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_own" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "orders_delete_own" ON public.orders FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for order_items (through orders relationship)
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "order_items_update_own" ON public.order_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "order_items_delete_own" ON public.order_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Create RLS policies for inventory
CREATE POLICY "inventory_select_own" ON public.inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "inventory_insert_own" ON public.inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inventory_update_own" ON public.inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "inventory_delete_own" ON public.inventory FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for staff
CREATE POLICY "staff_select_own" ON public.staff FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "staff_insert_own" ON public.staff FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff_update_own" ON public.staff FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "staff_delete_own" ON public.staff FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for attendance (through staff relationship)
CREATE POLICY "attendance_select_own" ON public.attendance FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.staff WHERE staff.id = attendance.staff_id AND staff.user_id = auth.uid()));
CREATE POLICY "attendance_insert_own" ON public.attendance FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.staff WHERE staff.id = attendance.staff_id AND staff.user_id = auth.uid()));
CREATE POLICY "attendance_update_own" ON public.attendance FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.staff WHERE staff.id = attendance.staff_id AND staff.user_id = auth.uid()));
CREATE POLICY "attendance_delete_own" ON public.attendance FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.staff WHERE staff.id = attendance.staff_id AND staff.user_id = auth.uid()));
