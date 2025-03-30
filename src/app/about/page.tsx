import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About RideShare",
  description: "Learn more about the RideShare project, our mission, and the team behind it.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <h1 className="text-4xl font-bold mb-6">About RideShare</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
          <p className="mb-4">
            RideShare is dedicated to revolutionizing the way people travel together. We aim to
            create a community-driven platform that connects friends, colleagues, and trusted
            individuals for shared rides, making transportation more efficient, economical, and
            environmentally friendly.
          </p>
          <p>
            Our goal is to reduce traffic congestion, lower carbon emissions, and foster a sense of
            community among travelers. By leveraging technology and social connections, we&apos;re
            building a safer, more sustainable alternative to traditional ride-sharing services.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-3">How It Works</h2>
          <p className="mb-4">
            Our platform allows users to easily create or join rides within their network of
            contacts. Whether you&apos;re commuting to work, heading to an event, or planning a road
            trip, RideShare makes it simple to find travel companions and share the journey.
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Create an account and build your network of trusted contacts</li>
            <li>Post a ride or search for available rides within your network</li>
            <li>Connect with ride partners and confirm trip details</li>
            <li>Enjoy your shared ride and split the costs</li>
            <li>Rate your experience and grow your trusted network</li>
          </ol>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-3">Our Values</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Safety:</strong> We prioritize user safety by enabling rides only within
              trusted networks and implementing robust verification processes.
            </li>
            <li>
              <strong>Community:</strong> We foster a sense of community and shared responsibility
              among our users, encouraging positive interactions and mutual support.
            </li>
            <li>
              <strong>Sustainability:</strong> By promoting ride-sharing, we contribute to reducing
              carbon emissions and minimizing our environmental impact.
            </li>
            <li>
              <strong>Innovation:</strong> We continuously improve our platform, incorporating user
              feedback and leveraging the latest technologies to enhance user experience and
              efficiency.
            </li>
            <li>
              <strong>Transparency:</strong> We believe in open communication with our users,
              providing clear information about our policies, data usage, and platform updates.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-3">Our Team</h2>
          <p className="mb-4">
            RideShare was founded by a group of passionate individuals who believe in the power of
            community and sustainable transportation. Our diverse team brings together expertise in
            technology, urban planning, and community building.
          </p>
          <p>
            Led by our CEO, Félix Robb, we&apos;re committed to creating a platform that not only
            simplifies travel but also strengthens social connections and contributes to a greener
            future.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-3">Technology & Security</h2>
          <p className="mb-4">
            RideShare is built using cutting-edge web technologies, ensuring a smooth and responsive
            experience across all devices. We employ industry-standard security measures to protect
            your data and maintain the integrity of our platform.
          </p>
          <p>
            Our commitment to privacy and data protection means that we only collect essential
            information and use it solely for the purpose of providing and improving our services.
            For more details, please review our Privacy Policy.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-3">Join Us</h2>
          <p className="mb-4">
            Be part of the RideShare community and experience a new way of traveling. By joining
            RideShare, you&apos;re not just finding a ride – you&apos;re contributing to a more
            connected, efficient, and sustainable future of transportation.
          </p>
          <p className="mb-6">
            Sign up today and start sharing rides with people you trust. Together, we can make every
            journey more enjoyable, affordable, and environmentally friendly.
          </p>
          <div className="flex space-x-4">
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${process.env.GMAIL_USER}`}>Contact Us</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
