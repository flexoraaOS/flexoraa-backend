
'use client';

import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const creditPackages = [
    { credits: 10, price: '₹80', popular: false },
    { credits: 50, price: '₹250', popular: false },
    { credits: 100, price: '₹500', popular: true },
];

export function BuyCreditsDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Add Credits</DialogTitle>
                    <DialogDescription>
                        Top up your account to continue using LeadOS and AgentOS services without interruption.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {creditPackages.map((pkg) => (
                        <Card key={pkg.credits} className={pkg.popular ? "border-primary" : ""}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-md">
                                        <Zap className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{pkg.credits} Credits</p>
                                        {pkg.popular && <p className="text-xs text-primary">Most Popular</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">{pkg.price}</p>
                                    <Button size="sm" asChild className="mt-1">
                                        <Link href="/checkout">Buy Now <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    <Separator />
                    <div className="space-y-3">
                        <Label htmlFor="custom-amount">Or Enter a Custom Amount</Label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                            <Input
                                id="custom-amount"
                                type="number"
                                placeholder="100 - 1,00,000"
                                min="100"
                                max="100000"
                                className="pl-6"
                            />
                        </div>
                        <Button asChild className="w-full">
                           <Link href="/checkout">Buy Credits</Link>
                        </Button>
                    </div>
                </div>
                 <DialogFooter>
                    <p className="text-xs text-muted-foreground text-center w-full">
                        You will be redirected to our secure payment gateway to complete the purchase.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
