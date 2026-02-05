"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentCompletionCardProps {
  completedSections: Set<string>;
  totalSections: number;
  onContinue: () => void;
  missingSections?: string[];
}

export function AssessmentCompletionCard({
  completedSections,
  totalSections,
  onContinue,
  missingSections = [],
}: AssessmentCompletionCardProps) {
  const allCompleted = completedSections.size === totalSections;
  const completionPercentage = (completedSections.size / totalSections) * 100;

  return (
    <Card className="fixed bottom-4 right-4 z-50 shadow-2xl border-2 max-w-md animate-in slide-in-from-bottom-5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {allCompleted ? (
            <>
              <Check className="w-5 h-5 text-green-600" />
              Assessment Complete!
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Almost There
            </>
          )}
        </CardTitle>
        <CardDescription>
          {completedSections.size} of {totalSections} sections completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={cn(
              "h-3 rounded-full transition-all duration-500",
              allCompleted ? "bg-green-600" : "bg-amber-500",
            )}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {!allCompleted && missingSections.length > 0 && (
          <div className="text-base text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-1">Still need to complete:</p>
            <ul className="list-disc list-inside space-y-1">
              {missingSections.map((section) => (
                <li key={section} className="text-sm">
                  {section}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={onContinue}
          disabled={!allCompleted}
          className={cn(
            "w-full",
            allCompleted && "bg-green-600 hover:bg-green-700",
          )}
        >
          {allCompleted ? (
            <>
              Continue to Pricing
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            "Complete Assessment First"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
