"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

import { MultiStepRegisterForm } from "./MultiStepRegisterForm"

interface RegisterPageProps {
  quote: {
    quote: string
    author: string
    source?: string
  }
}

export default function RegisterPage({ quote }: RegisterPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (name: string, phone: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Registration failed")
      }

      // Sign in the user after successful registration
      const result = await signIn("credentials", {
        identifier: email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      router.push("/dashboard")
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Email already registered")) {
          setError("This email is already registered. Please use a different email or try logging in.")
        } else if (error.message.includes("Phone number already registered")) {
          setError("This phone number is already registered. Please use a different number or try logging in.")
        } else if (error.message.includes("Invalid phone number")) {
          setError("Please enter a valid phone number.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-background p-4 shadow-sm">
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
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Join RideShare and start sharing rides today!</CardDescription>
            </CardHeader>
            <CardContent>
              <MultiStepRegisterForm onSubmit={handleRegister} isLoading={isLoading} />
            </CardContent>
            {error && <p className="text-destructive text-center mt-2">{error}</p>}
            <CardFooter className="flex justify-center">
              <Button variant="link" asChild>
                <Link href="/login">Already have an account? Login</Link>
              </Button>
            </CardFooter>
          </Card>
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
                &quot;{quote.quote}&quot;
                <footer className="mt-2 text-primary block font-semibold">
                  {quote.author} {quote.source && `- ${quote.source}`}
                </footer>
              </blockquote>
            )}
          </div>
        </div>
      </main>
      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

