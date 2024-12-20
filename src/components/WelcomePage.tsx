import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Car, Users, Shield, Zap, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-background">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
            RideShare
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Connect with friends, share rides, and travel together safely.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { icon: Car, title: "Easy Ride Sharing", description: "Create or join rides with just a few taps" },
            { icon: Users, title: "Connect with Friends", description: "Build your network of trusted contacts" },
            { icon: Shield, title: "Safe & Secure", description: "Travel with people you know and trust" },
            { icon: Zap, title: "Real-time Updates", description: "Get instant notifications about your rides" },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose RideShare?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            RideShare is more than just a ride-sharing app. It's a community of friends and trusted contacts, 
            making your journeys safer, more enjoyable, and eco-friendly.
          </p>
          <ul className="text-left max-w-md mx-auto space-y-4">
            {[
              "Connect with friends and build your trusted network",
              "Easily create or join rides within your community",
              "Real-time notifications keep you updated",
              "Secure and user-friendly interface",
              "Reduce your carbon footprint by sharing rides",
            ].map((benefit, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="flex items-center"
              >
                <ChevronRight className="w-5 h-5 text-primary mr-2" />
                <span>{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Sharing Rides Today</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
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
        </motion.div>
      </div>
    </div>
  )
}

