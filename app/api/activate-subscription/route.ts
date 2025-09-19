import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/lib/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const { userId, planId } = await request.json()

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing userId or planId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Activate subscription manually
    await subscriptionService.activateSubscription(
      userId,
      profile.razorpay_customer_id || 'manual',
      `manual_${Date.now()}`,
      planId
    )

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'subscription',
        title: 'Subscription Activated!',
        message: 'Your subscription has been manually activated.',
        action_url: '/dashboard',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Manual activation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to activate subscription' },
      { status: 500 }
    )
  }
}
