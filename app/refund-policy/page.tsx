import type React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/signup">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign Up
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Refund Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: September 24, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Refunds and Cancellation Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Cancellation Rights</h3>
              <p>You may cancel your RestaurantOS subscription at any time through your account settings or by contacting our support team. Cancellation will take effect at the end of your current billing period.</p>

              <h3 className="text-lg font-medium text-foreground mt-6">Refund Timelines</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-foreground">Free Trial Cancellation</h4>
                  <p>No charges apply during the 7-day trial period. You can cancel anytime without any fees.</p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-foreground">Monthly Subscriptions</h4>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Refunds requested within 7 days of billing: Full refund minus any usage fees</li>
                    <li>Refunds requested within 14 days of billing: 50% refund minus any usage fees</li>
                    <li>Refunds requested after 14 days: No refund, service continues until end of billing period</li>
                    <li>Processing time: 5-7 business days after approval</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-foreground">Annual Subscriptions</h4>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Refunds requested within 30 days of billing: Full refund minus any usage fees</li>
                    <li>Refunds requested within 60 days of billing: 75% refund minus any usage fees</li>
                    <li>Refunds requested after 60 days: Prorated refund only, no early termination</li>
                    <li>Processing time: 7-10 business days after approval</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-medium text-foreground mt-6">Special Circumstances</h3>
              <p>We may provide refunds outside our standard policy in exceptional cases, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Service outages lasting more than 24 consecutive hours</li>
                <li>Material breaches of service level agreements</li>
                <li>Technical issues preventing reasonable use of the platform</li>
                <li>Account compromises due to our security failures</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6">Refund Processing</h3>
              <div className="space-y-2">
                <p>Approved refunds are processed through the original payment method:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Credit/debit cards: 5-7 business days</li>
                  <li>Bank transfers: 7-10 business days</li>
                  <li>Digital wallets: 1-3 business days</li>
                </ul>
                <p className="mt-2">You will receive email confirmation once the refund is processed. Processing times may vary based on your financial institution.</p>
              </div>

              <h3 className="text-lg font-medium text-foreground mt-6">Non-Refundable Items</h3>
              <p>The following are not eligible for refunds:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Third-party integrations or custom development fees</li>
                <li>Training or consultation services already provided</li>
                <li>Refunds requested due to change of mind after 14 days (monthly) or 30 days (annual)</li>
                <li>Refunds for accounts terminated due to violation of terms</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6">Account Termination</h3>
              <p>Upon cancellation, your account will remain active until the end of the paid period. After that:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Data backup available for 30 days post-cancellation</li>
                <li>Data deletion after 90 days unless you request earlier removal</li>
                <li>No access to historical data after account deactivation</li>
                <li>Re-activation possible within 30 days with prorated charges</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Links to Other Policies</h2>
            <p className="text-muted-foreground leading-relaxed">
              This Refund Policy should be read in conjunction with our other policies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><a href="/terms" className="text-primary hover:text-primary/80 transition-colors">Terms of Service</a> - Rules for using RestaurantOS</li>
              <li><a href="/privacy" className="text-primary hover:text-primary/80 transition-colors">Privacy Policy</a> - How we collect and protect your data</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
