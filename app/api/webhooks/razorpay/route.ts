import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { razorpayService } from '@/lib/razorpay-service'
import { subscriptionService } from '@/lib/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    const event = JSON.parse(body)
    console.log('Webhook event received:', event.event)

    const isValidSignature = razorpayService.verifyWebhookSignature(
      body,
      signature,
      secret
    )

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    switch (event.event) {
      case 'subscription.activated':
      case 'payment.captured':
        await handleSubscriptionActivated(event, supabase)
        break

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event, supabase)
        break

      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ status: 'ok' })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionActivated(event: any, supabase: any) {
  try {
    const subscriptionId = event.payload.subscription?.id
    const customerId = event.payload.subscription?.customer_id

    console.log('Subscription activated:', { subscriptionId, customerId })

    if (!subscriptionId || !customerId) {
      console.error('Missing subscription or customer ID in webhook')
      return
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('razorpay_customer_id', customerId)
      .single()

    if (error || !profile) {
      console.error('User profile not found for customer ID:', customerId)
      return
    }

    const subscription = await razorpayService.getSubscription(subscriptionId)
    const planId = subscription.plan_id

    await subscriptionService.activateSubscription(
      profile.id,
      customerId,
      subscriptionId,
      planId
    )

    await supabase
      .from('notifications')
      .insert({
        user_id: profile.id,
        type: 'subscription',
        title: 'Subscription Activated',
        message: 'Your subscription has been successfully activated. You now have access to all premium features!',
        action_url: '/dashboard',
        created_at: new Date().toISOString()
      })

    console.log('Subscription activated for user:', profile.id)

  } catch (error) {
    console.error('Error handling subscription activation:', error)
  }
}

async function handleSubscriptionCancelled(event: any, supabase: any) {
  try {
    const customerId = event.payload.subscription?.customer_id

    if (!customerId) {
      console.error('Missing customer ID in cancellation webhook')
      return
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('razorpay_customer_id', customerId)
      .single()

    if (error || !profile) {
      console.error('User profile not found for customer ID:', customerId)
      return
    }

    await subscriptionService.cancelSubscription(profile.id)

    await supabase
      .from('notifications')
      .insert({
        user_id: profile.id,
        type: 'subscription',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled. You can still use the service until your current billing period ends.',
        action_url: '/subscription',
        created_at: new Date().toISOString()
      })

    console.log('Subscription cancelled for user:', profile.id)

  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}
