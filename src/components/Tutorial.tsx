import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, X } from 'lucide-react';

const steps = [
  {
    title: "Welcome to RideShare!",
    content: "Let's take a quick tour of the main features to help you get started.",
    target: null,
  },
  {
    title: "Create a Ride",
    content: "Click here to create a new ride. You can offer or request rides.",
    target: "[data-tutorial='create-ride']",
  },
  {
    title: "Your Dashboard",
    content: "This is your dashboard. You can see your active, available, and past rides here.",
    target: "[data-tutorial='dashboard-tabs']",
  },
  {
    title: "Manage Your Profile",
    content: "Click here to manage your profile, contacts, and account settings.",
    target: "[data-tutorial='profile-link']",
  },
  {
    title: "You're All Set!",
    content: "That's it! You're ready to start sharing rides. Enjoy using RideShare!",
    target: null,
  },
];

export function Tutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null);

  useEffect(() => {
    const target = steps[currentStep].target;
    if (target) {
      const element = document.querySelector(target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetElement(rect);
      }
    } else {
      setTargetElement(null);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      >
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <p>{steps[currentStep].content}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleSkip}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Finish"
              )}
            </Button>
          </CardFooter>
        </Card>
        {targetElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute border-2 border-primary rounded-md"
            style={{
              left: targetElement.left - 4,
              top: targetElement.top - 4,
              width: targetElement.width + 8,
              height: targetElement.height + 8,
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

