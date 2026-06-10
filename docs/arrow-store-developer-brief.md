# Arrow Store Developer Brief

Status: draft onboarding/context brief  
Target app: `store.arrowair.com`  
Related documents: `docs/arrow-store-roadmap.md`  
Related data repo: `arrow-catalog`

This brief gives Arrow/AIP-009 context for developers and designers who are not already familiar with the project. Use it alongside the roadmap, which focuses on implementation phases and requirements.

## 0. Executive summary for new developers

Arrow is an open-source aircraft DAO building modular VTOL aircraft and related hardware. The immediate product focus for this store is the **Quiver devkit**: a sellable hardware kit for builders who want to assemble, test, and extend the Quiver platform.

The store is not meant to be a conventional Shopify clone. It is the first practical commerce layer for Arrow's long-term manufacturing model:

1. Arrow publishes open-source aircraft designs and product standards.
2. Approved manufacturers build and sell physical kits, parts, and add-ons.
3. Arrow/DAO governance decides which products, manufacturers, regions, and commissions are valid.
4. Customers buy from manufacturer merchants of record while Arrow keeps the customer experience coherent.
5. Over time, catalog approvals, commissions, manufacturer bonds, and order/payment commitments can move on-chain.

The first implementation should stay pragmatic: manufacturer-direct payments, a small private order database, and manual DAO fee reconciliation. But the data model should be stable enough that we can later add smart contracts without rebuilding the store from scratch.

If you only remember one architectural principle: **the store is a frontend and private order workflow over canonical catalog/protocol data, not the source of truth for Arrow's products.**

## 0.1 What Arrow is

Arrow is a decentralized autonomous organization (DAO) developing open-source aircraft, starting with unmanned VTOL platforms. Arrow's work is public/open-source where practical: designs, documentation, software, and manufacturing knowledge are intended to be shared and improved by the community.

A DAO is not a normal company with one central operations team. Some responsibilities are handled by governance, some by contributors, and some by individual manufacturers. This matters for the store because:

- Arrow may not be the merchant of record for early sales.
- Manufacturers may be independent people or shops in different regions.
- The DAO needs transparent accounting around fees/commissions.
- Customer private data must not become visible to token holders or the public.
- The system should eventually support governance/on-chain approvals instead of hardcoded admin decisions.

## 0.2 What AIP-009 means in this context

AIP-009 is the Arrow manufacturing/revenue direction this store is intended to implement. You do not need deep governance context to build the MVP, but the practical idea is:

- Arrow's designs are open source. The DAO should not rely on traditional closed-IP licensing as the main revenue mechanism.
- Instead, Arrow can coordinate quality, standards, discovery, marketplace/customer flow, and protocol-level manufacturer approval.
- Approved manufacturers can sell Arrow-compatible products.
- The DAO can receive a commission/coordination fee that funds maintenance, documentation, future designs, software, and ecosystem work.

In v1 this fee can be manually tracked and later paid back to the DAO by the manufacturer. In later versions, fees may be enforced by smart contracts, split payments, escrow, or manufacturer bonds.

## 0.3 Current repos and responsibilities

Known repos/components:

- `arrow-catalog`
  - Current repo containing catalog JSON, schemas, manufacturers, checkout groups, and policy drafts.
  - This is the source of truth for MVP product/manufacturer/offer data.
  - This document currently lives here because the catalog model and store roadmap are being developed together.

- Future `arrow-store` / `store` repo
  - New independent app for `store.arrowair.com`.
  - Should consume `arrow-catalog` rather than duplicating canonical product/manufacturer data.
  - Should own cart, checkout intake, customer order status, private order DB, admin/manufacturer views, and payment handoff.

- Existing Arrow website repo
  - Marketing/docs/community website.
  - Should link to the store but should not own commerce logic.

## 0.4 Glossary

