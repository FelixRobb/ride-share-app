import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ReviewForm } from "@/components/ReviewForm"

export const metadata: Metadata = {
  title: "Leave a Review - RideShare",
  description: "Share your experience with RideShare by leaving a review.",
}

export default function ReviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <h1 className="text-4xl font-bold mb-6">Leave a Review</h1>
      <p className="mb-6">
        We value your feedback! Please share your experience with RideShare to help us improve and to let others know
        about our service.
      </p>
      <ReviewForm />
    </div>
  )
}

