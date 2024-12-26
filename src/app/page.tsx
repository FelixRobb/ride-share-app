'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WelcomePage from '@/components/WelcomePage';
import { Loader } from 'lucide-react';
import { checkUser } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkCurrentUser = async () => {
      const user = localStorage.getItem("currentUser");
      if (user) {
        const parsedUser = JSON.parse(user);
        try {
          const userExists = await checkUser(parsedUser.id);
          if (!userExists) {
            localStorage.removeItem("currentUser");
            setIsLoading(false);
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error("Error checking user:", error);
          toast({
            title: "Error",
            description: "An error occurred while checking your session. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      } else {
        // No user in localStorage, stop loading
        setIsLoading(false);
      }
    };

    checkCurrentUser();

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch(error => console.error("Service Worker registration failed:", error));
    }
  }, [router, toast]);

  if (isLoading) {
    return (
      <div className="bg-background flex flex-col gap-2 items-center justify-center h-screen dark">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary-foreground">
          RideShare
        </h1>
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <WelcomePage />;
}