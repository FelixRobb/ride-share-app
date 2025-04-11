import type { Metadata } from "next";

import RideDetailsClient from "./client";

export const metadata: Metadata = {
  title: "Ride Details | RideShare",
  description:
    "View detailed information about a specific ride, including route, participants, and status.",
  openGraph: {
    title: "Ride Details | RideShare",
    description:
      "View detailed information about a specific ride, including route, participants, and status.",
  },
};

export default function RideDetails() {
  return <RideDetailsClient />;
}
