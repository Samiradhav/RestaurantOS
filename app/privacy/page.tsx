import type React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: September 25, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
            <div className="space-y-3 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Personal Information</h3>
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name, email address, and phone number</li>
                <li>Restaurant name and business details</li>
                <li>Payment information for subscription billing</li>
                <li>Profile information and preferences</li>
                <li>Communication preferences and marketing consents</li>
                <li>Customer feedback and support requests</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6">Usage Data</h3>
              <p>We automatically collect certain information when you use RestaurantOS:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Device information and screen resolution</li>
                <li>Usage patterns and feature interactions</li>
                <li>Performance metrics and error reports</li>
                <li>Time zone and language preferences</li>
                <li>Session duration and navigation paths</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6">Technical Data</h3>
              <p>We collect technical information to improve our services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device identifiers and operating system</li>
                <li>Mobile device information (if applicable)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Crash reports and diagnostic data</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Legal Basis for Processing</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We process your personal data based on the following legal grounds:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Contract:</strong> To provide RestaurantOS services and fulfill our contractual obligations</li>
                <li><strong>Legitimate Interest:</strong> To improve our services, ensure security, and communicate with you</li>
                <li><strong>Consent:</strong> For marketing communications and non-essential cookies</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                <li><strong>Vital Interests:</strong> To protect the safety and security of our users</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve RestaurantOS</li>
                <li>Process transactions and manage subscriptions</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Prevent fraud and maintain platform security</li>
                <li>Comply with legal obligations</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Personalize your experience and content</li>
                <li>Conduct research and analytics</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Information Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>With service providers who assist in our operations (payment processors, hosting providers)</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or acquisition</li>
              <li>With your explicit consent</li>
              <li>To prevent fraud, security threats, or illegal activities</li>
              <li>With professional advisors (lawyers, accountants) under confidentiality agreements</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Cookies and Tracking Technologies</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We use cookies and similar technologies to enhance your experience:</p>
              <h3 className="text-lg font-medium text-foreground mt-4">Essential Cookies</h3>
              <p>These are necessary for the website to function properly:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Authentication and session management</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing and performance</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-4">Analytics Cookies</h3>
              <p>These help us understand how you use our service:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Usage patterns and feature adoption</li>
                <li>Performance metrics and error tracking</li>
                <li>Conversion and engagement data</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-4">Marketing Cookies</h3>
              <p>These are used to deliver relevant advertisements:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Personalized content and recommendations</li>
                <li>Retargeting and campaign effectiveness</li>
                <li>Social media integration</li>
              </ul>

              <p className="mt-4">You can control cookie settings through your browser preferences or our cookie consent tool. Disabling certain cookies may affect website functionality.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Third-Party Services and Integrations</h2>
            <p className="text-muted-foreground leading-relaxed">
              RestaurantOS integrates with third-party services such as payment processors (Razorpay) and authentication providers (Google). These services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of these third parties.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We may also integrate with additional services for enhanced functionality, including cloud storage providers, analytics platforms, and customer support tools. Each integration is carefully selected to ensure compliance with data protection standards.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, regular security audits, and access controls. We use industry-standard security protocols and regularly update our systems to address emerging threats.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Despite our best efforts, no security system is completely impenetrable. We cannot guarantee the absolute security of your information, but we are committed to protecting it using reasonable and appropriate measures.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, we securely delete or anonymize it.
            </p>
            <div className="space-y-2 mt-4">
              <p className="text-muted-foreground">Specific retention periods:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Account data: Retained while your account is active and for 3 years after deactivation</li>
                <li>Payment information: Retained for 7 years for tax and accounting purposes</li>
                <li>Usage logs: Retained for 2 years for security and analytics</li>
                <li>Marketing data: Retained until you unsubscribe or withdraw consent</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Your Rights and Choices</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>You have the following rights regarding your data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data (right to be forgotten)</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Objection:</strong> Object to certain data processing activities, including direct marketing</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for processing based on consent at any time</li>
              </ul>
              <p className="mt-4">To exercise these rights, please contact us using the information provided below. We will respond to your request within 30 days and may require verification of your identity.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Automated Decision Making and Profiling</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use automated decision-making and profiling in limited circumstances to enhance your experience and provide personalized services. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Personalized recommendations based on your usage patterns</li>
              <li>Fraud detection and security monitoring</li>
              <li>Automated customer support routing</li>
              <li>Content personalization and feature suggestions</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You have the right to object to automated decision-making that significantly affects you. If you believe an automated decision about you was incorrect, you can request human review.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Do Not Track Signals</h2>
            <p className="text-muted-foreground leading-relaxed">
              We honor Do Not Track (DNT) signals and similar mechanisms that indicate your preference to opt-out of tracking across websites. When we detect a DNT signal, we limit our use of tracking technologies accordingly. However, some features of our service may not function properly without certain tracking technologies.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Data Breach Notification</h2>
            <p className="text-muted-foreground leading-relaxed">
              In the event of a data breach that poses a risk to your personal information, we will notify affected users in accordance with applicable data protection laws. Notifications will be sent without undue delay and will include information about the breach, potential risks, and steps you can take to protect yourself.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. California Privacy Rights</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Right to know what personal information we collect and how it's used</li>
                <li>Right to delete your personal information</li>
                <li>Right to opt-out of the sale of your personal information</li>
                <li>Right to non-discrimination for exercising your CCPA rights</li>
              </ul>
              <p className="mt-4">We do not sell personal information as defined by CCPA. To exercise your California privacy rights, please contact us.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">14. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Standard contractual clauses approved by regulatory authorities</li>
              <li>Adequacy decisions by competent data protection authorities</li>
              <li>Binding corporate rules for intra-group transfers</li>
              <li>Certification schemes and codes of conduct</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">15. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              RestaurantOS is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will take steps to delete it promptly. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">16. Links to Other Policies</h2>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy should be read in conjunction with our other policies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><a href="/terms" className="text-primary hover:text-primary/80 transition-colors">Terms of Service</a> - Rules for using RestaurantOS</li>
              <li><a href="/cookies" className="text-primary hover:text-primary/80 transition-colors">Cookie Policy</a> - Detailed cookie usage information</li>
              <li><a href="/acceptable-use" className="text-primary hover:text-primary/80 transition-colors">Acceptable Use Policy</a> - Guidelines for appropriate platform usage</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">17. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. For significant changes, we may also send email notifications or provide in-app notifications. Your continued use of RestaurantOS after such changes constitutes acceptance of the updated policy.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">18. Contact Us</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">General Support:</span>
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
              <p className="mt-4">
                You can also reach us through our{" "}
                <a href="/contact" className="text-primary hover:text-primary/80 transition-colors">
                  contact page
                </a>{" "}
                or support channels within the application.
              </p>
              <p className="mt-4">
                For data protection inquiries under GDPR or other regulations, please include "Data Protection" in your subject line for faster processing.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
