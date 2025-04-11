import type { Metadata } from "next";

import RideHistoryClient from "./client";

export const metadata: Metadata = {
  title: "Ride History | RideShare",
  description: "View your past rides and filter by status, date, and more.",
  openGraph: {
    title: "Ride History | RideShare",
    description: "View your past rides and filter by status, date, and more.",
  },
};

export default function RideHistoryPage() {
  return <RideHistoryClient />;
}
