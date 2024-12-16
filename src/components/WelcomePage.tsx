import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to RideShare</h1>
        <p className="text-lg md:text-xl mb-8">Connect with friends, share rides, and travel together safely.</p>
        <div className="space-y-4 p-4">
          <Button asChild variant="default" size="lg" className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

