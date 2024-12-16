import { useState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { User } from "../types"

interface RegisterPageProps {
  setCurrentUser: (user: User) => void
  handleRegister: (name: string, phone: string, email: string, password: string) => Promise<void>
  isLoading: boolean
}

export default function RegisterPage({ setCurrentUser, handleRegister, isLoading }: RegisterPageProps) {
  const [error, setError] = useState<string | null>(null)

  return (
    <Card className="w-full max-w-[350px] mx-auto">
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
          {error && <p className="text-destructive mt-2">{error}</p>}
          <Button className="w-full mt-4" type="submit" disabled={isLoading}>
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
  )
}

