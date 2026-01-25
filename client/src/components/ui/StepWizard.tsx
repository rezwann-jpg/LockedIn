import React from 'react';

interface Step {
    title: string;
    icon: React.ReactNode;
    description?: string;
}

interface StepWizardProps {
    steps: Step[];
    currentStep: number;
    onStepClick?: (step: number) => void;
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export default function StepWizard({
    steps,
    currentStep,
    onStepClick,
    children,
    title,
    subtitle
}: StepWizardProps) {
    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-text mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-block">
                        {title}
                    </h1>
                    {subtitle && <p className="text-muted">{subtitle}</p>}
                </div>

                {/* Stepper */}
                <div className="mb-10">
                    <div className="flex items-center justify-between relative px-2">
                        {/* Progress Bar Background */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted/20 -z-10 rounded-full" />

                        {/* Active Progress Bar */}
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                        />

                        {steps.map((step, idx) => {
                            const isActive = idx === currentStep;
                            const isCompleted = idx < currentStep;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => isCompleted && onStepClick?.(idx)}
                                    disabled={!isCompleted && !isActive}
                                    className={`relative flex flex-col items-center group ${!isCompleted && !isActive ? 'cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-background ${isActive
                                            ? 'border-primary text-primary shadow-lg shadow-primary/20 scale-110'
                                            : isCompleted
                                                ? 'border-primary bg-primary text-white scale-100'
                                                : 'border-muted text-muted scale-90'
                                            }`}
                                    >
                                        {isCompleted ? '✓' : step.icon}
                                    </div>
                                    <span
                                        className={`absolute top-12 text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-primary' : isCompleted ? 'text-text' : 'text-muted'
                                            }`}
                                    >
                                        {step.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-secondary/50 backdrop-blur-sm rounded-2xl border border-muted/30 shadow-xl min-h-[400px]">
                    {children}
                </div>
            </div>
        </div>
    );
}
