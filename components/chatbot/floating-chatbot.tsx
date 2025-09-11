"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Bot, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-2xl hover:shadow-primary/25 transition-all duration-300"
          size="icon"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)]"
          >
            <Card className="shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-background/95 backdrop-blur-sm">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <div className="relative">
                      <Bot className="h-5 w-5 text-primary" />
                      <Sparkles className="h-2.5 w-2.5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    Restaurant Assistant
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)} 
                    className="h-8 w-8 hover:bg-muted/80 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="px-4 pb-4">
                <div className="flex flex-col items-center justify-center py-4 px-3 space-y-3">
                  {/* Coming Soon Icon */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Coming Soon Message */}
                  <div className="text-center space-y-3 max-w-sm">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        Coming Soon! 🚀
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Our intelligent Restaurant Assistant is currently under development and will be available soon.
                      </p>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                      <h4 className="font-medium text-xs text-primary">Features coming:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1 text-left">
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          Smart data insights
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          Customer management
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          Real-time processing
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          Inventory optimization
                        </li>
                      </ul>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Stay tuned for updates!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}