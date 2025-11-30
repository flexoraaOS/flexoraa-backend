'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordDialog() {
    const [step, setStep] = React.useState(1);
    const [emailOrPhone, setEmailOrPhone] = React.useState('');
    const [otp, setOtp] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [open, setOpen] = React.useState(false);

    const handleSendOtp = () => {
        setIsLoading(true);
        setTimeout(() => {
            toast(`An OTP has been sent to ${emailOrPhone}.`);
            setStep(2);
            setIsLoading(false);
        }, 1500);
    };

    const handleVerifyOtp = () => {
        setIsLoading(true);
        setTimeout(() => {
            if (otp === '123456') { // Mock OTP
                toast("You can now reset your password." );
                setStep(3);
            } else {
                toast("The OTP you entered is incorrect." );
            }
            setIsLoading(false);
        }, 1500);
    };

    const handleResetPassword = () => {
        if (newPassword !== confirmPassword) {
            toast( "The new passwords do not match." );
            return;
        }
        if (newPassword.length < 8) {
            toast( "Password must be at least 8 characters long." );
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            toast("You can now log in with your new password." );
            setStep(4);
            setIsLoading(false);
        }, 1500);
    };
    
    const resetState = () => {
        setStep(1);
        setEmailOrPhone('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
                resetState();
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="link" className="text-sm p-0 h-auto">Forgot Password?</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Your Password</DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Enter your email or phone number to receive a one-time password (OTP)."}
                        {step === 2 && `We've sent an OTP to ${emailOrPhone}. Please enter it below.`}
                        {step === 3 && "Enter your new password."}
                        {step === 4 && "Your password has been reset."}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {step === 1 && (
                        <div className="space-y-2">
                            <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                            <Input id="emailOrPhone" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="name@example.com" />
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-2">
                            <Label htmlFor="otp">One-Time Password (OTP)</Label>
                            <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter the 6-digit OTP" />
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                            </div>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="flex flex-col items-center text-center space-y-4 py-8">
                            <div className="p-4 bg-green-500/10 rounded-full">
                                <Check className="h-12 w-12 text-green-500"/>
                            </div>
                            <p className="text-muted-foreground">You can now close this window.</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {step === 1 && <Button onClick={handleSendOtp} disabled={isLoading || !emailOrPhone}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Send OTP</Button>}
                    {step === 2 && <Button onClick={handleVerifyOtp} disabled={isLoading || !otp}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Verify OTP</Button>}
                    {step === 3 && <Button onClick={handleResetPassword} disabled={isLoading || !newPassword || !confirmPassword}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Reset Password</Button>}
                    {step === 4 && <Button onClick={() => setOpen(false)}>Close</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}