import type { Metadata } from "next";

import ProfileClient from "./client";

export const metadata: Metadata = {
  title: "Profile | RideShare",
  description:
    "View and edit your RideShare profile, manage contacts, and update your preferences.",
  openGraph: {
    title: "Profile | RideShare",
    description:
      "View and edit your RideShare profile, manage contacts, and update your preferences.",
  },
};

export default function Profile() {
  return <ProfileClient />;
}
