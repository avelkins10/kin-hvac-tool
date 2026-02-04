"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";
import { PresentationNav } from "./PresentationNav";
import { SlideTransition } from "./animations/SlideTransition";
import { WelcomeSlide } from "./slides/WelcomeSlide";
import { CurrentSituationSlide } from "./slides/CurrentSituationSlide";
import { RecommendedSystemSlide } from "./slides/RecommendedSystemSlide";
import { EnhancementsSlide } from "./slides/EnhancementsSlide";
import { ProtectionPlanSlide } from "./slides/ProtectionPlanSlide";
import { InvestmentSlide } from "./slides/InvestmentSlide";
import { PaymentOptionsSlide } from "./slides/PaymentOptionsSlide";
import { NextStepsSlide } from "./slides/NextStepsSlide";
import {
  useProposalState,
  usePresentationSlide,
  type PresentationSlide,
} from "../proposal-builder/hooks/useProposalState";

const SLIDE_ORDER: PresentationSlide[] = [
  "welcome",
  "current-situation",
  "recommended-system",
  "enhancements",
  "protection-plan",
  "investment",
  "payment-options",
  "next-steps",
];

const SLIDE_TITLES: Record<PresentationSlide, string> = {
  welcome: "Welcome",
  "current-situation": "Current Situation",
  "recommended-system": "Your New System",
  enhancements: "Enhancements",
  "protection-plan": "Protection Plan",
  investment: "Your Investment",
  "payment-options": "Payment Options",
  "next-steps": "Next Steps",
};

export function PresentationMode() {
  const currentSlide = usePresentationSlide();
  const { toggleMode, nextSlide, prevSlide, setPresentationSlide } =
    useProposalState();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const currentIndex = SLIDE_ORDER.indexOf(currentSlide);
  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === SLIDE_ORDER.length - 1;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          if (!isLastSlide) {
            setDirection("forward");
            nextSlide();
          }
          break;
        case "ArrowLeft":
          if (!isFirstSlide) {
            setDirection("backward");
            prevSlide();
          }
          break;
        case "Escape":
          toggleMode();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFirstSlide, isLastSlide, nextSlide, prevSlide, toggleMode]);

  // Handle slide navigation
  const handleNext = useCallback(() => {
    if (!isLastSlide) {
      setDirection("forward");
      nextSlide();
    }
  }, [isLastSlide, nextSlide]);

  const handlePrev = useCallback(() => {
    if (!isFirstSlide) {
      setDirection("backward");
      prevSlide();
    }
  }, [isFirstSlide, prevSlide]);

  const handleSlideSelect = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? "forward" : "backward");
      setPresentationSlide(SLIDE_ORDER[index]);
    },
    [currentIndex, setPresentationSlide]
  );

  // Render the current slide
  const renderSlide = useCallback(() => {
    switch (currentSlide) {
      case "welcome":
        return <WelcomeSlide />;
      case "current-situation":
        return <CurrentSituationSlide />;
      case "recommended-system":
        return <RecommendedSystemSlide />;
      case "enhancements":
        return <EnhancementsSlide />;
      case "protection-plan":
        return <ProtectionPlanSlide />;
      case "investment":
        return <InvestmentSlide />;
      case "payment-options":
        return <PaymentOptionsSlide />;
      case "next-steps":
        return <NextStepsSlide />;
      default:
        return <WelcomeSlide />;
    }
  }, [currentSlide]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col",
        isDarkMode ? "presentation-dark bg-[oklch(0.12_0.01_250)]" : "bg-background"
      )}
    >
      {/* Top navigation bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        {/* Close button */}
        <button
          onClick={toggleMode}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            "hover:bg-muted active:scale-95",
            isDarkMode
              ? "text-gray-300 hover:text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <X className="w-4 h-4" />
          <span>Exit Presentation</span>
        </button>

        {/* Progress navigation */}
        <PresentationNav
          slides={SLIDE_ORDER.map((s) => SLIDE_TITLES[s])}
          currentSlide={currentIndex}
          onSlideSelect={handleSlideSelect}
          isDarkMode={isDarkMode}
        />

        {/* Theme toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            "hover:bg-muted active:scale-95",
            isDarkMode
              ? "text-gray-300 hover:text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main slide content */}
      <main className="flex-1 relative overflow-hidden">
        <SlideTransition
          slideKey={currentSlide}
          direction={direction}
          isDarkMode={isDarkMode}
        >
          <div
            className={cn(
              "h-full overflow-y-auto",
              isDarkMode ? "text-white" : "text-foreground"
            )}
          >
            {renderSlide()}
          </div>
        </SlideTransition>
      </main>

      {/* Bottom navigation */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-border/50">
        {/* Previous button */}
        <button
          onClick={handlePrev}
          disabled={isFirstSlide}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            isDarkMode
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-muted text-foreground hover:bg-muted/80",
            !isFirstSlide && "active:scale-95"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        {/* Slide counter */}
        <div
          className={cn(
            "text-sm font-medium",
            isDarkMode ? "text-gray-400" : "text-muted-foreground"
          )}
        >
          {currentIndex + 1} of {SLIDE_ORDER.length}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={isLastSlide}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            isLastSlide
              ? isDarkMode
                ? "bg-white/10 text-white"
                : "bg-muted text-foreground"
              : "bg-gradient-accent text-white gradient-shimmer",
            !isLastSlide && "active:scale-95"
          )}
        >
          <span>{isLastSlide ? "Finish" : "Next"}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </footer>

      {/* Keyboard hints */}
      <div
        className={cn(
          "absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs",
          isDarkMode ? "text-gray-500" : "text-muted-foreground"
        )}
      >
        <span>
          <kbd className="px-2 py-1 bg-muted/50 rounded">←</kbd> Previous
        </span>
        <span>
          <kbd className="px-2 py-1 bg-muted/50 rounded">→</kbd> Next
        </span>
        <span>
          <kbd className="px-2 py-1 bg-muted/50 rounded">Esc</kbd> Exit
        </span>
      </div>
    </div>
  );
}

export default PresentationMode;
