"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChefHat,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Settings,
  Menu,
  X,
  Plus,
  User,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/lib/shared-state"
import { cn } from "@/lib/utils"

// Types for navigation items
interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

// Navigation configuration
const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview and analytics" },
  { name: "Menu", href: "/dashboard/menu", icon: ChefHat, description: "Manage menu items" },
  { name: "Customers", href: "/dashboard/customers", icon: Users, description: "Customer management" },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart, description: "Order management" },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package, description: "Stock management" },
  { name: "Reports", href: "/dashboard/reports", icon: TrendingUp, description: "Sales and analytics" },
  { name: "Staff", href: "/dashboard/staff", icon: UserCheck, description: "Staff management" },
  { name: "Community", href: "/dashboard/community", icon: MessageSquare, description: "Connect with other restaurants" },
  { name: "Profile", href: "/dashboard/profile", icon: User, description: "User profile" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, description: "App settings" },
]

// Memoized navigation item component
const NavigationItem = memo(({ item, isActive, isCollapsed }: { 
  item: NavigationItem; 
  isActive: boolean; 
  isCollapsed: boolean 
}) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Let the Link component handle navigation
    }
  }, [])

  return (
    <Link 
      href={item.href}
      aria-label={`${item.name}${item.description ? ` - ${item.description}` : ''}`}
      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
    >
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="truncate"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  )
})

NavigationItem.displayName = "NavigationItem"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [navigationError, setNavigationError] = useState<string | null>(null)
  
  const { isOpen, toggle, close } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  // Fix hydration mismatch - only access window after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Handle mobile detection with proper cleanup
  useEffect(() => {
    if (!isMounted) return

    const checkMobile = () => {
      try {
        const width = window.innerWidth
        setIsMobile(width < 1024)
      } catch (error) {
        console.warn('Error checking mobile state:', error)
        // Fallback to false if window is not available
        setIsMobile(false)
      }
    }

    checkMobile()

    try {
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    } catch (error) {
      console.warn('Error setting up resize listener:', error)
      return () => {}
    }
  }, [isMounted])

  // Memoized navigation items with active state
  const navigationWithActiveState = useMemo(() => {
    return navigationItems.map(item => ({
      ...item,
      isActive: pathname === item.href
    }))
  }, [pathname])

  // Handle quick add with error handling
  const handleQuickAdd = useCallback(async () => {
    try {
      setNavigationError(null)
      await router.push("/dashboard/customers")
    } catch (error) {
      console.error('Error navigating to customers:', error)
      setNavigationError('Failed to navigate to customers page')
    }
  }, [router])

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    if (isMobile) {
      toggle()
    } else {
      setIsCollapsed(prev => !prev)
    }
  }, [isMobile, toggle])

  // Handle keyboard navigation for sidebar
  const handleSidebarKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isMobile && isOpen) {
      close()
    }
  }, [isMobile, isOpen, close])

  // Clear navigation errors
  useEffect(() => {
    if (navigationError) {
      const timer = setTimeout(() => setNavigationError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [navigationError])

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <motion.aside
        initial={{ x: -280 }}
        className="fixed left-0 top-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border"
      >
        <div className="flex h-16 items-center justify-center">
          <div className="animate-pulse bg-muted h-8 w-32 rounded"></div>
        </div>
      </motion.aside>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : "translate-x-0",
        )}
        onKeyDown={handleSidebarKeyDown}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <ChefHat className="h-8 w-8 text-primary" aria-hidden="true" />
                <span className="text-xl font-bold text-sidebar-foreground">
                  RestaurantOS
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSidebarToggle}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.div
                  key="menu"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="x"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4" role="menu">
          {navigationWithActiveState.map((item) => (
            <NavigationItem
              key={item.name}
              item={item}
              isActive={item.isActive}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Quick Actions */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 border-t border-sidebar-border"
            >
              {/* Error message */}
              <AnimatePresence>
                {navigationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      {navigationError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                onClick={handleQuickAdd}
                className="w-full justify-start gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2" 
                size="sm"
                disabled={!!navigationError}
                aria-label="Add new customer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Quick Add
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  )
}