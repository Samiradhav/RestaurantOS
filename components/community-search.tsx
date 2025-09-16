"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseDataService, RestaurantListing, CommunityMenuItem, RestaurantMessage } from '@/lib/supabase-data-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Search, MapPin, MessageSquare, Plus, Send, Phone, IndianRupee, AlertCircle, Clock, Check, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Notification, useNotifications } from '@/components/notifications'

interface SearchResult {
  restaurant_id: string
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
  distance?: number
  menu_items: Array<{
    id: string
    name: string
    description?: string
    price?: number
    category: string
    preparation_time?: number
    tags?: string[]
  }>
}

interface UserProfile {
  restaurant_name: string
}

// Updated to extend RestaurantMessage with the missing properties
// ... existing code ...
interface MessageWithStatus extends RestaurantMessage {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  tempId?: string
  receiver_id?: string
  sender_profile?: UserProfile
  receiver_profile?: UserProfile
}
// ... existing code ...

// Add this interface for the conversation grouping
interface Conversation {
  userId: string
  restaurantName: string
  lastMessage: RestaurantMessage & { receiver_id?: string; sender_profile?: UserProfile; receiver_profile?: UserProfile }
  unreadCount: number
  messages: (RestaurantMessage & { receiver_id?: string; sender_profile?: UserProfile; receiver_profile?: UserProfile })[]
}

export default function CommunitySearch() {
  const [activeTab, setActiveTab] = useState<'search' | 'list' | 'messages'>('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [pincode, setPincode] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [userListing, setUserListing] = useState<RestaurantListing | null>(null)
  const [menuItems, setMenuItems] = useState<CommunityMenuItem[]>([])
  const [messages, setMessages] = useState<(RestaurantMessage & { receiver_id?: string; sender_profile?: UserProfile; receiver_profile?: UserProfile })[]>([])
  const [chatMessages, setChatMessages] = useState<MessageWithStatus[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantListing | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const { toast } = useToast()
const { notifications, addNotification } = useNotifications()
  const supabase = createClient()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const lastMessageCountRef = useRef(0)
  const isUserScrollingRef = useRef(false)

  const typingTimeoutRef = useRef<number | null>(null)
  const typingChannelRef = useRef<any>(null)
  const messagesChannelRef = useRef<any>(null)
  const presenceChannelRef = useRef<any>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null);

 
const markMessageAsRead = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('restaurant_messages')
      .update({ is_read: true })
      .eq('id', messageId);
    if (error) throw error;
  } catch (error) {
    console.error('Error marking message as read:', error);
    toast({
      title: "Error",
      description: "Failed to mark message as read",
      variant: "destructive",
    });
  }
}

  const [listingForm, setListingForm] = useState({
    restaurant_name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    cuisine_type: '',
    latitude: '',
    longitude: '',
    pincode: ''
  })

  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    preparation_time: '',
    tags: ''
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsInitializing(true)
        setError(null)
        
        const userId = await supabaseDataService.getCurrentUser()
        setCurrentUserId(userId)
        
        await Promise.all([
          loadUserData(),
          loadMessages()
        ])

        setupRealtimeSubscriptions(userId)
      } catch (err) {
        console.error('Error initializing data:', err)
        setError('Failed to load data. Please refresh the page.')
        toast({
          title: "Error",
          description: "Failed to load community data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsInitializing(false)
      }
    }

    initializeData()

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      if (messagesChannelRef.current) {
        messagesChannelRef.current.unsubscribe()
      }
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe()
      }
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe()
      }
    }
  }, [])

  const setupRealtimeSubscriptions = useCallback((userId: string | null) => {
    if (!userId) return

    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'restaurant_messages',
          filter: `sender_id=eq.${userId}` // Listen for messages sent by this user
        },
        (payload) => {
          console.log('New message sent by user:', payload)
          handleNewMessage(payload.new as RestaurantMessage & { receiver_id?: string })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'restaurant_messages',
          filter: `receiver_id=eq.${userId}` // Listen for messages received by this user
        },
        (payload) => {
          console.log('New message received:', payload)
          handleNewMessage(payload.new as RestaurantMessage & { receiver_id?: string })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurant_messages',
          filter: `sender_id=eq.${userId}` // Listen for updates to messages sent by this user
        },
        (payload) => {
          console.log('Message sent by user updated:', payload)
          handleMessageUpdate(payload.new as RestaurantMessage & { receiver_id?: string })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurant_messages',
          filter: `receiver_id=eq.${userId}` // Listen for updates to messages received by this user
        },
        (payload) => {
          console.log('Message received by user updated:', payload)
          handleMessageUpdate(payload.new as RestaurantMessage & { receiver_id?: string })
        }
      )
      .subscribe((status) => {
        console.log('Messages channel status:', status)
      })
    
    messagesChannelRef.current = messagesChannel

    const typingChannel = supabase
      .channel('typing')
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.user_id !== userId && selectedRestaurant?.user_id === payload.user_id) {
          setOtherUserTyping(payload.isTyping)
        }
      })
      .subscribe()
    
    typingChannelRef.current = typingChannel

    const presenceChannel = supabase
      .channel('presence')
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState()
        const onlineUserIds = new Set<string>()
        Object.values(presenceState).forEach((presences: any[]) => {
          presences.forEach((presence: any) => {
            onlineUserIds.add(presence.user_id)
          })
        })
        setOnlineUsers(onlineUserIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: userId })
        }
      })
    
    presenceChannelRef.current = presenceChannel
  }, [selectedRestaurant])

