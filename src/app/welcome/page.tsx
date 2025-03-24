import WelcomePage from "@/components/WelcomePage"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Welcome to RideShare",
    description: "Find and share rides with people in your community",
}

export default function Welcome() {
    return <WelcomePage />
}

