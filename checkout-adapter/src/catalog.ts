// Load sellable offers from the canonical arrow-catalog on GitHub.
// Cached in-memory per isolate for five minutes — catalog changes are
// infrequent (PR-governed) and the worker restarts often anyway.

import { HandoffError, type SellableOffer } from './checkout.ts';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CatalogProduct {
  name: string;
  offers?: Array<{
    id: string;
    manufacturerId: string;
    checkoutGroupId: string;
    status: string;
    checkout?: { immediatePayment?: boolean };
    price?: { amount: number; currency: string };
  }>;
}

let cache: { key: string; offers: Map<string, SellableOffer>; fetchedAt: number } | null = null;

export async function loadOffers(repo: string, ref: string): Promise<Map<string, SellableOffer>> {
  const key = `${repo}@${ref}`;
  if (cache && cache.key === key && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.offers;
  }

  const listing = await githubJson(
    `https://api.github.com/repos/${repo}/contents/catalog/products?ref=${ref}`,
  );
  if (!Array.isArray(listing)) {
    throw new HandoffError('unexpected catalog listing response', 502);
  }

  const offers = new Map<string, SellableOffer>();
  await Promise.all(
    listing
      .filter((entry) => typeof entry.download_url === 'string' && entry.name.endsWith('.json'))
      .map(async (entry) => {
        const product = (await githubJson(entry.download_url)) as CatalogProduct;
        for (const offer of product.offers ?? []) {
          offers.set(offer.id, {
            offerId: offer.id,
            productName: product.name,
            manufacturerId: offer.manufacturerId,
            checkoutGroupId: offer.checkoutGroupId,
            status: offer.status,
            immediatePayment: offer.checkout?.immediatePayment === true,
            price: offer.price,
          });
        }
      }),
  );

  if (offers.size === 0) {
    throw new HandoffError('catalog contains no offers', 502);
  }
  cache = { key, offers, fetchedAt: Date.now() };
  return offers;
}

async function githubJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'arrow-checkout-adapter',
      'accept': 'application/vnd.github+json',
    },
  });
  if (!response.ok) {
    throw new HandoffError(`catalog fetch failed (${response.status})`, 502);
  }
  return response.json();
}
