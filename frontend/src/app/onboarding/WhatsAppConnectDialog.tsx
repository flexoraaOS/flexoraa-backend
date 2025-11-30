'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { RootState } from '@/lib/store';
import { fetchCredentials } from '@/lib/features/credentialsSlice';
import { Facebook, CheckCircle, Loader2 } from 'lucide-react';

interface WhatsAppConnectDialogProps {
  onConnected: () => void;
  children: React.ReactNode;
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '';
const META_OAUTH_REDIRECT = process.env.NEXT_PUBLIC_META_OAUTH_REDIRECT || '';
const META_SCOPES = [
  'business_management',
  'whatsapp_business_management',
  'whatsapp_business_messaging',
  'pages_messaging',
  'instagram_basic',
  'instagram_manage_messages',
].join(',');

export const WhatsAppConnectDialog = ({ onConnected, children }: WhatsAppConnectDialogProps) => {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { data: credentials, loading, status } = useAppSelector((state: RootState) => state.credentials);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const isConnected = credentials && credentials.meta_access_token;

  function generateState(): string {
    return crypto.randomUUID();
  }

  function startMetaConnect() {
    if (!META_APP_ID) {
      toast.error('Configuration error: Meta App ID is not set.');
      return;
    }
    if (!META_OAUTH_REDIRECT) {
      toast.error('Configuration error: Meta OAuth Redirect URI is not set.');
      return;
    }

    const state = generateState();
    localStorage.setItem('meta_oauth_state', state);

    const params = new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: META_OAUTH_REDIRECT,
      state,
      scope: META_SCOPES,
      response_type: 'code',
    });

    const oauthUrl = `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
    window.location.href = oauthUrl;
  }

  useEffect(() => {
    if (open && user?.id && !credentials) {
      dispatch(fetchCredentials(user.id));
    }
  }, [open, user, credentials, dispatch]);

  useEffect(() => {
    if (status === 'succeeded' && isConnected) {
      onConnected();
      // toast.success('Meta account connected successfully!');
    }
  }, [status, isConnected, onConnected]);

  const handleContinue = () => {
    setOpen(false);
    onConnected();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Connect WhatsApp Business</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Click the button below to connect your Meta account. This will automatically configure your credentials.
          </p>
        </DialogHeader>

        <div className="py-6">
          {loading === 'pending' ? (
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold">Verifying Connection...</p>
              <p className="text-muted-foreground">Please wait while we check your credentials.</p>
            </div>
          ) : isConnected ? (
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-bold">Account Connected</h3>
              <p className="text-muted-foreground mt-2">
                Your WhatsApp Business account is successfully linked.
              </p>
              <Button onClick={handleContinue} className="w-full mt-6">
                Continue
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
               <div className="p-4 rounded-full bg-green-500 mb-4">
                 <Facebook className="h-10 w-10 text-white" />
               </div>
              <p className="text-muted-foreground mb-6 max-w-sm">
                You'll be redirected to Meta to authorize Flexoraa. We will automatically discover and save the necessary API credentials.
              </p>
              <Button onClick={startMetaConnect} className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white gap-2">
                <Facebook className="h-5 w-5" />
                Connect with Meta
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center w-full">
                By connecting, you agree to Meta's terms and our privacy policy.
            </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
