"use client";

import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SlideTransitionProps {
  children: ReactNode;
  slideKey: string;
  direction: "forward" | "backward";
  isDarkMode?: boolean;
}

export function SlideTransition({
  children,
  slideKey,
  direction,
  isDarkMode = false,
}: SlideTransitionProps) {
  const [displayedKey, setDisplayedKey] = useState(slideKey);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (slideKey !== displayedKey) {
      // Start exit animation
      setIsAnimating(true);
      setAnimationClass(
        direction === "forward" ? "slide-exit-left" : "slide-exit-right"
      );

      // After exit animation, switch content and start enter animation
      const exitTimer = setTimeout(() => {
        setDisplayedKey(slideKey);
        setAnimationClass(
          direction === "forward" ? "slide-enter-right" : "slide-enter-left"
        );

        // After enter animation, cleanup
        const enterTimer = setTimeout(() => {
          setIsAnimating(false);
          setAnimationClass("");
        }, 500);

        return () => clearTimeout(enterTimer);
      }, 300);

      return () => clearTimeout(exitTimer);
    }
  }, [slideKey, displayedKey, direction]);

  return (
    <div
      className={cn(
        "h-full w-full",
        animationClass,
        isAnimating && "overflow-hidden"
      )}
    >
      {children}

      <style jsx global>{`
        @keyframes slideExitLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-60px);
          }
        }

        @keyframes slideExitRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(60px);
          }
        }

        @keyframes slideEnterRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideEnterLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .slide-exit-left {
          animation: slideExitLeft 0.3s ease-out forwards;
        }

        .slide-exit-right {
          animation: slideExitRight 0.3s ease-out forwards;
        }

        .slide-enter-right {
          animation: slideEnterRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)
            forwards;
        }

        .slide-enter-left {
          animation: slideEnterLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)
            forwards;
        }
      `}</style>
    </div>
  );
}

export default SlideTransition;
