'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DangerZoneCard() {
    const [deleteStep, setDeleteStep] = React.useState(1);
    const [deleteOtp, setDeleteOtp] = React.useState('');
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleContinueDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        toast("A one-time password has been sent to your registered email.");
        setDeleteStep(2);
    };

    const handleDeleteAccount = () => {
        setIsDeleting(true);
        setTimeout(() => {
            if (deleteOtp === '123456') { 
                toast("Your account is being permanently deleted.");
                console.log("Account deleted!");
            } else {
                toast("The OTP you entered is incorrect. Account deletion cancelled.");
            }
            setIsDeleting(false);
            setDeleteStep(1);
            setDeleteOtp('');
            document.getElementById('alert-dialog-cancel-button')?.click();
        }, 2000);
    };

    return (
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                </div>
                <AlertDialog onOpenChange={() => setDeleteStep(1)}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            {deleteStep === 1 && (
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove your data from our servers.
                                </AlertDialogDescription>
                            )}
                            {deleteStep === 2 && (
                                <AlertDialogDescription>
                                    For your security, please enter the one-time password sent to your email to confirm account deletion.
                                </AlertDialogDescription>
                            )}
                        </AlertDialogHeader>
                        {deleteStep === 2 && (
                            <div className="py-4">
                                <Label htmlFor="delete-otp">One-Time Password</Label>
                                <Input 
                                    id="delete-otp"
                                    placeholder="Enter OTP"
                                    value={deleteOtp}
                                    onChange={(e) => setDeleteOtp(e.target.value)}
                                />
                            </div>
                        )}
                        <AlertDialogFooter>
                            <AlertDialogCancel id="alert-dialog-cancel-button">Cancel</AlertDialogCancel>
                            {deleteStep === 1 ? (
                                <AlertDialogAction onClick={handleContinueDelete}>Continue</AlertDialogAction>
                            ) : (
                                <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Delete Account
                                </Button>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}