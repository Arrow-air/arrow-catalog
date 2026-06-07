# Arrow Catalog

Canonical catalog data for Arrow products, manufacturers, offers, checkout groups, and AIP-009 manufacturing protocol metadata.

This repository is the v0 source of truth for Arrow's hybrid manufacturing storefront. The website can consume this catalog to render product/store pages, while catalog changes remain reviewable through GitHub PRs and can later be connected to DAO governance or on-chain AIP-009 catalog publishing.

## Current status

This repo is in MVP bootstrap mode.

The current seed data includes:

- `quiver-devkit-v0` as the first AIP-009 storefront product fixture
- a placeholder spare propeller item to test same-manufacturer cart behavior
- trusted MVP manufacturer placeholders for Thomas/Texas and Julius/Germany
- checkout group placeholders for manufacturer-scoped carts
- draft warranty and support policy pages

Company names, prices, checkout URLs, USDC payment details, kit contents, and public warranty language are intentionally marked `TBD` until confirmed.

## Model

The catalog is organized around a few core entities:

- **Product** — the Arrow-sanctioned item: Quiver DevKit, spare part, PCB, attachment, service, etc.
- **Manufacturer** — an approved seller/fulfiller and merchant of record.
- **Offer** — a manufacturer's sellable version of a product.
- **Checkout group** — a manufacturer-scoped cart/checkout. Multiple offers from the same manufacturer can share a checkout group so customers can buy a DevKit and spare parts together.
- **Policy** — warranty/support text referenced by products.

MVP rule: one checkout equals one manufacturer merchant of record. If a customer buys products from multiple manufacturers, the storefront should split that into separate checkouts.

## Directory layout

```txt
catalog/
  products/          # product entries with embedded offers
  manufacturers/     # approved manufacturer profiles
  checkout-groups/   # manufacturer cart/checkout capabilities
  policies/          # markdown warranty/support policies
  schema/            # JSON Schema documents
scripts/
  validate-catalog.py
```

## Validate locally

```bash
make validate
```

The validator intentionally uses only the Python standard library. It checks malformed JSON, required top-level fields, duplicate IDs, and cross-references between products, manufacturers, checkout groups, and policies.

Full JSON Schema validation can be added later once the repo has a package/tooling stack.

## Storefront integration

Think of catalog JSON as the data that could plausibly become an AIP-009 on-chain catalog record or an input to one. If a field would make sense in a DAO-governed product/manufacturer/offer registry, it probably belongs here. If it is website layout, storytelling, or page composition, it belongs in the website repo.

Good catalog fields include:

- product name, category, status, and short description
- standards/manufacturing-guide links
- manufacturer offers and checkout groups
- price or price display
- availability, lead time, and ship-from/ship-to metadata
- merchant-of-record and payment metadata
- support/warranty policy references
- basic image/media URLs that identify the item
- future bond, fee, commission, reputation, or on-chain metadata

Fields that should stay out of the catalog:

- custom page layouts
- long-form marketing copy
- image galleries as presentation experiences
- launch pages, demos, animations, or narrative sections
- website-only UI decisions

This boundary keeps governance focused on canonical product/manufacturer/offer facts. Marketing copy and rich website content can iterate quickly in the website repo without treating every wording tweak as a catalog/governance change.

The website can generate ordinary product pages from catalog data for small parts/accessories, and custom MDX/React pages can reference catalog entries for flagship products.

For the first website integration, a simple build-time import/export is enough:

1. Read catalog JSON and policy markdown from this repo.
2. Validate it.
3. Use catalog data for `/store` cards, generated item pages, offer availability, manufacturer options, and checkout handoff.
4. Let website MDX/React optionally override or extend generated pages for major products.
5. Route customers to manufacturer-owned checkout links.

## AIP-009 direction

This repo is intentionally compatible with later AIP-009 protocol work:

- catalog entries can gain on-chain IDs
- offers can gain bond, fee, commission, and reputation metadata
- governance-approved PRs can become the pre-chain change process
- future scripts can publish catalog entries or content hashes on-chain

For now, GitHub PR review is the MVP governance/change process.
