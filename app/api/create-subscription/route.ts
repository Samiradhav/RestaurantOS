import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { razorpayService } from '@/lib/razorpay-service'
import { subscriptionService } from '@/lib/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const plan = subscriptionService.getPlan(planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    let customerId = profile.razorpay_customer_id
    if (!customerId) {
      const customer = await razorpayService.createCustomer({
        name: profile.name || 'Unknown User',
        email: profile.email,
        contact: profile.phone || undefined
      })
      customerId = customer.id

      await supabase
        .from('user_profiles')
        .update({ razorpay_customer_id: customerId })
        .eq('id', userId)
    }

    const subscription = await razorpayService.createSubscription({
      plan_id: plan.razorpay_plan_id || 'plan_RIeYhI8swV5lFy',
      customer_id: customerId,
      total_count: plan.interval === 'month' ? 12 : 1,
      notes: {
        user_id: userId,
        plan_name: plan.name
      }
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_id: planId
      }
    })

  } catch (error: any) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
