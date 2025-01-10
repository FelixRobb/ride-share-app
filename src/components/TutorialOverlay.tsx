import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';

export const TutorialOverlay: React.FC = () => {
  const { currentStep, nextStep, prevStep, skipTutorial } = useTutorial();
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (currentStep?.target) {
      const element = document.querySelector(currentStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetElement(rect);
      }
    } else {
      setTargetElement(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep && currentStep.page !== window.location.pathname) {
      router.push(currentStep.page);
    }
  }, [currentStep, router]);

  if (!currentStep) return null;

  const handleNext = () => {
    const nextStepData = nextStep();

    if (nextStepData && nextStepData.page !== window.location.pathname) {
      router.push(nextStepData.page)
    }
  }

  const handlePrev = () => {
    const prevStepData = prevStep();

    if (prevStepData && prevStepData.page !== window.location.pathname) {
      router.push(prevStepData.page)
    }
  }

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
            <CardTitle>{currentStep.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{currentStep.content}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={currentStep.step === 1}>
              Previous
            </Button>
            <Button variant="outline" onClick={skipTutorial}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext}>
              {currentStep.step < tutorialSteps.length ? "Next" : "Finish"}
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
};

