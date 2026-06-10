# Arrow Store Roadmap and Development Plan

Status: draft working plan  
Target app: `store.arrowair.com`  
Related data repo: `arrow-catalog`  
Primary audience: developers/designers building the first Arrow Store MVP, including contributors who are not yet familiar with Arrow

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

## 1. Product direction

Arrow Store should be an independent commerce app for AIP-009-style manufacturing, not a section of the main marketing website.

The long-term goal is a DAO-forward storefront where the app is mostly a frontend over public catalog/protocol state:

- DAO-governed catalog/product/offer records
- manufacturer approval and commission policy
- manufacturer-direct fulfillment and payments
- privacy-gated customer/order data
- eventual on-chain settlement, fee enforcement, bonds, and audit commitments

The short-term goal is to ship a practical first version that can sell Quiver devkits in the US without waiting for smart contracts, DAO legal entity setup, or a full Web3 payment stack.

## 2. Key decisions from working session

### Store app

- Build as an independent app at `store.arrowair.com`.
- Do not put the store inside the existing Arrow website repo.
- Main Arrow website can link to the store, but the store should own commerce UX, checkout handoff, customer order status, and manufacturer fulfillment workflows.

### First products

- Primary launch item: Quiver devkit.
- Also plan for spare/replacement parts and optional add-ons.
- Catalog/store model should support bundles or checkout groups so customers can buy a devkit plus compatible add-ons from the same manufacturer.

### Manufacturers and regions

- First manufacturer of record: Thomas / Texas workshop.
- US sales only for Thomas v1.
- Plan to add Julius / Germany as soon as practical.
- Julius should support EU sales when added.
- The system should be multi-manufacturer-capable from the start, even if only one manufacturer is active at launch.

### Customer relationship

- Arrow/store app owns the customer relationship.
- Manufacturer receives only the information needed to fulfill assigned orders.
- DAO/public should not receive customer PII.

### Payments

- V1 payments should be handled directly by the manufacturer.
- Likely launch modes:
  - manufacturer card payment link
  - manufacturer invoice
  - manual payment confirmation
- Arrow should not custody funds in v1.
- DAO fee/commission can be manually tracked and paid back by the manufacturer at first.
- Do not block v1 on Stripe Connect, a DAO legal entity, or smart contracts.

### On-chain direction

- Design the store and catalog to be on-chain-compatible, not on-chain-dependent.
- Long term, the catalog and commission policy may become DAO-governed on-chain records.
- Bulky human-facing fields should still live off-chain or behind content URIs/hashes.
- Store orders should produce deterministic commitments/hashes so future on-chain audit anchoring is possible.

## 3. Architecture principles

### Separate product truth from commerce operations

- Catalog repo: canonical product/manufacturer/offer facts.
- Store app: storefront UX, cart, checkout handoff, order/customer workflow.
- DB: private operational records only.
- Chain later: trust, approvals, commission policy, commitments, settlement, bonds.

### Privacy by default, transparency by commitment/reporting

Private:

- customer name
- email
- phone
- shipping address
- support notes
- fulfillment notes
- payment provider details

DAO-visible or public later:

- manufacturer IDs
- active offer/product IDs
- commission rates
- order commitment hashes
- fee obligations/paid status
- aggregate sales/fee reports
- approval/bond/slashing status

### Manufacturer-scoped checkout

V1 rule: one checkout equals one manufacturer merchant of record.

If a customer wants items from multiple manufacturers, split into separate checkouts/orders. This keeps payment, tax, shipping, liability, and fulfillment boundaries clear.

### Replaceable frontend

Long-term ideal: `store.arrowair.com` is not the protocol. It is the official Arrow frontend over shared catalog/protocol data. Another frontend should eventually be able to consume the same public catalog and on-chain registry.

## 4. Proposed system components

### 4.1 Store app repo

Suggested repo name: `Arrow-air/arrow-store` or `Arrow-air/store`.

Recommended stack for v1:

- Next.js / React app
- TypeScript
- Postgres-backed app database
- Auth provider such as Auth.js, Clerk, or Supabase Auth
- Deployment on Vercel, Cloudflare Pages/Workers, or similar
- Infrastructure managed with Terraform/OpenTofu where practical

The exact stack can change, but prioritize:

- boring maintainability
- good TypeScript/schema validation
- easy preview deployments
- secure environment/secret management
- clean API boundaries for future on-chain checkout

### 4.2 Catalog integration

The store should consume `arrow-catalog` as a data source, not duplicate product truth.

Initial integration can be build-time or CI-time:

1. Pull/read catalog JSON and policies.
2. Validate catalog schema.
3. Generate product, offer, manufacturer, and checkout-group views.
4. Fail build if catalog IDs or references are invalid.

Later integration can become API-based or protocol-based.

### 4.3 Database

Use the DB only for private/operational state that should not live in the public catalog.

Core tables/entities:

- users
- customer_profiles
- orders
- order_items
- order_status_events
- manufacturer_accounts
- payment_attempts or payment_records
- fulfillment_records
- dao_fee_obligations
- audit_log

