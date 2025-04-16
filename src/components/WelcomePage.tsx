"use client";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { createClient } from "@supabase/supabase-js";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Car,
  Users,
  Zap,
  ChevronDown,
  Star,
  ChevronRight,
  HelpCircle,
  FileText,
  Info,
  Code,
  Mail,
  ArrowRight,
  Shield,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Slider from "react-slick";

import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

// Add metadata configuration
export const metadata: Metadata = {
  title: "RideShare - Connect and Share Rides with Friends",
  description:
    "Join RideShare to connect with friends, share rides, and travel together safely. Create or join rides with just a few taps in our trusted community.",
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
};

// Update the Review interface to match the RPC function return type
interface Review {
  id: string;
  user_name: string; // Changed from userName to match RPC function
  review: string;
  rating: number;
  created_at: string;
}

export default function WelcomePage() {
  const [showCookieNotice, setShowCookieNotice] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [windowHeight, setWindowHeight] = useState(0);
  const { scrollY } = useScroll();

  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(false);

  // Enhanced parallax effects
  useEffect(() => {
    // Set window height after component mounts
    setWindowHeight(window.innerHeight);

    // Optional: Update on resize
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const carX = useTransform(
    scrollY,
    [windowHeight * (1 / 3), windowHeight * (1 / 3) + 500],
    [0, 1000]
  );

  const carOpacity = useTransform(
    scrollY,
    [windowHeight * (1 / 3), windowHeight * (1 / 3) + 300],
    [1, 0]
  );

  const { status } = useSession();

  interface ReviewCardProps {
    review: Review;
  }

  const ReviewCard = ({ review }: ReviewCardProps) => {
    return (
      <div className="h-full">
        <div className="h-full bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 p-6">
          {/* Rating */}
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>

          {/* Review content */}
          <div className="mb-4">
            <p className="text-foreground/90 italic leading-relaxed text-sm">
              &quot;{review.review}&quot;
            </p>
          </div>

          {/* User info and date */}
          <div className="flex justify-between items-center pt-4 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {review.user_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-primary/90">{review.user_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Visual decorative element */}
          <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY > 80);
      if (window.scrollY > 200 && !localStorage.getItem("cookiePreferences")) {
        setShowCookieNotice(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Replace the fetchApprovedReviews function with this new implementation
  const fetchApprovedReviews = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.rpc("get_approved_reviews");

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  };

  // Update the useEffect that fetches reviews
  useEffect(() => {
    const getReviews = async () => {
      const reviews = await fetchApprovedReviews();
      setApprovedReviews(reviews);
    };

    getReviews();
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem("cookiePreferences", "accepted");
    setShowCookieNotice(false);
  };

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 18,
      behavior: "smooth",
    });
  };

  const features = [
    {
      icon: Car,
      title: "Easy Ride Sharing",
      description: "Create or join rides with just a few taps",
    },
    {
      icon: Users,
      title: "Connect with Friends",
      description: "Build your network of trusted contacts",
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Travel with people you know and trust",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Get instant notifications about your rides",
    },
  ];

  const whyChooseRideShare = [
    "Connect with friends and build your trusted network",
    "Easily create or join rides within your community",
    "Real-time notifications keep you updated",
    "Secure and user-friendly interface",
    "Reduce your carbon footprint by sharing rides",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Enhanced Header */}
      <motion.header
        className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 border rounded-full w-11/12 m-auto shadow-lg bg-background/80 backdrop-blur-sm"
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
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-primary hover:text-primary px-2 py-1.5"
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-primary hover:text-primary mr-1">
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-primary hover:text-primary px-2 py-1.5"
                >
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Responsive Hero Section */}
      <section className="relative h-svh min-h-[600px] flex flex-col justify-center items-center text-center px-4 py-8 md:py-12 overflow-hidden">
        {/* Title and Description - Top Section */}
        <div className="w-full flex-1 flex items-end justify-center">
          <motion.div
            className="flex items-center justify-center flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="text-6xl md:text-8xl font-bold mb-6 
      text-primary 
      bg-clip-text supports-[text-transparent] bg-primary bg-gradient-to-r from-primary to-secondary-foreground 
      supports-[background-clip]:bg-clip-text supports-[background-clip]:text-transparent
      supports-not-[background-clip]:text-primary"
            >
              RideShare
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto">
              Connect with friends, share rides, and travel together safely.
            </p>
          </motion.div>
        </div>

        {/* CTA Button - More centrally positioned */}
        <div className="w-full flex-0 flex items-center justify-center flex-col mt-12">
          <motion.div
            className="flex flex-col items-center gap-4 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {status === "authenticated" ? (
              <Link href="/dashboard">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-10 bg-primary hover:bg-primary/90 text-black px-8 py-6 text-lg rounded-full group relative overflow-hidden">
                  <span className="relative z-10">Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-10 bg-primary hover:bg-primary/90 text-black px-8 py-6 text-lg rounded-full group relative overflow-hidden"
                onClick={scrollToContent}
              >
                <span className="relative z-10">Start Your Journey</span>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <motion.div
              animate={{
                y: [0, 6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <ChevronDown
                className="w-8 h-8 text-primary cursor-pointer"
                onClick={scrollToContent}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Middle section with car animation - Centered but keeps carX effect */}
        <div className="w-full flex-1 flex justify-center items-center">
          <motion.div
            className="absolute"
            style={{
              x: carX,
              opacity: carOpacity,
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
            <div className="w-40 h-40 sm:w-64 sm:h-64">
              <Car className="w-full h-full text-primary" />
              <motion.div
                className="absolute -inset-3 bg-primary/20 rounded-full blur-xl"
                animate={{
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
        </div>
      </section>

      {/* Features Section with Inline Animations */}
      <section className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-primary">
            Our Features
          </h2>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">
            Why Choose RideShare?
          </h2>
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
                  className="bg-primary rounded-full p-2"
                  whileHover={{
                    rotate: 180,
                    transition: { duration: 0.4 },
                  }}
                >
                  <ChevronRight className="w-6 h-6 text-black" />
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
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">
            What Our Users Say
          </h2>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />

            {/* Right gradient overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

            {/* Infinite Carousel using react-slick */}
            <div className="review-carousel-container">
              {approvedReviews.length > 0 ? (
                <Slider
                  dots={false}
                  infinite={true}
                  speed={5000}
                  slidesToShow={isLargeScreen ? 3 : isMediumScreen ? 2 : 1}
                  slidesToScroll={1}
                  autoplay={true}
                  autoplaySpeed={0}
                  cssEase="linear"
                  pauseOnHover={true}
                  arrows={false}
                  className="review-slider"
                >
                  {approvedReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </Slider>
              ) : (
                <div className="text-center text-muted-foreground">Loading reviews...</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">
            Start Sharing Rides Today
          </h2>
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto mb-12">
            Join our community of ride-sharers and experience a new way of traveling. Best of all,
            RideShare is completely free to use!
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
      <footer
        className={`
        bg-gradient-to-r from-primary/5 to-secondary/5 
        rounded-lg mx-${isLargeScreen ? "6" : "4"} 
        mb-20 md:mb-6 py-6 px-4 
        shadow-md border border-border/50
      `}
      >
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className={`text-${isMediumScreen ? "sm" : "xs"} font-medium text-foreground/80`}>
              &copy; {new Date().getFullYear()} RideShare by Félix Robb.
              <span className="text-muted-foreground ml-1">All rights reserved.</span>
            </p>

            <div className="mt-4 md:mt-0">
              {!isMediumScreen ? (
                // Mobile Drawer with controlled open state
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerTrigger className="h-9 px-4 py-2 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex rounded-full border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
                    <span>More Links</span>
                    <HelpCircle className="h-4 w-4" />
                  </DrawerTrigger>
                  <DrawerContent className="px-4 pb-8 pt-2 bg-gradient-to-b from-background to-primary/5">
                    <DrawerHeader className="pb-2">
                      <DrawerTitle className="text-center text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Explore RideShare
                      </DrawerTitle>
                    </DrawerHeader>
                    <div className="grid grid-cols-2 gap-3 p-2">
                      {[
                        { href: "/privacy-policy", label: "Privacy Policy", icon: Shield },
                        {
                          href: "/terms-of-service",
                          label: "Terms of Service",
                          icon: FileText,
                        },
                        { href: "/about", label: "Learn more", icon: Info },
                        { href: "/faq", label: "FAQ", icon: HelpCircle },
                        {
                          href: "https://github.com/FelixRobb/ride-share-app",
                          label: "GitHub",
                          icon: Code,
                        },
                        {
                          href: "mailto:rideshareapp.mail@gmail.com",
                          label: "Contact Us",
                          icon: Mail,
                        },
                      ].map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-2 p-3 rounded-xl bg-card hover:bg-primary/10 shadow-sm border border-border/50 transition-all duration-300 text-sm font-medium text-foreground hover:text-primary hover:shadow-md"
                        >
                          <Icon className="h-4 w-4 text-primary" />
                          <span>{label}</span>
                        </Link>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                // Desktop Popover with controlled open state
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger className="h-9 px-4 py-2 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex rounded-full border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
                    <span>More Links</span>
                    <HelpCircle
                      className={`h-${isLargeScreen ? "5" : "4"} w-${isLargeScreen ? "5" : "4"}`}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    className={`w-${isLargeScreen ? "96" : "80"} p-0 bg-card/95 backdrop-blur-md border border-border/50 shadow-lg rounded-xl mr-3`}
                  >
                    <div className="p-2">
                      <div className="py-3 px-4 border-b border-border/20">
                        <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                          Explore RideShare
                        </h3>
                      </div>
                      <div
                        className={`grid ${isLargeScreen ? "grid-cols-3" : "grid-cols-2"} gap-2 p-3`}
                      >
                        {[
                          { href: "/privacy-policy", label: "Privacy Policy", icon: Shield },
                          {
                            href: "/terms-of-service",
                            label: "Terms of Service",
                            icon: FileText,
                          },
                          { href: "/about", label: "Learn more", icon: Info },
                          { href: "/faq", label: "FAQ", icon: HelpCircle },
                          {
                            href: "https://github.com/FelixRobb/ride-share-app",
                            label: "GitHub",
                            icon: Code,
                          },
                          {
                            href: "mailto:rideshareapp.mail@gmail.com",
                            label: "Contact Us",
                            icon: Mail,
                          },
                        ].map(({ href, label, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors duration-200 text-sm font-medium text-foreground/80 hover:text-primary"
                          >
                            <Icon className="h-4 w-4 text-primary/70" />
                            <span>{label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      </footer>

      {showCookieNotice && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-card border border-zinc-700 rounded-lg p-4 shadow-lg max-w-xs mx-auto md:mx-0 z-40">
          <p className="text-sm text-zinc-300 mb-3">
            This website uses cookies to enhance your experience. By continuing to browse, you agree
            to our use of cookies.
          </p>
          <Button
            onClick={handleAcceptCookies}
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-black"
          >
            Accept
          </Button>
        </div>
      )}
    </div>
  );
}
