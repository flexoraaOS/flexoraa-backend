"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = 'force-dynamic';

export default function VerifyOTPPage() {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('resetEmail') : null;
    const storedOtp = typeof window !== 'undefined' ? localStorage.getItem('resetOtp') : null;

    useEffect(() => {
        if (!storedEmail || !storedOtp) {
            router.push('/auth/forgot-password');
        }
    }, [storedEmail, storedOtp, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (otp.trim() !== storedOtp?.trim()) {
            toast.error('Invalid OTP. Please check your email and try again.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create a demo user with the new password (since Supabase is having issues)
            const demoUser = {
                email: storedEmail,
                password: newPassword,
                createdAt: new Date().toISOString(),
            };

            // Store the demo user (in a real app, this would update the database)
            localStorage.setItem('demoUser', JSON.stringify(demoUser));

            toast.success('Password reset successfully!');

            // Clear stored data
            localStorage.removeItem('resetOtp');
            localStorage.removeItem('resetEmail');

            // Redirect to login page after successful reset
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);

        } catch (err) {
            console.error('Failed to reset password:', err);
            setError(err instanceof Error ? err.message : 'Failed to reset password');
            toast.error('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!storedEmail || !storedOtp) {
        return null; // Will redirect in useEffect
    }

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
                    <CardTitle className="text-3xl font-bold font-headline">Verify Code</CardTitle>
                    <CardDescription>
                        Enter the 6-digit code sent to {storedEmail} and your new password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">6-Digit Code</Label>
                            <Input
                                id="otp"
                                type="text"
                                placeholder="123456"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                            disabled={loading || !otp.trim() || !newPassword.trim() || !confirmPassword.trim()}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Did not receive the code?{' '}
                            <Link href="/auth/forgot-password" className="text-[#ec4343] hover:underline font-medium">
                                Resend Code
                            </Link>
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                            Remember your password?{' '}
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
