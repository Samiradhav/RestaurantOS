# 🗄️ Complete Supabase Setup Guide for Restaurant Management

This guide will walk you through setting up Supabase to store all your restaurant data step by step.

## 📋 What You'll Get

After following this guide, you'll have:
- ✅ Complete database with all restaurant tables
- ✅ Easy-to-use data service for your app
- ✅ All your data stored securely in Supabase
- ✅ Ready-to-use components that work with real data

## 🚀 Step 1: Set Up Your Supabase Database

### 1.1 Go to Your Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard
2. Sign in to your account
3. Click on your project (the one with URL: `krqrhpykeehifyjomzam`)

### 1.2 Open the SQL Editor
1. In your Supabase dashboard, look for **"SQL Editor"** in the left sidebar
2. Click on **"SQL Editor"**
3. Click **"New Query"** to create a new SQL script

### 1.3 Run the Database Setup Script
1. Copy the entire contents of the file `scripts/complete_supabase_setup.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button (or press Ctrl+Enter)

**This will create:**
- 10 tables for all your restaurant data
- Indexes for better performance
- Security policies
- Automatic timestamp updates

## 🔧 Step 2: Update Your App to Use Supabase

### 2.1 Update Your Signup Page
Your signup page is already updated to use Supabase! When users sign up:
1. Firebase handles authentication
2. User profile is automatically created in Supabase

### 2.2 Use the Data Service
Replace any dummy data with real Supabase data using the data service:

```typescript
import { supabaseDataService } from '@/lib/supabase-data-service'

// Get all menu items
const menuItems = await supabaseDataService.getMenuItems()

// Create a new menu item
const newItem = await supabaseDataService.createMenuItem({
  name: "Pizza Margherita",
  category: "Pizza",
  price: 12.99,
  description: "Classic Italian pizza",
  is_available: true
})

// Get all customers
const customers = await supabaseDataService.getCustomers()

// Create a new customer
const newCustomer = await supabaseDataService.createCustomer({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890"
})
```

## 📊 Step 3: What Tables Were Created

Here's what you now have in your Supabase database:

### 🏪 **user_profiles**
- Stores user information (name, email, restaurant name)
- One record per user

### 🍕 **menu_items**
- All your restaurant menu items
- Categories, prices, descriptions, images
- Availability status

### 👥 **customers**
- Customer information
- Contact details, loyalty points
- Order history tracking

### 📋 **orders**
- All restaurant orders
- Order items, totals, status
- Payment information

### 📦 **inventory_items**
- Stock management
- Suppliers, costs, expiry dates
- Low stock alerts

### 👨‍💼 **staff_members**
- Employee information
- Positions, salaries, contact details
- Active/inactive status

### ⏰ **attendance**
- Staff attendance tracking
- Check-in/check-out times
- Break tracking

### 💰 **expenses**
- Business expenses
- Categories, vendors, receipts
- Recurring expense tracking

### 📈 **sales_reports**
- Daily sales summaries
- Payment method breakdowns
- Performance metrics

### ⚙️ **settings**
- App configuration
- User preferences
- Custom settings

## 🎯 Step 4: Test Your Setup

### 4.1 Start Your App
```bash
pnpm dev
```

### 4.2 Create a Test Account
1. Go to `/signup`
2. Create a new account
3. Check your Supabase dashboard → **Table Editor** → **user_profiles**
4. You should see your new user profile!

### 4.3 Test Menu Items
1. Go to `/dashboard/menu`
2. Try adding a new menu item
3. Check Supabase → **Table Editor** → **menu_items**
4. Your menu item should appear there!

## 🔍 Step 5: View Your Data in Supabase

### 5.1 Access Table Editor
1. In your Supabase dashboard, click **"Table Editor"**
2. You'll see all your tables listed
3. Click on any table to view/edit data

### 5.2 View Data
- Click on **"menu_items"** to see your menu
- Click on **"customers"** to see your customers
- Click on **"orders"** to see your orders
- And so on...

## 🛠️ Step 6: Update Your Components

### 6.1 Example: Update Menu Page
Here's how to update your menu page to use real Supabase data:

```typescript
// In your menu page component
import { supabaseDataService } from '@/lib/supabase-data-service'
import { useState, useEffect } from 'react'

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Load menu items from Supabase
  useEffect(() => {
    async function loadMenuItems() {
      try {
        const items = await supabaseDataService.getMenuItems()
        setMenuItems(items)
      } catch (error) {
        console.error('Error loading menu items:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMenuItems()
  }, [])

  // Add new menu item
  const handleAddItem = async (itemData) => {
    try {
      const newItem = await supabaseDataService.createMenuItem(itemData)
      if (newItem) {
        setMenuItems(prev => [...prev, newItem])
      }
    } catch (error) {
      console.error('Error adding menu item:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {/* Your menu UI here */}
      {menuItems.map(item => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>${item.price}</p>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  )
}
```

## 🔐 Step 7: Security (Important!)

### 7.1 Current Setup
- All data access is currently allowed (for easy setup)
- This is fine for development and testing

### 7.2 For Production
When you're ready to deploy, you should:
1. Set up proper Row Level Security (RLS) policies
2. Or use API routes that validate Firebase tokens
3. This ensures users can only access their own data

## 🐛 Troubleshooting

### Problem: "User not authenticated" errors
**Solution:** Make sure you're logged in with Firebase before trying to access data

### Problem: Tables not showing in Supabase
**Solution:** 
1. Check if the SQL script ran successfully
2. Look for any error messages in the SQL Editor
3. Try running the script again

### Problem: Data not saving
**Solution:**
1. Check your browser console for errors
2. Verify your environment variables are correct
3. Make sure you're logged in

### Problem: Can't see data in Supabase dashboard
**Solution:**
1. Refresh the Table Editor page
2. Check if you're looking at the right table
3. Make sure data was actually saved (check console logs)

## 📚 Available Data Operations

Here are all the operations you can perform with the data service:

### Menu Items
```typescript
await supabaseDataService.getMenuItems()
await supabaseDataService.createMenuItem(data)
await supabaseDataService.updateMenuItem(id, updates)
await supabaseDataService.deleteMenuItem(id)
```

### Customers
```typescript
await supabaseDataService.getCustomers()
await supabaseDataService.createCustomer(data)
await supabaseDataService.updateCustomer(id, updates)
await supabaseDataService.deleteCustomer(id)
```

### Orders
```typescript
await supabaseDataService.getOrders()
await supabaseDataService.createOrder(data)
await supabaseDataService.updateOrder(id, updates)
await supabaseDataService.deleteOrder(id)
```

### Inventory
```typescript
await supabaseDataService.getInventoryItems()
await supabaseDataService.createInventoryItem(data)
await supabaseDataService.updateInventoryItem(id, updates)
await supabaseDataService.deleteInventoryItem(id)
```

### Staff
```typescript
await supabaseDataService.getStaffMembers()
await supabaseDataService.createStaffMember(data)
await supabaseDataService.updateStaffMember(id, updates)
await supabaseDataService.deleteStaffMember(id)
```

### And many more...

## 🎉 You're All Set!

Your restaurant management system now has:
- ✅ Complete database setup
- ✅ Real data storage in Supabase
- ✅ Easy-to-use data service
- ✅ All your restaurant data organized

## 🆘 Need Help?

If you run into any issues:
1. Check the browser console for error messages
2. Verify your Supabase connection in the dashboard
3. Make sure you're logged in with Firebase
4. Check that the SQL script ran successfully

Your data is now safely stored in Supabase and ready to use! 🚀
