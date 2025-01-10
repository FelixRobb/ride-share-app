import React, { createContext, useContext, useState, useEffect } from 'react';

type TutorialStep = {
  page: string;
  step: number;
  title: string;
  content: string;
  target?: string;
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
    page: '/dashboard',
    step: 1,
    title: "Welcome to RideShare!",
    content: "Let's start by adding a contact. This is crucial for sharing rides with people you know and trust.",
    target: "[data-tutorial='contacts-button']"
  },
  {
    page: '/dashboard',
    step: 2,
    title: "Adding a Contact",
    content: "Click on 'Manage Contacts' to add your first contact. You'll need their phone number to send a request.",
    target: "[data-tutorial='contacts-button']"
  },
  {
    page: '/profile',
    step: 3,
    title: "Your Profile",
    content: "This is your profile page. Here you can manage your personal information, contacts, and account settings.",
    target: "[data-tutorial='profile-info']"
  },
  {
    page: '/profile',
    step: 4,
    title: "Managing Contacts",
    content: "In the Contacts section, you can add new contacts, accept requests, and manage your existing contacts.",
    target: "[data-tutorial='contacts-section']"
  },
  {
    page: '/dashboard',
    step: 5,
    title: "Creating Your First Ride",
    content: "Great! Now that you have a contact, let's create your first ride. Click on 'Create Ride' to get started.",
    target: "[data-tutorial='create-ride']"
  },
  {
    page: '/create-ride',
    step: 6,
    title: "Ride Details",
    content: "Fill in the details for your ride. You can specify the start and end locations, date, time, and any additional notes.",
    target: "[data-tutorial='ride-form']"
  },
  {
    page: '/dashboard',
    step: 7,
    title: "Your Dashboard",
    content: "This is your dashboard. Here you can see your active, available, and past rides.",
    target: "[data-tutorial='dashboard-tabs']"
  },
  {
    page: '/dashboard',
    step: 8,
    title: "Ride Tabs",
    content: "Use these tabs to switch between your active rides, available rides from your contacts, and your ride history.",
    target: "[data-tutorial='dashboard-tabs']"
  },
  {
    page: '/dashboard',
    step: 9,
    title: "Congratulations!",
    content: "You've completed the tutorial. You're now ready to start sharing rides with your contacts. Enjoy using RideShare!",
  },
];

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (tutorialCompleted !== 'true') {
      setCurrentStep(tutorialSteps[0]);
    }
  }, []);

  const nextStep = () => {
    setCurrentStep((prevStep) => {
      if (prevStep) {
        const nextIndex = tutorialSteps.findIndex(step => step.step === prevStep.step) + 1;
        if (nextIndex < tutorialSteps.length) {
          return tutorialSteps[nextIndex];
        }
      }
      return null;
    });
  };

  const prevStep = () => {
    setCurrentStep((prevStep) => {
      if (prevStep) {
        const prevIndex = tutorialSteps.findIndex(step => step.step === prevStep.step) - 1;
        if (prevIndex >= 0) {
          return tutorialSteps[prevIndex];
        }
      }
      return null;
    });
  };

  const skipTutorial = () => {
    setCurrentStep(null);
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

