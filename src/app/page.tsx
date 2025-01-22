'use client'

import { useEffect } from 'react';
import WelcomePage from '@/components/WelcomePage';
import { toast } from "sonner";

export default function Home() {

  useEffect(() => {


    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch(error => console.error("Service Worker registration failed:", error));
    }
  }, [toast]);

  return <WelcomePage />;
}

