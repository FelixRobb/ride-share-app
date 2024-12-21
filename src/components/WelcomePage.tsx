import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Car, Users, Shield, Zap, ChevronDown, Star } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function WelcomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [showCookieNotice, setShowCookieNotice] = useState(false)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 100], [1, 0])
  const arrowY = useTransform(scrollY, [0, 100], [0, 20])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      if (window.scrollY > 200 && !localStorage.getItem('cookiePreferences')) {
        setShowCookieNotice(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleAcceptCookies = () => {
    localStorage.setItem('cookiePreferences', 'accepted')
    setShowCookieNotice(false)
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <motion.header 
        className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 border rounded-full w-11/12 m-auto shadow-inner ${scrolled ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`}
        initial={{ y: -100 }}
        animate={{ y: scrolled ? 0 : -100 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">RideShare</h1>
          <nav>
            <Button asChild variant="ghost" className="text-orange-500 hover:text-orange-400 mr-1">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-orange-500 hover:text-orange-400 px-2 py-1.5">
              <Link href="/register">Register</Link>
            </Button>
          </nav>
        </div>
      </motion.header>

      <section className="h-screen flex flex-col justify-center items-center text-center px-4">
        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          RideShare
        </motion.h1>
        <motion.p 
          className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Connect with friends, share rides, and travel together safely.
        </motion.p>
        <motion.div style={{ opacity, y: arrowY }}>
          <ChevronDown className="w-12 h-12 text-primary animate-bounce" />
        </motion.div>
      </section>

      <section className='h-8 bg-gradient-to-b from-black to-zinc-900'></section>

      <section className="py-20 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-orange-500">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-zinc-800 rounded-lg p-6 shadow-lg hover:shadow-orange-500/20 transition-shadow duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <feature.icon className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-orange-400">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-orange-500">Why Choose RideShare?</h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            {whyChooseRideShare.map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-4 bg-zinc-900 rounded-lg p-4 hover:bg-zinc-800 transition-colors duration-300"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
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

      <section className="py-20 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-orange-500">What Our Users Say</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={index}
                className="bg-zinc-800 rounded-lg p-6 shadow-lg flex-shrink-0 w-full md:w-80 hover:shadow-orange-500/20 transition-shadow duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-orange-500 fill-current" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-4">{review.comment}</p>
                <p className="text-orange-400 font-semibold">{review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-orange-500">Start Sharing Rides Today</h2>
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto mb-12">
            Join our community of ride-sharers and experience a new way of traveling. 
            Best of all, RideShare is completely free to use!
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" className="px-8 bg-orange-500 hover:bg-orange-600 text-black">
              <Link href="/register">Sign Up Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-black">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-900 py-8 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} RideShare by Félix Robb. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy-policy" className="hover:text-orange-500 transition-colors duration-300">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-orange-500 transition-colors duration-300">Terms of Service</Link>
          <Link href="/https://github.com/FelixRobb/ride-share-app" className="hover:text-orange-500 transition-colors duration-300">Source code on github</Link>
        </div>
      </footer>

      {showCookieNotice && (
        <div className="fixed bottom-4 right-4 bg-zinc-800 border border-zinc-700 rounded-lg p-4 shadow-lg max-w-xs">
          <p className="text-sm text-zinc-300 mb-3">
            This website uses cookies to enhance your experience. By continuing to browse, you agree to our use of cookies.
          </p>
          <Button onClick={handleAcceptCookies} size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
            Accept
          </Button>
        </div>
      )}
    </div>
  )
}

