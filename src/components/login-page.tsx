"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phoneOrEmail = (e.currentTarget.elements.namedItem("phoneOrEmail") as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneOrEmail, password }),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        router.push("/dashboard");
      } else {
        throw new Error(data.error || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      setError("Invalid phone number/email or password. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-[350px] mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your phone number or email and password to login.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
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
          <Button className="w-full mt-4" type="submit">
            Login
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button variant="link" onClick={() => router.push("/register")}>
          Don&apos;t have an account? Register
        </Button>
        <Button variant="link" onClick={() => router.push("/forgot-password")}>
          Forgot your password?
        </Button>
      </CardFooter>
    </Card>
  );
}
