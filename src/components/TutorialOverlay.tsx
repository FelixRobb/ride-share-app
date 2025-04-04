"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useTutorial, tutorialSteps } from "@/contexts/TutorialContext";
import { cn } from "@/lib/utils";

export const TutorialOverlay: React.FC = () => {
  const { currentStep, nextStep, prevStep, skipTutorial, isTargetReady } = useTutorial();
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  const updateTargetElement = useCallback(() => {
    if (!currentStep?.target || !isMounted || !isTargetReady) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(currentStep.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetElement(rect);
    } else {
      setTargetElement(null);
    }
  }, [currentStep, isMounted, isTargetReady]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Update target element when step changes or target is ready
  useEffect(() => {
    if (!isMounted) return;

    updateTargetElement();

    const handleUpdate = () => {
      requestAnimationFrame(updateTargetElement);
    };

    window.addEventListener("scroll", handleUpdate);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [updateTargetElement, isMounted]);

  if (!currentStep || !isMounted || currentStep.page !== pathname) return null;

  const isLastStep = currentStep.step === tutorialSteps.length;
  const progress = `${currentStep.step}/${tutorialSteps.length}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep.key}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-20 md:bottom-4 left-0 right-0 mx-auto z-50 w-80 md:right-4 md:left-auto md:mx-0"
      >
        <Card className="w-72 shadow-lg border border-primary/20 bg-card/95 backdrop-blur-sm">
          <div className="px-3 pt-3 pb-1 flex items-center justify-between border-b border-border/30">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-sm font-medium">{currentStep.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{progress}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={skipTutorial}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardContent className="pt-2 pb-2">
            <p className="text-xs text-muted-foreground leading-relaxed">{currentStep.content}</p>
          </CardContent>
          <CardFooter className="flex justify-between pt-0 pb-2 px-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep.step === 1}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="h-3 w-3 mr-1" /> Prev
            </Button>
            <Button variant="default" size="sm" onClick={nextStep} className="h-7 px-3 text-xs">
              {isLastStep ? (
                "Finish"
              ) : (
                <>
                  Next <ChevronRight className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      {targetElement && isTargetReady && (
        <motion.div
          key={`highlight-${currentStep.key}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed border-2 border-primary rounded-md pointer-events-none shadow-[0_0_0_4px_rgba(var(--primary)/.15)]",
            currentStep.key === "notifications" ? "z-[60] rounded-full" : "z-40"
          )}
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
