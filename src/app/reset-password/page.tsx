import type { Metadata } from "next";

import ResetPasswordClient from "./client";

export const metadata: Metadata = {
  title: "Reset Password | RideShare",
  description: "Reset your RideShare account password.",
  openGraph: {
    title: "Reset Password | RideShare",
    description: "Reset your RideShare account password.",
  },
};

export default function ResetPassword() {
  return <ResetPasswordClient />;
}
