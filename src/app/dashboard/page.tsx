import { Metadata } from "next";

import DashboardClient from "./client";

export const metadata: Metadata = {
  title: "Dashboard | RideShare",
  description: "Manage your rides, view your trips, and connect with other RideShare users.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
