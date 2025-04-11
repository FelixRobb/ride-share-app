import type { Metadata } from "next";

import RegisterPage from "@/components/RegisterPage";
import { getRandomQuote } from "@/utils/authUtils";

export const metadata: Metadata = {
  title: "Register | RideShare",
  description: "Create a new account to start using RideShare and connect with others for rides.",
  openGraph: {
    title: "Register | RideShare",
    description: "Create a new account to start using RideShare and connect with others for rides.",
  },
};

export default function Register() {
  const randomQuote = getRandomQuote();

  return <RegisterPage quote={randomQuote} />;
}
