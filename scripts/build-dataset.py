#!/usr/bin/env python3
"""Convert raw Enter the Gungeon data (guns.csv, items.csv, synergies.v3.json)
into a single normalized dataset.json consumed by the DB seed script.

Source data: https://github.com/verrchu/etg (datamined, mirrors the Fandom wiki).
"""
import csv
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


def fix_sprites(text: str | None) -> str | None:
    """Restore words for wiki sprites stripped from the datamined source."""
    if text is None:
        return None
    return SPRITE_FIXUPS.get(text, text)


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


def main() -> None:
    items: dict[str, dict] = {}  # id -> item
    name_to_id: dict[str, str] = {}

    def add_item(name, type_, qual, description, quote):
        name = name.strip()
        description = fix_sprites(description)
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

    def group_from(node, group_index, components):
        """Add a single group (list of alternative item ids) to components."""
        ids = []
        if "single" in node:
            iid = resolve(node["single"])
            if iid:
                ids.append(iid)
        elif "one_of" in node:
            for alt in node["one_of"]:
                iid = resolve(alt)
                if iid:
                    ids.append(iid)
        else:  # bare {item|gun}
            iid = resolve(node)
            if iid:
                ids.append(iid)
        for iid in ids:
            components.append({"itemId": iid, "groupIndex": group_index})
        return len(ids) > 0

    for name, s in syn_raw.items():
        parts = s["parts"]
        components: list[dict] = []
        required_groups = 2

        if "all_of" in parts:
            # Every listed part is its own mandatory group.
            groups_ok = 0
            for i, node in enumerate(parts["all_of"]):
                if group_from(node, i, components):
                    groups_ok += 1
            required_groups = groups_ok
        elif "two_of" in parts:
            # Any two of the listed parts.
            for i, node in enumerate(parts["two_of"]):
                group_from(node, i, components)
            required_groups = 2
        else:  # left / right
            left_ok = group_from(parts["left"], 0, components)
            right_ok = group_from(parts["right"], 1, components)
            required_groups = (1 if left_ok else 0) + (1 if right_ok else 0)

        # Skip synergies we couldn't fully resolve (missing every component of a
        # required group) to avoid impossible-to-trigger rows.
        distinct_groups = len({c["groupIndex"] for c in components})
        if not components or distinct_groups < required_groups or required_groups < 1:
            continue

        synergies.append(
            {
                "id": slugify(name),
                "name": name,
                "effect": fix_sprites(s["effect"]),
                "requiredGroups": required_groups,
                "components": components,
            }
        )

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
