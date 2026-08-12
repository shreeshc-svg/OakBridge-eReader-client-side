import { useState } from 'react';
import { payments_api } from '../api/payments.api';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';

export const usePayments = () => {
     const [isProcessing, setIsProcessing] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const initiatePayment = async (
          bookId: string,
          shippingAddress: string,
          billingAddress: string,
          onSuccess: () => void,
          couponCode?: string
     ) => {
          try {
               setIsProcessing(true);
               setError(null);

               // 1. Create order on backend
               const { order } = await payments_api.createOrder(bookId, shippingAddress, billingAddress, couponCode);

               // 2. Open Razorpay checkout widget
               const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', // Enter the Key ID generated from the Dashboard
                    amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                    currency: 'INR',
                    name: 'Oakbridge eReader',
                    description: 'Book Purchase',
                    order_id: order.id,
                    handler: async function (response: any) {
                         try {
                              // 3. Verify payment on backend
                              await payments_api.verifyPayment(
                                   response.razorpay_order_id,
                                   response.razorpay_payment_id,
                                   response.razorpay_signature
                              );
                              toast.success('Your payment process is complete. Now you can find your book in your library.', { duration: 5000 });

                              posthog.capture('purchase_completed', {
                                   amount: order.amount,
                                   isCart: false,
                                   bookId: bookId,
                                   couponCode: couponCode
                              });

                              onSuccess();
                         } catch (err: any) {
                              const errorMessage =
                                   err.response?.data?.message ||
                                   'Payment verification failed';
                              setError(errorMessage);
                              toast.error(errorMessage);
                         }
                    },
                    theme: {
                         color: '#f59e0b',
                    },
               };

               const rzp1 = new window.Razorpay(options);
               
               rzp1.on('payment.failed', function (response: any) {
                    setError(response.error.description);
                    toast.error(`Payment Failed: ${response.error.description}`);
               });

               rzp1.open();
          } catch (err: any) {
               const errorMessage =
                    err.response?.data?.message || 'Failed to initiate payment';
               setError(errorMessage);
               toast.error(errorMessage);
          } finally {
               setIsProcessing(false);
          }
     };

     const initiateSubscription = async (
          tier: 'GOLD' | 'PLATINUM',
          onSuccess: () => void,
          shippingAddress?: string,
          billingAddress?: string
     ) => {
          try {
               setIsProcessing(true);
               setError(null);

               // 1. Create order on backend
               const { order } = await payments_api.createSubscriptionOrder(tier, shippingAddress, billingAddress);

               // 2. Open Razorpay checkout widget
               const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
                    amount: order.amount,
                    currency: 'INR',
                    name: 'Oakbridge eReader',
                    description: `${tier} Subscription Plan`,
                    order_id: order.id,
                    handler: async function (response: any) {
                         try {
                              // 3. Verify payment on backend
                              await payments_api.verifyPayment(
                                   response.razorpay_order_id,
                                   response.razorpay_payment_id,
                                   response.razorpay_signature
                              );
                              toast.success('Your subscription is active!', { duration: 5000 });
                              onSuccess();
                         } catch (err: any) {
                              const errorMessage =
                                   err.response?.data?.message ||
                                   'Subscription payment verification failed';
                              setError(errorMessage);
                              toast.error(errorMessage);
                         }
                    },
                    theme: {
                         color: '#f59e0b',
                    },
               };

               const rzp1 = new window.Razorpay(options);
               
               rzp1.on('payment.failed', function (response: any) {
                    setError(response.error.description);
                    toast.error(`Payment Failed: ${response.error.description}`);
               });

               rzp1.open();
          } catch (err: any) {
               const errorMessage =
                    err.response?.data?.message || 'Failed to initiate subscription payment';
               setError(errorMessage);
               toast.error(errorMessage);
          } finally {
               setIsProcessing(false);
          }
     };

     const initiateCartPayment = async (
          bookIds: string[],
          shippingAddress: string,
          billingAddress: string,
          onSuccess: () => void,
          couponCode?: string
     ) => {
          try {
               setIsProcessing(true);
               setError(null);

               // 1. Create cart order on backend
               const { order } = await payments_api.createCartOrder(bookIds, shippingAddress, billingAddress, couponCode);

               // 2. Open Razorpay checkout widget
               const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
                    amount: order.amount,
                    currency: 'INR',
                    name: 'Oakbridge eReader',
                    description: `Cart Purchase (${bookIds.length} books)`,
                    order_id: order.id,
                    handler: async function (response: any) {
                         try {
                              // 3. Verify payment on backend
                              await payments_api.verifyPayment(
                                   response.razorpay_order_id,
                                   response.razorpay_payment_id,
                                   response.razorpay_signature
                              );
                              toast.success(
                                   'Payment successful! All books have been added to your library.',
                                   { duration: 5000 }
                              );

                              posthog.capture('purchase_completed', {
                                   amount: order.amount,
                                   isCart: true,
                                   booksCount: bookIds.length,
                                   couponCode: couponCode
                              });

                              onSuccess();
                         } catch (err: any) {
                              const errorMessage =
                                   err.response?.data?.message ||
                                   'Cart payment verification failed';
                              setError(errorMessage);
                              toast.error(errorMessage);
                         }
                    },
                    theme: {
                         color: '#f59e0b',
                    },
               };

               const rzp1 = new window.Razorpay(options);

               rzp1.on('payment.failed', function (response: any) {
                    setError(response.error.description);
                    toast.error(`Payment Failed: ${response.error.description}`);
               });

               rzp1.open();
          } catch (err: any) {
               const errorMessage =
                    err.response?.data?.message ||
                    'Failed to initiate cart payment';
               setError(errorMessage);
               toast.error(errorMessage);
          } finally {
               setIsProcessing(false);
          }
     };

     return {
          initiatePayment,
          initiateCartPayment,
          initiateSubscription,
          isProcessing,
          error,
     };
};
