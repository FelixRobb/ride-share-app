"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import AuthLoader from "@/components/AuthLoader";
import Layout from "@/components/Layout";
import type { User } from "@/types";

const ProfilePage = dynamic(() => import("@/components/ProfilePage"), { ssr: false });

export default function Profile() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUser = session?.user as User | undefined;

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

  if (!currentUser) {
    return <div>Error: User not found</div>;
  }

  return (
    <Layout>
      <ProfilePage currentUser={currentUser} />
    </Layout>
  );
}
