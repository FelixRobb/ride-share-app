import { useState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User } from "../types"

interface LoginPageProps {
  setCurrentUser: (user: User) => void
  handleLogin: (phoneOrEmail: string, password: string) => Promise<void>
  isLoading: boolean
}

export default function LoginPage({ setCurrentUser, handleLogin, isLoading }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")

  const handleResetPassword = async () => {
    // Implement password reset logic here
  }

  return (
    <Card className="w-full max-w-[350px] mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your phone number or email and password to login.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const phoneOrEmail = (e.currentTarget.elements.namedItem("phoneOrEmail") as HTMLInputElement).value
            const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value
            try {
              await handleLogin(phoneOrEmail, password)
              setError(null)
            } catch (error) {
              setError("Invalid phone number/email or password. Please try again.")
            }
          }}
        >
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="phoneOrEmail">Phone or Email</Label>
              <Input id="phoneOrEmail" placeholder="Enter your phone number or email" required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" required />
            </div>
          </div>
          {error && <p className="text-destructive mt-2">{error}</p>}
          <Button className="w-full mt-4" type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button variant="link" asChild>
          <Link href="/register">Don&apos;t have an account? Register</Link>
        </Button>
        <Button variant="link" onClick={() => setIsResetPasswordOpen(true)}>
          Forgot your password?
        </Button>
      </CardFooter>

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Enter your email to receive a password reset link.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reset-email" className="text-right">
                Email
              </Label>
              <Input id="reset-email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleResetPassword}>Send Reset Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

