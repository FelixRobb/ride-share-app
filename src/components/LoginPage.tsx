"use client"



import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ArrowRight, Mail, Phone } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import PhoneInput from "react-phone-number-input"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import "react-phone-number-input/style.css"

interface LoginPageProps {
  quote: {
    quote: string
    author: string
    source?: string
  }
}

export default function LoginPage({ quote }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [phone, setPhone] = useState("")
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (session && !isLoggedIn) {
      toast.success("You're still logged in. Redirecting to dashboard")
      router.push("/dashboard")
    }
  }, [session, router, isLoggedIn])

  const handleResetPassword = async () => {
    try {
      setIsResetLoading(true)
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      })
      if (response.ok) {
        toast.success("Password reset email sent. Please check your inbox.")
        setIsResetPasswordOpen(false)
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to send reset email")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleResendVerification = async () => {
    try {
      const identifier = loginMethod === "email" ? email : phone
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, loginMethod }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Verification email resent. Please check your inbox.")
      } else {
        toast.error(data.error || "Failed to resend verification email. Please try again.")
      }
    } catch {
      toast.error("An error occurred. Please try again later.")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginMethod === "email" ? email : phone,
          password,
          loginMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.code || "LOGIN_FAILED")
      }

      if (data.user) {
        // Use NextAuth to set the session
        const result = await signIn("credentials", {
          redirect: false,
          identifier: loginMethod === "email" ? email : phone,
          password,
        })

        if (result?.error) {
          throw new Error(result.error)
        }

        setIsLoggedIn(true)
        toast.success("Login successful!")
        router.push("/dashboard")
      }
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "INVALID_CREDENTIALS":
            toast.error("Invalid credentials. Please check your input and try again.")
            break
          case "INVALID_PHONE":
            toast.error("Invalid phone number. Please enter a valid phone number.")
            break
          case "INVALID_LOGIN_METHOD":
            toast.error("Invalid login method. Please try again.")
            break
          case "USER_NOT_FOUND":
            toast.error("User not found. Please check your credentials or register a new account.")
            break
          case "INVALID_PASSWORD":
            toast.error("Invalid password. Please try again.")
            break
          case "EMAIL_NOT_VERIFIED":
            toast.error("Email not verified. Please check your inbox for the verification email.", {
              action: {
                label: "Resend Verification",
                onClick: () => handleResendVerification(),
              },
            })
            break
          case "INTERNAL_SERVER_ERROR":
            toast.error("An unexpected error occurred. Please try again later.")
            break
          default:
            toast.error("Login failed. Please check your credentials and try again.")
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-background/80 backdrop-blur-sm p-4 shadow-sm border-b">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">RideShare</h1>
          <div>
            <Button variant="ghost" asChild className="mr-2">
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-center space-x-2 mb-4">
                    <Button
                      type="button"
                      onClick={() => setLoginMethod("email")}
                      variant={loginMethod === "email" ? "default" : "outline"}
                      className="w-full"
                    >
                      <Mail className="mr-2 h-4 w-4" /> Email
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setLoginMethod("phone")}
                      variant={loginMethod === "phone" ? "default" : "outline"}
                      className="w-full"
                    >
                      <Phone className="mr-2 h-4 w-4" /> Phone
                    </Button>
                  </div>
                  {loginMethod === "email" ? (
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone</Label>
                      <PhoneInput
                        international
                        defaultCountry="PT"
                        value={phone}
                        onChange={(value) => setPhone(value || "")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                {error && <p className="text-destructive text-sm mt-2">{error}</p>}
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button variant="link" asChild className="w-full">
                <Link href="/register">Don&#39;t have an account? Register</Link>
              </Button>
              <Button variant="link" onClick={() => setIsResetPasswordOpen(true)} className="w-full">
                Forgot your password?
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col relative overflow-hidden items-center justify-center">
          <Image
            src="/oldcar.png"
            alt="Car on the road"
            width={0}
            height={0}
            sizes="50vw"
            className="w-full lg:w-7/12 h-auto lg:rounded-l-lg"
            placeholder="blur"
            blurDataURL="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="
          />
          {quote && (
            <blockquote className="p-4 mt-4 text-center text-lg italic border-l-4 border-primary bg-muted/50 rounded-r-lg">
              &#34;{quote.quote}&#34;
              <footer className="mt-2 text-primary block font-semibold">
                {quote.author} {quote.source && `- ${quote.source}`}
              </footer>
            </blockquote>
          )}
        </div>
      </main>
      <footer className="bg-background/80 backdrop-blur-sm p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Enter your email to receive a password reset link.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reset-email" className="text-right">
                Email
              </Label>
              <Input
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleResetPassword} disabled={isResetLoading}>
              {isResetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isResetLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