// Original lines 263-302: Update handleNewMessage with duplicate notification check and add 'notifications' to deps
const handleNewMessage = useCallback((newMessage: RestaurantMessage & { receiver_id?: string }) => {
  setMessages(prev => {
    const exists = prev.some(msg => msg.id === newMessage.id)
    if (exists) return prev
    return [newMessage, ...prev]
  })

  if (selectedRestaurant && 
      (newMessage.sender_id === selectedRestaurant.user_id || newMessage.receiver_id === selectedRestaurant.user_id)) {
    setChatMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id)
      if (exists) return prev
      return [...prev, { ...newMessage, status: 'delivered' }]
    })

    if (newMessage.receiver_id === currentUserId) {
      playNotificationSound()
// ... existing code ...
if (!notifications.some((n: Notification) => n.message.includes(`New message from ${selectedRestaurant?.restaurant_name || 'Restaurant'}`) && !n.read)) {
 
        addNotification({
          type: 'chat',
          title: 'New Message',
          message: `New message from ${selectedRestaurant?.restaurant_name || 'Restaurant'}`,
          actionUrl: '/dashboard/community'
        })
      }
    }
  }

  if (isChatOpen && newMessage.receiver_id === currentUserId) {
    // ... existing code ...
markMessageAsRead(newMessage.id).catch(console.error)
// ... existing code ...
  }
}, [selectedRestaurant, currentUserId, isChatOpen, notifications]) // Added notifications to deps for duplicate check

