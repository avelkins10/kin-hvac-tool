'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { EscalatorExplainerProps } from './types';

export function EscalatorExplainer({ className }: EscalatorExplainerProps) {
  const content = (
    <div className="space-y-3 text-sm">
      <p className="font-semibold text-foreground">
        What is an escalator rate?
      </p>
      <p className="text-muted-foreground">
        Your monthly payment increases slightly each year, similar to cost-of-living adjustments.
      </p>
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-start gap-3">
          <span className="w-14 text-escalator-low font-medium shrink-0">0%</span>
          <span className="text-muted-foreground">Same payment forever - most predictable</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-14 text-escalator-mid font-medium shrink-0">0.99%</span>
          <span className="text-muted-foreground">~$2-3/mo increase per year - balanced option</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-14 text-escalator-high font-medium shrink-0">1.99%</span>
          <span className="text-muted-foreground">~$4-6/mo increase per year - lowest starting payment</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Tooltip on hover */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors',
                className
              )}
            >
              <Info className="w-4 h-4" />
              <span>What&apos;s an escalator rate?</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs p-4">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Mobile: Popover on tap */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'md:hidden inline-flex items-center gap-1 text-sm text-muted-foreground active:text-foreground transition-colors',
              // Minimum touch target size
              'min-h-[44px] min-w-[44px] justify-center',
              className
            )}
          >
            <Info className="w-4 h-4" />
            <span>What&apos;s an escalator rate?</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-80 p-4">
          {content}
        </PopoverContent>
      </Popover>
    </>
  );
}
