"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, ArrowLeft } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      router.push("/auth/login")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6 animate-fade-in-up">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary animate-pulse-glow" />
              <h1 className="text-2xl font-bold text-foreground">LibraryMS</h1>
            </div>
          </div>

          <Card className="border-primary/20 shadow-xl hover-lift">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ArrowLeft className="h-12 w-12 text-secondary" />
              </div>
              <CardTitle className="text-2xl text-primary">Redirecting...</CardTitle>
              <CardDescription>Taking you back to the demo login</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Email verification is not required for the demo system. You'll be redirected to the login page shortly.
              </p>
              <Button asChild variant="outline" className="w-full bg-transparent border-primary/30 hover:bg-primary/10">
                <Link href="/auth/login">Go to Login Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
