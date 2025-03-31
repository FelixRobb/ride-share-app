"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import AdminDashboard from "@/components/AdminDashboard";
import AdminLogin from "@/components/AdminLogin";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    };

    // Initial auth check
    checkAuth();

    // Set up periodic auth check every 2 hours (7200000 milliseconds)
    const intervalId = setInterval(checkAuth, 7200000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = async (password: string) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        toast.success("Successfully logged in");
      } else {
        toast.error(data.message || "Invalid password");
      }
    } catch {
      toast.error("An error occurred during login");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      setIsAuthenticated(false);
      toast.success("Successfully logged out");
      router.push("/");
    } catch {
      toast.error("An error occurred during logout");
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
