'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WelcomePage from '@/components/WelcomePage';
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkCurrentUser = async () => {
      const user = localStorage.getItem("currentUser");

      if (user) {
        const parsedUser = JSON.parse(user);
        try {
          const response = await fetch(`/api/check-user?userId=${parsedUser.id}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to check user');
          }

          if (data.exists) {
            // Check if all fields match
            const fieldsMatch = Object.keys(parsedUser).every(key => parsedUser[key] === data.user[key]);

            if (fieldsMatch) {
              localStorage.setItem('currentUser', JSON.stringify(data.user));
              router.push('/dashboard');
            } else {
              // Fields don't match, clear local storage and redirect
              localStorage.removeItem('currentUser');
              router.push('/login');
              toast.error('Session Expired', { 
                description: 'Your session has expired. Please log in again.' })
            }
          } else {
            localStorage.removeItem("currentUser");
            router.push('/login');
            toast.error('Session Expired', { 
              description: 'Your session has expired. Please log in again.' })
          }
        } catch (error) {
          console.error("Error checking user:", error);
          toast.error(error instanceof Error ? error.message : "An error occurred while checking your session. Please try again.");
          localStorage.removeItem("currentUser"); // Remove invalid user data
        }
      } else {
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

