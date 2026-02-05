import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepsProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function Steps({ steps, currentStep, className }: StepsProps) {
    return (
        <div className={cn("w-full", className)}>
            <div className="relative flex justify-between">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 px-2">
                    <div className="h-0.5 w-full bg-gray-200 rounded-full" />
                </div>

                {/* Active Line Progress */}
                <div
                    className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-brand-olive transition-all duration-300 ease-in-out px-2"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {/* Steps */}
                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isActive = stepNum === currentStep;

                    return (
                        <div key={step} className="relative flex flex-col items-center group z-10">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 bg-white",
                                    isActive && "border-brand-olive text-brand-olive scale-110",
                                    isCompleted && "border-brand-olive bg-brand-olive text-white",
                                    !isActive && !isCompleted && "border-gray-200 text-gray-400"
                                )}
                            >
                                {isCompleted ? <Check size={14} /> : stepNum}
                            </div>
                            <span
                                className={cn(
                                    "absolute top-10 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap transition-colors duration-300",
                                    isActive ? "text-brand-olive" : "text-gray-400"
                                )}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
