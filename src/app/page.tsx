'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WelcomePage from '@/components/WelcomePage';
import { checkUser } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const router = useRouter();
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
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error("Error checking user:", error);
          toast({
            title: "Error",
            description: "An error occurred while checking your session. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        // No user in localStorage, stop loadi
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

  return <WelcomePage />;
}