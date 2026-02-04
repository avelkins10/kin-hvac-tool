"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PriceRevealProps {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
  prefix?: string;
  showCelebration?: boolean;
}

export function PriceReveal({
  value,
  className,
  duration = 1500,
  delay = 500,
  prefix = "$",
  showCelebration = false,
}: PriceRevealProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start animation after delay
    const delayTimer = setTimeout(() => {
      setIsAnimating(true);
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function - ease out expo for dramatic reveal
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        const currentValue = Math.round(value * eased);
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else if (showCelebration) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [value, duration, delay, showCelebration]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Price display */}
      <div
        className={cn(
          "transition-all duration-300",
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        <span className="font-price tabular-nums">
          {prefix}
          {displayValue.toLocaleString()}
        </span>
      </div>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: "50%",
                top: "50%",
                backgroundColor: [
                  "#0D9488",
                  "#F97316",
                  "#22C55E",
                  "#F59E0B",
                  "#EC4899",
                ][i % 5],
                animationDelay: `${i * 50}ms`,
                "--confetti-x": `${(Math.random() - 0.5) * 200}px`,
                "--confetti-y": `${-Math.random() * 150 - 50}px`,
                "--confetti-rotate": `${Math.random() * 360}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
                calc(-50% + var(--confetti-x)),
                calc(-50% + var(--confetti-y))
              )
              rotate(var(--confetti-rotate)) scale(0);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default PriceReveal;
