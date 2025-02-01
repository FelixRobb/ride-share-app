'use client'

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import LoginPage from '@/components/LoginPage'
import { toast } from "sonner"
import { User } from "@/types"
import { fetchUserData } from "@/utils/api"

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
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
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * quotes.length));
  }, []);

  if (quoteIndex === null) return null;


  const handleLogin = async (identifier: string, password: string, loginMethod: 'email' | 'phone') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password, loginMethod }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem("currentUser", JSON.stringify(data.user))
      localStorage.setItem("theme", "dark")
      await fetchUserData(data.user.id, null)
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LoginPage
      handleLoginAction={handleLogin}
      isLoading={isLoading}
      quoteIndex={quoteIndex} // Pass the index as a prop
    />
  )
}

