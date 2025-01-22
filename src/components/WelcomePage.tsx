import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Car, Users, Shield, Zap, ChevronDown, Star, ArrowRight } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"

export default function WelcomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [showCookieNotice, setShowCookieNotice] = useState(false)
  const [showHeader, setShowHeader] = useState(false)
  const { scrollY } = useScroll()

  // Enhanced parallax effects
  const carX = useTransform(scrollY, [0, 500], [0, 1000])
  const carScale = useTransform(scrollY, [0, 200], [1, 0.8])
  const carOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  // Add a new state to track user authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show header after scrolling 80px
      setShowHeader(window.scrollY > 80)
      // Add blur effect after scrolling 150px
      setScrolled(window.scrollY > 150)
      if (window.scrollY > 200 && !localStorage.getItem("cookiePreferences")) {
        setShowCookieNotice(true)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Add an effect to check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem("currentUser")
      setIsAuthenticated(!!user)
    }

    checkAuth()
    window.addEventListener("storage", checkAuth)

    return () => {
      window.removeEventListener("storage", checkAuth)
    }
  }, [])

  const handleAcceptCookies = () => {
    localStorage.setItem("cookiePreferences", "accepted")
    setShowCookieNotice(false)
  }

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
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

  const reviews = [
    { name: "Alice", rating: 5, comment: "RideShare has made my daily commute so much easier and more enjoyable!" },
    { name: "Bob", rating: 4, comment: "Great app for finding rides with friends. Saves me money on gas too!" },
    { name: "Charlie", rating: 5, comment: "I feel much safer sharing rides with people I know. Highly recommended!" },
    { name: "Diana", rating: 4, comment: "The real-time updates are super helpful. Never miss a ride!" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden dark">
      {/* Enhanced Header */}
      <motion.header
        className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 border rounded-full w-11/12 m-auto shadow-lg ${
          scrolled ? "bg-background/80 backdrop-blur-sm" : "bg-transparent"
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
            {isAuthenticated ? (
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

        {/* Car Aanimation */}
        <motion.div
          className="absolute top-[70vh]"
          style={{
            x: carX,
            scale: carScale,
            opacity: carOpacity,

            transform: "translateY(-50%)",
          }}
          initial={{
            opacity: 0,
          }}
          transition={{
            duration: 1.5, // Animation duration
            ease: "easeOut", // Smooth easing
          }}
          animate={{
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

      {/* Features Section */}
      <section className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="border rounded-lg p-6 shadow-lg hover:shadow-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-primary">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-orange-500">Why Choose RideShare?</h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            {whyChooseRideShare.map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-4 border rounded-lg p-4 shadow-lg hover:shadow-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="bg-orange-500 rounded-full p-2">
                  <ChevronDown className="w-6 h-6 text-black" />
                </div>
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
          <div className="flex flex-wrap justify-center gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={index}
                className="rounded-lg p-6 shadow-lg flex-shrink-0 w-full md:w-80 hover:shadow-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-primary fill-current" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-4">{review.comment}</p>
                <p className="text-primary font-semibold">{review.name}</p>
              </motion.div>
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
            {isAuthenticated ? (
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

