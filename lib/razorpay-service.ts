import Razorpay from 'razorpay'
import { createHmac } from 'crypto'

export interface RazorpayCustomer {
  id: string
  name: string
  email: string
  contact?: string
}

export interface RazorpaySubscription {
  id: string
  plan_id: string
  customer_id: string
  status: string
  current_start: number
  current_end: number
  charge_at: number
  start_at: number
  end_at: number
  total_count: number
  paid_count: number
  customer_notify: boolean
  created_at: number
}

export class RazorpayService {
  private razorpay: any

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      console.error('Missing Razorpay environment variables:', {
        keyId: !!keyId,
        keySecret: !!keySecret
      })
      throw new Error(
        "Missing Razorpay environment variables. Please check your .env.local file."
      )
    }

    this.razorpay = new (Razorpay as any)({
      key_id: keyId,
      key_secret: keySecret
    })
  }

  async createCustomer(customerData: {
    name: string
    email: string
    contact?: string
  }): Promise<RazorpayCustomer> {
    try {
      const customer = await this.razorpay.customers.create({
        name: customerData.name,
        email: customerData.email,
        contact: customerData.contact || '',
        fail_existing: 0
      })

      return {
        id: customer.id,
        name: customer.name || customerData.name,
        email: customer.email || customerData.email,
        contact: customer.contact || customerData.contact
      }
    } catch (error) {
      console.error('Error creating Razorpay customer:', error)
      throw new Error('Failed to create customer')
    }
  }

  async createSubscription(subscriptionData: {
    plan_id: string
    customer_id: string
    total_count?: number
    quantity?: number
    start_at?: number
    expire_by?: number
    customer_notify?: boolean
    addons?: any[]
    notes?: Record<string, string>
  }): Promise<RazorpaySubscription> {
    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: subscriptionData.plan_id,
        customer_id: subscriptionData.customer_id,
        total_count: subscriptionData.total_count || 12,
        quantity: subscriptionData.quantity || 1,
        customer_notify: subscriptionData.customer_notify ?? true,
        notes: subscriptionData.notes || {}
      })

      return {
        id: subscription.id,
        plan_id: subscription.plan_id,
        customer_id: subscription.customer_id || subscriptionData.customer_id,
        status: subscription.status,
        current_start: subscription.current_start || 0,
        current_end: subscription.current_end || 0,
        charge_at: subscription.charge_at || 0,
        start_at: subscription.start_at || 0,
        end_at: subscription.end_at || 0,
        total_count: subscription.total_count || 12,
        paid_count: subscription.paid_count || 0,
        customer_notify: subscription.customer_notify ?? true,
        created_at: subscription.created_at || Date.now()
      }
    } catch (error) {
      console.error('Error creating Razorpay subscription:', error)
      throw new Error('Failed to create subscription')
    }
  }

  async getSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
    try {
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId)

      return {
        id: subscription.id,
        plan_id: subscription.plan_id,
        customer_id: subscription.customer_id || '',
        status: subscription.status,
        current_start: subscription.current_start || 0,
        current_end: subscription.current_end || 0,
        charge_at: subscription.charge_at || 0,
        start_at: subscription.start_at || 0,
        end_at: subscription.end_at || 0,
        total_count: subscription.total_count || 0,
        paid_count: subscription.paid_count || 0,
        customer_notify: subscription.customer_notify ?? true,
        created_at: subscription.created_at || Date.now()
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      throw new Error('Failed to fetch subscription')
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false) {
    try {
      const result = await this.razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd)
      return result
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = createHmac('sha256', secret)
        .update(body)
        .digest('hex')

      return signature === expectedSignature
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  async getPayment(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId)
      return payment
    } catch (error) {
      console.error('Error fetching payment:', error)
      throw new Error('Failed to fetch payment')
    }
  }
}

export const razorpayService = new RazorpayService()
