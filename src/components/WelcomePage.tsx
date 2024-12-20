import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Car, Users, Shield, Zap, ChevronDown, Star } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function WelcomePage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const arrowY = useTransform(scrollYProgress, [0, 0.1], [0, 20]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Car, title: "Easy Ride Sharing", description: "Create or join rides with just a few taps" },
    { icon: Users, title: "Connect with Friends", description: "Build your network of trusted contacts" },
    { icon: Shield, title: "Safe & Secure", description: "Travel with people you know and trust" },
    { icon: Zap, title: "Real-time Updates", description: "Get instant notifications about your rides" },
  ];

  const whyChooseRideShare = [
    "Connect with friends and build your trusted network",
    "Easily create or join rides within your community",
    "Real-time notifications keep you updated",
    "Secure and user-friendly interface",
    "Reduce your carbon footprint by sharing rides",
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'
        }`}
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

      {/* Hero Section */}
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

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-1 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-900 rounded-lg p-6 shadow-lg flex items-center space-x-6"
              style={{
                y: useTransform(scrollYProgress, [0.2 + index * 0.1, 0.3 + index * 0.1], [20, -20]),
                opacity: useTransform(scrollYProgress, [0.2 + index * 0.1, 0.3 + index * 0.1], [0, 1]),
              }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <feature.icon className="w-12 h-12 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{feature.title}</h2>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Choose RideShare Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Choose RideShare?</h2>
          {whyChooseRideShare.map((benefit, index) => (
            <motion.div
              key={index}
              className="bg-black/80 backdrop-blur-sm rounded-lg p-6 shadow-lg my-4"
              style={{
                x: useTransform(scrollYProgress, [0.3 + index * 0.1, 0.4 + index * 0.1], [-50, 50]),
                opacity: useTransform(scrollYProgress, [0.3 + index * 0.1, 0.4 + index * 0.1], [0, 1]),
              }}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <p className="text-xl text-center">{benefit}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}