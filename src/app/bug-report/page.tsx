import type { Metadata } from "next";

import BugReportClient from "./client";

export const metadata: Metadata = {
  title: "Report a Bug | RideShare",
  description: "Help us improve by reporting any issues you encounter while using RideShare.",
  openGraph: {
    title: "Report a Bug | RideShare",
    description: "Help us improve by reporting any issues you encounter while using RideShare.",
  },
};

export default function BugReportPage() {
  return <BugReportClient />;
}
