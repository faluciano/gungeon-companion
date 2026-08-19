#!/usr/bin/env python3
"""Diff dataset.json against the Fandom wiki's master Items/Guns tables.

Fetch the raw wikitext first (cached in scripts/raw/):
  curl -s "https://enterthegungeon.fandom.com/api.php?action=parse&page=Items&format=json&prop=wikitext" -A "Mozilla/5.0" -o scripts/raw/wiki-items.json
  curl -s "https://enterthegungeon.fandom.com/api.php?action=parse&page=Guns&format=json&prop=wikitext" -A "Mozilla/5.0" -o scripts/raw/wiki-guns.json

Reports quality-tier, type, and quote mismatches. The wiki is the source of
truth; discrepancies get fixed via OVERRIDES in build-dataset.py.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))


def load_wikitext(name: str) -> str:
    path = os.path.join(HERE, "raw", name)
    with open(path) as f:
        return json.load(f)["parse"]["wikitext"]["*"]


def strip_markup(cell: str) -> str:
    """Reduce a wikitable cell to plain text."""
    cell = re.sub(r"\[\[File:[^\]]+\]\]", "", cell)
    # [[target|label]] -> label, [[target]] -> target
    cell = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", cell)
    cell = re.sub(r"\{\{Hover\|([^|}]+)\|[^}]*\}\}", r"\1", cell)
    cell = re.sub(r"'''?", "", cell)
    cell = re.sub(r"<[^>]+>", "", cell)
    return cell.strip()


def parse_rows(wikitext: str) -> list[list[str]]:
    """Parse every sortable wikitable into rows of raw cell strings."""
    rows = []
    for table in re.findall(r"\{\|[^\n]*sortable.*?\n\|\}", wikitext, re.S):
        # Rows are separated by "|-" at line start only — a cell like the
        # quote "-P-" contains "|-" mid-line and must not split the row.
        for raw_row in re.split(r"\n\|-", table)[1:]:
            # Cells start on lines beginning with | or ||; ! lines are headers.
            body = "\n".join(
                ln for ln in raw_row.split("\n") if not ln.startswith("!")
            )
            cells = [c for c in re.split(r"\|\||\n\|", body) if c.strip()]
            # Drop style-only fragments like `style="width: 80px;"`
            cells = [c for c in cells if not re.fullmatch(r"\s*[\w-]+=\"[^\"]*\"\s*", c)]
            if cells:
                rows.append(cells)
    return rows


QUALITY_RE = re.compile(r"\{\{Quality\|([NDCBAS])\}\}")
FILE_RE = re.compile(r"\[\[File:([^|\]]+)\.png", re.I)


def wiki_entries(wikitext: str, kind: str) -> dict[str, dict]:
    """Map item key -> {quality, type, quote} from a master-list wikitable."""
    entries: dict[str, dict] = {}
    for cells in parse_rows(wikitext):
        joined = "||".join(cells)
        qm = QUALITY_RE.search(joined)
        fm = FILE_RE.search(joined)
        if not qm or not fm:
            continue
        # The icon filename matches the item's real (disambiguated) name,
        # e.g. "Master Round I.png" where the Name column says "Master Round" —
        # modulo underscores, "(Gun)"/"(Item)" suffixes, and sprite variants
        # like "Ser Junkan 1".
        name = fm.group(1).replace("_", " ").strip()
        name = re.sub(r"\s*\((?:Gun|Item)\)$", "", name, flags=re.I)
        name = re.sub(r"\s+\d+$", "", name)
        stripped = [strip_markup(c) for c in cells]
        quality = qm.group(1)
        if kind == "item":
            # Icon, Name, Type, Quote, Quality, Effect
            typ = next(
                (c.lower() for c in stripped if c.lower() in ("passive", "active")),
                None,
            )
            quote_idx = 3
        else:
            typ = "gun"
            quote_idx = 3
        quote = stripped[quote_idx] if len(stripped) > quote_idx else None
        entry = {"name": name, "quality": quality, "type": typ, "quote": quote}
        entries[name.lower()] = entry
        # Fallback key: the Name column (second cell), for rows whose icon
        # filename doesn't follow the item name at all.
        if len(stripped) > 1 and stripped[1] and stripped[1].lower() not in entries:
            entries[stripped[1].lower()] = entry
    return entries


def main() -> None:
    with open(os.path.join(HERE, "..", "src", "lib", "data", "dataset.json")) as f:
        dataset = json.load(f)

    wiki = wiki_entries(load_wikitext("wiki-items.json"), "item")
    wiki.update(wiki_entries(load_wikitext("wiki-guns.json"), "gun"))

    missing, mismatches = [], []
    for item in dataset["items"]:
        entry = wiki.get(item["name"].lower())
        if entry is None:
            missing.append(item["name"])
            continue
        # Dataset uses "N" for no-quality items too.
        got_q = item.get("quality") or "N"
        if entry["quality"] != got_q:
            mismatches.append(
                f"quality  {item['name']}: dataset={got_q} wiki={entry['quality']}"
            )
        if entry["type"] and item.get("type") != entry["type"]:
            mismatches.append(
                f"type     {item['name']}: dataset={item.get('type')} wiki={entry['type']}"
            )

    print(f"wiki entries parsed: {len(wiki)}")
    print(f"dataset items:       {len(dataset['items'])}")
    print(f"not found in wiki tables ({len(missing)}):")
    for name in missing:
        print(f"  {name}")
    print(f"mismatches ({len(mismatches)}):")
    for m in mismatches:
        print(f"  {m}")


if __name__ == "__main__":
    main()
