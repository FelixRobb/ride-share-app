import type { Metadata } from "next";

import FAQClient from "./client";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | RideShare",
  description: "Find answers to common questions about using the RideShare platform.",
  openGraph: {
    title: "Frequently Asked Questions | RideShare",
    description: "Find answers to common questions about using the RideShare platform.",
  },
};

export default function FAQPage() {
  return <FAQClient />;
}
