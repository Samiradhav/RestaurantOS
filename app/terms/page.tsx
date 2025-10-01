import type React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: September 24, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using RestaurantOS ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              RestaurantOS is a comprehensive restaurant management platform that provides tools for inventory management, order processing, customer management, staff scheduling, and business analytics. The service is provided on a subscription basis with various pricing tiers.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. User Accounts and Registration</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>To use RestaurantOS, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be at least 18 years old to create an account</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Subscription and Payment</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>RestaurantOS operates on a subscription model:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Free trial period of 7 days is provided upon registration</li>
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>Payment is processed securely through Razorpay</li>
                <li>Failed payments may result in service suspension</li>
                <li>Refunds are provided according to our refund policy</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Refunds and Cancellation Policy</h2>
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
            <h2 className="text-2xl font-semibold text-foreground">6. Data Usage and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of RestaurantOS is also governed by our Privacy Policy, which outlines how we collect, use, and protect your data. By using our service, you consent to our data practices as described in the Privacy Policy.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Acceptable Use Policy</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>You agree not to use RestaurantOS to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the service or servers</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              RestaurantOS and its original content, features, and functionality are owned by RestaurantOS and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to RestaurantOS immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the service will cease immediately.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall RestaurantOS, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be interpreted and governed by the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. Contact Information</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Email:</span>
                  <a href="mailto:support@restaurantos.in" className="text-primary hover:text-primary/80 transition-colors">
                    support@restaurantos.in
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Phone:</span>
                  <a href="tel:+919876543210" className="text-primary hover:text-primary/80 transition-colors">
                    +91-9371939637
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Business Hours:</span>
                  <span>Monday - Friday, 9:00 AM - 6:00 PM IST</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Address:</span>
                  <span>pune, Maharashtra, India</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
