"use client";

import { ComputerIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AnimationStart, AnimationVariant, createAnimation } from "@/hooks/theme-animations";
import { cn } from "@/lib/utils";

interface ThemeToggleAnimationProps {
  variant?: AnimationVariant;
  start?: AnimationStart;
  showLabel?: boolean;
  url?: string;
}

export default function ThemeToggleButton({
  variant = "circle-blur",
  start = "top-left",
  showLabel = false,
  url = "",
}: ThemeToggleAnimationProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the themed content
  useEffect(() => {
    setMounted(true);
  }, []);

  const styleId = "theme-transition-styles";

  const updateStyles = useCallback((css: string) => {
    if (typeof window === "undefined") return;

    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;
  }, []);

  const toggleTheme = useCallback(() => {
    const animation = createAnimation(variant, start, url);
    updateStyles(animation.css);

    if (typeof window === "undefined") return;

    const switchTheme = () => {
      // Cycle through: light -> dark -> system
      if (theme === "light") {
        setTheme("dark");
      } else if (theme === "dark") {
        setTheme("system");
      } else {
        setTheme("light");
      }
    };

    if (!document.startViewTransition) {
      switchTheme();
      return;
    }

    document.startViewTransition(switchTheme);
  }, [variant, start, url, updateStyles, setTheme, theme]);

  // Get the icon based on the current theme
  const getIcon = () => {
    if (!mounted) return null;

    if (theme === "system") {
      return <ComputerIcon className="size-[1.2rem]" />;
    } else if (theme === "light") {
      return <SunIcon className="size-[1.2rem]" />;
    } else {
      return <MoonIcon className="size-[1.2rem]" />;
    }
  };

  // Get the label for hover tooltip
  const getThemeLabel = () => {
    if (theme === "system") return "System";
    if (theme === "light") return "Light";
    return "Dark";
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      className={cn(
        "w-10 h-10 rounded-full relative group transition-all duration-300",
        "hover:scale-110 hover:shadow-md",
        "border border-primary/20 bg-background/80 backdrop-blur-sm"
      )}
      aria-label="Theme Toggle Button"
    >
      <div className="relative flex items-center justify-center transition-all duration-300">
        {getIcon()}
      </div>
      <span className="sr-only">Toggle {getThemeLabel()} Theme</span>

      {/* Hover tooltip */}
      <span className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-transform duration-200 py-1 px-2 rounded-md text-xs bg-background border shadow-sm">
        {getThemeLabel()}
      </span>

      {showLabel && (
        <>
          <span className="hidden group-hover:block border rounded-full px-2 absolute -top-10">
            variant = {variant}
          </span>
          <span className="hidden group-hover:block border rounded-full px-2 absolute -bottom-10">
            start = {start}
          </span>
        </>
      )}
    </Button>
  );
}
