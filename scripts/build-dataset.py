#!/usr/bin/env python3
"""Convert raw Enter the Gungeon data (guns.csv, items.csv, synergies.v3.json)
into a single normalized dataset.json bundled with the app (src/lib/game-data.ts).

Item icon URLs are resolved separately by scripts/resolve-images.mjs (network);
this script carries any existing `imageUrl` over so a rebuild is offline-safe.

Source data: https://github.com/verrchu/etg (datamined, mirrors the Fandom wiki).
"""
import csv
import html
import json
import re
import os

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
OUT = os.path.join(HERE, "..", "src", "lib", "data", "dataset.json")

VALID_QUALITY = {"D", "C", "B", "A", "S"}

# The datamined source strips inline wiki sprites (money/casings, item icons)
# from effect/description text, leaving blank gaps (a double space). Restore the
# missing word so the text reads correctly instead of rendering a blank. Keyed
# by the raw string as it appears in synergies.v3.json / items.csv.
SPRITE_FIXUPS = {
    # Item descriptions (items.csv effect column)
    "Increases the chance to find  shells upon completing rooms.":
        "Increases the chance to find shells upon completing rooms.",
    "Grants 500  on pickup.": "Grants 500 money on pickup.",
    "Grants 250  and 3 .": "Grants 250 money and 3 keys.",
    # Synergy effects (synergies.v3.json)
    "Lil' Bomber's bombs become gold and spawn  every time they hit an enemy.":
        "Lil' Bomber's bombs become gold and spawn money every time they hit an enemy.",
    "Tables have a 15% chance to be golden. Flipping a golden table will cause "
    "all normal enemies in the room to drop 2 to 6 extra  upon death. Golden "
    "tables will not automatically flip due to Table Tech Money.":
        "Tables have a 15% chance to be golden. Flipping a golden table will cause "
        "all normal enemies in the room to drop 2 to 6 extra money upon death. "
        "Golden tables will not automatically flip due to Table Tech Money.",
    "Chance for the Green Guon Stone to heal upon taking damage is raised to 70% "
    "if that damage would have killed the player. 20  also appears whenever Green "
    "Guon Stone heals the player.":
        "Chance for the Green Guon Stone to heal upon taking damage is raised to 70% "
        "if that damage would have killed the player. 20 money also appears whenever "
        "Green Guon Stone heals the player.",
    "Allows the player to make purchases without losing the  Ring.":
        "Allows the player to make purchases without losing the Ring of Miserly Protection.",
}


# Corrections where the datamined source disagrees with the wiki (verified via
# scripts/verify-dataset.py against the wiki's master Items/Guns tables and the
# item's own page infobox). Keyed by item name.
QUALITY_OVERRIDES = {
    "Finished Gun": "D",
}


def fix_sprites(text: str | None) -> str | None:
    """Restore words for wiki sprites stripped from the datamined source."""
    if text is None:
        return None
    text = SPRITE_FIXUPS.get(text, text)
    # Collapse leftover double spaces (stripped sprites, sentence spacing).
    return re.sub(r"  +", " ", text)


def clean_text(text: str | None) -> str | None:
    """Undo wiki HTML escaping and normalise whitespace in display text.

    The source copies raw wikitext, so entities like `&#160;` (non-breaking
    space), `&lt;` and `&gt;` leak through and would render literally in the
    browser (React escapes strings, so entities are shown verbatim).
    """
    text = fix_sprites(text)
    if text is None:
        return None
    text = html.unescape(text).replace("\u00a0", " ")
    return re.sub(r"  +", " ", text).strip()


def slugify(name: str) -> str:
    s = name.lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def clean(val: str | None) -> str | None:
    if val is None:
        return None
    val = val.strip()
    return val or None


def read_rows(path: str):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh, delimiter="|"))


def quality(raw: str | None) -> str:
    raw = (raw or "").strip().upper()
    return raw if raw in VALID_QUALITY else "N"


def load_existing_images() -> dict[str, str]:
    """imageUrl per item id from the previous dataset.json (if any)."""
    if not os.path.exists(OUT):
        return {}
    with open(OUT, encoding="utf-8") as fh:
        previous = json.load(fh)
    return {
        it["id"]: it["imageUrl"]
        for it in previous.get("items", [])
        if it.get("imageUrl")
    }