Keep schemas small and migration-friendly.

### 4.4 Auth and roles

Initial roles:

- `store_admin`
  - manage orders, manufacturers, disputes, app config
- `manufacturer_admin`
  - manage offers/fulfillment/orders for one manufacturer
- `fulfillment_member`
  - access shipping/contact info for assigned orders only
- `dao_finance`
  - view fee/reconciliation reports with minimal or no PII
- `customer`
  - view own orders/status

V1 can start with Thomas as both `store_admin` and `manufacturer_admin`, then add Julius as `manufacturer_admin` for Germany/EU.

Important rule: manufacturer users should only see orders assigned to their manufacturer.

### 4.5 Payment abstraction

Do not hardcode one payment model. Define a payment provider interface per manufacturer or offer.

Possible provider modes:

- `manufacturer_checkout_link`
  - store redirects or links to manufacturer-owned payment page
- `manual_invoice`
  - order created, manufacturer sends invoice manually
- `manual_card_payment`
  - manufacturer processes card payment externally and marks paid
- `crypto_direct`
  - future buyer wallet calls checkout contract
- `card_onramp`
  - future fiat/card provider funds checkout contract on buyer behalf
- `stripe_connect`
  - future option only if legal/KYC structure makes sense

V1 should probably implement `manual_invoice` and/or `manufacturer_checkout_link` first.

### 4.6 Order commitment hash

Every order should be able to produce a deterministic commitment hash for future audit/on-chain anchoring.

Do not include raw PII in the public commitment payload.

Suggested private order record contains full details; commitment payload contains normalized non-private or hashed fields, e.g.:

- `order_id`
- `created_at`
- `manufacturer_id`
- `items[]` with product/offer IDs, quantities, unit prices
- `currency`
- `subtotal`
- `dao_fee_bps`
- `dao_fee_amount`
- `payment_status`
- `shipping_country_or_region` only if safe
- salted hash of private customer/shipping payload, not raw data

The public commitment hash can later be published on-chain or in a DAO accounting report.

## 5. V1 scope

### Customer-facing

- Product listing for Quiver devkit.
- Optional spare/replacement parts and add-ons, if catalog data is ready.
- Manufacturer/region availability.
- Cart restricted to one manufacturer checkout group.
- Checkout intake form.
- Payment handoff to manufacturer or manual invoice workflow.
- Basic order confirmation page/email.
- Customer order status page or magic-link status access.

### Manufacturer/admin-facing

- View assigned orders.
- See customer fulfillment info for assigned orders.
- Mark statuses:
  - received
  - awaiting payment
  - paid
  - in production / preparing
  - shipped
  - delivered / complete
  - cancelled / refunded
- Record payment reference manually.
- Record shipping/tracking info.
- View DAO fee owed for orders.

### DAO/finance-facing

- Report orders by manufacturer.
- Report gross sales and DAO fee obligations.
- Track manual fee paid/unpaid status.
- Export CSV for reconciliation.
- Avoid exposing customer PII unless explicitly authorized for ops.

### Out of v1 scope

- On-chain checkout contract.
- DAO-enforced commission splits.
- Manufacturer staking/bonds.
- Slashing/dispute governance.
- Stripe Connect dependency.
- Full support ticketing system.
- Automated tax/VAT complexity.
- Multi-manufacturer single-cart checkout.

## 6. Roadmap

### Phase 0 — Planning and repo bootstrap

Deliverables:

- Create independent store repo.
- Pick app/deploy/auth/database stack.
- Define environments: local, preview, production.
- Add baseline CI: lint, typecheck, tests, catalog validation.
- Add initial Terraform/OpenTofu structure if using managed infra.
- Document secrets policy.

Acceptance criteria:

- Fresh repo deploys a placeholder store app.
- `store.arrowair.com` DNS/deployment path is understood, even if not public yet.
- No secrets in repo.
- CI validates basic app and catalog import.

### Phase 1 — Catalog-driven storefront

Deliverables:

- Import `arrow-catalog` data.
- Render product cards/pages from catalog IDs.
- Render manufacturer offers and region availability.
- Render checkout group boundaries.
- Fail safely when products/offers are unavailable or region-ineligible.

Acceptance criteria:

- Quiver devkit page renders from catalog data.
- Thomas/Texas offer can be shown for US customers.
- Julius/Germany offer can exist as inactive/coming-soon or EU-only.
- Store does not duplicate canonical catalog facts.

### Phase 2 — Cart and checkout intake

Deliverables:

- Cart supports one manufacturer checkout group.
- Add-ons/spares can be added if compatible with same manufacturer.
- Checkout captures customer contact and shipping info.
- Checkout creates order records.
- Order confirmation includes next step: invoice/payment link/manual payment instructions.

Acceptance criteria:

- Customer can create a Quiver devkit order/reservation for Thomas/US.
- Order is stored with line items and assigned manufacturer.
- Multi-manufacturer cart is blocked or split clearly.
- Customer PII is stored only in private DB.

### Phase 3 — Manufacturer/admin workflow

Deliverables:

