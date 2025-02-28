"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Car, Users, Shield, Zap, ChevronDown, ArrowRight, Star } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Add metadata configuration
export const metadata: Metadata = {
  title: "RideShare - Connect and Share Rides with Friends",
  description: "Join RideShare to connect with friends, share rides, and travel together safely. Create or join rides with just a few taps in our trusted community.",
  keywords: ["rideshare", "carpooling", "ride sharing", "transportation", "community rides"],
  openGraph: {
    title: "RideShare - Connect and Share Rides with Friends",
    description: "Join RideShare to connect with friends, share rides, and travel together safely.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png", // Make sure to add this image to your public folder
        width: 1200,
        height: 630,
        alt: "RideShare Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RideShare - Connect and Share Rides with Friends",
    description: "Join RideShare to connect with friends, share rides, and travel together safely.",
    images: ["/twitter-image.png"], // Make sure to add this image to your public folder
  },
}

interface Review {
  id: string
  userName: string
  review: string
  rating: number
  created_at: string
}

export default function WelcomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [showCookieNotice, setShowCookieNotice] = useState(false)
  const [showHeader, setShowHeader] = useState(false)
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([])
  const { scrollY } = useScroll()

  // Enhanced parallax effects
  const carX = useTransform(scrollY, [0, 500], [0, 1000])
  const carScale = useTransform(scrollY, [0, 200], [1, 0.8])
  const carOpacity = useTransform(scrollY, [0, 300], [1, 0])

  const { status } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY > 80)
      setScrolled(window.scrollY > 150)
      if (window.scrollY > 200 && !localStorage.getItem("cookiePreferences")) {
        setShowCookieNotice(true)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchApprovedReviews = async () => {
      const response = await fetch("/api/reviews/approved")
      if (response.ok) {
        const data = await response.json()
        setApprovedReviews(data)
      } else {
        throw new Error("Failed to fetch approved reviews")
      }
    }

    fetchApprovedReviews()
  }, [])

  const handleAcceptCookies = () => {
    localStorage.setItem("cookiePreferences", "accepted")
    setShowCookieNotice(false)
  }

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 16,
      behavior: "smooth",
    })
  }

  const features = [
    { icon: Car, title: "Easy Ride Sharing", description: "Create or join rides with just a few taps" },
    { icon: Users, title: "Connect with Friends", description: "Build your network of trusted contacts" },
    { icon: Shield, title: "Safe & Secure", description: "Travel with people you know and trust" },
    { icon: Zap, title: "Real-time Updates", description: "Get instant notifications about your rides" },
  ]

  const whyChooseRideShare = [
    "Connect with friends and build your trusted network",
    "Easily create or join rides within your community",
    "Real-time notifications keep you updated",
    "Secure and user-friendly interface",
    "Reduce your carbon footprint by sharing rides",
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Enhanced Header */}
      <motion.header
        className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 border rounded-full w-11/12 m-auto shadow-lg ${scrolled ? "bg-background/80 backdrop-blur-sm" : "bg-transparent"
          }`}
        initial={{ y: -100 }}
        animate={{
          y: showHeader ? 0 : -100,
          opacity: showHeader ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">RideShare</h1>
          <nav>
            {status === "authenticated" ? (
              <Button asChild variant="outline" size="lg" className="text-primary hover:text-primary px-2 py-1.5">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-primary hover:text-primary mr-1">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-primary hover:text-primary px-2 py-1.5">
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Modified Hero Section with Adjusted Car Position */}
      <section className="relative h-svh flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        {/* Title and Description */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-primary bg-gradient-to-r from-primary to-secondary-foreground">
            RideShare
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Connect with friends, share rides, and travel together safely.
          </p>
        </motion.div>

        {/* Car Animation */}
        <motion.div
          className="absolute top-[70vh]"
          style={{
            x: carX,
            scale: carScale,
            opacity: carOpacity,
            transform: "translateY(-50%)",
          }}
          initial={{
            x: -200,
            opacity: 0,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
            opacity: { duration: 0.5, ease: "easeOut" },
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
        >
          <div className="relative w-40 h-40 sm:w-64 sm:h-64">
            <Car className="w-full h-full text-primary" />
            <motion.div
              className="absolute -inset-4 bg-primary/20 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          className="flex flex-col items-center gap-6 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {status === "authenticated" ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-black px-8 py-6 text-lg rounded-full group relative overflow-hidden"
              >
                <span className="relative z-10">Go to Dashboard</span>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
                <ArrowRight className="w-6 h-6 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-black px-8 py-6 text-lg rounded-full group relative overflow-hidden"
              onClick={scrollToContent}
            >
              <span className="relative z-10">Start Your Journey</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <ArrowRight className="w-6 h-6 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <ChevronDown className="w-8 h-8 text-primary cursor-pointer" onClick={scrollToContent} />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section with Inline Animations */}
      <section className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="border rounded-lg p-6 shadow-lg transition-shadow duration-300 bg-background/50 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: index * 0.1,
                  },
                }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{
                  scale: 1.03,
                  transition: { duration: 0.4, ease: "easeOut" },
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <feature.icon className="w-12 h-12 text-primary mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-primary">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section with Inline Animations */}
      <section className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-orange-500">Why Choose RideShare?</h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            {whyChooseRideShare.map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-4 border rounded-lg p-4 shadow-lg transition-shadow duration-300 bg-background/50 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: index * 0.1,
                  },
                }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{
                  scale: 1.03,
                  transition: { duration: 0.4, ease: "easeOut" },
                }}
              >
                <motion.div
                  className="bg-orange-500 rounded-full p-2"
                  whileHover={{
                    rotate: 180,
                    transition: { duration: 0.4 },
                  }}
                >
                  <ChevronDown className="w-6 h-6 text-black" />
                </motion.div>
                <p className="text-lg">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedReviews.map((review) => (
              <Card key={review.id} className="bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="text-xl whitespace-nowrap overflow-hidden text-ellipsis">{review.userName}</span>
                    <div className="flex">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{review.review}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">Start Sharing Rides Today</h2>
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto mb-12">
            Join our community of ride-sharers and experience a new way of traveling. Best of all, RideShare is
            completely free to use!
          </p>
          <div className="space-x-4">
            {status === "authenticated" ? (
              <Button
                asChild
                size="lg"
                className="px-8 bg-primary hover:bg-primary/90 text-black relative overflow-hidden group"
              >
                <Link href="/dashboard">
                  <span className="relative z-10">Go to Dashboard</span>
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="px-8 bg-primary hover:bg-primary/90 text-black relative overflow-hidden group"
                >
                  <Link href="/register">
                    <span className="relative z-10">Sign Up Now</span>
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-8 text-primary border-primary hover:bg-primary hover:text-black"
                >
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-8 text-center text-sm text-muted-foreground relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="relative z-10">
          <p>&copy; {new Date().getFullYear()} RideShare by Félix Robb. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors duration-300">
              Terms of Service
            </Link>
            <Link
              href="https://github.com/FelixRobb/ride-share-app"
              className="hover:text-primary transition-colors duration-300"
            >
              Source code on github
            </Link>
            <Link href="/faq" className="hover:text-primary transition-colors duration-300">
              Frequently Asked Questions
            </Link>
            <Link href="/about" className="hover:text-primary transition-colors duration-300">
              About RideShare
            </Link>
          </div>
        </div>
      </footer>

      {showCookieNotice && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-card border border-zinc-700 rounded-lg p-4 shadow-lg max-w-xs mx-auto md:mx-0 z-40">
          <p className="text-sm text-zinc-300 mb-3">
            This website uses cookies to enhance your experience. By continuing to browse, you agree to our use of
            cookies.
          </p>
          <Button onClick={handleAcceptCookies} size="sm" className="w-full bg-primary hover:bg-primary/90 text-black">
            Accept
          </Button>
        </div>
      )}
    </div>
  )
}

