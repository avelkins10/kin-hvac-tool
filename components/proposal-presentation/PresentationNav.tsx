"use client";

import { cn } from "@/lib/utils";

interface PresentationNavProps {
  slides: string[];
  currentSlide: number;
  onSlideSelect: (index: number) => void;
  isDarkMode?: boolean;
}

export function PresentationNav({
  slides,
  currentSlide,
  onSlideSelect,
  isDarkMode = false,
}: PresentationNavProps) {
  return (
    <nav className="flex items-center gap-2">
      {/* Progress dots for mobile */}
      <div className="flex items-center gap-1.5 sm:hidden">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => onSlideSelect(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentSlide
                ? "w-6 bg-primary"
                : index < currentSlide
                ? isDarkMode
                  ? "bg-white/40"
                  : "bg-primary/40"
                : isDarkMode
                ? "bg-white/20"
                : "bg-muted"
            )}
            aria-label={`Go to slide ${index + 1}: ${slides[index]}`}
          />
        ))}
      </div>

      {/* Progress bar with labels for desktop */}
      <div className="hidden sm:flex items-center gap-1">
        {slides.map((title, index) => (
          <div key={index} className="flex items-center">
            {/* Step button */}
            <button
              onClick={() => onSlideSelect(index)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                "hover:bg-muted/50 active:scale-95",
                index === currentSlide
                  ? isDarkMode
                    ? "bg-white/10 text-white"
                    : "bg-primary/10 text-primary"
                  : index < currentSlide
                  ? isDarkMode
                    ? "text-white/60"
                    : "text-primary/60"
                  : isDarkMode
                  ? "text-white/30"
                  : "text-muted-foreground"
              )}
            >
              {/* Step number */}
              <span
                className={cn(
                  "w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold",
                  index === currentSlide
                    ? "bg-primary text-primary-foreground"
                    : index < currentSlide
                    ? isDarkMode
                      ? "bg-white/20 text-white"
                      : "bg-primary/20 text-primary"
                    : isDarkMode
                    ? "bg-white/10 text-white/40"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </span>

              {/* Title - only show current and adjacent */}
              {Math.abs(index - currentSlide) <= 1 && (
                <span className="text-sm font-medium hidden lg:block max-w-24 truncate">
                  {title}
                </span>
              )}
            </button>

            {/* Connector line */}
            {index < slides.length - 1 && (
              <div
                className={cn(
                  "w-4 h-0.5 mx-1",
                  index < currentSlide
                    ? isDarkMode
                      ? "bg-white/30"
                      : "bg-primary/30"
                    : isDarkMode
                    ? "bg-white/10"
                    : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

export default PresentationNav;
