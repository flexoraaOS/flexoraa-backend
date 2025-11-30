import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppConnectDialog } from './WhatsAppConnectDialog';
import { VerificationDialog } from './VerificationDialog';
import { TestLeadDialog } from './TestLeadDialog';
import { InstagramConnectDialog } from './InstagramConnectDialogue';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function StepAction({ step, onComplete }: { step: Step; onComplete: () => void; }) {
  const buttonText = step.id === 'whatsapp' ? 'Connect' : step.id === 'verify' ? 'Verify' : 'Start';

  switch (step.id) {
    case 'whatsapp':
      return <WhatsAppConnectDialog onConnected={onComplete}><Button className="w-full">{buttonText}</Button></WhatsAppConnectDialog>;
    case 'verify':
      return <VerificationDialog onVerified={onComplete}><Button className="w-full">{buttonText}</Button></VerificationDialog>;
    case 'test':
      return <TestLeadDialog onSent={onComplete}><Button className="w-full">{buttonText}</Button></TestLeadDialog>;
    case 'instagram':
      return <InstagramConnectDialog onConnected={onComplete}><Button className="w-full">Connect</Button></InstagramConnectDialog>;
    default:
      return <Button className="w-full" onClick={onComplete}>
        {buttonText}
      </Button>;
  }
}