- Admin/manufacturer login.
- Manufacturer-scoped order list.
- Order detail view.
- Status updates.
- Payment reference/status updates.
- Fulfillment/tracking fields.
- Audit log for order changes.

Acceptance criteria:

- Thomas can see and manage US orders.
- Julius can later be added without seeing Thomas-only private order details unless granted admin access.
- Status changes are logged.
- Customer can be notified or view updated status.

### Phase 4 — DAO fee tracking

Deliverables:

- Configure DAO commission per offer/manufacturer/order.
- Record fee obligation at order creation.
- Track fee paid/unpaid manually.
- Export reconciliation report.
- Generate order commitment hash.

Acceptance criteria:

- Each paid order has a recorded DAO fee obligation.
- Finance/admin can see manufacturer-level totals.
- Export is usable for manual repayment to DAO.
- Commitment hash exists for future audit anchoring.

### Phase 5 — Production hardening

Deliverables:

- Security review of auth/roles/PII access.
- Backups and restore process.
- Error monitoring and logging.
- Basic privacy policy/terms/disclaimer placeholders.
- Launch checklist.
- Private test order flow.

Acceptance criteria:

- No obvious role leakage between manufacturers.
- Secrets are managed in platform secret manager, not repo.
- DB backup path is documented.
- Test order can be completed end-to-end.
- Store can soft-launch for limited US devkit sales.

### Phase 6 — DAO-native upgrade path

Deliverables:

- On-chain manufacturer registry design.
- On-chain catalog/offer/commission registry design.
- Checkout contract design.
- Card-to-chain/onramp provider research.
- Fee enforcement/bond/slashing design.
- Migration plan from manual fee tracking to protocol-enforced settlement.

Acceptance criteria:

- V1 order/catalog IDs map cleanly to protocol IDs.
- Existing order commitment hashes remain meaningful.
- Store can support both legacy manufacturer-direct payments and on-chain checkout during transition.

## 7. Development instructions

### Repository conventions

- Treat catalog IDs as stable external identifiers.
- Never use display names as primary keys.
- Keep product/manufacturer/offer truth in `arrow-catalog` unless it is private or operational.
- Keep order/customer/fulfillment data in the store DB.
- Avoid storing PII in logs, analytics, public exports, or on-chain payloads.

### Data model requirements

Every order should include:

- stable `order_id`
- `customer_id`
- `manufacturer_id`
- line items referencing catalog `product_id` and `offer_id`
- checkout group ID
- region/country
- payment provider/mode
- payment status
- fulfillment status
- DAO fee bps/amount/status
- commitment hash fields/version
- audit events

Every manufacturer should include:

- stable `manufacturer_id`
- allowed regions
- admin users
- supported payment methods
- fulfillment contact/config
- active/inactive status

### Security instructions

- Use least-privilege roles.
- Manufacturer users only access their manufacturer’s orders.
- DAO finance role should prefer aggregate/fee reports without customer PII.
- Store secrets in platform secret manager.
- Do not commit `.env` files with real secrets.
- Audit admin and manufacturer status changes.
- Treat customer PII as sensitive by default.

### Payment instructions

- Implement payment as an interface, not a one-off redirect.
- V1 provider can be manual invoice/payment link.
- Store should record payment state but should not require Arrow to custody funds.
- Make DAO fee calculation explicit at order creation.
- Do not assume Stripe Connect is available.
- Leave room for future on-chain checkout where the same order model can be settled by contract.

### Infrastructure instructions

Terraform/OpenTofu can manage:

- DNS records for `store.arrowair.com`
- hosting project/config
- database/project resources where provider supports it
- storage buckets
- service accounts
- environment/secret references
- staging/production separation

Do not use Terraform to manage individual customer orders, manufacturer fulfillment state, or day-to-day commerce data.

### Testing instructions

Minimum tests/checks:

- catalog import validation
- product page generation from catalog fixtures
- manufacturer region eligibility
- cart cannot mix incompatible checkout groups
- order creation stores correct line items and manufacturer assignment
- role-based access control tests
- DAO fee calculation tests
- order commitment hash determinism tests

## 8. Open questions

- What stack should the independent store app use?
- Should the first payment mode be invoice-first or manufacturer checkout link first?
- What database/auth provider best balances speed, security, and Terraform management?
- How much of the current `arrow-catalog` schema needs to change before store integration?
- What is the exact v1 DAO commission rate and when is it owed?
- What minimum disclaimers/terms are needed before accepting real payments?
- How should customer support messages be handled: email, Discord, app inbox, or external helpdesk?
- What country/state tax obligations apply to Thomas’s first US sales?

## 9. Recommended immediate next steps

1. Decide the store repo name and stack.
2. Add a lightweight architecture decision record for the chosen stack.
3. Review `arrow-catalog` schema against the V1 order/offer needs.
4. Create initial `arrow-store` repo with placeholder app and CI.
5. Implement catalog import and Quiver devkit page.
6. Implement manufacturer-scoped cart and checkout intake.
7. Implement admin/manufacturer order workflow.
8. Add DAO fee tracking and commitment hashes before any public launch.
