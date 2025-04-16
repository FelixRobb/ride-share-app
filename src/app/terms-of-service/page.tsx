import { Metadata } from "next";

import TermsOfServiceClient from "./client";

export const metadata: Metadata = {
  title: "Privacy Policy - RideShare",
  description: "Read our privacy policy to understand how we handle your data.",
  openGraph: {
    title: "Privacy Policy - RideShare",
    description: "Read our privacy policy to understand how we handle your data.",
  },
};

export default function PrivacyPolicyPage() {
  return <TermsOfServiceClient />;
}
