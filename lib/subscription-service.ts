import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/lib/supabase-data-service"

export interface SubscriptionPlan {
  id: string
  razorpay_plan_id: string
  name: string
  amount: number // in paisa (₹1 = 100 paisa)
  currency: string
  interval: 'month' | 'year'
  description: string
  features: string[]
}

export interface SubscriptionStatus {
  isSubscribed: boolean
  isTrialActive: boolean
  trialDaysLeft: number
  trialEndDate: Date | null
  subscriptionPlan: string | null
  subscriptionStatus: string
}

export class SubscriptionService {
  private supabase = createClient()

  // Subscription plans configuration
  public readonly SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
    monthly: {
      id: 'monthly',
      razorpay_plan_id: 'plan_XXXXXXXXXXXXXXX', // ← Update this with your actual plan ID
      name: 'Monthly Subscription',
      amount: 9900, // ₹99
      currency: 'INR',
      interval: 'month',
      description: 'Full access to all restaurant management features',
      features: [
        'Unlimited menu items',
        'Complete order management',
        'Customer database',
        'Staff management',
        'Inventory tracking',
        'Sales reports & analytics',
        'Mobile app access',
        'Priority support',
        'All premium features'
      ]
    }
  }

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

  async hasAccess(userId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId)
    return status.isSubscribed || status.isTrialActive
  }

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

    await this.logSubscriptionEvent(userId, 'subscription_activated', {
      razorpay_customer_id: razorpayCustomerId,
      razorpay_subscription_id: razorpaySubscriptionId,
      plan_id: planId
    })
  }

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

  getPlan(planId: string): SubscriptionPlan | null {
    return this.SUBSCRIPTION_PLANS[planId] || null
  }

  getAllPlans(): SubscriptionPlan[] {
    return Object.values(this.SUBSCRIPTION_PLANS)
  }
}

export const subscriptionService = new SubscriptionService()
