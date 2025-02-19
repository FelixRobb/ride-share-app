"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"


const faqs = [
  {
    question: "What is RideShare?",
    answer:
      "RideShare is a platform that allows users to share rides with their trusted contacts, making travel more efficient and economical.",
  },
  {
    question: "How do I create an account?",
    answer:
      "You can create an account by clicking the 'Register' button on the homepage and following the registration process. You'll need to provide your name, email, phone number, and create a password.",
  },
  {
    question: "Is RideShare safe?",
    answer:
      "RideShare prioritizes safety by allowing rides only within your network of trusted contacts. We also implement various security measures to protect your data and privacy.",
  },
  {
    question: "How do I add contacts?",
    answer:
      "You can add contacts by going to your profile page and using the 'Manage Contacts' feature. You can search for users by name or phone number and send them a contact request.",
  },
  {
    question: "How do I create a ride?",
    answer:
      "To create a ride, log in to your account, go to the dashboard, and click on the 'Create Ride' button. Fill in the details of your ride, including start and end locations, date, time, and any additional notes.",
  },
  {
    question: "Can I edit or cancel a ride?",
    answer:
      "Yes, you can edit or cancel a ride you've created as long as it hasn't been accepted by another user. Go to the ride details page to make changes or cancel the ride.",
  },
  {
    question: "How do notifications work?",
    answer:
      "RideShare sends notifications for new ride offers, ride requests, and updates to rides you're involved in. You can manage your notification preferences in your profile settings.",
  },
  {
    question: "Is RideShare free to use?",
    answer: "Yes, RideShare is currently free to use. We do not charge any fees for creating or joining rides.",
  },
  {
    question: "What should I do if I have a problem with a ride or another user?",
    answer:
      "If you encounter any issues, please contact our support team immediately. You can find the contact information in the app's settings or on our website.",
  },
  {
    question: "Can I use RideShare for long-distance trips?",
    answer:
      "Yes, you can use RideShare for both short and long-distance trips. Just make sure to clearly communicate the details with your ride partner.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "To reset your password, go to the login page and click on the 'Forgot Password' link. Enter your email address, and we'll send you instructions to reset your password.",
  },
  {
    question: "Can I change my email or phone number?",
    answer:
      "Yes, you can update your email or phone number in your profile settings. Go to your profile page and click on 'Edit Profile' to make changes.",
  },
  {
    question: "How do I filter rides on the dashboard?",
    answer:
      "On the dashboard, you can use the filter options to sort rides by date, status (pending, accepted, completed), or location. Look for the filter icon or dropdown menu to access these options.",
  },
  {
    question: "What happens if a ride is cancelled?",
    answer:
      "If a ride is cancelled, both the requester and the accepter (if already assigned) will receive a notification. The ride will be removed from active rides and marked as cancelled in the history.",
  },
  {
    question: "How do I leave a review?",
    answer:
      "After completing a ride, you'll have the option to leave a review. Go to your ride history, find the completed ride, and click on 'Leave Review' to rate your experience and leave a comment.",
  },
  {
    question: "Can I block a user?",
    answer:
      "Yes, you can block a user from your contacts list. Go to your contacts, find the user you want to block, and select the 'Block' option. Blocked users won't be able to see your rides or contact you.",
  },
  {
    question: "How does RideShare handle my personal data?",
    answer:
      "RideShare takes data privacy seriously. We only collect necessary information and use it to provide our services. Your data is encrypted and stored securely. For more details, please read our Privacy Policy.",
  },
  {
    question: "Can I use RideShare on my computer?",
    answer:
      "Yes, RideShare is a web application that works on both mobile devices and desktop computers. Simply visit our website and log in to access all features.",
  },
  {
    question: "How do I report inappropriate behavior?",
    answer:
      "If you encounter inappropriate behavior, you can report it by going to the user's profile or the specific ride and clicking on the 'Report' button. Our team will review the report and take appropriate action.",
  },
  {
    question: "Can I set up recurring rides?",
    answer:
      "Currently, RideShare doesn't support setting up recurring rides automatically. However, you can easily duplicate a previous ride when creating a new one to save time for regular trips.",
  },
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFaqs = useMemo(() => {
    if (!searchTerm) return faqs
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return faqs
      .filter(
        (faq) =>
          faq.question.toLowerCase().includes(lowerCaseSearchTerm) ||
          faq.answer.toLowerCase().includes(lowerCaseSearchTerm),
      )
      .sort((a, b) => {
        const aTitle = a.question.toLowerCase().includes(lowerCaseSearchTerm)
        const bTitle = b.question.toLowerCase().includes(lowerCaseSearchTerm)
        if (aTitle && !bTitle) return -1
        if (!aTitle && bTitle) return 1
        return 0
      })
  }, [searchTerm])

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Search FAQ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>
      <Accordion type="single" collapsible className="w-full">
        {filteredFaqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {filteredFaqs.length === 0 && (
        <p className="text-center text-muted-foreground mt-4">No results found. Please try a different search term.</p>
      )}
    </div>
  )
}