def main() -> None:
    items: dict[str, dict] = {}  # id -> item
    name_to_id: dict[str, str] = {}
    existing_images = load_existing_images()

    def add_item(name, type_, qual, description, quote):
        name = name.strip()
        qual = QUALITY_OVERRIDES.get(name, qual)
        description = clean_text(description)
        quote = clean_text(quote)
        iid = slugify(name)
        if iid in items:
            # Keep the first occurrence; prefer a non-empty description if the
            # first was blank.
            if not items[iid]["description"] and description:
                items[iid]["description"] = description
            return iid
        items[iid] = {
            "id": iid,
            "name": name,
            "type": type_,
            "quality": qual,
            "description": description or f"{name}.",
            "quote": quote,
        }
        if iid in existing_images:
            items[iid]["imageUrl"] = existing_images[iid]
        name_to_id[name] = iid
        return iid

    # --- Guns ---
    for g in read_rows(os.path.join(RAW, "guns.csv")):
        add_item(
            g["name"],
            "gun",
            quality(g.get("tier")),
            clean(g.get("notes")) or "",
            clean(g.get("quote")),
        )

    # --- Items (passives / actives) ---
    # Master Round appears as 5 identical rows; synergies reference the roman
    # numeral variants "Master Round I".."Master Round V". Expand them.
    master_round_seen = 0
    roman = ["I", "II", "III", "IV", "V"]
    for it in read_rows(os.path.join(RAW, "items.csv")):
        name = it["name"].strip()
        type_ = "active" if it.get("type", "").strip().lower() == "active" else "passive"
        if name == "Master Round":
            variant = f"Master Round {roman[master_round_seen]}"
            master_round_seen += 1
            add_item(
                variant,
                type_,
                quality(it.get("tier")),
                clean(it.get("effect")) or "Grants a heart container.",
                clean(it.get("quote")),
            )
            continue
        add_item(
            name,
            type_,
            quality(it.get("tier")),
            clean(it.get("effect")) or "",
            clean(it.get("quote")),
        )

    # --- Synergies ---
    syn_raw = json.load(open(os.path.join(RAW, "synergies.v3.json"), encoding="utf-8"))
    synergies = []
    missing_refs = set()

    def resolve(node) -> str | None:
        name = node.get("item") or node.get("gun")
        if not name:
            return None
        iid = slugify(name)
        if iid not in items:
            missing_refs.add(name)
            return None
        return iid

    def leaf_ids(node) -> list[str]:
        """Item ids for a leaf node: {single}, {one_of: [...]}, or bare {item|gun}."""
        if "single" in node:
            alts = [node["single"]]
        elif "one_of" in node:
            alts = node["one_of"]
        else:
            alts = [node]
        return [iid for iid in (resolve(alt) for alt in alts) if iid]

    def groups_from(node, next_index, components, group_minimums) -> int:
        """Append the group(s) a part node describes; return how many were added.

        A group is a set of interchangeable items. It is satisfied when at least
        `minItems` of them are owned (1 unless the node is `two_of`).

        - {single}/{one_of}/bare -> one group, any member satisfies it
        - {two_of: [...]}         -> one group needing two distinct members
                                     (e.g. Chief Master: any two Master Rounds)
        - {all_of: [...]}         -> one mandatory group per member
        """
        if "all_of" in node:
            added = 0
            for sub in node["all_of"]:
                added += groups_from(sub, next_index + added, components, group_minimums)
            return added
        if "two_of" in node:
            ids = [iid for sub in node["two_of"] for iid in leaf_ids(sub)]
            if len(ids) < 2:
                return 0
            for iid in ids:
                components.append({"itemId": iid, "groupIndex": next_index})
            group_minimums.append({"groupIndex": next_index, "minItems": 2})
            return 1
        ids = leaf_ids(node)
        for iid in ids:
            components.append({"itemId": iid, "groupIndex": next_index})
        return 1 if ids else 0

    for name, s in syn_raw.items():
        parts = s["parts"]
        components: list[dict] = []
        group_minimums: list[dict] = []
        required_groups = 2

        if "all_of" in parts:
            # Every listed part is its own mandatory group.
            required_groups = groups_from(parts, 0, components, group_minimums)
        elif "two_of" in parts:
            # Any two of the listed parts (each part is its own group).
            for i, node in enumerate(parts["two_of"]):
                groups_from(node, i, components, group_minimums)
            required_groups = 2
        else:  # left / right — both sides mandatory
            left_groups = groups_from(parts["left"], 0, components, group_minimums)
            right_groups = groups_from(parts["right"], left_groups, components, group_minimums)
            # Only count a side if all of its groups resolved; otherwise the
            # synergy could never trigger and is skipped below.
            left_ok = left_groups > 0 and (
                "all_of" not in parts["left"] or left_groups == len(parts["left"]["all_of"])
            )
            right_ok = right_groups > 0 and (
                "all_of" not in parts["right"] or right_groups == len(parts["right"]["all_of"])
            )
            required_groups = left_groups + right_groups if left_ok and right_ok else 0

        # Skip synergies we couldn't fully resolve (missing every component of a
        # required group) to avoid impossible-to-trigger rows.
        distinct_groups = len({c["groupIndex"] for c in components})
        if not components or distinct_groups < required_groups or required_groups < 1:
            continue

        synergy = {
            "id": slugify(name),
            "name": name,
            "effect": clean_text(s["effect"]),
            "requiredGroups": required_groups,
            "components": components,
        }
        if group_minimums:
            synergy["groupMinimums"] = group_minimums
        synergies.append(synergy)

    dataset = {
        "items": list(items.values()),
        "synergies": synergies,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(dataset, fh, indent=2, ensure_ascii=False)

    print(f"items: {len(dataset['items'])}")
    print(f"synergies: {len(dataset['synergies'])}")
    if missing_refs:
        print(f"unresolved names ({len(missing_refs)}): {sorted(missing_refs)[:20]}")


if __name__ == "__main__":
    main()
