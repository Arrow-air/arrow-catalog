import { describe, expect, it } from 'vitest';
import {
  buildSessionForm,
  HandoffError,
  parseAllowedOrigins,
  parseItems,
  parseRef,
  priceLineItems,
  resolveReturnUrl,
  type SellableOffer,
} from '../src/checkout.ts';

const offers = new Map<string, SellableOffer>([
  [
    'quiver-devkit-thomas-texas',
    {
      offerId: 'quiver-devkit-thomas-texas',
      productName: 'Quiver DevKit',
      manufacturerId: 'thomas-texas',
      checkoutGroupId: 'thomas-store',
      status: 'limited-availability',
      immediatePayment: true,
      price: { amount: 490000, currency: 'USD' },
    },
  ],
  [
    'spare-propellers-thomas-texas',
    {
      offerId: 'spare-propellers-thomas-texas',
      productName: 'Quiver Spare Propeller (XRotor MFP 2480)',
      manufacturerId: 'thomas-texas',
      checkoutGroupId: 'thomas-store',
      status: 'available',
      immediatePayment: true,
      price: { amount: 1999, currency: 'USD' },
    },
  ],
  [
    'quiver-devkit-julius-germany',
    {
      offerId: 'quiver-devkit-julius-germany',
      productName: 'Quiver DevKit',
      manufacturerId: 'julius-germany',
      checkoutGroupId: 'julius-store',
      status: 'waitlist',
      immediatePayment: true,
      price: undefined,
    },
  ],
]);

describe('parseItems', () => {
  it('parses well-formed item lists', () => {
    expect(parseItems('a:1,b:2')).toEqual([
      { offerId: 'a', quantity: 1 },
      { offerId: 'b', quantity: 2 },
    ]);
  });

  it.each(['', 'a', 'a:0', 'a:1.5', 'a:100', 'a:1:2', 'a:1,a:2'])('rejects %j', (raw) => {
    expect(() => parseItems(raw)).toThrow(HandoffError);
  });
});

describe('parseRef', () => {
  it('accepts opaque order references', () => {
    expect(parseRef('ord_01KTSY7M20Q8HFGK7BQB4PEBGX')).toBe('ord_01KTSY7M20Q8HFGK7BQB4PEBGX');
  });

  it.each([null, '', 'has spaces', 'a'.repeat(65), 'no/slash'])('rejects %j', (raw) => {
    expect(() => parseRef(raw)).toThrow(HandoffError);
  });
});

describe('priceLineItems', () => {
  it('prices a multi-item cart from the catalog', () => {
    const lines = priceLineItems(
      offers,
      [
        { offerId: 'quiver-devkit-thomas-texas', quantity: 1 },
        { offerId: 'spare-propellers-thomas-texas', quantity: 2 },
      ],
      'thomas-texas',
    );
    expect(lines).toEqual([
      { name: 'Quiver DevKit', unitAmount: 490000, currency: 'usd', quantity: 1 },
      {
        name: 'Quiver Spare Propeller (XRotor MFP 2480)',
        unitAmount: 1999,
        currency: 'usd',
        quantity: 2,
      },
    ]);
  });

  it('rejects offers belonging to another manufacturer (and does not leak that they exist)', () => {
    expect(() =>
      priceLineItems(offers, [{ offerId: 'quiver-devkit-julius-germany', quantity: 1 }], 'thomas-texas'),
    ).toThrow(/unknown offer/);
  });

  it('rejects unknown offers, non-orderable statuses, and missing prices', () => {
    expect(() =>
      priceLineItems(offers, [{ offerId: 'nope', quantity: 1 }], 'thomas-texas'),
    ).toThrow(/unknown offer/);
    expect(() =>
      priceLineItems(offers, [{ offerId: 'quiver-devkit-julius-germany', quantity: 1 }], 'julius-germany'),
    ).toThrow(/not currently orderable/);
  });
});

describe('buildSessionForm', () => {
  it('builds a single-payment session with the ref attached', () => {
    const form = buildSessionForm(
      [
        { name: 'Quiver DevKit', unitAmount: 490000, currency: 'usd', quantity: 1 },
        { name: 'Propeller', unitAmount: 1999, currency: 'usd', quantity: 2 },
      ],
      'ord_X',
      'https://store.arrowair.com/orders/payment-complete',
      'https://store.arrowair.com/cart',
    );
    expect(form.get('mode')).toBe('payment');
    expect(form.get('client_reference_id')).toBe('ord_X');
    expect(form.get('metadata[order_ref]')).toBe('ord_X');
    expect(form.get('success_url')).toBe(
      'https://store.arrowair.com/orders/payment-complete?ref=ord_X&session_id={CHECKOUT_SESSION_ID}',
    );
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('490000');
    expect(form.get('line_items[1][quantity]')).toBe('2');
  });
});

describe('resolveReturnUrl', () => {
  const allowed = parseAllowedOrigins('https://store.arrowair.com, http://localhost:4321/');
  const fallback = 'https://store.arrowair.com/orders/payment-complete';

  it('accepts URLs on allowlisted origins', () => {
    expect(
      resolveReturnUrl('http://localhost:4321/orders/payment-complete', allowed, fallback),
    ).toBe('http://localhost:4321/orders/payment-complete');
    expect(resolveReturnUrl('https://store.arrowair.com/anywhere', allowed, fallback)).toBe(
      'https://store.arrowair.com/anywhere',
    );
  });

  it('falls back for foreign, malformed, or missing URLs (no open redirect)', () => {
    expect(resolveReturnUrl('https://evil.example/phish', allowed, fallback)).toBe(fallback);
    expect(resolveReturnUrl('https://store.arrowair.com.evil.example/x', allowed, fallback)).toBe(
      fallback,
    );
    expect(resolveReturnUrl('//store.arrowair.com/x', allowed, fallback)).toBe(fallback);
    expect(resolveReturnUrl('javascript:alert(1)', allowed, fallback)).toBe(fallback);
    expect(resolveReturnUrl(null, allowed, fallback)).toBe(fallback);
  });

  it('falls back to defaults when no allowlist is configured', () => {
    expect(
      resolveReturnUrl('https://store.arrowair.com/x', parseAllowedOrigins(undefined), fallback),
    ).toBe(fallback);
  });
});

describe('wildcard-port allowlist entries', () => {
  const allowed = parseAllowedOrigins('https://store.arrowair.com,http://localhost:*');
  const fallback = 'https://store.arrowair.com/orders/payment-complete';

  it('matches any loopback port', () => {
    expect(resolveReturnUrl('http://localhost:4322/orders/payment-complete', allowed, fallback)).toBe(
      'http://localhost:4322/orders/payment-complete',
    );
    expect(resolveReturnUrl('http://localhost:5000/x', allowed, fallback)).toBe(
      'http://localhost:5000/x',
    );
  });

  it('wildcard matches hostname exactly, not lookalikes or other protocols', () => {
    expect(resolveReturnUrl('http://localhost.evil.example:4322/x', allowed, fallback)).toBe(fallback);
    expect(resolveReturnUrl('http://notlocalhost:4322/x', allowed, fallback)).toBe(fallback);
    expect(resolveReturnUrl('https://localhost:4322/x', allowed, fallback)).toBe(fallback);
  });

  it('exact entries still require an exact origin match', () => {
    expect(resolveReturnUrl('https://store.arrowair.com:8443/x', allowed, fallback)).toBe(fallback);
  });
});
