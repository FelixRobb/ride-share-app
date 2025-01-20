"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type TutorialStep = {
  key: string;
  page: string;
  step: number;
  title: string;
  content: string;
  target?: string | null;
};

type TutorialContextType = {
  currentStep: TutorialStep | null;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const tutorialSteps: TutorialStep[] = [
  {
    key: 'welcome',
    page: '/dashboard',
    step: 1,
    title: "Welcome to RideShare!",
    content: "This is your dashboard. Here you can see your rides and manage your account. Let's explore the key features.",
    target: "[data-tutorial='dashboard']"
  },
  {
    key: 'create-ride',
    page: '/dashboard',
    step: 2,
    title: "Create a Ride",
    content: "Click here to create a new ride. You can offer or request rides with your contacts.",
    target: "[data-tutorial='create-ride']"
  },
  {
    key: 'ride-tabs',
    page: '/dashboard',
    step: 3,
    title: "Ride Tabs",
    content: "Use these tabs to switch between your active rides, available rides from your contacts, and your ride history.",
    target: "[data-tutorial='dashboard-tabs']"
  },
  {
    key: 'profile',
    page: '/profile',
    step: 4,
    title: "Your Profile",
    content: "This is your profile page. Here you can manage your personal information, contacts, and account settings.",
    target: "[data-tutorial='profile-info']"
  },
  {
    key: 'contacts',
    page: '/profile',
    step: 5,
    title: "Managing Contacts",
    content: "In the Contacts section, you can add new contacts, accept requests, and manage your existing contacts.",
    target: "[data-tutorial='contacts-section']"
  },
  {
    key: 'notifications',
    page: '/profile',
    step: 6,
    title: "Notification Settings",
    content: "Adjust your notification preferences here to stay updated on your rides and contact requests.",
    target: "[data-tutorial='notification-settings']"
  },
  {
    key: 'create-ride-form',
    page: '/create-ride',
    step: 7,
    title: "Creating a Ride",
    content: "Fill in the details for your ride. Specify the start and end locations, date, time, and any additional notes.",
    target: "[data-tutorial='ride-form']"
  },
  {
    key: 'finish',
    page: '/dashboard',
    step: 8,
    title: "Congratulations!",
    content: "You've completed the tutorial. You're now ready to start sharing rides with your contacts. Enjoy using RideShare!"
  }
];

export { tutorialSteps };

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [pendingStep, setPendingStep] = useState<TutorialStep | null>(null);

  // Initialize tutorial on mount
  useEffect(() => {
    const initializeTutorial = () => {
      if (localStorage.getItem('tutorialCompleted') === 'true') {
        setCurrentStep(null);
        setPendingStep(null);
        return;
      }

      const savedStepNumber = parseInt(localStorage.getItem('tutorialStep') || '1', 10);
      const step = tutorialSteps.find(s => s.step === savedStepNumber) || tutorialSteps[0];
      
      if (step.page === pathname) {
        setCurrentStep(step);
        setPendingStep(null);
      } else {
        setPendingStep(step);
        router.push(step.page);
      }
    };

    initializeTutorial();
  }, [pathname]);

  // Handle page changes
  useEffect(() => {
    if (pendingStep && pathname === pendingStep.page) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }
  }, [pathname, pendingStep]);

  const changeStep = useCallback(async (step: TutorialStep | null) => {
    if (!step) {
      localStorage.removeItem('tutorialStep');
      localStorage.setItem('tutorialCompleted', 'true');
      setCurrentStep(null);
      setPendingStep(null);
      return;
    }

    // Store the new step number before navigation
    localStorage.setItem('tutorialStep', step.step.toString());
    
    if (step.page === pathname) {
      setCurrentStep(step);
      setPendingStep(null);
    } else {
      setPendingStep(step);
      router.push(step.page);
    }
  }, [pathname, router]);

  const nextStep = useCallback(() => {
    if (!currentStep) return;

    const currentIndex = tutorialSteps.findIndex(step => step.step === currentStep.step);
    
    // Handle the last step specifically
    if (currentIndex === tutorialSteps.length - 1) {
      localStorage.removeItem('tutorialStep');
      localStorage.setItem('tutorialCompleted', 'true');
      setCurrentStep(null);
      setPendingStep(null);
      return;
    }

    const nextStep = tutorialSteps[currentIndex + 1];
    changeStep(nextStep);
  }, [currentStep, changeStep]);

  const prevStep = useCallback(() => {
    if (!currentStep) return;

    const currentIndex = tutorialSteps.findIndex(step => step.step === currentStep.step);
    if (currentIndex > 0) {
      const prevStep = tutorialSteps[currentIndex - 1];
      changeStep(prevStep);
    }
  }, [currentStep, changeStep]);

  const skipTutorial = useCallback(() => {
    localStorage.removeItem('tutorialStep');
    localStorage.setItem('tutorialCompleted', 'true');
    setCurrentStep(null);
    setPendingStep(null);
  }, []);


  return (
    <TutorialContext.Provider value={{
      currentStep,
      nextStep,
      prevStep,
      skipTutorial
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};