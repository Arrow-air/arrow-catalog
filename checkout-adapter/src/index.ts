// Reference manufacturer checkout endpoint for the Arrow checkout handoff
// convention (arrow-catalog/docs/checkout-handoff.md).
//
// GET /checkout?items=offerId:qty,...&ref=<orderRef>
//   -> validates against the canonical catalog, creates ONE Stripe Checkout
//      Session in this manufacturer's account, 303-redirects the customer.
//
// The frontend never touches payment credentials; this endpoint never sees
// customer PII. Each manufacturer deploys their own instance.

import { loadOffers } from './catalog.ts';
import {
  buildSessionForm,
  HandoffError,
  parseAllowedOrigins,
  parseItems,
  parseRef,
  priceLineItems,
  resolveReturnUrl,
} from './checkout.ts';

export interface Env {
  STRIPE_SECRET_KEY: string;
  MANUFACTURER_ID: string;
  CATALOG_REPO: string;
  CATALOG_REF: string;
  SUCCESS_URL: string;
  CANCEL_URL: string;
  /** Comma-separated origins allowed in `return`/`cancel` params. */
  ALLOWED_RETURN_ORIGINS?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' && request.method === 'GET') {
      return Response.json({
        service: 'arrow-checkout-adapter',
        manufacturerId: env.MANUFACTURER_ID,
        catalog: `${env.CATALOG_REPO}@${env.CATALOG_REF}`,
        usage: 'GET /checkout?items=offerId:qty,...&ref=<orderRef>',
      });
    }

    if (url.pathname !== '/checkout' || request.method !== 'GET') {
      return new Response('Not found', { status: 404 });
    }

    try {
      const items = parseItems(url.searchParams.get('items'));
      const ref = parseRef(url.searchParams.get('ref'));
      const allowedOrigins = parseAllowedOrigins(env.ALLOWED_RETURN_ORIGINS);
      const successUrl = resolveReturnUrl(
        url.searchParams.get('return'),
        allowedOrigins,
        env.SUCCESS_URL,
      );
      const cancelUrl = resolveReturnUrl(
        url.searchParams.get('cancel'),
        allowedOrigins,
        env.CANCEL_URL,
      );
      // Observable via `wrangler tail` when debugging a frontend's redirect
      // setup; return URLs are not customer data.
      console.log(
        JSON.stringify({
          ref,
          requestedReturn: url.searchParams.get('return'),
          resolvedReturn: successUrl,
        }),
      );

      const offers = await loadOffers(env.CATALOG_REPO, env.CATALOG_REF);
      const lines = priceLineItems(offers, items, env.MANUFACTURER_ID);
      const form = buildSessionForm(lines, ref, successUrl, cancelUrl);

      const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });
      const session = (await stripe.json()) as { url?: string; error?: { message?: string } };
      if (!stripe.ok || !session.url) {
        // Never echo Stripe error details to the customer.
        console.error('stripe session creation failed:', session.error?.message);
        return new Response('Payment session could not be created. Please try again.', {
          status: 502,
        });
      }
      return Response.redirect(session.url, 303);
    } catch (error) {
      if (error instanceof HandoffError) {
        return new Response(error.message, { status: error.status });
      }
      console.error('checkout failed:', error);
      return new Response('Internal error', { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
