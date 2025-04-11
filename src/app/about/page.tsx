import { Metadata } from "next";

import AboutClient from "./client";

export const metadata: Metadata = {
  title: "About RideShare",
  description: "Learn more about the RideShare project, our mission, and the team behind it.",
};

export default function AboutPage() {
  return <AboutClient />;
}
