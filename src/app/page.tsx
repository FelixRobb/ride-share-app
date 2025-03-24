import WelcomePage from "@/components/WelcomePage"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "RideShare - Find and share rides",
  description: "Find and share rides with people in your community",
}

export default function Home() {
  return <WelcomePage />
}

