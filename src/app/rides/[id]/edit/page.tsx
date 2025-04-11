import type { Metadata } from "next";

import EditRideClient from "./client";

export const metadata: Metadata = {
  title: "Edit Ride | RideShare",
  description: "Modify the details of your ride, including route, time, and other information.",
  openGraph: {
    title: "Edit Ride | RideShare",
    description: "Modify the details of your ride, including route, time, and other information.",
  },
};

export default function EditRide() {
  return <EditRideClient />;
}
