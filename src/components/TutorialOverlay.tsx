"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useTutorial, tutorialSteps } from "@/contexts/TutorialContext"
import { cn } from "@/lib/utils"

export const TutorialOverlay: React.FC = () => {
  const { currentStep, nextStep, prevStep, skipTutorial, isTargetReady } = useTutorial()
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()

  const updateTargetElement = useCallback(() => {
    if (!currentStep?.target || !isMounted || !isTargetReady) {
      setTargetElement(null)
      return
    }

    const element = document.querySelector(currentStep.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetElement(rect)
    } else {
      setTargetElement(null)
    }
  }, [currentStep, isMounted, isTargetReady])

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Update target element when step changes or target is ready
  useEffect(() => {
    if (!isMounted) return

    updateTargetElement()

    const handleUpdate = () => {
      requestAnimationFrame(updateTargetElement)
    }

    window.addEventListener("scroll", handleUpdate)
    window.addEventListener("resize", handleUpdate)

    return () => {
      window.removeEventListener("scroll", handleUpdate)
      window.removeEventListener("resize", handleUpdate)
    }
  }, [updateTargetElement, isMounted])

  if (!currentStep || !isMounted || currentStep.page !== pathname) return null

  const isLastStep = currentStep.step === tutorialSteps.length
  const progress = `${currentStep.step}/${tutorialSteps.length}`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep.key}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-20 md:bottom-4 left-0 right-0 mx-auto z-50 w-80 sm:right-4 sm:left-auto sm:mx-0"
      >
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              <div className="flex flex-col">
                <span>{currentStep.title}</span>
                <span className="text-sm text-muted-foreground">{progress}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={skipTutorial}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{currentStep.content}</p>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={prevStep} disabled={currentStep.step === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="default" size="sm" onClick={nextStep}>
              {isLastStep ? (
                "Finish"
              ) : (
                <>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      {targetElement && isTargetReady && (
        <motion.div
          key={`highlight-${currentStep.key}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed border-2 border-primary rounded-md pointer-events-none",
            // Only use z-[60] for the notifications tutorial step
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
  )
}

