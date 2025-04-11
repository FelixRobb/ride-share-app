"use client";

import { Loader } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordStrength, setNewPasswordStrength] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const evaluatePasswordStrength = (password: string) => {
    const lengthCriteria = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < 6) return "Too short";
    if (lengthCriteria && hasUppercase && hasNumber) return "Strong";
    if (lengthCriteria) return "Medium";
    return "Weak";
  };

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setIsLoading(false);
        setErrorMessage("No reset token provided");
        return;
      }

      try {
        const response = await fetch(`/api/auth/check-reset-token?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setIsTokenValid(true);
        } else {
          setErrorMessage(data.message || "Invalid or expired token");
        }
      } catch {
        setErrorMessage("An error occurred while checking the token");
      }

      setIsLoading(false);
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        toast.success("Your password has been reset successfully");
        router.push("/");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Card className="w-full max-w-[350px]">
          <CardContent className="flex items-center justify-center h-[200px]">
            <p>Checking reset token...</p>
            <div>
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Card className="w-full max-w-[350px]">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription className="text-red-500">{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please request another password reset.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-background/80 backdrop-blur-sm shadow-md border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex-shrink-0 mr-4">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              RideShare
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center bg-background">
        <Card className="w-full max-w-[350px]">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <PasswordInput
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setNewPasswordStrength(evaluatePasswordStrength(e.target.value));
                    }}
                    required
                  />
                  {newPassword && (
                    <div className="relative">
                      <div className="h-2 rounded bg-gray-200">
                        <div
                          className={`h-full rounded ${newPasswordStrength === "Strong" ? "bg-green-500" : newPasswordStrength === "Medium" ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{
                            width:
                              newPasswordStrength === "Strong"
                                ? "100%"
                                : newPasswordStrength === "Medium"
                                  ? "66%"
                                  : newPasswordStrength === "Weak"
                                    ? "33%"
                                    : "0%",
                          }}
                        />
                      </div>
                      <p
                        className={`text-sm mt-1 ${newPasswordStrength === "Strong" ? "text-green-500" : newPasswordStrength === "Medium" ? "text-yellow-500" : "text-red-500"}`}
                      >
                        {newPasswordStrength}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button className="w-full mt-4" type="submit">
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default function ResetPasswordClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black">
          <Card className="w-full max-w-[350px]">
            <CardContent className="flex items-center justify-center h-[200px]">
              <p>Checking reset token...</p>
              <div>
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
