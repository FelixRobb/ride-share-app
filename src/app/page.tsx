import type { Metadata } from "next";

import WelcomePage from "@/components/WelcomePage";

export const metadata: Metadata = {
  title: "RideShare - Find and share rides",
  description: "Find and share rides with people in your community",
};

export default function Home() {
  return <WelcomePage />;
}
