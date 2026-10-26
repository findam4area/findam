'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [paymentType, setPaymentType] = useState<'boost' | 'premium' | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');

      if (!reference) {
        setStatus('failed');
        setMessage('Invalid payment reference');
        return;
      }

      try {
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setPaymentType(data.payment_type);
          setMessage(
            data.payment_type === 'boost'
              ? 'Your listing has been boosted successfully!'
              : 'Welcome to FindAm Premium!'
          );
        } else {
          setStatus('failed');
          setMessage(data.error || 'Payment verification failed');
        }
      } catch (error) {
        setStatus('failed');
        setMessage('An error occurred while verifying payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      if (paymentType === 'premium') {
        router.push('/profile');
      } else {
        router.push('/feed');
      }
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-naija-orange/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-naija-orange animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-400">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-naija-green/20 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-naija-green" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            {paymentType === 'boost' && (
              <div className="bg-naija-orange/10 border border-naija-orange/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">
                  Your listing will now appear at the top of the For You feed for the
                  next 7 days.
                </p>
              </div>
            )}
            {paymentType === 'premium' && (
              <div className="bg-gradient-to-br from-naija-orange/10 to-neon-pink/10 border border-naija-orange/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300 mb-2">
                  You now have access to:
                </p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ Up to 30 active listings</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Premium verification badge</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
            )}
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-naija-orange to-neon-pink hover:opacity-90"
            >
              Continue
            </Button>
          </>
        )}

        {status === 'failed' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
            >
              <XCircle className="w-8 h-8 text-red-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
              <Button
                onClick={() => router.back()}
                className="flex-1 bg-naija-orange hover:bg-naija-orange/90"
              >
                Try Again
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-naija-orange animate-spin" />
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
