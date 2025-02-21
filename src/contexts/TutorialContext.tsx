"use client"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

import { TutorialOverlay } from "@/components/TutorialOverlay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"


type TutorialStep = {
  key: string
  page: string
  step: number
  title: string
  content: string
  target?: string | null
}

type TutorialContextType = {
  currentStep: TutorialStep | null
  nextStep: () => void
  prevStep: () => void
  skipTutorial: () => void
  restartTutorial: () => void // Add this new function
  showPopup: boolean
  handlePopupChoice: (choice: boolean) => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

const tutorialSteps: TutorialStep[] = [
  {
    key: "welcome",
    page: "/dashboard",
    step: 1,
    title: "Welcome to RideShare!",
    content:
      "This is your dashboard. Here you can see your rides and manage your account. Let's explore the key features.",
    target: "[data-tutorial='dashboard']",
  },
  {
    key: "create-ride",
    page: "/dashboard",
    step: 2,
    title: "Create a Ride",
    content: "Click here to create a new ride. You can offer or request rides with your contacts.",
    target: "[data-tutorial='create-ride']",
  },
  {
    key: "ride-tabs",
    page: "/dashboard",
    step: 3,
    title: "Ride Tabs",
    content:
      "Use these tabs to switch between your active rides, available rides from your contacts, and your ride history.",
    target: "[data-tutorial='dashboard-tabs']",
  },
  {
    key: "profile",
    page: "/profile",
    step: 4,
    title: "Your Profile",
    content:
      "This is your profile page. Here you can manage your personal information, contacts, and account settings.",
    target: "[data-tutorial='profile-info']",
  },
  {
    key: "contacts",
    page: "/profile",
    step: 5,
    title: "Managing Contacts",
    content: "In the Contacts section, you can add new contacts, accept requests, and manage your existing contacts.",
    target: "[data-tutorial='contacts-section']",
  },
  {
    key: "notifications",
    page: "/profile",
    step: 6,
    title: "Notification Settings",
    content: "Adjust your notification preferences here to stay updated on your rides and contact requests.",
    target: "[data-tutorial='notification-settings']",
  },
  {
    key: "create-ride-form",
    page: "/create-ride",
    step: 7,
    title: "Creating a Ride",
    content:
      "Fill in the details for your ride. Specify the start and end locations, date, time, and any additional notes.",
    target: "[data-tutorial='ride-form']",
  },
  {
    key: "finish",
    page: "/dashboard",
    step: 8,
    title: "Congratulations!",
    content:
      "You've completed the tutorial. You're now ready to start sharing rides with your contacts. Enjoy using RideShare!",
  },
]

export { tutorialSteps }

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null)
  const [pendingStep, setPendingStep] = useState<TutorialStep | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [showStepPopup, setShowStepPopup] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Initialize tutorial on mount
  useEffect(() => {
    const initializeTutorial = () => {
      const tutorialCompleted = localStorage.getItem("tutorialCompleted") === "true"
      const savedStepNumber = Number.parseInt(localStorage.getItem("tutorialStep") || "1", 10)
      const step = tutorialSteps.find((s) => s.step === savedStepNumber) || tutorialSteps[0]

      if (tutorialCompleted) {
        setCurrentStep(null)
        setPendingStep(null)
      } else if (step.page === pathname) {
        setCurrentStep(step)
        setPendingStep(null)
        setShowStepPopup(true)
      } else {
        setPendingStep(step)
        setShowPopup(true)
      }

      setIsInitialized(true)
    }

    initializeTutorial()
  }, [pathname])

  useEffect(() => {
    if (isInitialized && pendingStep) {
      if (pathname === pendingStep.page) {
        // Longer delay and more controlled state transition
        const timeoutId = setTimeout(() => {
          setCurrentStep(pendingStep)
          setPendingStep(null)
          setShowStepPopup(true)
          setShowPopup(false)
          setIsTransitioning(false)
        }, 300) // Increased delay for smoother transition

        return () => clearTimeout(timeoutId)
      } else if (!isTransitioning) {
        setShowPopup(true)
        setShowStepPopup(false)
      }
    }
  }, [pathname, pendingStep, isInitialized, isTransitioning])

  const changeStep = useCallback(
    async (step: TutorialStep | null) => {
      if (!step) {
        // Completely reset tutorial state
        localStorage.removeItem("tutorialStep")
        localStorage.setItem("tutorialCompleted", "true")
        setCurrentStep(null)
        setPendingStep(null)
        setShowStepPopup(false)
        setShowPopup(false)
        return
      }

      // Clear any lingering state from previous step
      setCurrentStep(null)
      setPendingStep(null)
      setShowStepPopup(false)

      // Short delay to ensure clean state before new step
      await new Promise((resolve) => setTimeout(resolve, 50))

      localStorage.setItem("tutorialStep", step.step.toString())

      if (step.page !== pathname) {
        setIsTransitioning(true)
        setPendingStep(step)
        router.push(step.page)
      } else {
        setCurrentStep(step)
        setShowStepPopup(true)
      }
    },
    [pathname, router],
  )

  const nextStep = useCallback(() => {
    if (!currentStep) return

    const currentIndex = tutorialSteps.findIndex((step) => step.step === currentStep.step)

    if (currentIndex === tutorialSteps.length - 1) {
      localStorage.removeItem("tutorialStep")
      localStorage.setItem("tutorialCompleted", "true")
      setCurrentStep(null)
      setPendingStep(null)
      setShowStepPopup(false)
      return
    }

    const nextStep = tutorialSteps[currentIndex + 1]
    changeStep(nextStep)
  }, [currentStep, changeStep])

  const prevStep = useCallback(() => {
    if (!currentStep) return

    const currentIndex = tutorialSteps.findIndex((step) => step.step === currentStep.step)
    if (currentIndex > 0) {
      const prevStep = tutorialSteps[currentIndex - 1]
      changeStep(prevStep)
    }
  }, [currentStep, changeStep])

  const skipTutorial = useCallback(() => {
    localStorage.removeItem("tutorialStep")
    localStorage.setItem("tutorialCompleted", "true")
    setCurrentStep(null)
    setPendingStep(null)
    setShowStepPopup(false)
    setShowPopup(false)
  }, [])

  const restartTutorial = useCallback(() => {
    localStorage.removeItem("tutorialCompleted")
    localStorage.setItem("tutorialStep", "1")
    const firstStep = tutorialSteps[0]
    setCurrentStep(firstStep)
    setPendingStep(null)
    setShowStepPopup(true)
    setShowPopup(false)
    router.push(firstStep.page)
  }, [router])

  const handlePopupChoice = useCallback(
    (choice: boolean) => {
      if (choice) {
        if (pendingStep) {
          router.push(pendingStep.page)
        }
      } else {
        skipTutorial()
      }
      setShowPopup(false)
    },
    [pendingStep, router, skipTutorial],
  )

  return (
    <TutorialContext.Provider
      value={{
        currentStep,
        nextStep,
        prevStep,
        skipTutorial,
        restartTutorial, // Add this new function to the context
        showPopup,
        handlePopupChoice,
      }}
    >
      {children}
      {isInitialized && !isTransitioning && (
        <>
          <PopupDialog open={showPopup} onOpenChange={setShowPopup} onChoice={handlePopupChoice} />
          <AnimatePresence mode="wait">
            {showStepPopup && currentStep && <TutorialOverlay key={currentStep.key} />}
          </AnimatePresence>
        </>
      )}
    </TutorialContext.Provider>
  )
}

export const useTutorial = () => {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider")
  }
  return context
}

const PopupDialog: React.FC<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onChoice: (choice: boolean) => void
}> = ({ open, onChoice }) => {
  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Card className="w-80 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Continue Tutorial?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Would you like to continue with the tutorial? This will navigate you to the next step.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button variant="outline" size="sm" onClick={() => onChoice(false)}>
            Skip Tutorial
          </Button>
          <Button variant="default" size="sm" onClick={() => onChoice(true)}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

