"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmail() {
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
    <div className="flex items-center justify-center min-h-screen bg-background">
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
    </div>
  )
}

