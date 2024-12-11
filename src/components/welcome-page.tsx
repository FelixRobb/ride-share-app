"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to RideShare</h1>
        <p className="text-lg md:text-xl mb-8">Connect with friends, share rides, and travel together safely.</p>
        <div className="space-y-4 p-4">
          <Button onClick={() => router.push("/login")} variant="default" size="lg" className="w-full">
            Login
          </Button>
          <Button onClick={() => router.push("/register")} variant="outline" size="lg" className="w-full">
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}

