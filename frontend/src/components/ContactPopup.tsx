'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { submitContactForm, resetContactStatus, selectContactState } from '@/lib/features/contactSlice';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

export function ContactPopup() {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector(selectContactState);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'loading') return;
    dispatch(submitContactForm({ name, email, message }));
  };

  useEffect(() => {
    if (status === 'succeeded') {
      toast.success("Message Sent!", {
        description: "Thank you for contacting us. We'll get back to you shortly.",
      });
      setOpen(false); // Close the dialog on success
      // Reset form fields
      setName('');
      setEmail('');
      setMessage('');
    }
    if (status === 'failed') {
      toast.error("Submission Failed", {
        description: error || "Something went wrong. Please try again.",
      });
    }
  }, [status, error]);

  // Reset status when the dialog is closed
  useEffect(() => {
    if (!open) {
      dispatch(resetContactStatus());
    }
  }, [open, dispatch]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm  hover:text-red-500 cursor-pointer">
          Contact
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Contact Us</DialogTitle>
          <DialogDescription>
            Have a question? Fill out the form below or email us directly at{' '}
            <a href="mailto:Contact@flexoraaa.com" className="text-red-500 hover:underline">
              Contact@flexoraaa.com
            </a>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" placeholder="Your Name" className="col-span-3" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" placeholder="your.email@example.com" className="col-span-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right pt-2">Message</Label>
              <Textarea id="message" placeholder="Your message..." className="col-span-3" rows={10} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="red" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
