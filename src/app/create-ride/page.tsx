"use client";

import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

import AuthLoader from "@/components/AuthLoader";
import Layout from "@/components/Layout";
import type { User } from "@/types";

const CreateRidePage = dynamic(() => import("@/components/CreateRidePage"), { ssr: false });

// Create a separate component that uses useSearchParams
function CreateRideContent({ currentUser }: { currentUser: User }) {
  // Import useSearchParams only within this component
  const searchParams = useSearchParams();
  const isReusingRide = searchParams.get("reuse") === "true";

  useEffect(() => {
    if (isReusingRide) {
      // Use a timeout to ensure the toast appears after the page loads
      const timer = setTimeout(() => {
        toast.success(
          "Ride details loaded. Please update the time and any other details as needed."
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isReusingRide]);

  return <CreateRidePage currentUser={currentUser} />;
}

export default function CreateRide() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUser = session?.user as User | null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <AuthLoader />;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        {currentUser && <CreateRideContent currentUser={currentUser} />}
      </Suspense>
    </Layout>
  );
}
