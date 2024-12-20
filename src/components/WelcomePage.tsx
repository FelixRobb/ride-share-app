import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, Users, Shield, Zap, ChevronDown, Star } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const ParallaxSection = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <motion.div
      ref={ref}
      style={{
        opacity,
        scale,
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
};

export default function WelcomePage() {
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
    <div className="min-h-screen bg-black text-white">
      {/* Features Section */}
      <section className="relative h-[300vh] overflow-hidden">
        <h2 className="absolute top-8 left-1/2 transform -translate-x-1/2 text-3xl font-bold z-10">
          Features
        </h2>
        {features.map((feature, index) => (
          <ParallaxSection key={index} index={index}>
            <div className="bg-gray-900 rounded-lg p-6 shadow-lg max-w-md mx-auto">
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          </ParallaxSection>
        ))}
      </section>

      {/* Why Choose RideShare Section */}
      <section className="relative h-[300vh] overflow-hidden bg-gray-900">
        <h2 className="absolute top-8 left-1/2 transform -translate-x-1/2 text-3xl font-bold z-10">
          Why Choose RideShare?
        </h2>
        {whyChooseRideShare.map((benefit, index) => (
          <ParallaxSection key={index} index={index}>
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 shadow-lg max-w-md mx-auto">
              <p className="text-xl text-center">{benefit}</p>
            </div>
          </ParallaxSection>
        ))}
      </section>
    </div>
  );
}