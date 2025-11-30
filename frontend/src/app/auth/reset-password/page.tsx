"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { resetPassword } from "@/lib/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loading, error } = useAppSelector(state => state.auth);

    useEffect(() => {
        // Extract token from URL parameters
        const accessToken = searchParams?.get('access_token');
        const refreshToken = searchParams?.get('refresh_token');

        if (accessToken) {
            setToken(accessToken);
        } else {
            // If no token in URL, check if user is already authenticated
            router.push('/auth/login');
        }
    }, [searchParams, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim() || password !== confirmPassword) {
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            await dispatch(resetPassword({ password: password.trim(), token })).unwrap();
            // Redirect to login page after successful password reset
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err) {
            console.error('Failed to reset password:', err);
        }
    };

    const isPasswordValid = password.length >= 6;
    const isConfirmPasswordValid = password === confirmPassword && confirmPassword.length > 0;
    const canSubmit = isPasswordValid && isConfirmPasswordValid && loading !== 'pending';

    return (
        <Card className="w-full max-w-sm mx-auto">
            <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                    <Logo />
                </div>
                <CardTitle className="text-3xl font-bold font-headline">Reset Password</CardTitle>
                <CardDescription>
                    Enter your new password below.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter new password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {password && !isPasswordValid && (
                            <p className="text-red-500 text-xs">Password must be at least 6 characters long</p>
                        )}
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
                        {confirmPassword && !isConfirmPasswordValid && (
                            <p className="text-red-500 text-xs">Passwords do not match</p>
                        )}
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
                        disabled={!canSubmit}
                    >
                        {loading === 'pending' ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex items-center justify-center min-h-screen animated-background p-4" id="animated-background">
            {/* Floating Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <Suspense fallback={
                <Card className="w-full max-w-sm mx-auto">
                    <CardHeader className="space-y-2 text-center">
                        <div className="flex justify-center mb-4">
                            <Logo />
                        </div>
                        <CardTitle className="text-3xl font-bold font-headline">Reset Password</CardTitle>
                        <CardDescription>
                            Loading...
                        </CardDescription>
                    </CardHeader>
                </Card>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
