"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Separate component to handle verification logic
function VerificationHandler() {
  const [verificationStatus, setVerificationStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus("error");
        toast.error("Invalid verification link");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setVerificationStatus("success");
          toast.success("Email verified successfully. Please login.");
          router.push("/login");
        } else {
          setVerificationStatus("error");
          toast.error(data.error || "Email verification failed");
        }
      } catch {
        setVerificationStatus("error");
        toast.error("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [token, router]);

  const statusIcon = {
    verifying: <Loader2 className="h-12 w-12 animate-spin text-primary" />,
    success: <CheckCircle className="h-12 w-12 text-green-500" />,
    error: <XCircle className="h-12 w-12 text-red-500" />,
  };

  const statusMessage = {
    verifying: "Verifying your email...",
    success: "Your email has been verified successfully!",
    error: "There was an error verifying your email. Please try again or contact support.",
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>Verifying your email address</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
          {statusIcon[verificationStatus]}
        </motion.div>
        <p className="text-center">{statusMessage[verificationStatus]}</p>
      </CardContent>
      <CardFooter className="flex justify-center">
        {verificationStatus === "error" && (
          <Button asChild>
            <Link href="/login" className="group">
              Back to Login
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Loading fallback component
function VerificationLoading() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>Loading verification...</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-center">Please wait...</p>
      </CardContent>
    </Card>
  );
}

// Main component
export default function VerifyEmailClient() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-background/80 backdrop-blur-sm shadow-md border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex-shrink-0 mr-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              RideShare
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center bg-background p-4">
        <Suspense fallback={<VerificationLoading />}>
          <VerificationHandler />
        </Suspense>
      </main>

      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
