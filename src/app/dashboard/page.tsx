"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

import AuthLoader from "@/components/AuthLoader";
import Layout from "@/components/Layout";
import type { User } from "@/types";

const DashboardPage = dynamic(() => import("@/components/DashboardPage"), { ssr: false });

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // default tab
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUser = session?.user as User | undefined;

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    if (search) {
      setActiveTab(search.get("tab") || "active");
    }
  }, []);

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
      <DashboardPage
        currentUser={currentUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </Layout>
  );
}
