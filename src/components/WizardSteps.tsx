"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

export function WizardSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number; // 1-based
}) {
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex items-center">
        {steps.map((label, i) => {
          const n = i + 1;
          const completed = n < current;
          const active = n === current;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition",
                    completed && "bg-green-500 text-white",
                    active && "bg-f7red text-white shadow-lg shadow-f7red/30",
                    !completed && !active && "bg-f7panel2 text-slate-500 border border-f7border"
                  )}
                >
                  {completed ? <Check size={16} strokeWidth={3} /> : n}
                </div>
                <span
                  className={clsx(
                    "text-[11px] mt-2 whitespace-nowrap",
                    active ? "text-white font-medium" : "text-slate-500"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    "flex-1 h-0.5 mx-2 -mt-5 transition",
                    completed ? "bg-green-500" : "bg-f7border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
