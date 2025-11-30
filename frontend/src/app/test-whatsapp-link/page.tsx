"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const dynamic = 'force-dynamic';

export default function TestWhatsAppLinkPage() {
  const [businessNumber, setBusinessNumber] = useState("14155238886");
  const [message, setMessage] = useState("Verify login: test1234");
  const [generatedLink, setGeneratedLink] = useState("");

  const generateLink = () => {
    const encodedMessage = encodeURIComponent(message);
    const link = `https://wa.me/${businessNumber}?text=${encodedMessage}`;
    setGeneratedLink(link);
  };

  const testLink = () => {
    if (generatedLink) {
      window.open(generatedLink, '_blank');
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Link Tester</CardTitle>
          <CardDescription>
            Test your WhatsApp message links before using them in QR codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-number">Business WhatsApp Number</Label>
            <Input
              id="business-number"
              placeholder="14155238886"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Format: Country code + number (no + or spaces)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Pre-filled Message</Label>
            <Input
              id="message"
              placeholder="Verify login: test1234"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button onClick={generateLink} className="w-full">
            Generate Link
          </Button>

          {generatedLink && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Generated Link:</Label>
                <div className="p-3 bg-muted rounded-md break-all text-sm font-mono">
                  {generatedLink}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={testLink} className="flex-1 bg-[#25D366] hover:bg-[#20BA5A]">
                  Test in WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(generatedLink)}
                  className="flex-1"
                >
                  Copy Link
                </Button>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
                <p className="text-sm font-semibold mb-2">What should happen:</p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Click "Test in WhatsApp"</li>
                  <li>WhatsApp should open (on phone or WhatsApp Web)</li>
                  <li>You should see a chat with the business number</li>
                  <li>The message should be pre-filled</li>
                  <li>You can send it or modify it</li>
                </ol>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                <p className="text-sm font-semibold mb-2">⚠️ Common Issues:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>If nothing happens: Check the number format</li>
                  <li>If it says "Invalid number": Remove + and spaces</li>
                  <li>If WhatsApp doesn't open: Make sure it's installed</li>
                  <li>On desktop: It will open WhatsApp Web</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
