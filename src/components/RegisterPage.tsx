"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import oldCarImage from "@/components/images/oldcar.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

import { MultiStepRegisterForm } from "./MultiStepRegisterForm";

interface RegisterPageProps {
  quote: {
    quote: string;
    author: string;
    source?: string;
  };
}

export default function RegisterPage({ quote }: RegisterPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      toast.success("You're still logged in. Redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleRegister = async (name: string, phone: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsRegistered(true);
        toast.success("Registration successful! Please check your email to verify your account.", {
          action: {
            label: "Resend Verification",
            onClick: () => handleResendVerification(),
          },
        });
      } else {
        if (data.error === "Email already registered") {
          toast.error("Email already registered. Please try logging in or use a different email.", {
            action: {
              label: "Go to Login",
              onClick: () => {
                router.push("/login");
              },
            },
          });
        } else if (data.error === "Email not verified") {
          toast.error("Email not verified. Please check your inbox for the verification email.", {
            action: {
              label: "Resend Verification",
              onClick: () => handleResendVerification(),
            },
          });
        } else {
          toast.error("Registration failed. Please try again.");
        }
      }
    } catch {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "" }), //This needs to be updated to get the email from the form
      });

      if (response.ok) {
        toast.success("Verification email resent. Please check your inbox.");
      } else {
        toast.error("Failed to resend verification email. Please try again.");
      }
    } catch {
      toast.error("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
      <main className="flex-grow flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Join RideShare and start sharing rides today!</CardDescription>
            </CardHeader>
            <CardContent>
              {isRegistered ? (
                <div className="flex items-center justify-center flex-col">
                  <p className="text-center">Please check your email to verify your account.</p>
                  <Button onClick={handleResendVerification} className="mt-4">
                    Resend Verification Email
                  </Button>
                </div>
              ) : (
                <MultiStepRegisterForm onSubmit={handleRegister} isLoading={isLoading} />
              )}
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button variant="link" asChild>
                <Link href="/login">Already have an account? Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col relative overflow-hidden items-center justify-center">
          <Image
            src={oldCarImage}
            alt="Car on the road"
            width={0}
            height={0}
            sizes="50vw"
            className="w-full lg:w-7/12 h-auto lg:rounded-l-lg"
            placeholder="blur"
            blurDataURL="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="
          />
          {quote && (
            <blockquote className="p-4 mt-4 text-center text-lg italic border-l-4 border-primary bg-muted/50 rounded-r-lg">
              &#34;{quote.quote}&#34;
              <footer className="mt-2 text-primary block font-semibold">
                {quote.author} {quote.source && `- ${quote.source}`}
              </footer>
            </blockquote>
          )}
        </div>
      </main>
      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
