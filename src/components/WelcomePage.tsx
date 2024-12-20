import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Car, Users, Shield, Zap, ChevronDown, Star } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export default function WelcomePage() {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 100], [1, 0])
  const arrowY = useTransform(scrollY, [0, 100], [0, 20])

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { icon: Car, title: "Easy Ride Sharing", description: "Create or join rides with just a few taps" },
    { icon: Users, title: "Connect with Friends", description: "Build your network of trusted contacts" },
    { icon: Shield, title: "Safe & Secure", description: "Travel with people you know and trust" },
    { icon: Zap, title: "Real-time Updates", description: "Get instant notifications about your rides" },
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`}
        initial={{ y: -100 }}
        animate={{ y: scrolled ? 0 : -100 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">RideShare</h1>
          <nav>
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
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
          className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12"
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

      <section ref={ref} className="min-h-screen flex flex-col justify-center items-center py-20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-900 rounded-lg p-6 shadow-lg"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Choose RideShare?</h2>
          <ul className="space-y-6 max-w-2xl mx-auto">
            {[
              "Connect with friends and build your trusted network",
              "Easily create or join rides within your community",
              "Real-time notifications keep you updated",
              "Secure and user-friendly interface",
              "Reduce your carbon footprint by sharing rides",
            ].map((benefit, index) => (
              <motion.li
                key={index}
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <ChevronDown className="w-5 h-5 text-primary mr-2" />
                <span>{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">What Our Users Say</h2>
          <div className="flex overflow-x-auto space-x-6 pb-6">
            {reviews.map((review, index) => (
              <motion.div
                key={index}
                className="bg-gray-900 rounded-lg p-6 shadow-lg flex-shrink-0 w-80"
                initial={{ opacity: 0, x: 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">{review.comment}</p>
                <p className="text-primary font-semibold">{review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Start Sharing Rides Today</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-12">
            Join our community of ride-sharers and experience a new way of traveling. 
            Best of all, RideShare is completely free to use!
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" className="px-8">
              <Link href="/register">Sign Up Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-black py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} RideShare. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-primary">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}

