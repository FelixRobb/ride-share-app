import { useState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { User } from "../types"
import { Loader } from 'lucide-react'

interface RegisterPageProps {
  setCurrentUser: (user: User) => void
  handleRegister: (name: string, phone: string, email: string, password: string) => Promise<void>
  isLoading: boolean
}

export default function RegisterPage({ setCurrentUser, handleRegister, isLoading }: RegisterPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
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
      <main className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-[350px]">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Create a new account to start sharing rides.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value
                const phone = (e.currentTarget.elements.namedItem("phone") as HTMLInputElement).value
                const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value
                const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value
                const confirmPassword = (e.currentTarget.elements.namedItem("confirmPassword") as HTMLInputElement).value

                if (password !== confirmPassword) {
                  setError("Passwords do not match. Please try again.")
                  return
                }

                try {
                  await handleRegister(name, phone, email, password)
                  setError(null)
                } catch (error) {
                  if (error instanceof Error && error.message.includes("User already exists")) {
                    setError("This phone number or email is already registered. Please use a different one or login.")
                  } else {
                    setError("Registration failed. Please try again.")
                  }
                }
              }}
            >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" required />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="Enter your phone number" required />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" required />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Create a password" required />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Confirm your password" required />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the <Link className="underline text-orange-500" href="/privacy-policy">Privacy Policy</Link> and <Link className="underline text-orange-500" href="/terms-of-service">Terms of Service</Link>
                  </Label>
                </div>
              </div>
              {error && <p className="text-destructive mt-2">{error}</p>}
              <Button className="w-full mt-4" type="submit" disabled={isLoading || !agreedToTerms}>
                {isLoading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
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

