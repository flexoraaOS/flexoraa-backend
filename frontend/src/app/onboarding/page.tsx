'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Logo } from '@/components/ui/logo';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingHeader from './OnboardingHeader';
import OnboardingSteps from './OnboardingSteps';
import OnboardingHelp from './OnboardingHelp';
import { toast } from 'sonner';

type ProductType = 'leados' | 'agentos';

const leadOSStepsData = [
  { id: 'whatsapp', title: 'Connect WhatsApp Business API', description: 'Link your WABA to enable automated messaging.', icon: 'MessageSquare' },
  { id: 'verify', title: 'Verify Number & Templates', description: 'Confirm your phone number and message templates with Meta.', icon: 'FileCheck2' },
  { id: 'test', title: 'Send Test Lead', description: 'Run a test to ensure the automation is working correctly.', icon: 'ArrowRight' },
];

const agentOSStepsData = [
  { id: 'instagram', title: 'Connect Instagram Account', description: 'Link your Instagram business profile via OAuth.', icon: 'Instagram' },
  { id: 'facebook', title: 'Connect Facebook Page', description: 'Authorize access to your Facebook page messages.', icon: 'Facebook' },
  { id: 'whatsapp', title: 'Connect WhatsApp Business API', description: 'Link your WABA to the omnichannel inbox.', icon: 'MessageSquare' },
  { id: 'test', title: 'Run Test Reply', description: 'Send a test message to check the integration.', icon: 'ArrowRight' },
];

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const product = (searchParams?.get('product') as ProductType) || 'leados';

  const initialStepsData = product === 'leados' ? leadOSStepsData : agentOSStepsData;
  const [steps, setSteps] = useState(initialStepsData);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleCompleteStep = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
      toast.success("Step Completed!", {
        description: "You've successfully completed this step.",
      });
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  };

  const handleContinue = () => {
    if (completedSteps.includes(steps[currentStepIndex].id)) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        router.push(product === 'leados' ? '/dashboard/leados' : '/dashboard/agentos');
      }
    }
  };

  const progressValue = (completedSteps.length / steps.length) * 100;

  useEffect(() => {
    const newSteps = product === 'leados' ? leadOSStepsData : agentOSStepsData;
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
  }, [product]);

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <OnboardingHeader product={product} />
      <div className="mb-10 px-4">
        <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
          <span>Step {Math.min(completedSteps.length + 1, steps.length)} of {steps.length}</span>
          <span>{Math.round(progressValue)}% Complete</span>
        </div>
        <Progress value={progressValue} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <OnboardingSteps
          steps={steps}
          currentStepIndex={currentStepIndex}
          completedSteps={completedSteps}
          onCompleteStep={handleCompleteStep}
        />
        <aside className="md:col-span-4 lg:col-span-5 sticky top-24 space-y-6">
          <OnboardingHelp />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/profile">Skip for now</Link>
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!completedSteps.includes(steps[currentStepIndex]?.id)}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}