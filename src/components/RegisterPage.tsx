import { useState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { User } from "../types"
import { MultiStepRegisterForm } from "./MultiStepRegisterForm"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface RegisterPageProps {
  setCurrentUser: (user: User) => void
  handleRegister: (name: string, phone: string, countryCode: string, email: string, password: string) => Promise<void>
  isLoading: boolean
}

export default function RegisterPage({ setCurrentUser, handleRegister, isLoading }: RegisterPageProps) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast();

  const onSubmit = async (name: string, phone: string, countryCode: string, email: string, password: string) => {
    try {
      await handleRegister(name, phone, countryCode, email, password)
    } catch (error) {
      if (error instanceof Error && error.message.includes("User already exists")) {
        setError("This phone number or email is already registered. Please use a different one or login.")
      } else {
        setError("Registration failed. Please try again.")
      }
      throw error
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
        <Card className="w-full max-w-[400px]">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Join RideShare and start sharing rides today!</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiStepRegisterForm
              onSubmit={onSubmit}
              isLoading={isLoading}
            />
          </CardContent>
          {error && <p className="text-destructive text-center mt-2">{error}</p>}
          <CardFooter className="flex justify-center">
            <Button variant="link" asChild>
              <Link href="/login">Already have an account? Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

