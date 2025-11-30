import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, MessageSquare, FileCheck2, ArrowRight, Instagram, Facebook, Loader2 } from 'lucide-react';
import StepAction from './StepAction';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: string;
}

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'active';

const iconMap: { [key: string]: React.ReactNode } = {
  MessageSquare: <MessageSquare className="h-6 w-6" />,
  FileCheck2: <FileCheck2 className="h-6 w-6" />,
  ArrowRight: <ArrowRight className="h-6 w-6" />,
  Instagram: <Instagram className="h-6 w-6" />,
  Facebook: <Facebook className="h-6 w-6" />,
  Check: <Check className="h-6 w-6" />,
};

const StepCard = ({ step, status, onComplete }: { step: Step; status: StepStatus; onComplete: () => void; }) => {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <div key={step.id} className={cn(
      "flex items-start gap-4 p-6 rounded-xl transition-all duration-300",
      isActive ? 'bg-card shadow-2xl shadow-primary/10 border border-primary/20' : 'bg-card/50 border',
      isCompleted && 'opacity-60'
    )}>
      <div className={cn(
        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-colors",
        isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
        isCompleted && 'bg-green-500/20 text-green-500'
      )}>
        {isCompleted ? iconMap.Check : iconMap[step.icon]}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{step.title}</h3>
        <p className="text-muted-foreground text-sm mt-1">{step.description}</p>
        {isActive && (
          <div className="mt-4">
            <StepAction step={step} onComplete={onComplete} />
          </div>
        )}
      </div>
    </div>
  );
};

export default function OnboardingSteps({ steps, currentStepIndex, completedSteps, onCompleteStep }: {
  steps: Step[],
  currentStepIndex: number,
  completedSteps: string[],
  onCompleteStep: (stepId: string) => void,
}) {

  const getStepStatus = (stepId: string, index: number): StepStatus => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (index === currentStepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="md:col-span-8 lg:col-span-7">
      <div className="space-y-6">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            status={getStepStatus(step.id, index)}
            onComplete={() => onCompleteStep(step.id)}
          />
        ))}
      </div>
    </div>
  );
}