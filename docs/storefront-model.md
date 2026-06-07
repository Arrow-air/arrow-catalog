# Storefront model

The Arrow website should use the catalog as structured store/protocol data, not as a one-page-per-SKU CMS.

## Page types

### 1. Store landing page

Route example: `/store`

Purpose:

- show major products and categories
- highlight Quiver DevKit
- link to generated category pages for parts/accessories/spares

Data source:

- catalog product list
- category/status/short description
- selected image/media URLs when added

### 2. Flagship ordering/configurator pages

Route example: `/store/quiver-devkit`

Purpose:

- custom page for a major product
- rich website-owned copy, media, safety/disclaimer presentation, and explanation
- catalog-backed order builder

The Quiver page should not be a single static SKU. It should be a configured cart builder:

1. Choose base manufacturer/region/offer, e.g. Thomas/Texas or Julius/Germany.
2. Show compatible add-ons from the same manufacturer checkout group:
   - carrying case
   - RC remote
   - batteries/chargers if offered
   - spare propellers
   - spare cables
   - attachment kits
3. Customer selects optional add-ons and quantities.
4. Website builds a manufacturer-scoped cart from selected offer IDs.
5. Customer checks out through that manufacturer's checkout group.

MVP rule: one checkout equals one manufacturer merchant of record. If selected items come from different manufacturers, split into separate checkouts or prevent that combination until routing is solved.

### 3. Generated item pages

Route examples:

- `/store/parts/quiver-spare-propellers`
- `/store/accessories/quiver-carrying-case`
- `/store/cables/xt60-power-cable`

Purpose:

- small parts and accessories should not need custom website pages
- render automatically from catalog fields
- show offers, compatibility, standards links, and checkout buttons

Generated pages should be enough for ordinary catalog items that do not need launch/marketing treatment.

### 4. Category/listing pages

Route examples:

- `/store/parts`
- `/store/accessories`
- `/store/spares`
- `/store/quiver-compatible`

Purpose:

- browse many small items
- filter by product compatibility, manufacturer, region, status, and category

## Catalog fields likely needed

The current catalog can support the first pass, but the storefront will probably need a few additional fields soon.

### Product compatibility

Used to answer: "Can this accessory be offered on the Quiver DevKit ordering page?"

Example:

```json
"compatibleWith": ["quiver-devkit-v0"]
```

### Product role

Used to group options on flagship configurator pages.

Example:

```json
"storeRole": "optional-addon"
```

Possible roles:

- `base-product`
- `optional-addon`
- `required-choice`
- `replacement-part`
- `consumable`
- `service`

### Option groups

Used by the website to render sections on a configurator page.

Example for a Quiver DevKit page:

```json
"optionGroups": [
  {
    "id": "field-equipment",
    "label": "Field equipment",
    "selection": "multiple",
    "productIds": ["quiver-carrying-case", "quiver-rc-remote"]
  },
  {
    "id": "spares",
    "label": "Spares",
    "selection": "multiple",
    "productIds": ["quiver-spare-propellers", "quiver-spare-cables"]
  }
]
```

This may live in the catalog if it is considered canonical product packaging/offer structure. If it becomes mostly UI/presentation, it can live in the website and reference catalog product IDs.

### Images/media

Basic product image URLs are appropriate in the catalog because they identify the item and help generated pages.

Richer galleries, launch visuals, animations, and page-specific media treatment should live in the website repo.

Example:

```json
"media": {
  "primaryImage": "https://.../quiver-spare-propellers.png"
}
```

## Recommended MVP website behavior

1. Build a custom Quiver DevKit page in the website repo.
2. Pull base Quiver offers from the catalog.
3. Pull compatible optional add-ons from the catalog by `compatibleWith` and/or explicit option groups.
4. Let customers select add-ons and quantities.
5. Build one cart per manufacturer checkout group.
6. Send the customer to the manufacturer-owned checkout.
7. Generate simple pages/listings for small parts and accessories directly from catalog entries.

## Mental model

- Catalog repo answers: what products/offers/manufacturers exist, how they relate, and what could later be DAO-governed/on-chain.
- Website repo answers: how customers experience, understand, configure, and buy those products.
