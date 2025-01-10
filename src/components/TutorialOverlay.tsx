import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial, tutorialSteps } from '@/contexts/TutorialContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

export const TutorialOverlay: React.FC = () => {
  const { currentStep, nextStep, prevStep, skipTutorial } = useTutorial();
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const updateTargetElement = useCallback(() => {
    if (currentStep?.target) {
      const element = document.querySelector(currentStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetElement(rect);
      } else {
        setTargetElement(null); // Set to null if target not found
      }
    } else {
      setTargetElement(null);
    }
  }, [currentStep]);

  useEffect(() => {
    updateTargetElement(); // Initial calculation

    const handleScroll = () => {
      updateTargetElement(); // Recalculate on scroll
    };

    window.addEventListener('scroll', handleScroll); // Attach scroll listener
    return () => window.removeEventListener('scroll', handleScroll); // Clean up
  }, [currentStep, updateTargetElement, pathname]); // Add pathname as dependency

  useEffect(() => {
    const updatedStepKey = localStorage.getItem('tutorialStepKey');
    if (updatedStepKey) {
      const step = tutorialSteps.find(s => s.key === updatedStepKey);
      if (step && step.page !== pathname) {
        router.push(step.page);
      }
    }
  }, [pathname, router]);

  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  if (!currentStep) return null;

  return (
    <AnimatePresence>
      {currentStep && ( // Conditionally render based on currentStep
        <motion.div
          key={currentStep.key}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="w-80 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Step {currentStep.step}: {currentStep.title}</span>
                <Button variant="ghost" size="sm" onClick={skipTutorial}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{currentStep.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentStep.step === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                {currentStep.step < 9 ? (
                  <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
                ) : (
                  "Finish"
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
      {targetElement && (
        <motion.div
          key={`highlight-${currentStep.key}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed border-2 border-primary rounded-md pointer-events-none"
          style={{
            left: targetElement.left - 4,
            top: targetElement.top - 4,
            width: targetElement.width + 8,
            height: targetElement.height + 8,
          }}
        />
      )}
    </AnimatePresence>
  );
};

