"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  setCurrentStep: (step: TutorialStep | null) => void;
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
  },
];

export { tutorialSteps };

const getInitialStep = (): TutorialStep | null => {
  if (typeof window !== 'undefined') {
    const savedStepKey = localStorage.getItem('tutorialStepKey');
    if (savedStepKey) {
      const step = tutorialSteps.find(step => step.key === savedStepKey);
      return step || null;
    }
  }
  return tutorialSteps[0];
};

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);

  useEffect(() => {
    // Only set the current step on the first load or if it's null
    if (currentStep === null) {
      setCurrentStep(getInitialStep());
    }
  }, []); // Run only on the first mount
  
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (tutorialCompleted === 'true') {
      setCurrentStep(null);
      return;
    }
  
    if (currentStep) {
      localStorage.setItem('tutorialStepKey', currentStep.key);
      
      // Redirect only if the target page is different and not the current page
      if (currentStep.page !== pathname) {
        router.push(currentStep.page);
      }
    }
  }, [currentStep]); // Removed pathname from dependencies
  

  const nextStep = () => {
    setCurrentStep((prevStep) => {
      if (prevStep) {
        const currentIndex = tutorialSteps.findIndex(step => step.key === prevStep.key);
        if (currentIndex < tutorialSteps.length - 1) {
          const nextStep = tutorialSteps[currentIndex + 1];
          localStorage.setItem('tutorialStepKey', nextStep.key);
          return nextStep;
        }
      }
      localStorage.removeItem('tutorialStepKey');
      localStorage.setItem('tutorialCompleted', 'true');
      return null;
    });
  };

  const prevStep = () => {
    setCurrentStep((prevStep) => {
      if (prevStep) {
        const currentIndex = tutorialSteps.findIndex(step => step.key === prevStep.key);
        if (currentIndex > 0) {
          const prevStep = tutorialSteps[currentIndex - 1];
          localStorage.setItem('tutorialStepKey', prevStep.key);
          return prevStep;
        }
      }
      return null;
    });
  };

  const skipTutorial = () => {
    setCurrentStep(null);
    localStorage.removeItem('tutorialStepKey');
    localStorage.setItem('tutorialCompleted', 'true');
  };

  return (
    <TutorialContext.Provider value={{ currentStep, setCurrentStep, nextStep, prevStep, skipTutorial }}>
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

