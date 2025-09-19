"use client"

import type React from "react"
import { Suspense } from "react"
import { SubscriptionGuard } from "@/components/auth/subscription-guard"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { FloatingChatbot } from "@/components/chatbot/floating-chatbot"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-64">
          <Navbar />
          <main className="p-6">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              {children}
            </Suspense>
          </main>
        </div>
        <FloatingChatbot />
      </div>
    </SubscriptionGuard>
  )
}
