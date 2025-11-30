import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Loader2, FileCheck2 } from 'lucide-react';

export const VerificationDialog = ({ onVerified, children }: { onVerified: () => void, children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verificationComplete, setVerificationComplete] = React.useState(false);

  const templates = [
    { name: 'onboarding_welcome', category: 'UTILITY', status: 'APPROVED' },
    { name: 'follow_up_1', category: 'MARKETING', status: 'APPROVED' },
    { name: 'quote_ready', category: 'UTILITY', status: 'APPROVED' },
  ];

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationComplete(true);
      toast("Verification Successful!", {
        description: "Phone number and templates have been verified.",
      });
    }, 2000);
  };

  const handleComplete = () => {
    onVerified();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Verify Number & Templates</DialogTitle>
          <DialogDescription>
            We&apos;ll check your number&apos;s status with Meta and fetch your approved message templates.
          </DialogDescription>
        </DialogHeader>
        {!verificationComplete ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileCheck2 className="h-16 w-16 text-primary mb-4" />
            <p className="text-muted-foreground mb-6">Ready to start the verification process?</p>
            <Button onClick={handleVerify} disabled={isVerifying}>
              {isVerifying ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
              ) : "Start Verification"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-500/10 rounded-lg text-green-700 dark:text-green-300 flex items-center gap-3">
              <Check className="h-5 w-5" />
              <p className="font-medium text-sm">Phone number successfully verified with Meta.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Approved Message Templates</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(template => (
                    <TableRow key={template.name}>
                      <TableCell className="font-mono text-xs">{template.name}</TableCell>
                      <TableCell><Badge variant="outline">{template.category}</Badge></TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-400 border-green-500/30">{template.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={handleComplete}>Confirm & Complete Step</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};