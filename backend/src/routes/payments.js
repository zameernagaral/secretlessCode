const express = require('express');
const Stripe = require('stripe');
const logger = require('../utils/logger');
const { requireAuth } = require('../middlewares/clerkAuth');
const db = require('../utils/db');

const router = express.Router();

// Fallback to empty string if not provided; Stripe will throw an error if used without a valid key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * POST /payments/create-checkout-session
 * 
 * Creates a Stripe Checkout Session to sponsor or buy a "Pro" plan.
 * Protected route: verifies user session on the server via Clerk.
 */
router.post('/payments/create-checkout-session', express.json(), requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId; // Securely extracted from Clerk session

    // Ensure the user exists in our database before creating a checkout session
    // (If they don't exist yet, we can't upgrade them later!)
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `placeholder-${userId}@secretless.local`, // Real email requires Clerk webhook sync
      }
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Secretless Code Pro / Sponsor',
              description: 'Support the project and get extended API limits.',
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/?payment=success`,
      cancel_url: `${FRONTEND_URL}/?payment=cancelled`,
      metadata: {
        userId: userId,
      },
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    logger.error('[Stripe] Checkout Session Error', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'STRIPE_ERROR', message: 'Failed to create payment session.' } 
    });
  }
});

/**
 * POST /webhooks/stripe
 * 
 * Receives Stripe webhooks (e.g. successful payments).
 * MUST use express.raw to verify the Stripe signature.
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the webhook signature using the raw body
    event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn('[Stripe Webhook] Invalid signature', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      
      logger.info('[Stripe Webhook] Payment successful!', { 
        sessionId: session.id,
        amountTotal: session.amount_total,
        customerEmail: session.customer_details?.email,
        metadata: session.metadata 
      });

      if (userId) {
        try {
          await db.user.update({
            where: { id: userId },
            data: { isPro: true }
          });
          logger.info('[Stripe Webhook] Upgraded user to Pro', { userId });
        } catch (dbErr) {
          logger.error('[Stripe Webhook] DB Error upgrading user', { userId, error: dbErr.message });
        }
      }
      break;
    }
    // Add other event types as needed
    default:
      logger.debug('[Stripe Webhook] Unhandled event type', { type: event.type });
  }

  // Acknowledge receipt of the event
  res.json({ success: true, data: { received: true } });
});

module.exports = router;
