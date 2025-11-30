"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { sendWhatsAppOTP, verifyWhatsAppOTP } from "@/lib/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="#25D366"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}

export default function WhatsAppLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector(state => state.auth);

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Please enter a valid phone number with country code (e.g., +1234567890)");
      return;
    }

    try {
      await dispatch(sendWhatsAppOTP({ phoneNumber })).unwrap();
      setOtpSent(true);
    } catch (err) {
      console.error('Failed to send OTP: ', err);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      await dispatch(verifyWhatsAppOTP({ phoneNumber, otp })).unwrap();
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to verify OTP: ', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen animated-background p-4" id="animated-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <WhatsAppIcon />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">
            {otpSent ? "Verify OTP" : "WhatsApp Login"}
          </CardTitle>
          <CardDescription>
            {otpSent 
              ? "Enter the OTP sent to your WhatsApp" 
              : "Enter your phone number to receive an OTP"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+1234567890" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required 
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US, +91 for India)
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phoneNumber}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="Enter 6-digit OTP" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required 
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {!otpSent ? (
            <Button 
              className="w-full" 
              variant="red" 
              onClick={handleSendOTP}
              disabled={loading === 'pending'}
            >
              {loading === 'pending' ? 'Sending...' : 'Send OTP'}
            </Button>
          ) : (
            <>
              <Button 
                className="w-full" 
                variant="red" 
                onClick={handleVerifyOTP}
                disabled={loading === 'pending'}
              >
                {loading === 'pending' ? 'Verifying...' : 'Verify & Login'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                Change Phone Number
              </Button>
            </>
          )}
          <div className="mt-2 text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="text-[#ec4343] hover:underline font-medium">
              Back to Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
