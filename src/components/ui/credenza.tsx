"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface BaseProps {
  children: React.ReactNode
}

interface RootCredenzaProps extends BaseProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  breakpoint?: string
  dialogClassName?: string
  drawerClassName?: string
}

interface CredenzaProps extends BaseProps {
  className?: string
  dialogClassName?: string
  drawerClassName?: string
  asChild?: true
}

const CredenzaContext = React.createContext<{ 
  isDesktop: boolean;
  dialogClassName?: string;
  drawerClassName?: string;
}>({
  isDesktop: false,
  dialogClassName: undefined,
  drawerClassName: undefined,
});

const useCredenzaContext = () => {
  const context = React.useContext(CredenzaContext);
  if (!context) {
    throw new Error(
      "Credenza components cannot be rendered outside the Credenza Context",
    );
  }
  return context;
};

const Credenza = ({ 
  children, 
  breakpoint = "(min-width: 768px)", 
  dialogClassName,
  drawerClassName,
  open,
  onOpenChange,
  ...props 
}: RootCredenzaProps) => {
  const isDesktop = useMediaQuery(breakpoint);
  // Force re-mount of component when isDesktop changes
  const [prevIsDesktop, setPrevIsDesktop] = React.useState(isDesktop);
  
  // Managed state to handle the transition between modes
  const [isOpen, setIsOpen] = React.useState(open || false);
  
  // Handle external open state changes
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);
  
  // Reset component when mode changes
  React.useEffect(() => {
    if (prevIsDesktop !== isDesktop) {
      // If it was open, briefly close and reopen to force recalculation
      if (isOpen) {
        const timer = setTimeout(() => {
          // Call the external handler if provided
          if (onOpenChange) {
            onOpenChange(true);
          }
          setIsOpen(true);
        }, 50);
        
        // Close it first
        if (onOpenChange) {
          onOpenChange(false);
        }
        setIsOpen(false);
        
        return () => clearTimeout(timer);
      }
      
      setPrevIsDesktop(isDesktop);
    }
  }, [isDesktop, prevIsDesktop, isOpen, onOpenChange]);
  
  // Handle internal state changes
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  
  const CredenzaComponent = isDesktop ? Dialog : Drawer;
  
  // Don't pass className to Dialog component
  const componentProps = isDesktop 
    ? { ...props, open: isOpen, onOpenChange: handleOpenChange } 
    : { ...props, className: drawerClassName, autoFocus: true, open: isOpen, onOpenChange: handleOpenChange };

  return (
    <CredenzaContext.Provider value={{ isDesktop, dialogClassName, drawerClassName }}>
      <CredenzaComponent {...componentProps}>
        {children}
      </CredenzaComponent>
    </CredenzaContext.Provider>
  );
};

const CredenzaContent = ({ className, dialogClassName, drawerClassName, children, ...props }: CredenzaProps) => {
  const { isDesktop } = useCredenzaContext();
  const CredenzaContent = isDesktop ? DialogContent : DrawerContent;
  const componentClassName = isDesktop ? dialogClassName : drawerClassName;
  
  // Use a ref to handle content resizing
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Force layout recalculation when component type changes
  React.useEffect(() => {
    if (contentRef.current) {
      // This forces a reflow/recalculation
      void contentRef.current.offsetHeight;
    }
  }, [isDesktop]);

  return (
    <CredenzaContent 
      ref={contentRef}
      className={cn(className, componentClassName)} 
      {...props}
    >
      {children}
    </CredenzaContent>
  );
};

// Rest of the components remain the same
const CredenzaTrigger = ({ className, dialogClassName, drawerClassName, children, ...props }: CredenzaProps) => {
  const { isDesktop } = useCredenzaContext();
  const CredenzaTrigger = isDesktop ? DialogTrigger : DrawerTrigger;
  const componentClassName = isDesktop ? dialogClassName : drawerClassName;

  return (
    <CredenzaTrigger className={cn(className, componentClassName)} {...props}>
      {children}
    </CredenzaTrigger>
  );
};

const CredenzaClose = ({ className, dialogClassName, drawerClassName, children, ...props }: CredenzaProps) => {
  const { isDesktop } = useCredenzaContext();
  const CredenzaClose = isDesktop ? DialogClose : DrawerClose;
  const componentClassName = isDesktop ? dialogClassName : drawerClassName;

  return (
    <CredenzaClose className={cn(className, componentClassName)} {...props}>
      {children}
    </CredenzaClose>
  );
};

const CredenzaDescription = ({
  className,
  dialogClassName,
  drawerClassName,
  children,
  ...props
}: CredenzaProps) => {
  const { isDesktop } = useCredenzaContext();
  const CredenzaDescription = isDesktop ? DialogDescription : DrawerDescription;
  const componentClassName = isDesktop ? dialogClassName : drawerClassName;

  return (
    <CredenzaDescription className={cn(className, componentClassName)} {...props}>
      {children}
    </CredenzaDescription>
  );
};

const CredenzaHeader = ({ className, dialogClassName, drawerClassName, children, ...props }: CredenzaProps) => {
  const { isDesktop } = useCredenzaContext();
  const CredenzaHeader = isDesktop ? DialogHeader : DrawerHeader;
  const componentClassName = isDesktop ? dialogClassName : drawerClassName;

  return (
    <CredenzaHeader className={cn(className, componentClassName)} {...props}>
      {children}
    </CredenzaHeader>
  );
};

const CredenzaTitle = ({ className, dialogClassName, drawerClassName, children, ...props }: CredenzaProps) => {
  const { isDesktop } = useCredenzaContext();
  const CredenzaTitle = isDesktop ? DialogTitle : DrawerTitle;
  const componentClassName = isDesktop ? dialogClassName : drawerClassName;

  return (
    <CredenzaTitle className={cn(className, componentClassName)} {...props}>
      {children}
    </CredenzaTitle>
  );
};

const CredenzaBody = ({ className, dialogClassName, drawerClassName, children, ...props }: CredenzaProps) => {
  const { isDesktop } = useCredenzaContext();
  const componentClassName = isDesktop ? dialogClassName : drawerClassName;

  return (
    <div className={cn("px-4 md:px-0", className, componentClassName)} {...props}>
      {children}
    </div>
  );
};

const CredenzaFooter = ({ className, dialogClassName, drawerClassName, children, ...props }: CredenzaProps) => {
  const { isDesktop } = useCredenzaContext();
  const CredenzaFooter = isDesktop ? DialogFooter : DrawerFooter;
  const componentClassName = isDesktop ? dialogClassName : drawerClassName;

  return (
    <CredenzaFooter className={cn(className, componentClassName)} {...props}>
      {children}
    </CredenzaFooter>
  );
};

export {
  Credenza,
  CredenzaTrigger,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
}