import type { Metadata } from "next";

import VerifyEmailClient from "./client";

export const metadata: Metadata = {
  title: "Verify Email | RideShare",
  description: "Verify your email address to complete your RideShare account registration.",
  openGraph: {
    title: "Verify Email | RideShare",
    description: "Verify your email address to complete your RideShare account registration.",
  },
};

export default function VerifyEmail() {
  return <VerifyEmailClient />;
}
