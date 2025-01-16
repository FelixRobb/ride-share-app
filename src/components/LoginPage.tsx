import { useState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { User } from "../types"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

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
  const { toast } = useToast();

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
      let formattedIdentifier = loginMethod === 'email' ? email : phone;
      console.log('Submitting login form with:', { identifier: formattedIdentifier, password: '******', loginMethod });
      await handleLogin(formattedIdentifier, password, loginMethod);
    } catch (error) {
      console.error('Login error in component:', error);
      setError("Invalid email/phone or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/20 to-secondary/20">
      <header className="bg-background/80 backdrop-blur-sm p-4 shadow-sm">
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
      <main className="flex-grow flex items-center justify-center p-4">
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
                    onClick={() => setLoginMethod('email')}
                    variant={loginMethod === 'email' ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <Mail className="mr-2 h-4 w-4" /> Email
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    variant={loginMethod === 'phone' ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {/* <Phone className="mr-2 h-4 w-4" /> */} Phone
                  </Button>
                </div>
                {loginMethod === 'email' ? (
                  <div className="space-y-1">
                    <Label htmlFor="email" className="sr-only">Email</Label>
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
                    <Label htmlFor="phone" className="sr-only">Phone</Label>
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
                  <Label htmlFor="password" className="sr-only">Password</Label>
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
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button variant="link" asChild className="w-full">
              <Link href="/register">Don't have an account? Register</Link>
            </Button>
            <Button variant="link" onClick={() => setIsResetPasswordOpen(true)} className="w-full">
              Forgot your password?
            </Button>
          </CardFooter>
        </Card>
      </main>
      <footer className="bg-background/80 backdrop-blur-sm p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
              {isResetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isResetLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

