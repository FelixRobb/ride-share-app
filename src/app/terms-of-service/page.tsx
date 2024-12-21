import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
          <CardDescription>Last updated: [Insert Date]</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using the RideShare application and website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">2. Use of Service</h2>
            <p>RideShare provides a platform for users to connect and share rides. You must be at least 18 years old to use our services. You are responsible for maintaining the confidentiality of your account and password.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">3. User Responsibilities</h2>
            <p>You agree to use RideShare for lawful purposes only. You must not use the service to engage in any illegal activities or to harass, harm, or impersonate others. You are responsible for all content you post and actions you take through the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Intellectual Property</h2>
            <p>The RideShare application, website, and all related content are the exclusive property of RideShare and are protected by copyright and other intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Limitation of Liability</h2>
            <p>RideShare is not responsible for the actions, content, information, or data of third parties. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">6. Modifications to Service</h2>
            <p>We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">7. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of [Insert Jurisdiction], without regard to its conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">8. Changes to Terms</h2>
            <p>We reserve the right to update or change our Terms of Service at any time. We will notify users of any changes by posting the new Terms of Service on this page.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">9. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at [Insert Contact Information].</p>
          </section>
        </CardContent>
      </Card>
      <div className="mt-6 text-center">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}

