"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6 animate-fade-in-up">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary animate-pulse-glow" />
              <h1 className="text-2xl font-bold text-foreground">LibraryMS</h1>
            </div>
          </div>

          <Card className="border-destructive/20 shadow-xl hover-lift">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">Demo System Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                There was an issue with the demo system. Please try accessing the demo login again.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover-lift">
                  <Link href="/auth/login">Try Demo Login</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-transparent border-primary/30 hover:bg-primary/10"
                >
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
