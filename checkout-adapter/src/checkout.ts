// Pure handoff logic (no I/O) — parsing, validation against catalog data,
// and Stripe Checkout Session form construction. See the convention:
// arrow-catalog/docs/checkout-handoff.md

export class HandoffError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface RequestedItem {
  offerId: string;
  quantity: number;
}

/** A catalog offer joined with its product name (the only fields we need). */
export interface SellableOffer {
  offerId: string;
  productName: string;
  manufacturerId: string;
  checkoutGroupId: string;
  status: string;
  immediatePayment: boolean;
  price?: { amount: number; currency: string };
}

export interface LineItem {
  name: string;
  unitAmount: number;
  currency: string;
  quantity: number;
}

const MAX_LINE_ITEMS = 20;
const MAX_QUANTITY = 99;
const ORDERABLE_STATUSES = ['available', 'limited-availability'];
const REF_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Parse the `items` query parameter: "offerId:qty,offerId:qty". */
export function parseItems(raw: string | null): RequestedItem[] {
  if (!raw) throw new HandoffError('missing items parameter');
  const parts = raw.split(',');
  if (parts.length > MAX_LINE_ITEMS) {
    throw new HandoffError(`too many line items (max ${MAX_LINE_ITEMS})`);
  }
  const seen = new Set<string>();
  return parts.map((part) => {
    const [offerId, rawQty, ...extra] = part.split(':');
    const quantity = Number(rawQty);
    if (!offerId || extra.length > 0 || !Number.isInteger(quantity)) {
      throw new HandoffError(`malformed item "${part}" (expected offerId:quantity)`);
    }
    if (quantity < 1 || quantity > MAX_QUANTITY) {
      throw new HandoffError(`quantity out of range for ${offerId}`);
    }
    if (seen.has(offerId)) throw new HandoffError(`duplicate offer ${offerId}`);
    seen.add(offerId);
    return { offerId, quantity };
  });
}

/** Parse and validate the `ref` query parameter (opaque frontend order reference). */
export function parseRef(raw: string | null): string {
  if (!raw || !REF_PATTERN.test(raw)) {
    throw new HandoffError('missing or invalid ref parameter');
  }
  return raw;
}

/**
 * Resolve requested items against the canonical catalog. The catalog — never
 * the request — decides what is sellable and at what price.
 */
export function priceLineItems(
  offers: ReadonlyMap<string, SellableOffer>,
  items: RequestedItem[],
  manufacturerId: string,
): LineItem[] {
  const lines = items.map((item) => {
    const offer = offers.get(item.offerId);
    if (!offer || offer.manufacturerId !== manufacturerId) {
      throw new HandoffError(`unknown offer: ${item.offerId}`);
    }
    if (!ORDERABLE_STATUSES.includes(offer.status) || !offer.immediatePayment) {
      throw new HandoffError(`offer ${item.offerId} is not currently orderable`);
    }
    if (!offer.price) {
      throw new HandoffError(`offer ${item.offerId} has no machine-readable price`);
    }
    return {
      name: offer.productName,
      unitAmount: offer.price.amount,
      currency: offer.price.currency.toLowerCase(),
      quantity: item.quantity,
    };
  });

  const groups = new Set(
    items.map((item) => offers.get(item.offerId)!.checkoutGroupId),
  );
  if (groups.size > 1) {
    throw new HandoffError('items span multiple checkout groups; one payment covers one group');
  }
  if (new Set(lines.map((line) => line.currency)).size > 1) {
    throw new HandoffError('items have mixed currencies');
  }
  return lines;
}

/** Build the form-encoded body for POST /v1/checkout/sessions (no Stripe SDK needed). */
export function buildSessionForm(
  lines: LineItem[],
  ref: string,
  successUrl: string,
  cancelUrl: string,
): URLSearchParams {
  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('client_reference_id', ref);
  form.set('metadata[order_ref]', ref);
  const join = successUrl.includes('?') ? '&' : '?';
  form.set('success_url', `${successUrl}${join}ref=${ref}&session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', cancelUrl);
  lines.forEach((line, index) => {
    form.set(`line_items[${index}][price_data][currency]`, line.currency);
    form.set(`line_items[${index}][price_data][product_data][name]`, line.name);
    form.set(`line_items[${index}][price_data][unit_amount]`, String(line.unitAmount));
    form.set(`line_items[${index}][quantity]`, String(line.quantity));
  });
  return form;
}
