import type { Metadata } from "next";

import LoginPage from "@/components/LoginPage";
import { getRandomQuote } from "@/utils/authUtils";

export const metadata: Metadata = {
  title: "Login | RideShare",
  description: "Sign in to your RideShare account to find and share rides.",
  openGraph: {
    title: "Login | RideShare",
    description: "Sign in to your RideShare account to find and share rides.",
  },
};

export default function Login() {
  const randomQuote = getRandomQuote();

  return <LoginPage quote={randomQuote} />;
}
