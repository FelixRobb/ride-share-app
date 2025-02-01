import Image from 'next/image'
import Link from 'next/link'
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"


import { MultiStepRegisterForm } from "./MultiStepRegisterForm"


interface RegisterPageProps {
  handleRegister: (name: string, phone: string, email: string, password: string) => Promise<void>
  isLoading: boolean
  quoteIndex: number;
}

const quotes = [
  { quote: "The freedom of the open road is seductive, serendipitous, and absolutely liberating.", author: "Aaron Lauritsen", source: "100 Days Drive" },
  { quote: "Driving at night is about communicating with lights.", author: "Lukhman Pambra" },
  { quote: "All he needed was a wheel in his hand and four on the road.", author: "Jack Kerouac", source: "On the Road" },
  { quote: "Kilometers are shorter than miles. Save gas, take your next trip in kilometers.", author: "George Carlin" },
  { quote: "The journey is part of the experience—an expression of the seriousness of one’s intent. One doesn’t take the A train to Mecca.", author: "Anthony Bourdain" },
  { quote: "Road trips aren’t measured by mile markers, but by moments.", author: "Unknown" },
  { quote: "The road must eventually lead to the whole world.", author: "Jack Kerouac", source: "On the Road" },
  { quote: "The open road is a beckoning, a strangeness, a place where a man can lose himself.", author: "William Least Heat-Moon", source: "Blue Highways" },
  { quote: "Stop worrying about the potholes in the road and enjoy the journey.", author: "Babs Hoffman" },
  { quote: "Every journey begins with a single tank of gas.", author: "Unknown" },
  { quote: "You can’t have a great day without driving a great distance.", author: "Unknown" },
  { quote: "Sometimes the best therapy is a long drive and good music.", author: "Unknown" },
  { quote: "No road is long with good company.", author: "Turkish Proverb" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { quote: "A journey is best measured in friends rather than miles.", author: "Tim Cahill" },
];

export default function RegisterPage({ handleRegister, isLoading, quoteIndex }: RegisterPageProps) {
  const [error, setError] = useState<string | null>(null)
  const randomQuote = quotes[quoteIndex];

  const onSubmit = async (name: string, phone: string, email: string, password: string) => {
    try {
      await handleRegister(name, phone, email, password)
    } catch (error) {
      if (error instanceof Error && error.message.includes("User already exists")) {
        setError("This phone number or email is already registered. Please use a different one or login.")
      } else {
        setError("Registration failed. Please try again.")
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
      }
      throw error
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-background p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">RideShare</h1>
          <div>
            <Button variant="ghost" asChild className="mr-2">
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Join RideShare and start sharing rides today!</CardDescription>
            </CardHeader>
            <CardContent>
              <MultiStepRegisterForm
                onSubmit={onSubmit}
                isLoading={isLoading}
              />
            </CardContent>
            {error && <p className="text-destructive text-center mt-2">{error}</p>}
            <CardFooter className="flex justify-center">
              <Button variant="link" asChild>
                <Link href="/login">Already have an account? Login</Link>
              </Button>
            </CardFooter>
          </Card>
          <div className="hidden lg:flex lg:w-1/2 lg:flex-col relative overflow-hidden items-center justify-center">
            <Image
              src="/oldcar.png"
              alt="Car on the road"
              width={0}
              height={0}
              sizes="50vw"
              className="w-full lg:w-7/12 h-auto lg:rounded-l-lg"
              placeholder = 'blur'
              blurDataURL="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="
            />
            {randomQuote && (
              <blockquote className="p-4 mt-4 text-center text-lg italic border-l-4 border-primary bg-muted/50 rounded-r-lg">
                &quot;{randomQuote.quote}&quot;
                <footer className="mt-2 text-primary block font-semibold">
                  {randomQuote.author} {randomQuote.source && `- ${randomQuote.source}`}
                </footer>
              </blockquote>
            )}
          </div>
        </div>
      </main>
      <footer className="bg-background p-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RideShare. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

