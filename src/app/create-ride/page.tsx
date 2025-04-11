import type { Metadata } from "next";

import CreateRideClient from "./client";

export const metadata: Metadata = {
  title: "Create a Ride | RideShare",
  description: "Create a new ride to share with your contacts.",
  openGraph: {
    title: "Create a Ride | RideShare",
    description: "Create a new ride to share with your contacts.",
  },
};

export default function CreateRide() {
  return <CreateRideClient />;
}
