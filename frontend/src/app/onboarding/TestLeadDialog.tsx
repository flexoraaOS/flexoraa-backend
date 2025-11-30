import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

export const TestLeadDialog = ({ onSent, children }: { onSent: () => void, children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast("Test Message Sent!", {
        description: "Test lead delivered successfully.",
      });
      onSent();
      setOpen(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Send Test Lead</DialogTitle>
          <DialogDescription>
            Enter a phone number (with country code) to send a test message to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSend}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Test Phone Number</Label>
              <Input id="phone-number" placeholder="e.g., +15551234567" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Send Test</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};