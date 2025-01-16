"use client"
import { useState, useEffect } from "react"
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { User } from "../types"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

interface LoginPageProps {
  setCurrentUser: (user: User) => void
  handleLogin: (identifier: string, password: string, method: 'email' | 'phone') => Promise<void>
  isLoading: boolean
  quoteIndex: number;
}

const quotes = [
  { quote: "The freedom of the open road is seductive, serendipitous, and absolutely liberating.", author: "Aaron Lauritsen", source: "100 Days Drive" },
  { quote: "Driving at night is about communicating with lights.", author: "Lukhman Pambra" },
  { quote: "All he needed was a wheel in his hand and four on the road.", author: "Jack Kerouac", source: "On the Road" },
  { quote: "Kilometers are shorter than miles. Save gas, take your next trip in kilometers.", author: "George Carlin" },
  { quote: "The journey is part of the experience—an expression of the seriousness of one’s intent. One doesn’t take the A train to Mecca.", author: "Anthony Bourdain" },
  { quote: "Road trips aren’t measured by mile markers, but by moments.", author: "Unknown" },
  { quote: "The road must eventually lead to the whole world.", author: "Jack Kerouac", source: "On the Road" },
  { quote: "The open road is a beckoning, a strangeness, a place where a man can lose himself.", author: "William Least Heat-Moon", source: "Blue Highways" },
  { quote: "Stop worrying about the potholes in the road and enjoy the journey.", author: "Babs Hoffman" },
  { quote: "Every journey begins with a single tank of gas.", author: "Unknown" },
  { quote: "You can’t have a great day without driving a great distance.", author: "Unknown" },
  { quote: "Sometimes the best therapy is a long drive and good music.", author: "Unknown" },
  { quote: "No road is long with good company.", author: "Turkish Proverb" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { quote: "A journey is best measured in friends rather than miles.", author: "Tim Cahill" },
];


export default function LoginPage({ setCurrentUser, handleLogin, isLoading, quoteIndex }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const randomQuote = quotes[quoteIndex];
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
        toast.success("Password reset email sent. Please check your inbox.");
        setIsResetPasswordOpen(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reset email");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
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
                      Phone
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
        </div>
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col relative overflow-hidden items-center justify-center">
          <Image
            src="/oldcar.png"
            alt="Car on the road"
            width={0}
            height={0}
            sizes="50vw"
            className="w-full lg:w-7/12 h-auto lg:rounded-l-lg"
          />
          {randomQuote && (
            <blockquote className="p-4 mt-4 text-center text-lg italic border-l-4 border-primary bg-muted/50 rounded-r-lg">
              "{randomQuote.quote}"
              <footer className="mt-2 text-primary block font-semibold">
                {randomQuote.author} {randomQuote.source && `- ${randomQuote.source}`}
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

