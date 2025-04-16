"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import LayoutAuth from "@/components/LayoutAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyClient() {
  return (
    <LayoutAuth>
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <CardDescription>Last updated: 4/4/2025</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-2">1. Introduction</h2>
              <p>
                Welcome to RideShare. We are committed to protecting your personal information and
                your right to privacy. This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you use our mobile application and website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">2. Information We Collect</h2>
              <p>
                We collect personal information that you provide to us, such as your name, email
                address, phone number, and location data when you use our services. We also collect
                information automatically when you use the app, including usage data and device
                information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">3. How We Use Your Information</h2>
              <p>
                We use your information to provide and improve our services, communicate with you,
                and ensure the security of our platform. This includes matching riders with drivers,
                processing payments, and sending you important updates about your rides.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">4. Sharing Your Information</h2>
              <p>
                We may share your information with other users as necessary for ride-sharing
                purposes, with service providers who assist us in operating our platform, and as
                required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">5. Your Rights and Choices</h2>
              <p>
                You have the right to access, correct, or delete your personal information. You can
                also opt out of certain data collection and use practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">6. Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your
                personal information against unauthorized or unlawful processing, accidental loss,
                destruction, or damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">7. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">8. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at [Insert
                Contact Information].
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </LayoutAuth>
  );
}