const handleMessageUpdate = useCallback((updatedMessage: RestaurantMessage & { receiver_id?: string }) => {
  setMessages(prev => prev.map(msg => 
    msg.id === updatedMessage.id ? updatedMessage : msg
  ))
  setChatMessages(prev => prev.map(msg => 
    msg.id === updatedMessage.id ? { ...updatedMessage, status: updatedMessage.is_read ? 'read' : 'delivered' } : msg
  ))
}, [])



  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Silently fail if audio can't play
      })
    } catch (error) {
      // Silently fail
    }
  }, [])

  const handleTyping = useCallback(() => {
    if (!currentUserId || !selectedRestaurant || !typingChannelRef.current) return

    setIsTyping(true)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId, isTyping: true }
    })

    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false)
      if (typingChannelRef.current) {
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: currentUserId, isTyping: false }
        })
      }
    }, 3000)
  }, [currentUserId, selectedRestaurant])

  const loadUserData = useCallback(async () => {
    try {
      console.log('loadUserData: Starting...')
      
      const { isAuthenticated, userId } = await supabaseDataService.checkAuthentication()
      if (!isAuthenticated) {
        console.warn('loadUserData: User not authenticated')
        setError('Please log in to access the community feature')
        return
      }

      const listing = await supabaseDataService.getUserRestaurantListing()
      setUserListing(listing)

      if (listing) {
        const items = await supabaseDataService.getCommunityMenuItems(listing.id)
        setMenuItems(items)
      }
      
      console.log('loadUserData: Completed successfully')
    } catch (error: any) {
      console.error('loadUserData: Error:', error)
      setError(error.message || 'Failed to load restaurant data')
      throw error
    }
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      const userMessages = await supabaseDataService.getUserMessages()
      setMessages(userMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
      throw error
    }
  }, [])

  const searchFood = useCallback(async (term: string, pincode?: string): Promise<SearchResult[]> => {
    if (!term.trim()) {
      return []
    }

    try {
      const results = await supabaseDataService.searchNearbyRestaurants(term, undefined, undefined, 50, pincode)
      return results
    } catch (error: any) {
      console.error('Search error:', error)
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  const createListing = useCallback(async (listingData: typeof listingForm) => {
    const result = await supabaseDataService.createRestaurantListing({
      restaurant_name: listingData.restaurant_name,
      description: listingData.description,
      address: listingData.address,
      phone: listingData.phone,
      email: listingData.email,
      cuisine_type: listingData.cuisine_type,
      latitude: listingData.latitude ? parseFloat(listingData.latitude) : undefined,
      longitude: listingData.longitude ? parseFloat(listingData.longitude) : undefined,
      pincode: listingData.pincode || undefined,
      operating_hours: undefined,
      is_active: true
    })

    if (!result) {
      throw new Error('Failed to create restaurant listing')
    }

    return result
  }, [])

  const addMenuItem = useCallback(async (itemData: typeof menuForm) => {
    if (!userListing) {
      throw new Error('No restaurant listing found')
    }

    const tagsArray = itemData.tags
      ? itemData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : []

    const result = await supabaseDataService.createCommunityMenuItem({
      listing_id: userListing.id,
      name: itemData.name,
      description: itemData.description,
      category: itemData.category,
      price: itemData.price ? parseFloat(itemData.price) : undefined,
      preparation_time: itemData.preparation_time ? parseInt(itemData.preparation_time) : undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      is_available: true
    })

    if (!result) {
      throw new Error('Failed to create menu item')
    }

    return result
  }, [userListing])
  
  const sendMessage = useCallback(async (receiverId: string, message: string) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`
    
    const tempMessage: MessageWithStatus = {
      id: tempId,
      sender_id: currentUserId || '',
      conversation_id: '',
      message,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      status: 'sending',
      tempId,
      receiver_id: receiverId
    }
    
    setChatMessages(prev => [...prev, tempMessage])


try {
  const conversationId = await supabaseDataService.getOrCreateConversation(receiverId, currentUserId!)
  
  if (!conversationId) {
    throw new Error('Failed to create or find conversation')
  }



      const result = await supabaseDataService.sendMessage({
        conversation_id: conversationId,
        message,
        message_type: 'text',
        is_read: false
      })
    
      if (!result) {
        throw new Error('Failed to send message')
      }
      
      setChatMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...result, status: 'sent' as const, receiver_id: receiverId }
          : msg
      ))
      
      return result
    } catch (error) {
      console.error('Error sending message:', error)
      setChatMessages(prev => prev.filter(msg => msg.tempId !== tempId))
      throw error
    }
  }, [currentUserId])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a search term to find restaurants.",
        variant: "destructive",
      })
      return
    }

    if (!pincode.trim()) {
      toast({
        title: "Pincode required",
        description: "Please enter a pincode to find restaurants in your area.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const results = await searchFood(searchTerm, pincode)
      setSearchResults(results)
      toast({
        title: "Search completed",
        description: `Found ${results.length} restaurant${results.length !== 1 ? 's' : ''} with "${searchTerm}"${pincode ? ` in pincode ${pincode}` : ''}`,
      })
    } catch (error: any) {
      console.error('Search error:', error)
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateListing = async () => {
    if (!listingForm.restaurant_name.trim() || !listingForm.address.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in restaurant name and address",
        variant: "destructive",
      })
      return
    }

    if (!listingForm.cuisine_type) {
      toast({
        title: "Missing cuisine type",
        description: "Please select a cuisine type for your restaurant",
        variant: "destructive",
      })
      return
    }

    if (!listingForm.pincode.trim()) {
      toast({
        title: "Missing pincode",
        description: "Please enter a pincode for your restaurant",
        variant: "destructive",
      })
      return
    }

    try {
      const listing = await createListing(listingForm)
      setUserListing(listing)
      
      setListingForm({
        restaurant_name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        cuisine_type: '',
        latitude: '',
        longitude: '',
        pincode: ''
      })
      
      toast({
        title: "Success!",
        description: "Your restaurant is now listed in the community",
      })
    } catch (error: any) {
      console.error('Create listing error:', error)
      toast({
        title: "Failed to create listing",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleAddMenuItem = async () => {
    if (!menuForm.name.trim() || !menuForm.category.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter item name and category",
        variant: "destructive",
      })
      return
    }

    try {
      const item = await addMenuItem(menuForm)
      setMenuItems(prev => [item, ...prev])
      
      setMenuForm({
        name: '',
        description: '',
        category: '',
        price: '',
        preparation_time: '',
        tags: ''
      })
      
      toast({
        title: "Menu item added",
        description: "Your menu item is now visible to the community",
      })
    } catch (error: any) {
      console.error('Add menu item error:', error)
      toast({
        title: "Failed to add menu item",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!selectedRestaurant || !newMessage.trim()) {
      return
    }

    try {
      await sendMessage(selectedRestaurant.user_id, newMessage)
      setNewMessage('')
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        setIsTyping(false)
        if (typingChannelRef.current) {
          typingChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: currentUserId, isTyping: false }
          })
        }
      }
    } catch (error: any) {
      console.error('Send message error:', error)
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const openChat = async (restaurant: RestaurantListing) => {
    setSelectedRestaurant(restaurant)
    setIsChatOpen(true)
    try {
      await loadChatMessages(restaurant.user_id)
      
      const unreadMessages = chatMessages.filter(msg => 
        msg.receiver_id === currentUserId && !msg.is_read
      )
      // ... existing code ...
unreadMessages.forEach(msg => markMessageAsRead(msg.id).catch(console.error))
// ... existing code ...
    } catch (error) {
      console.error('Error opening chat:', error)
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      })
    }
  }

  const loadChatMessages = useCallback(async (otherUserId: string) => {
    try {
      if (!currentUserId) {
        throw new Error('User not authenticated')
      }

      const allMessages = await supabaseDataService.getUserMessages()
      const chatMessages = allMessages.filter(msg => 
        (msg.sender_id === currentUserId && (msg as any).receiver_id === otherUserId) ||
        (msg.sender_id === otherUserId && (msg as any).receiver_id === currentUserId)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      setChatMessages(chatMessages.map(msg => ({
        ...msg,
        status: msg.is_read ? 'read' as const : 
                (msg.sender_id === currentUserId ? 'sent' as const : 'delivered' as const),
        receiver_id: (msg as any).receiver_id
      })))

      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      }, 100)
const markMessageAsRead = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('restaurant_messages')
      .update({ is_read: true })
      .eq('id', messageId);
    if (error) throw error;
  } catch (error) {
    console.error('Error marking message as read:', error);
    toast({
      title: "Error",
      description: "Failed to mark message as read",
      variant: "destructive",
    });
  }
}
// ... existing code ...
// ... existing code ...
    } catch (error) {
      console.error('Load chat messages error:', error)
      throw error
    }
  }, [currentUserId])

  // Enhanced scroll to bottom with smooth animation
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  }, [])

  // Check if user is near bottom of chat
  const checkScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const nearBottom = distanceFromBottom < 100 // Within 100px of bottom
      
      setIsNearBottom(nearBottom)
      setShowScrollButton(!nearBottom)
      
      // If user manually scrolled away from bottom, mark as user scrolling
      if (!nearBottom) {
        isUserScrollingRef.current = true
      } else {
        isUserScrollingRef.current = false
      }
    }
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    checkScrollPosition()
  }, [checkScrollPosition])

  
// Auto-scroll to bottom when new messages arrive
useEffect(() => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }
}, [chatMessages]);

  // Auto-scroll for new messages (like Instagram)
  useEffect(() => {
    const currentMessageCount = chatMessages.length
    
    // Only auto-scroll if:
    // 1. We have new messages
    // 2. User is near bottom OR it's the initial load
    // 3. Chat is open
    if (currentMessageCount > lastMessageCountRef.current && 
        isChatOpen && 
        (isNearBottom || lastMessageCountRef.current === 0)) {
      // Small delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(true), 50)
    }
    
    lastMessageCountRef.current = currentMessageCount
  }, [chatMessages.length, isChatOpen, isNearBottom, scrollToBottom])

  // Set up scroll listener
  useEffect(() => {
    if (messagesContainerRef.current && isChatOpen) {
      messagesContainerRef.current.addEventListener('scroll', handleScroll)
      return () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.removeEventListener('scroll', handleScroll)
        }
      }
    }
  }, [isChatOpen, handleScroll])

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (isChatOpen && chatMessages.length > 0) {
      setTimeout(() => scrollToBottom(false), 100)
    }
  }, [isChatOpen, chatMessages.length, scrollToBottom])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  if (isInitializing) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Restaurant Community</h1>
          <p className="text-muted-foreground">
            Connect with nearby restaurants to suggest alternatives to your customers
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading community data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Restaurant Community</h1>
          <p className="text-muted-foreground">
            Connect with nearby restaurants to suggest alternatives to your customers
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-2">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Restaurant Community</h1>
        <p className="text-muted-foreground">
          Connect with nearby restaurants to suggest alternatives to your customers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Find Food</TabsTrigger>
          <TabsTrigger value="list">List My Restaurant</TabsTrigger>
          <TabsTrigger value="messages">
            Messages 
            {(() => {
              const unreadCount = messages.filter(m => !m.is_read && (m as any).receiver_id === currentUserId).length
              return unreadCount > 0 ? `(${unreadCount > 99 ? '99+' : unreadCount})` : ''
            })()}
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search for Food Items</CardTitle>
              <CardDescription>
                Find restaurants that can provide specific food items for your customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for food items (e.g., pizza, sushi, burger)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Input
                  placeholder="Pincode *"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isLoading}
                  className="w-32"
                  type="text"
                  required
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              <div className="grid gap-4">
                {searchResults.map((result) => (
                  <Card key={result.restaurant_id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{result.restaurant_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {result.address}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {result.phone}
                        </div>
                        <Badge>{result.cuisine_type}</Badge>
                        {result.pincode && (
                          <p className="text-sm text-muted-foreground">
                            Pincode: {result.pincode}
                          </p>
                        )}
                        {result.distance && (
                          <p className="text-sm text-muted-foreground">
                            Distance: {result.distance.toFixed(1)} km
                          </p>
                        )}
                      </div>
                      <Button 
                        onClick={() => openChat({
                          id: result.restaurant_id,
                          user_id: result.user_id,
                          restaurant_name: result.restaurant_name,
                          description: result.description || '',
                          address: result.address,
                          phone: result.phone || '',
                          email: result.email || '',
                          cuisine_type: result.cuisine_type,
                          latitude: result.latitude,
                          longitude: result.longitude,
                          is_active: true,
                          created_at: '',
                          updated_at: ''
                        })}
                        disabled={!result.restaurant_id}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Available Menu Items:</h4>
                      <div className="grid gap-2">
                        {result.menu_items.slice(0, 5).map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                            <div className="flex-1">
                              <span className="font-medium">{item.name}</span>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{item.category}</Badge>
                                {item.price && (
                                  <div className="flex items-center gap-1 text-sm font-medium">
                                    <IndianRupee className="h-3 w-3" />
                                    {item.price.toFixed(2)}
                                  </div>
                                )}
                                {item.preparation_time && (
                                  <span className="text-xs text-muted-foreground">
                                    {item.preparation_time} min prep
                                  </span>
                                )}
                              </div>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {item.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {result.menu_items.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            +{result.menu_items.length - 5} more items available
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {searchResults.length === 0 && !isLoading && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No restaurants found with "{searchTerm}"</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try a different search term
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Business Tab */}
        <TabsContent value="list" className="space-y-6">
          {!userListing ? (
            <Card>
              <CardHeader>
                <CardTitle>List Your Restaurant</CardTitle>
                <CardDescription>
                  Make your restaurant visible to the community and help customers find alternatives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant_name">Restaurant Name *</Label>
                    <Input
                      id="restaurant_name"
                      value={listingForm.restaurant_name}
                      onChange={(e) => setListingForm(prev => ({ ...prev, restaurant_name: e.target.value }))}
                      placeholder="Your Restaurant Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuisine_type">Cuisine Type *</Label>
                    <Select 
                      value={listingForm.cuisine_type} 
                      onValueChange={(value) => setListingForm(prev => ({ ...prev, cuisine_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cuisine type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="italian">Italian</SelectItem>
                        <SelectItem value="chinese">Chinese</SelectItem>
                        <SelectItem value="mexican">Mexican</SelectItem>
                        <SelectItem value="indian">Indian</SelectItem>
                        <SelectItem value="american">American</SelectItem>
                        <SelectItem value="japanese">Japanese</SelectItem>
                        <SelectItem value="thai">Thai</SelectItem>
                        <SelectItem value="mediterranean">Mediterranean</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={listingForm.description}
                    onChange={(e) => setListingForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your restaurant..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={listingForm.phone}
                      onChange={(e) => setListingForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={listingForm.email}
                      onChange={(e) => setListingForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@restaurant.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude (optional)</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={listingForm.latitude}
                      onChange={(e) => setListingForm(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="40.7128"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude (optional)</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={listingForm.longitude}
                      onChange={(e) => setListingForm(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="-74.0060"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={listingForm.address}
                    onChange={(e) => setListingForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={listingForm.pincode}
                    onChange={(e) => setListingForm(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="12345"
                    type="text"
                    required
                  />
                </div>

                <Button onClick={handleCreateListing} className="w-full">
                  Create Restaurant Listing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Restaurant Listing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{userListing.restaurant_name}</h3>
                    <p className="text-muted-foreground">{userListing.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {userListing.address}
                    </div>
                    {userListing.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        {userListing.phone}
                      </div>
                    )}
                    <Badge>{userListing.cuisine_type}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add Menu Items</CardTitle>
                  <CardDescription>
                    Add items that other restaurants can search for and contact you about
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_name">Item Name *</Label>
                      <Input
                        id="item_name"
                        value={menuForm.name}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Pizza Margherita"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item_category">Category *</Label>
                      <Select 
                        value={menuForm.category} 
                        onValueChange={(value) => setMenuForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appetizers">Appetizers</SelectItem>
                          <SelectItem value="main-courses">Main Courses</SelectItem>
                          <SelectItem value="desserts">Desserts</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                          <SelectItem value="sides">Sides</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_price">Price (optional)</Label>
                      <Input
                        id="item_price"
                        type="number"
                        step="0.01"
                        value={menuForm.price}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="15.99"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preparation_time">Prep Time (min)</Label>
                      <Input
                        id="preparation_time"
                        type="number"
                        value={menuForm.preparation_time}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, preparation_time: e.target.value }))}
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item_description">Description</Label>
                    <Textarea
                      id="item_description"
                      value={menuForm.description}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the item..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item_tags">Tags (comma-separated)</Label>
                    <Input
                      id="item_tags"
                      value={menuForm.tags}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="vegetarian, spicy, gluten-free"
                    />
                  </div>

                  <Button onClick={handleAddMenuItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Menu Items ({menuItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {menuItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 border rounded">
                        <div className="space-y-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.category}</Badge>
                            {item.price && (
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <IndianRupee className="h-3 w-3" />
                                {item.price.toFixed(2)}
                              </div>
                            )}
                            {item.preparation_time && (
                              <span className="text-xs text-muted-foreground">
                                {item.preparation_time} min prep
                              </span>
                            )}
                          </div>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex gap-1">
                              {item.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant={item.is_available ? "default" : "secondary"}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

       {/* Messages Tab */}
<TabsContent value="messages" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Messages
      </CardTitle>
      <CardDescription>
        Chat with other restaurants in your community
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {(() => {
          const conversations = new Map<string, Conversation>()

          messages.forEach(message => {
            const otherUserId = message.sender_id === currentUserId ? (message as any).receiver_id : message.sender_id
            const otherUserName = message.sender_id === currentUserId
              ? ((message as any).receiver_profile?.restaurant_name || 'Unknown Restaurant')
              : ((message as any).sender_profile?.restaurant_name || 'Unknown Restaurant')

            if (!conversations.has(otherUserId)) {
              conversations.set(otherUserId, {
                userId: otherUserId,
                restaurantName: otherUserName,
                lastMessage: message,
                unreadCount: 0,
                messages: []
              })
            }

            const conversation = conversations.get(otherUserId)!
            conversation.messages.push(message)

            if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
              conversation.lastMessage = message
            }

            if (!message.is_read && (message as any).receiver_id === currentUserId) {
              conversation.unreadCount++
            }
          })

          const conversationList = Array.from(conversations.values())
            .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())

          return conversationList.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                Start by searching for food items or listing your restaurant to connect with others
              </p>
            </div>
          ) : (
            conversationList.map((conversation) => (
              <div
                key={conversation.userId}
                className="flex items-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={async () => {
                  const tempRestaurant: RestaurantListing = {
                    id: conversation.userId,
                    user_id: conversation.userId,
                    restaurant_name: conversation.restaurantName,
                    description: '',
                    address: '',
                    phone: '',
                    email: '',
                    cuisine_type: '',
                    latitude: undefined,
                    longitude: undefined,
                    is_active: true,
                    created_at: '',
                    updated_at: ''
                  }

                  await openChat(tempRestaurant)
                }}
              >
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                    {conversation.restaurantName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground truncate">
                    {conversation.restaurantName}
                    </h4>
                    <div className="flex items-center gap-2">
                    {onlineUsers.has(conversation.userId) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.lastMessage.created_at)}
                      </span>
                  </div>
                </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {conversation.lastMessage.sender_id === currentUserId && 'You: '}
                      {conversation.lastMessage.message}
                    </p>

                {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        })()}
      </div>
    </CardContent>
  </Card>
</TabsContent>
</Tabs>

{/* Chat Dialog */}
<Dialog open={isChatOpen} onOpenChange={(open) => {
  setIsChatOpen(open);
  if (!open) {
    document.body.style.overflow = 'auto'; // Restore body scroll when dialog closes
  } else {
    document.body.style.overflow = 'hidden'; // Prevent body scroll when dialog is open
  }
}}>
  <DialogContent className="max-w-2xl max-h-[80vh] h-[600px] p-0 flex flex-col overflow-hidden">
    <DialogTitle className="sr-only">
      Chat with {selectedRestaurant?.restaurant_name || 'Restaurant'}
    </DialogTitle>
    {/* Fixed Header */}
    <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {selectedRestaurant?.restaurant_name?.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900">
            {selectedRestaurant?.restaurant_name}
          </h3>
          <div className="flex items-center gap-2">
            {selectedRestaurant && onlineUsers.has(selectedRestaurant.user_id) ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Active now</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-xs text-gray-500">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsChatOpen(false)}
        className="h-8 w-8 p-0"
      >
        ✕
      </Button>
    </div>

    {/* Messages Container - Scrollable */}
      <div 
      id="chatBox"
        ref={messagesContainerRef} 
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ scrollBehavior: 'smooth' }}
      >
        {chatMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start a conversation!</p>
            </div>
          </div>
        ) : (
          chatMessages.map((message: MessageWithStatus) => (
          <div key={message.id || message.tempId} className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender_id === currentUserId 
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.message}
              </p>
              <div className={`flex items-center justify-end mt-1 space-x-1 ${
                message.sender_id === currentUserId ? 'text-blue-100' : 'text-gray-400'
              }`}>
                <span className="text-xs">
                  {formatTime(message.created_at)}
                </span>
                  {message.sender_id === currentUserId && (
                  <div className="text-xs">
                      {message.status === 'sending' && <Clock className="h-3 w-3" />}
                      {message.status === 'sent' && <Check className="h-3 w-3" />}
                      {message.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                    {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-300" />}
                      {message.status === 'failed' && (
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 text-red-300" />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                          onClick={() => sendMessage(message.receiver_id || '', message.message)}
                          className="p-0 h-auto text-xs text-red-300 hover:text-red-100"
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {otherUserTyping && (
        <div className="flex justify-start">
          <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
              <span className="text-xs text-gray-500">Typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

    {/* Fixed Input Area */}
    <div id="chatForm" className="flex-shrink-0 bg-white border-t border-gray-200 p-3">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const messageText = newMessage.trim();
          if (messageText) {
            handleSendMessage();
          }
        }}
        className="flex items-center gap-2 max-w-2xl mx-auto"
      >
          <div className="flex-1 relative">
            <Input 
            id="messageInput"
            className="w-full shadow-sm rounded-full border focus-visible:ring-2 focus-visible:ring-blue-500 bg-white hover:bg-gray-50 transition-all duration-200 pr-12"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onFocus={() => {
              // Ensure input is visible when focused
                setTimeout(() => {
                  messagesContainerRef.current?.scrollTo({
                    top: messagesContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                  });
              }, 300);
              }}
            />
          </div>
          <Button 
          type="submit"
          className="rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            disabled={!newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
      </form>
    </div>
  </DialogContent>
</Dialog>
</div>
)
}