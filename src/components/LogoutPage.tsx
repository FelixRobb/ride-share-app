"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { unregisterServiceWorker } from "@/utils/cleanupService";
import { getDeviceId } from "@/utils/deviceUtils";

export default function LogoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Get the current push subscription
        let currentSubscription: PushSubscription | null = null;
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.ready;
          currentSubscription = await registration.pushManager.getSubscription();
        }

        // Get the device ID
        const deviceId = getDeviceId();

        // Call the logout API with the current subscription and device ID
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: currentSubscription ? currentSubscription.toJSON() : null,
            deviceId,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Logout failed");
        }

        // Unregister service worker and unsubscribe from push notifications
        if (currentSubscription) {
          await currentSubscription.unsubscribe();
        }
        await unregisterServiceWorker();

        // Clear specific data from localStorage
        localStorage.removeItem("tutorialstep");
        localStorage.removeItem("rideData");
        localStorage.removeItem("theme");
        localStorage.removeItem("pushNotificationDeclined");
        localStorage.removeItem("rideshare_device_id");

        // Sign out using NextAuth
        await signOut({ redirect: false });

        toast.success("Logged out successfully");
        router.push("/login");
      } catch {
        setError(true);
        toast.error("Failed to logout. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    handleLogout();
  }, [router]); // Remove loading from dependencies to avoid infinite loop

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
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle className="text-center">Logging Out</CardTitle>
              <CardDescription className="text-center">
                {loading
                  ? "Please wait while we log you out..."
                  : error
                    ? "An error occurred. Please try again."
                    : "Logging you out..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Button onClick={() => router.push("/")}>Go to Home</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="bg-background/80 backdrop-blur-sm p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
