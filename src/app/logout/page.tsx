import type { Metadata } from "next";

import LogoutPage from "@/components/LogoutPage";

export const metadata: Metadata = {
  title: "Logout | RideShare",
  description: "Securely log out of your RideShare account.",
  openGraph: {
    title: "Logout | RideShare",
    description: "Securely log out of your RideShare account.",
  },
};

export default function Logout() {
  return <LogoutPage />;
}
