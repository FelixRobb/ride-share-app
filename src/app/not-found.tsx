"use client"

import { motion } from "framer-motion"
import { Car, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"


export default function NotFound() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    setIsLoggedIn(!!user)
  }, [])

  const carVariants = {
    initial: { x: "-100%" },
    animate: {
      x: "100%",
      transition: {
        duration: 4,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
      },
    },
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-2xl mx-5">
        <h1 className="text-6xl md:text-8xl font-bold text-primary">404</h1>
        <p className="text-2xl md:text-4xl font-semibold text-foreground">Oops! You&apos;ve taken a wrong turn</p>
        <p className="text-lg md:text-xl text-muted-foreground">
          The page you&apos;re looking for seems to have driven off into the sunset.
        </p>

        <div className="relative w-full h-24 overflow-hidden my-12">
          <motion.div
            className="absolute inset-0 flex items-center"
            variants={carVariants}
            initial="initial"
            animate="animate"
          >
            <Car className="w-16 h-16 text-primary" />
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        <Button asChild size="lg" className="group">
          <Link href={isLoggedIn ? "/dashboard" : "/"}>
            {isLoggedIn ? "Back to Dashboard" : "Back to Home"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

