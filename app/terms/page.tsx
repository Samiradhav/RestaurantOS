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
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: October 6, 2025</p>
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
              RestaurantOS is a comprehensive restaurant management platform that provides tools for inventory management, order processing, customer management, staff scheduling, and business analytics. The service is provided free of charge with no subscription fees, hidden costs, or premium features behind paywalls.
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
            <h2 className="text-2xl font-semibold text-foreground">4. Service Availability</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Free Service</h3>
              <p>RestaurantOS is provided as a completely free service. We reserve the right to modify or discontinue the service at any time without notice, though we strive to maintain consistent availability for all users.</p>

              <h3 className="text-lg font-medium text-foreground mt-6">Data and Privacy</h3>
              <p>Your data is stored securely and we are committed to protecting your privacy. All features of RestaurantOS are available to all users without any restrictions or limitations based on usage levels.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Data Usage and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of RestaurantOS is also governed by our Privacy Policy, which outlines how we collect, use, and protect your data. By using our service, you consent to our data practices as described in the Privacy Policy.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Acceptable Use Policy</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>You agree not to use RestaurantOS to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Store or transmit inappropriate, offensive, or illegal content</li>
                <li>Share your account credentials with unauthorized users</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              RestaurantOS and its original content, features, and functionality are owned by RestaurantOS and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to RestaurantOS immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the service will cease immediately. We may also delete your data after a reasonable period following termination.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall RestaurantOS, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. Your continued use of the service after changes take effect constitutes acceptance of the new terms.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be interpreted and governed by the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Contact Information</h2>
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
                  <span>Pune, Maharashtra, India</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}