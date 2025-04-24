"use client";

import {
  Home,
  Car,
  Users,
  HelpCircle,
  Shield,
  FileText,
  Info,
  Star,
  Code,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import type React from "react";
import { toast } from "sonner";

import { NotificationPanel } from "@/components/NotificationPanel";
import { Button } from "@/components/ui/button";
import { useTutorial, TutorialProvider } from "@/contexts/TutorialContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

import type { User } from "../types";

import PushNotificationHandler from "./PushNotificationHandler";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUser = session?.user as User | null;
  const isOnline = useOnlineStatus();
  const [wasPreviouslyOffline, setWasPreviouslyOffline] = useState(false);
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasPreviouslyOffline(true);
      toast.error("You're offline. Please check your internet connection.");
    } else if (isOnline && wasPreviouslyOffline) {
      setWasPreviouslyOffline(false);
      toast.success("You're back online. Your connection has been restored.");
    }
  }, [isOnline, wasPreviouslyOffline]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const TutorialButton = () => {
    const { restartTutorial } = useTutorial();
    return (
      <Button
        variant="default"
        size={isLargeScreen ? "default" : "sm"}
        className="rounded-full w-full"
        onClick={() => {
          restartTutorial();
          setOpen(false);
        }}
      >
        <HelpCircle className="mr-2 h-4 w-4" />
        Restart Tutorial
      </Button>
    );
  };

  return (
    <>
      {currentUser && (
        <div className="flex flex-col min-h-screen bg-background text-foreground relative">
          <TutorialProvider>
            <PushNotificationHandler userId={currentUser.id} />
            <header className="bg-background/80 backdrop-blur-sm shadow-md border-b border-border sticky top-0 z-50">
              <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex-shrink-0 mr-4">
                  <Link href="/welcome" className="text-2xl font-bold text-primary">
                    RideShare
                  </Link>
                </div>

                {/* Desktop Navigation with Notification Button */}
                {isMediumScreen ? (
                  <nav className={`flex items-center space-x-2 rounded-full p-1 border`}>
                    {[
                      { icon: Home, label: "Dashboard", href: "/dashboard" },
                      { icon: Car, label: "Create Ride", href: "/create-ride" },
                      { icon: Users, label: "Profile", href: "/profile" },
                    ].map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        asChild
                        className={`rounded-full px-4 py-2 transition-colors duration-200 ${pathname === item.href ? "bg-accent" : ""}`}
                      >
                        <Link
                          href={item.href}
                          className={pathname === item.href ? "text-primary" : ""}
                        >
                          <item.icon className="mr-2 h-4 w-4" /> {item.label}
                        </Link>
                      </Button>
                    ))}
                    <div className="h-6 w-px bg-border mx-2" />
                    <NotificationPanel userId={currentUser.id} />
                  </nav>
                ) : (
                  <div>
                    <NotificationPanel userId={currentUser.id} />
                  </div>
                )}
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 py-8 pb-7 md:pb-8">{children}</main>

            {/* Mobile Navigation Bar */}
            <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50`}>
              <div className="flex justify-around items-center h-16">
                {[
                  { icon: Home, label: "Dashboard", href: "/dashboard" },
                  { icon: Car, label: "Create Ride", href: "/create-ride" },
                  { icon: Users, label: "Profile", href: "/profile" },
                ].map((item) => (
                  <div key={item.label} className="flex-1">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center p-2",
                        pathname === item.href
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-xs mt-1">{item.label}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </nav>
            <footer
              className={`
        bg-gradient-to-r from-primary/5 to-secondary/5 
        rounded-lg mx-${isLargeScreen ? "6" : "4"} 
        mb-20 md:mb-6 py-6 px-4 
        shadow-md border border-border/50
      `}
            >
              <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p
                    className={`text-${isMediumScreen ? "sm" : "xs"} font-medium text-foreground/80`}
                  >
                    <a href="/admin">&copy;</a> {new Date().getFullYear()} RideShare by Félix Robb.
                    <span className="text-muted-foreground ml-1">All rights reserved.</span>
                  </p>

                  <div className="mt-4 md:mt-0">
                    {!isMediumScreen ? (
                      // Mobile Drawer with controlled open state
                      <Drawer open={open} onOpenChange={setOpen}>
                        <DrawerTrigger className="h-9 px-4 py-2 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex rounded-full border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
                          <span>More Links</span>
                          <HelpCircle className="h-4 w-4" />
                        </DrawerTrigger>
                        <DrawerContent className="px-4 pb-8 pt-2 bg-gradient-to-b from-background to-primary/5">
                          <DrawerHeader className="pb-2">
                            <DrawerTitle className="text-center text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                              Explore RideShare
                            </DrawerTitle>
                          </DrawerHeader>
                          <div className="grid grid-cols-2 gap-3 p-2">
                            {[
                              { href: "/privacy-policy", label: "Privacy Policy", icon: Shield },
                              {
                                href: "/terms-of-service",
                                label: "Terms of Service",
                                icon: FileText,
                              },
                              { href: "/about", label: "Learn more", icon: Info },
                              { href: "/faq", label: "FAQ", icon: HelpCircle },
                              { href: "/reviews", label: "Leave a review", icon: Star },
                              {
                                href: "https://github.com/FelixRobb/ride-share-app",
                                label: "GitHub",
                                icon: Code,
                              },
                              { href: "/bug-report", label: "Bug Reports", icon: HelpCircle },
                              {
                                href: "mailto:rideshareapp.mail@gmail.com",
                                label: "Contact Us",
                                icon: Mail,
                              },
                            ].map(({ href, label, icon: Icon }) => (
                              <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-2 p-3 rounded-xl bg-card hover:bg-primary/10 shadow-sm border border-border/50 transition-all duration-300 text-sm font-medium text-foreground hover:text-primary hover:shadow-md"
                              >
                                <Icon className="h-4 w-4 text-primary" />
                                <span>{label}</span>
                              </Link>
                            ))}
                          </div>
                          <div className="flex justify-center mt-6">
                            <TutorialButton />
                          </div>
                        </DrawerContent>
                      </Drawer>
                    ) : (
                      // Desktop Popover with controlled open state
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger className="h-9 px-4 py-2 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex rounded-full border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
                          <span>More Links</span>
                          <HelpCircle
                            className={`h-${isLargeScreen ? "5" : "4"} w-${isLargeScreen ? "5" : "4"}`}
                          />
                        </PopoverTrigger>
                        <PopoverContent
                          className={`w-${isLargeScreen ? "96" : "80"} p-0 bg-card/95 backdrop-blur-md border border-border/50 shadow-lg rounded-xl mr-3`}
                        >
                          <div className="p-2">
                            <div className="py-3 px-4 border-b border-border/20">
                              <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                Explore RideShare
                              </h3>
                            </div>
                            <div
                              className={`grid ${isLargeScreen ? "grid-cols-3" : "grid-cols-2"} gap-2 p-3`}
                            >
                              {[
                                { href: "/privacy-policy", label: "Privacy Policy", icon: Shield },
                                {
                                  href: "/terms-of-service",
                                  label: "Terms of Service",
                                  icon: FileText,
                                },
                                { href: "/about", label: "Learn more", icon: Info },
                                { href: "/faq", label: "FAQ", icon: HelpCircle },
                                { href: "/reviews", label: "Leave a review", icon: Star },
                                {
                                  href: "https://github.com/FelixRobb/ride-share-app",
                                  label: "GitHub",
                                  icon: Code,
                                },
                                { href: "/bug-report", label: "Bug Reports", icon: HelpCircle },
                                {
                                  href: "mailto:rideshareapp.mail@gmail.com",
                                  label: "Contact Us",
                                  icon: Mail,
                                },
                              ].map(({ href, label, icon: Icon }) => (
                                <Link
                                  key={href}
                                  href={href}
                                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors duration-200 text-sm font-medium text-foreground/80 hover:text-primary"
                                >
                                  <Icon className="h-4 w-4 text-primary/70" />
                                  <span>{label}</span>
                                </Link>
                              ))}
                            </div>
                            <div className="flex justify-center p-3 mt-1 border-t border-border/20">
                              <TutorialButton />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            </footer>
          </TutorialProvider>
        </div>
      )}
    </>
  );
}
