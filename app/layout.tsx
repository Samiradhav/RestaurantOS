import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { Providers } from "@/components/theme-provider"
import "./globals.css"

// Configure Inter font for better performance than Geist
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "RestraintOS - Restaurant Management System",
    template: "%s | RestraintOS"
  },
  description: "Complete restaurant management system with inventory, orders, staff management, and customer relations. Built for modern restaurants.",
  keywords: ["restaurant", "management", "POS", "inventory", "orders", "staff"],
  authors: [{ name: "RestraintOS Team" }],
  creator: "RestraintOS",
  publisher: "RestraintOS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'RestraintOS - Restaurant Management System',
    description: 'Complete restaurant management system with inventory, orders, staff management, and customer relations.',
    siteName: 'RestraintOS',
    images: [
      {
        url: '/placeholder-logo.png',
        width: 1200,
        height: 630,
        alt: 'RestraintOS - Restaurant Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RestraintOS - Restaurant Management System',
    description: 'Complete restaurant management system with inventory, orders, staff management, and customer relations.',
    images: ['/placeholder-logo.png'],
    creator: '@restraintos',
  },
  icons: {
    icon: [
      { url: "/placeholder-logo.svg", type: "image/svg+xml" }
      // Removed favicon.ico reference - file doesn't exist and causes 404 errors
    ],
    shortcut: "/placeholder-logo.svg",
    apple: "/placeholder-logo.png",
  },
  
  // Removed manifest reference since manifest.json doesn't exist
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src * 'unsafe-eval' 'unsafe-inline'; script-src * 'unsafe-eval' 'unsafe-inline'; style-src * 'unsafe-inline'; img-src * data: https:; media-src * data: https:; font-src * data:; connect-src *;"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              </div>
            }>
              {children}
            </Suspense>
          </div>
        </Providers>
      </body>
    </html>
  )
}