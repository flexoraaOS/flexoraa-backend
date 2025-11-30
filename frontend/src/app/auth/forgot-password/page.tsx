"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Store OTP in localStorage (temporary storage)
            localStorage.setItem('resetOtp', otp);
            localStorage.setItem('resetEmail', email.trim().toLowerCase());

            // Send OTP via Gmail SMTP
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    otp: otp,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send email');
            }

            toast.success('Reset code sent! Please check your email.');

            // Redirect to OTP verification page
            setTimeout(() => {
                router.push('/auth/verify-otp');
            }, 1500);

        } catch (err) {
            console.error('Failed to send reset email:', err);
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
            toast.error('Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen animated-background p-4" id="animated-background">
            {/* Floating Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-sm mx-auto">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center mb-4">
                        <Logo />
                    </div>
                    <CardTitle className="text-3xl font-bold font-headline">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            className="w-full"
                            variant="red"
                            type="submit"
                            disabled={loading || !email.trim()}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Remember your password?&apos;{' '}
                            <Link href="/auth/login" className="text-[#ec4343] hover:underline font-medium">
                                Back to Login
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
