"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import BugReportForm from "@/components/BugReportForm";
import Layout from "@/components/Layout";

export default function BugReportClient() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  return (
    <Layout>
      <BugReportForm />
    </Layout>
  );
}
