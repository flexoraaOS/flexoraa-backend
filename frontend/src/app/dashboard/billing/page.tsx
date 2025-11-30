'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface TokenBalance {
  balance: number;
  is_paused: boolean;
}

interface TokenPack {
  tokens: number;
  price: number;
  discount: number;
  pricePerToken: number;
}

const TOKEN_PACKS: Record<string, TokenPack> = {
  '100': { tokens: 100, price: 50, discount: 0, pricePerToken: 0.50 },
  '500': { tokens: 500, price: 200, discount: 20, pricePerToken: 0.40 },
  '1000': { tokens: 1000, price: 350, discount: 30, pricePerToken: 0.35 },
  '5000': { tokens: 5000, price: 1500, discount: 40, pricePerToken: 0.30 },
};

export default function BillingPage() {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<string>('500');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/tokens/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setBalance(data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    try {
      // Create Razorpay order
      const orderResponse = await fetch('/api/tokens/topup/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tokenPack: selectedPack })
      });

      const orderData = await orderResponse.json();

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Flexoraa Intelligence OS',
        description: `${orderData.tokens} Token Pack`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/tokens/topup/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          if (verifyResponse.ok) {
            alert('Payment successful! Tokens credited.');
            fetchBalance();
          }
        },
        theme: {
          color: '#3b82f6'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Top-up failed:', error);
      alert('Failed to initiate payment');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const usagePercent = balance ? ((1000 - balance.balance) / 1000) * 100 : 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Token Management</h1>
        <p className="text-muted-foreground">Manage your token balance and top-up</p>
      </div>

      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{balance?.balance || 0}</p>
              <p className="text-sm text-muted-foreground">tokens remaining</p>
            </div>
            {balance?.is_paused && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Service Paused
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{usagePercent.toFixed(1)}%</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>

          {usagePercent >= 80 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-orange-600">
                You've used {usagePercent.toFixed(0)}% of your tokens. Top up to avoid service interruption.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Packs */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Top Up Tokens</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(TOKEN_PACKS).map(([key, pack]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                selectedPack === key ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedPack(key)}
            >
              <CardHeader>
                <CardTitle>{pack.tokens} Tokens</CardTitle>
                <CardDescription>
                  ${pack.pricePerToken}/token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-bold">${pack.price}</p>
                {pack.discount > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <TrendingUp className="h-3 w-3" />
                    {pack.discount}% off
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Button size="lg" onClick={handleTopUp} className="w-full md:w-auto">
            <Coins className="mr-2 h-5 w-5" />
            Top Up {TOKEN_PACKS[selectedPack].tokens} Tokens for ${TOKEN_PACKS[selectedPack].price}
          </Button>
        </div>
      </div>

      {/* Token Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Lead Verification</span>
              <span className="font-mono">0.5 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>AI Qualification Message</span>
              <span className="font-mono">2.0 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>AI Persuasion Message</span>
              <span className="font-mono">3.0 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Cold Recovery</span>
              <span className="font-mono">2.5 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Lead Routing</span>
              <span className="font-mono">1.0 tokens</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
