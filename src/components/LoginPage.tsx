import { useState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { User } from "../types"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

interface LoginPageProps {
  setCurrentUser: (user: User) => void
  handleLogin: (identifier: string, password: string, method: 'email' | 'phone') => Promise<void>
  isLoading: boolean
}

export default function LoginPage({ setCurrentUser, handleLogin, isLoading }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  const handleResetPassword = async () => {
    try {
      setIsResetLoading(true);
      const response = await fetch("/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail }),
        });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Password reset email sent. Please check your inbox.",
        });
        setIsResetPasswordOpen(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reset email");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      console.log('Submitting login form with:', { email, phone, password: '******', loginMethod });
      await handleLogin(loginMethod === 'email' ? email : phone, password, loginMethod);
    } catch (error) {
      console.error('Login error in component:', error);
      setError("Invalid email/phone or password. Please try again.");
    }
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid w-full items-center gap-4">
                <div className="flex justify-center space-x-2 mb-4">
                  <Button
                    type="button"
                    variant={loginMethod === 'email' ? 'default' : 'outline'}
                    onClick={() => setLoginMethod('email')}
                  >
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === 'phone' ? 'default' : 'outline'}
                    onClick={() => setLoginMethod('phone')}
                  >
                    Phone
                  </Button>
                </div>
                {loginMethod === 'email' ? (
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1.5">
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
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
        </Card>
      </main>
      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="rounded-lg w-11/12">
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
            <Button onClick={handleResetPassword} disabled={isResetLoading}>
              {isResetLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