- **Arrow**: The open-source aircraft DAO/ecosystem.
- **DAO**: Decentralized autonomous organization; governance and treasury layer for Arrow.
- **AIP**: Arrow Improvement Proposal. AIP-009 is the manufacturing/revenue direction relevant to this store.
- **Quiver**: Arrow's modular VTOL drone platform.
- **Quiver devkit**: The first intended store product: a physical kit for builders/testers. Exact kit contents and pricing are still TBD.
- **Manufacturer**: An approved person/shop/entity that builds and sells Arrow-compatible hardware.
- **Merchant of record**: The party that actually sells to the customer, processes payment, and is responsible for fulfillment/taxes/refunds for that sale. In v1 this is expected to be the manufacturer, not Arrow.
- **Offer**: A manufacturer-specific sellable version of a product, with region, price/price display, availability, lead time, and payment mode.
- **Checkout group**: A manufacturer-scoped grouping of offers that can be purchased together in one checkout.
- **Catalog**: Canonical data describing products, manufacturers, offers, checkout groups, policies, and eventually DAO/on-chain references.
- **Order commitment hash**: A deterministic hash of selected order facts, designed so orders can later be anchored/audited without publishing private customer data.
- **PII**: Personally identifiable information, such as customer name, email, phone, and shipping address.

## 0.5 V1 user journey in plain English

A first-time developer should picture the MVP flow like this:

1. A customer visits `store.arrowair.com`.
2. The store reads public catalog data and shows the Quiver devkit, compatible add-ons/spares, and available manufacturers.
3. The customer selects the Thomas/Texas offer if they are in the US.
4. The cart only allows items that can be fulfilled by the same manufacturer checkout group.
5. The customer enters contact and shipping details.
6. The store creates a private order record assigned to Thomas/Texas.
7. The customer receives confirmation and payment instructions or a manufacturer payment link.
8. Thomas processes payment through his own merchant/payment setup, not through Arrow custody.
9. Thomas updates the order status in the store admin/manufacturer view.
10. The store tracks the DAO commission owed for that order.
11. The manufacturer later pays/reconciles owed DAO fees manually.
12. The order has a commitment hash so future systems can prove or audit order accounting without revealing private customer data.

When Julius/Germany is added, the same flow should work for EU-eligible offers, but Julius should only see his assigned manufacturer orders.

## 0.6 Important mental model: three layers

Developers should keep these layers separate:

### Public/governed layer

This layer answers: “What is Arrow-approved?”

Examples:

- product IDs
- manufacturer IDs
- offer IDs
- regions
- commission rates
- product status
- manufacturer approval status
- catalog record hashes/URIs

Today this is mostly `arrow-catalog` plus GitHub PR review. Later it can become DAO-governed on-chain state.

### Private operations layer

This layer answers: “What happened with this customer/order?”

Examples:

- customer email/name/phone/address
- exact order status
- support notes
- payment references
- tracking numbers
- fulfillment notes

This belongs in the store database with strict roles and audit logging. It should not be placed in the public catalog or on-chain.

### Settlement/accounting layer

This layer answers: “What money/fees are owed or paid?”

Examples:

- manufacturer gross sales totals
- DAO commission amount
- fee status
- order commitment hash
- future smart-contract payment/split/escrow records

In v1 this can be report/export/manual reconciliation. Later it can be protocol-enforced.

## 0.7 What not to build accidentally

Avoid these traps:

- Do not build product truth into the store app if it belongs in `arrow-catalog`.
- Do not expose customer PII to DAO-wide governance, public repos, analytics, logs, or on-chain payloads.
- Do not require Stripe Connect or DAO legal/KYC setup for v1.
- Do not assume Arrow is merchant of record for v1 sales.
- Do not build a big bespoke admin/ERP system before the first real sales workflow is proven.
- Do not make checkout depend on future smart contracts being complete.
- Do not prevent future smart-contract checkout by using unstable IDs or ad hoc order data.

## 0.8 Current seed data assumptions

At the time of this draft, `arrow-catalog` contains MVP seed data for:

- a Quiver devkit product fixture
- a spare propeller product fixture
- Thomas/Texas manufacturer placeholder
- Julius/Germany manufacturer placeholder
- manufacturer-scoped checkout group placeholders
- draft support/warranty policy references

Many fields are intentionally still placeholders (`TBD`) until pricing, legal language, kit contents, checkout URLs, and public policy text are confirmed. Developers should treat the catalog schema and IDs as directionally important, but should expect some field-level iteration before production launch.

## Next reading

After this brief, read `docs/arrow-store-roadmap.md` for the implementation plan, roadmap phases, data model requirements, security guidance, and open questions.
