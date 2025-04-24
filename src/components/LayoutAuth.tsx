"use client";
import { ArrowRight, HelpCircle, Shield, FileText, Info, Code, Mail } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface LayoutProps {
  children: React.ReactNode;
}
export default function LayoutAuth({ children }: LayoutProps) {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="bg-background/80 backdrop-blur-sm p-4 shadow-sm border-b">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/welcome" className="text-2xl font-bold text-primary">
            RideShare
          </Link>
          {!isLoggedIn ? (
            <div>
              <Button variant="ghost" asChild className="mr-2">
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          ) : (
            <div>
              <Button variant="outline" asChild className="mr-2">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-grow flex flex-col lg:flex-row">{children}</main>
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
            <p className={`text-${isMediumScreen ? "sm" : "xs"} font-medium text-foreground/80`}>
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
                        {
                          href: "https://github.com/FelixRobb/ride-share-app",
                          label: "GitHub",
                          icon: Code,
                        },
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
                          {
                            href: "https://github.com/FelixRobb/ride-share-app",
                            label: "GitHub",
                            icon: Code,
                          },
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
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
