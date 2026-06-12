#!/usr/bin/env python3
"""Lightweight catalog validation using only the Python standard library.

This does not replace full JSON Schema validation. It catches malformed JSON,
missing top-level required fields, duplicate IDs, and broken cross-references so
catalog PRs have a fast local sanity check without extra dependencies.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog"


def load_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:  # noqa: BLE001 - keep validator dependency-free/simple
        raise SystemExit(f"{path}: failed to parse JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise SystemExit(f"{path}: expected top-level object")
    return data


def require(path: Path, data: dict[str, Any], fields: list[str]) -> None:
    missing = [field for field in fields if field not in data]
    if missing:
        raise SystemExit(f"{path}: missing required fields: {', '.join(missing)}")


def index_by_id(kind: str, paths: list[Path], required: list[str]) -> dict[str, dict[str, Any]]:
    seen: dict[str, dict[str, Any]] = {}
    for path in paths:
        data = load_json(path)
        require(path, data, required)
        item_id = data["id"]
        if item_id in seen:
            raise SystemExit(f"duplicate {kind} id: {item_id}")
        seen[item_id] = data
    return seen


def main() -> int:
    manufacturers = index_by_id(
        "manufacturer",
        sorted((CATALOG / "manufacturers").glob("*.json")),
        ["id", "displayName", "approved", "merchantOfRecord"],
    )
    checkout_groups = index_by_id(
        "checkout group",
        sorted((CATALOG / "checkout-groups").glob("*.json")),
        ["id", "manufacturerId", "immediatePayment", "supportsMultipleItems"],
    )
    products = index_by_id(
        "product",
        sorted((CATALOG / "products").glob("*.json")),
        ["id", "slug", "name", "offers", "supportPolicyId", "warrantyPolicyId"],
    )

    policy_ids = {path.stem for path in (CATALOG / "policies").glob("*.md")}

    for group_id, group in checkout_groups.items():
        manufacturer_id = group["manufacturerId"]
        if manufacturer_id not in manufacturers:
            raise SystemExit(f"checkout group {group_id}: unknown manufacturerId {manufacturer_id}")

    for product_id, product in products.items():
        for entry in product.get("compatibleWith", []):
            if entry not in products:
                raise SystemExit(f"product {product_id}: unknown compatibleWith id {entry}")

        group_ids: set[str] = set()
        option_groups = product.get("optionGroups", [])
        if not isinstance(option_groups, list):
            raise SystemExit(f"product {product_id}: optionGroups must be an array")
        for group in option_groups:
            if not isinstance(group, dict):
                raise SystemExit(f"product {product_id}: option group must be an object")
            require(Path(f"product:{product_id}"), group, ["id", "label", "selection", "productIds"])
            if group["id"] in group_ids:
                raise SystemExit(f"product {product_id}: duplicate option group id {group['id']}")
            group_ids.add(group["id"])
            for option_product_id in group["productIds"]:
                if option_product_id == product_id:
                    raise SystemExit(
                        f"product {product_id}: option group {group['id']} references the product itself"
                    )
                if option_product_id not in products:
                    raise SystemExit(
                        f"product {product_id}: option group {group['id']} references "
                        f"unknown product {option_product_id}"
                    )

    offer_ids: set[str] = set()
    for product_id, product in products.items():
        if product["supportPolicyId"] not in policy_ids:
            raise SystemExit(f"product {product_id}: unknown supportPolicyId {product['supportPolicyId']}")
        if product["warrantyPolicyId"] not in policy_ids:
            raise SystemExit(f"product {product_id}: unknown warrantyPolicyId {product['warrantyPolicyId']}")

        offers = product["offers"]
        if not isinstance(offers, list):
            raise SystemExit(f"product {product_id}: offers must be an array")
        for offer in offers:
            if not isinstance(offer, dict):
                raise SystemExit(f"product {product_id}: offer must be an object")
            require(Path(f"product:{product_id}"), offer, ["id", "manufacturerId", "checkoutGroupId", "checkout"])
            offer_id = offer["id"]
            if offer_id in offer_ids:
                raise SystemExit(f"duplicate offer id: {offer_id}")
            offer_ids.add(offer_id)

            manufacturer_id = offer["manufacturerId"]
            checkout_group_id = offer["checkoutGroupId"]
            if manufacturer_id not in manufacturers:
                raise SystemExit(f"offer {offer_id}: unknown manufacturerId {manufacturer_id}")
            if checkout_group_id not in checkout_groups:
                raise SystemExit(f"offer {offer_id}: unknown checkoutGroupId {checkout_group_id}")
            if checkout_groups[checkout_group_id]["manufacturerId"] != manufacturer_id:
                raise SystemExit(
                    f"offer {offer_id}: checkout group {checkout_group_id} belongs to "
                    f"{checkout_groups[checkout_group_id]['manufacturerId']}, not {manufacturer_id}"
                )
            checkout = offer["checkout"]
            if offer.get("status") not in {"quote-required", "waitlist", "coming-soon", "out-of-stock", "hidden"}:
                if checkout.get("immediatePayment") is not True:
                    raise SystemExit(f"offer {offer_id}: available offers must support immediate payment")

    print(
        f"catalog ok: {len(products)} products, {len(manufacturers)} manufacturers, "
        f"{len(checkout_groups)} checkout groups, {len(offer_ids)} offers"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
