import type { Metadata } from "next";

import WelcomePage from "@/components/WelcomePage";

export const metadata: Metadata = {
  title: "Welcome to RideShare",
  description: "Find and share rides with people in your community",
};

export default function Welcome() {
  return <WelcomePage />;
}
