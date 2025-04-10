"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import AuthLoader from "@/components/AuthLoader";
import Layout from "@/components/Layout";
import type { User } from "@/types";

const CreateRidePage = dynamic(() => import("@/components/CreateRidePage"), { ssr: false });

export default function CreateRide() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUser = session?.user as User | null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading states
  if (status === "loading") {
    return <AuthLoader />;
  }

  // Handle unauthenticated state
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (!currentUser) {
    return <div>Error: User not found</div>;
  }

  return (
    <Layout>
      <CreateRidePage currentUser={currentUser} />
    </Layout>
  );
}
