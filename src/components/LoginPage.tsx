import { useState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
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


  const handleResetPassword = async (
  ) => {
    try {
      const response = await fetch("/api/auth/reset-password",
        {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: resetEmail }),
        }); if (
        response.ok) {
        toast({ title: "Success", description: "Password reset email sent. Please check your inbox.", }); setIsResetPasswordOpen(false);
      } else { const data = await response.json(); throw new Error(data.error || "Failed to send reset email"); }
    } catch (
    error
    ) { toast({ title: "Error", description: error instanceof Error ? error.message : "An unexpected error occurred", variant: "destructive", }); }
  };

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
            <DialogContent className="rounded-lg">
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
      </main>
      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

