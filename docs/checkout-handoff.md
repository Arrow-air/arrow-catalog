# Checkout Handoff Convention

Status: draft v1 — proposed for DAO review alongside the reference adapter implementation.

## Why

Arrow's store model separates three layers: governed catalog truth (this repo), private
order workflows (frontends like arrow-store), and payment/settlement (manufacturer
merchants of record). Payment must stay a **manufacturer-side capability**: a frontend
should never hold a manufacturer's payment credentials or sit in the money flow.

This document standardizes the *handoff* between any frontend and any manufacturer's
checkout so that:

- a customer pays for a whole order in **one payment** to the manufacturer of record,
- the **catalog stays the single source of price truth** (machine-readable prices below),
- **new frontends can emerge** without manufacturer-specific integrations, and
- **new manufacturers can onboard** by deploying their own checkout endpoint —
  no coordination with frontend operators required beyond a catalog PR.

The same convention is the stepping stone to on-chain checkout (AIP-009): the handoff
parameters map directly onto a future smart-contract call, with the order reference
binding a payment to an order commitment hash.

## The handoff URL

A checkout group that supports this convention sets `mode: "external-cart"` and a
`baseUrl` pointing at the manufacturer's checkout endpoint. A frontend hands a cart off
by redirecting the customer to:

```
{baseUrl}?items=<offerId>:<qty>[,<offerId>:<qty>...]&ref=<orderRef>
```

- `items` — comma-separated `offerId:quantity` pairs. All offers MUST belong to the same
  checkout group (one manufacturer merchant of record per payment). Quantities are
  integers 1–99; at most 20 line items.
- `ref` — an opaque order reference from the frontend (`[A-Za-z0-9_-]{1,64}`), e.g. an
  arrow-store order id. It binds the payment to the frontend's private order record and
  MUST NOT contain customer data.

Example:

```
https://checkout.jpl.example/checkout?items=quiver-devkit-thomas-texas:1,spare-propellers-thomas-texas:2&ref=ord_01KTSY7M20Q8HFGK7BQB4PEBGX
```

## Machine-readable prices

Display strings like `"$4,900 USD"` cannot be charged. Offers that support this
convention carry a `price` object:

```json
"price": { "amount": 490000, "currency": "USD" }
```

- `amount` — unit price in **minor units** (cents for USD).
- `currency` — ISO 4217 code.
- `priceDisplay` remains the human-facing string and SHOULD agree with `price`.

`price` is the value a checkout endpoint charges and the value future order commitment
hashes and on-chain records reference. An offer without `price` cannot be sold through
an automated handoff (frontends fall back to invoice-style flows).

## Checkout endpoint requirements

A manufacturer checkout endpoint (see the reference adapter) MUST:

1. **Validate against the canonical catalog** (this repo at a published ref): every
   offer exists, belongs to this manufacturer's checkout group, has an orderable status
   (`available` / `limited-availability`), `checkout.immediatePayment: true`, and a
   `price`. Unknown or foreign offer ids are rejected — the catalog, not the request,
   decides what is sellable and at what price.
2. **Create exactly one payment** for the full item list, in the manufacturer's own
   payment account (the manufacturer is merchant of record; no frontend or Arrow
   custody).
3. **Attach `ref`** to the payment (e.g. Stripe `client_reference_id` and metadata) so
   payments reconcile to frontend order records and, later, commitment hashes.
4. **Never require customer PII in the handoff.** The payment provider collects what it
   needs; the frontend keeps its own private record.

It SHOULD redirect the customer back to a frontend success/cancel URL, and SHOULD notify
the frontend of payment completion out of band (webhook → manufacturer admin update);
until then frontends treat payment status as pending and manufacturers confirm manually.

## Frontend requirements

A frontend using the handoff MUST create its own order record *before* redirecting (the
handoff is a payment step, not an order step), MUST only combine offers from a single
checkout group per handoff, and MUST NOT treat a customer's return as proof of payment.

## Reference implementation

[`checkout-adapter/`](../checkout-adapter/) in this repo is a zero-dependency Cloudflare
Worker any manufacturer can deploy with their own Stripe restricted key. Configuration
is environment-only (manufacturer id, catalog repo/ref, success/cancel URLs, Stripe
key) — the code contains no manufacturer specifics and resolves all prices from this
catalog.
