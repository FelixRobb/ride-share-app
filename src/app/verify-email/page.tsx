"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function VerifyEmailContent() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        toast.error("No verification token provided")
        setIsVerifying(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setIsVerified(true)
          toast.success("Email verified successfully")
          setTimeout(() => router.push("/dashboard"), 3000)
        } else {
          throw new Error(data.error || "Failed to verify email")
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>Verifying your email address</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isVerifying ? (
          <Loader className="h-8 w-8 animate-spin" />
        ) : isVerified ? (
          <div className="text-center">
            <p className="text-xl font-semibold text-green-500 mb-2">Email Verified!</p>
            <p>You will be redirected to the dashboard shortly.</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-semibold text-red-500 mb-2">Verification Failed</p>
            <p>There was an error verifying your email. Please try again or contact support.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {!isVerifying && !isVerified && <Button onClick={() => router.push("/login")}>Back to Login</Button>}
      </CardFooter>
    </Card>

  )
}

export default function VerifyEmail() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-background/80 backdrop-blur-sm shadow-md border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex-shrink-0 mr-4">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              RideShare
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center bg-background">
        <Suspense fallback={
          <Skeleton className="w-[350] h-[300]"/>
        }>
          <VerifyEmailContent />
        </Suspense>
      </main>
      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  )
}