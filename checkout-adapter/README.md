# checkout-adapter

Reference implementation of the [Arrow checkout handoff convention](../docs/checkout-handoff.md):
a tiny Cloudflare Worker that turns a handed-off cart into **one Stripe payment** in the
**manufacturer's own Stripe account**. It lives in this repo because it is part of the
protocol surface: the convention doc, the catalog schema it relies on, and this
reference endpoint evolve together under the same DAO review.

Every Arrow manufacturer deploys their own instance with their own restricted Stripe
key. Frontends (like [arrow-store](https://github.com/Arrow-air/arrow-store)) never
touch payment credentials; this endpoint never sees customer PII; and the canonical
catalog — not the request — decides what is sellable and at what price.

```
GET /checkout?items=<offerId>:<qty>[,<offerId>:<qty>...]&ref=<orderRef>
```

1. Items are validated against `arrow-catalog`: offer exists, belongs to this
   manufacturer, is orderable, supports immediate payment, and carries a
   machine-readable `price`.
2. One Stripe Checkout Session is created for the whole cart, with `ref` (the
   frontend's order id) attached as `client_reference_id` and metadata.
3. The customer is 303-redirected to Stripe; afterwards Stripe sends them to your
   configured success/cancel URLs (with `ref` echoed back).

No Stripe SDK, no runtime dependencies — the worker is ~250 lines of TypeScript.

## Deploy your instance

```sh
npm install
npm test

# 1. Edit wrangler.toml: MANUFACTURER_ID, SUCCESS_URL, CANCEL_URL
# 2. Create a RESTRICTED Stripe key (Checkout Sessions: write, only):
#    Stripe dashboard -> Developers -> API keys -> Create restricted key
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler deploy
```

Then publish your endpoint in the catalog: set your checkout group's
`mode: "external-cart"` and `baseUrl: "https://<your-worker>/checkout"` via an
arrow-catalog PR. Frontends pick it up from there — no further coordination needed.

## Payment confirmation

v1 keeps confirmation manual: payments land in your Stripe dashboard carrying the
order `ref`, and you mark the order paid in the store admin. A Stripe webhook that
notifies the frontend automatically is a natural follow-up and slot for it is left in
the convention (SHOULD, not MUST).

## Local development

```sh
echo 'STRIPE_SECRET_KEY=sk_test_...' > .dev.vars   # test-mode key
npm run dev
open "http://localhost:8787/checkout?items=quiver-devkit-thomas-texas:1&ref=ord_TEST"
```
