"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";

import AuthLoader from "@/components/AuthLoader";
import Layout from "@/components/Layout";
import type { User } from "@/types";

const CreateRidePage = dynamic(() => import("@/components/CreateRidePage"), { ssr: false });

export default function CreateRide() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReusingRide = searchParams.get("reuse") === "true";
  const { data: session, status } = useSession();
  const currentUser = session?.user as User | null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (isReusingRide && status === "authenticated") {
      // Use a timeout to ensure the toast appears after the page loads
      const timer = setTimeout(() => {
        // We need to import toast, so add it to the imports at the top
        toast.success(
          "Ride details loaded. Please update the time and any other details as needed."
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isReusingRide, status]);

  if (status === "loading") {
    return <AuthLoader />;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return <Layout>{currentUser && <CreateRidePage currentUser={currentUser} />}</Layout>;
}
