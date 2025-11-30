"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { 
  generateWhatsAppQR, 
  checkWhatsAppQRStatus, 
  loginWithWhatsAppQR 
} from "@/lib/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import QRCode from "qrcode";

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

export default function WhatsAppQRLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [verificationUrl, setVerificationUrl] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector(state => state.auth);

  // Poll for verification status
  useEffect(() => {
    if (!sessionId || !phoneNumber) return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await dispatch(checkWhatsAppQRStatus({ sessionId })).unwrap();
        
        if (result.verified) {
          clearInterval(pollInterval);
          // Login with the user's phone number
          await dispatch(loginWithWhatsAppQR({ phoneNumber })).unwrap();
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [sessionId, phoneNumber, dispatch, router]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [expiresAt]);

  const handleGenerateQR = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Please enter a valid phone number with country code (e.g., +1234567890)");
      return;
    }

    try {
      setIsExpired(false);
      
      // Call API directly instead of using Redux action
      const response = await fetch("/api/auth/whatsapp-qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate QR code");
      }
      
      setSessionId(result.sessionId);
      setVerificationUrl(result.verificationUrl);
      setExpiresAt(result.expiresAt);
      setShowQR(true);
      
      // Generate QR code image
      const qrDataUrl = await QRCode.toDataURL(result.qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen animated-background p-4" id="animated-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <WhatsAppIcon />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">
            WhatsApp QR Login
          </CardTitle>
          <CardDescription>
            Scan the QR code with your phone or click to open WhatsApp
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!showQR ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Your Phone Number</Label>
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
              <Button 
                className="w-full" 
                variant="red" 
                onClick={handleGenerateQR}
                disabled={loading === 'pending'}
              >
                Generate QR Code
              </Button>
            </>
          ) : qrCodeUrl && !isExpired ? (
            <>
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src={qrCodeUrl} 
                    alt="WhatsApp QR Code" 
                    className="rounded-lg border-4 border-primary"
                  />
                  {timeLeft > 0 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {formatTime(timeLeft)}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-center text-sm text-muted-foreground">
                <p className="font-semibold text-primary">How to login:</p>
                <ol className="text-left space-y-2 max-w-sm mx-auto bg-muted/50 p-4 rounded-lg">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">1.</span>
                    <span>Scan this QR code with your phone camera</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">2.</span>
                    <span>Tap "Open WhatsApp" when prompted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">3.</span>
                    <span>Send the pre-filled verification message</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">4.</span>
                    <span>You'll be logged in automatically!</span>
                  </li>
                </ol>
              </div>

              <div className="pt-2 space-y-2">
                <Button 
                  variant="default" 
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
                  onClick={() => window.open(verificationUrl, '_blank')}
                >
                  <WhatsAppIcon className="mr-2 h-5 w-5" />
                  Open in WhatsApp
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Can't scan? Click the button above to open WhatsApp directly
                </p>
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setShowQR(false);
                  setQrCodeUrl("");
                }}
              >
                Change Phone Number
              </Button>
            </>
          ) : isExpired ? (
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">QR code has expired</p>
              <Button 
                variant="red" 
                onClick={handleGenerateQR}
                disabled={loading === 'pending'}
              >
                Generate New QR Code
              </Button>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or use other methods
              </span>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push('/auth/whatsapp-login')}
            >
              OTP Login
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push('/auth/login')}
            >
              Email Login
            </Button>
          </div>

          <div className="mt-2 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-[#ec4343] hover:underline font-medium">
              Sign Up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
