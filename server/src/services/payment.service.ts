import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

export interface PaymentResult {
  id: string;
  clientSecret?: string;
  status: 'requires_action' | 'succeeded' | 'failed';
}

/**
 * Create a payment intent for the deposit.
 * In production, this calls Stripe. In test mode, we simulate.
 */
export async function createDepositPayment(
  amount: number,
  currency: string,
  customerEmail: string,
  metadata: Record<string, string>
): Promise<PaymentResult> {
  if (env.stripe.secretKey) {
    return createStripePayment(amount, currency, customerEmail, metadata);
  }
  // Mock payment for development
  return mockPayment(amount, currency);
}

async function createStripePayment(
  amount: number,
  currency: string,
  customerEmail: string,
  metadata: Record<string, string>
): Promise<PaymentResult> {
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.stripe.secretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      receipt_email: customerEmail,
      metadata,
      capture_method: 'manual',
      automatic_payment_methods: { enabled: true },
    });
    logger.info('Stripe payment intent created', { id: paymentIntent.id, amount });
    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ?? undefined,
      status: paymentIntent.status === 'requires_action' ? 'requires_action' : 'succeeded',
    };
  } catch (err) {
    logger.error('Stripe payment failed', { error: (err as Error).message });
    throw ApiError.internal('Payment processing failed');
  }
}

async function mockPayment(amount: number, _currency: string): Promise<PaymentResult> {
  await new Promise((r) => setTimeout(r, 500));
  const id = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  logger.info('Mock payment created', { id, amount });
  return { id, status: 'succeeded' };
}

/**
 * Capture a previously authorized payment (e.g., deposit hold).
 */
export async function capturePayment(paymentIntentId: string, amount?: number): Promise<void> {
  if (env.stripe.secretKey) {
    try {
      const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.stripe.secretKey);
      await stripe.paymentIntents.capture(paymentIntentId, amount ? { amount_to_capture: Math.round(amount * 100) } : undefined);
    } catch (err) {
      logger.error('Stripe capture failed', { error: (err as Error).message });
      throw ApiError.internal('Payment capture failed');
    }
  }
  logger.info('Payment captured', { paymentIntentId, amount });
}

/**
 * Refund a payment.
 */
export async function refundPayment(paymentIntentId: string, amount?: number): Promise<void> {
  if (env.stripe.secretKey) {
    try {
      const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.stripe.secretKey);
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });
    } catch (err) {
      logger.error('Stripe refund failed', { error: (err as Error).message });
      throw ApiError.internal('Payment refund failed');
    }
  }
  logger.info('Payment refunded', { paymentIntentId, amount });
}
