"use client"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"

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
  restartTutorial: () => void
  showPopup: boolean
  handlePopupChoice: (choice: boolean) => void
  isTargetReady: boolean
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

const tutorialSteps: TutorialStep[] = [
  {
    key: "welcome",
    page: "/dashboard",
    step: 1,
    title: "Welcome to RideShare!",
    content:
      "Welcome to RideShare, your new platform for sharing rides with trusted contacts. Let's explore the key features and get you started!",
  },
  {
    key: "dashboard-overview",
    page: "/dashboard",
    step: 2,
    title: "Your Dashboard",
    content:
      "This is your dashboard, the central hub of RideShare. Here you can see your active rides, available rides from contacts, and your ride history.",
    target: "[data-tutorial='dashboard']",
  },
  {
    key: "rides-tabs",
    page: "/dashboard",
    step: 3,
    title: "Ride Categories",
    content:
      "Use these tabs to switch between your active rides, available rides from your contacts, and your ride history. This helps you manage all your ride-related activities.",
    target: "[data-tutorial='dashboard-tabs']",
  },
  {
    key: "filters-and-search",
    page: "/dashboard",
    step: 4,
    title: "Filters and Search",
    content:
      "Use these tools to find specific rides. You can filter by status, date, or use the search bar to find rides by location or rider name.",
    target: "[data-tutorial='search-filter']",
  },
  {
    key: "create-ride",
    page: "/dashboard",
    step: 5,
    title: "Create a Ride",
    content:
      "Click this button to offer or request a new ride. You'll be able to set all the necessary details for your journey.",
    target: "[data-tutorial='create-ride']",
  },
  {
    key: "notifications",
    page: "/dashboard",
    step: 6,
    title: "Notifications",
    content:
      "Check your notifications here. You'll be alerted about new ride offers, requests, and any changes to your existing rides.",
    target: "[data-tutorial='notifications']",
  },
  {
    key: "profile-overview",
    page: "/profile",
    step: 7,
    title: "Profile Overview",
    content: "Welcome to your profile page! Here you can manage all your personal information, security settings, contacts, and app preferences.",
    target: "[data-tutorial='profile-header']"
  },
  {
    key: "personal-info",
    page: "/profile",
    step: 8,
    title: "Personal Information",
    content: "View and edit your personal details including name, email, and phone number. Click 'Edit Profile' to make changes.",
    target: "[data-tutorial='personal-info']"
  },
  {
    key: "activity-stats",
    page: "/profile",
    step: 9,
    title: "Activity Statistics",
    content: "Track your platform activity here. See how many rides you've offered and requested over time.",
    target: "[data-tutorial='activity-stats']"
  },
  {
    key: "associated-people",
    page: "/profile",
    step: 10,
    title: "Associated People",
    content: "Manage people associated with your account. Add family members or friends you frequently arrange rides for.",
    target: "[data-tutorial='associated-people']"
  },
  {
    key: "contact-management",
    page: "/profile",
    step: 11,
    title: "Contact Management",
    content: "View and manage your contacts in the Contacts tab. Add new contacts and manage existing ones to build your trusted network.",
    target: "[data-tutorial='contacts-tab']"
  },
  {
    key: "security-settings",
    page: "/profile",
    step: 12,
    title: "Security Settings",
    content: "Access the Security tab to change your password and manage notification preferences to keep your account secure.",
    target: "[data-tutorial='security-tab']"
  },
  {
    key: "app-settings",
    page: "/profile",
    step: 13,
    title: "App Settings",
    content: "Customize your app experience in the Settings tab. Choose your preferred theme and check your connection status.",
    target: "[data-tutorial='settings-tab']"
  },
  {
    key: "create-ride-page",
    page: "/create-ride",
    step: 14,
    title: "Creating a New Ride",
    content:
      "This is where you can create a new ride. Fill in all the necessary details like pickup and drop-off locations, date, time, and any special notes.",
    target: "[data-tutorial='ride-form']",
  },
  {
    key: "finish",
    page: "/dashboard",
    step: 15,
    title: "Congratulations!",
    content:
      "You've completed the RideShare tutorial! You're now ready to start sharing rides. Remember, you can always access help and FAQs from the menu if you need more information. Enjoy using RideShare!",
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
  const [isTargetReady, setIsTargetReady] = useState(false)
  const observerRef = useRef<MutationObserver | null>(null)

  const scrollToTarget = useCallback((target: string) => {
    const element = document.querySelector(target)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      })
    }
  }, [])

  const waitForTarget = useCallback((target: string, maxWaitTime = 5000) => {
    setIsTargetReady(false)
    return new Promise<void>((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(target)
        if (element) {
          setIsTargetReady(true)
          resolve()
        }
      }

      // Check immediately
      checkElement()

      // Set up MutationObserver
      const observer = new MutationObserver(checkElement)
      observerRef.current = observer
      observer.observe(document.body, { childList: true, subtree: true })

      // Set a timeout to resolve anyway after maxWaitTime
      const timeoutId = setTimeout(() => {
        observer.disconnect()
        setIsTargetReady(true)
        resolve()
      }, maxWaitTime)

      // Clean up function
      const cleanup = () => {
        observer.disconnect()
        clearTimeout(timeoutId)
      }

      // Return cleanup function
      return cleanup
    })
  }, [])

  const handleStep = useCallback(
    async (step: TutorialStep) => {
      if (step.target) {
        await waitForTarget(step.target)
        scrollToTarget(step.target)
      }
      setCurrentStep(step)
      setShowStepPopup(true)
    },
    [scrollToTarget, waitForTarget],
  )

  // Initialize tutorial on mount
  useEffect(() => {
    const initializeTutorial = async () => {
      const tutorialCompleted = localStorage.getItem("tutorialCompleted") === "true"
      const savedStepNumber = Number.parseInt(localStorage.getItem("tutorialStep") || "1", 10)
      const step = tutorialSteps.find((s) => s.step === savedStepNumber) || tutorialSteps[0]

      if (tutorialCompleted) {
        setCurrentStep(null)
        setPendingStep(null)
      } else if (step.page === pathname) {
        await handleStep(step)
        setPendingStep(null)
      } else {
        setPendingStep(step)
        setShowPopup(true)
      }

      setIsInitialized(true)
    }

    initializeTutorial()
  }, [pathname, handleStep])

  useEffect(() => {
    if (isInitialized && pendingStep) {
      if (pathname === pendingStep.page) {
        // Longer delay and more controlled state transition
        const timeoutId = setTimeout(async () => {
          await handleStep(pendingStep)
          setPendingStep(null)
          setShowPopup(false)
          setIsTransitioning(false)
        }, 300) // Increased delay for smoother transition

        return () => clearTimeout(timeoutId)
      } else if (!isTransitioning) {
        setShowPopup(true)
        setShowStepPopup(false)
      }
    }
  }, [pathname, pendingStep, isInitialized, isTransitioning, handleStep])

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
        await handleStep(step)
      }
    },
    [pathname, router, handleStep],
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
    setCurrentStep(null)
    setPendingStep(null)
    setShowStepPopup(false)
    setShowPopup(false)
    router.push(firstStep.page)
    handleStep(firstStep)
  }, [router, handleStep])

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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return (
    <TutorialContext.Provider
      value={{
        currentStep,
        nextStep,
        prevStep,
        skipTutorial,
        restartTutorial,
        showPopup,
        handlePopupChoice,
        isTargetReady,
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

