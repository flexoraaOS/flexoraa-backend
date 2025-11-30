'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Check } from 'lucide-react';
import { Plan } from '@/lib/types/paymentsTypes';

const PricingCard: React.FC<{ plan: Plan }> = ({ plan }) => {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (plan.isCustom) {
      router.push('/contact-sales');
      return;
    }

    // DEBUG: Log the plan object to inspect the data being used.
    console.log("Attempting payment for plan:", plan);
    console.log("Value of amountInPaisa:", plan.amountInPaisa, "Type:", typeof plan.amountInPaisa);

    // FIX: Add a client-side check to ensure amountInPaisa is a valid number before the API call.
    // This provides a clearer error if the data passed to this component is incorrect.
    if (typeof plan.amountInPaisa !== 'number' || isNaN(plan.amountInPaisa)) {
      alert('Configuration Error: The plan price is invalid. Please contact support.');
      console.error("Invalid plan data detected. `amountInPaisa` is not a number:", plan.amountInPaisa);
      return;
    }

    if (plan.amountInPaisa <= 0) {
      alert('You have successfully subscribed to the Free Plan!');
      router.push('/dashboard');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: plan.amountInPaisa, planName: plan.name, userId: user?.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      const { order } = data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Flexoraa',
        description: `Payment for ${plan.name}`,
        order_id: order.id,
        handler: async function (response: unknown) {
          console.log('Payment success handler called with response:', response);

          const verificationResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_payment_id: (response as any).razorpay_payment_id,
              razorpay_order_id: (response as any).razorpay_order_id,
              razorpay_signature: (response as any).razorpay_signature,
              planName: plan.name,
              amount: order.amount,
            }),
          });

          console.log('Verification API response status:', verificationResponse.status);
          const result = await verificationResponse.json();
          console.log('Verification API result:', result);

          if (result.success) {
            alert('Payment Successful! Your subscription is now active.');
            router.push('/onboarding');
          } else {
            alert(`Payment verification failed: ${result.error}`);
          }
        },
        prefill: {
          name: user?.user_metadata?.first_name || 'User Name',
          email: user?.email || 'user@example.com',
          contact: user?.phone || '9999999999',
        },
        notes: {
          address: 'Flexoraa Inc.',
        },
        theme: {
          color: '#8B0000',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Payment Error:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`group flex flex-col justify-between rounded-xl border p-4 sm:p-4 md:p-4 lg:p-5 shadow-xl w-full h-full bg-card 
        transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-[1.02]
        ${plan.isRecommended ? 'border-[#8B0000] ring-1 ring-[#8B0000] shadow-[#8B0000]/40' : 'border-border'}`}
    >
      <div className="flex-grow">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">{plan.name}</h3>
        <p className="mt-1 text-sm text-red-500 font-semibold tracking-wide">{plan.tagline}</p>
        <p className="mt-4 text-muted-foreground leading-relaxed">{plan.description}</p>

        <div className="mt-6">
          {plan.isCustom ? (
            <p className="text-3xl md:text-3xl font-black text-foreground">{plan.price}</p>
          ) : (
            <p className="text-3xl md:text-3xl font-black text-foreground flex items-baseline">
              {plan.price}
              <span className="text-sm ml-1 text-muted-foreground">{plan.priceDetails}</span>
            </p>
          )}
        </div>

        <ul className="mt-8 space-y-4">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <Check className="text-red-500 flex-shrink-0 w-4" />
              &nbsp;
              <span className="text-foreground leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 w-full">
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className={`w-full rounded-xl px-6 py-3 font-semibold text-white uppercase tracking-wide text-sm
            bg-[#ec4343]
            hover:shadow-lg hover:shadow-red-500/50 hover:-translate-y-1 transition-transform duration-500 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Processing...' : plan.buttonText}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;

