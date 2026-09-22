#!/usr/bin/env python3
"""Generate web/shelf-data.js from data/shelf.json.

    python3 tools/shelfgen.py           rewrite web/shelf-data.js
    python3 tools/shelfgen.py --check   fail if it is out of date

Same contract as navgen.py, and for the same reason. The shelf is a
catalogue of somebody else's documents: titles change, URLs rot, guides
get added and withdrawn. Hand-maintaining a JavaScript literal is how a
link quietly starts 404-ing and nobody notices, because the page still
renders perfectly and just sends people nowhere.

So data/shelf.json is the source of truth, this generates the shipped
file, and --check runs in build.sh so an edit to the wrong file fails the
build instead of reaching the server.

WHAT THIS CHECK DOES NOT DO: touch the network. Whether a URL still
resolves is tools/shelf_verify.py's job, run deliberately, because a
build that makes HTTP calls fails on a bad hotel wifi and teaches people
to work around it.
"""

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "shelf.json"
OUT = ROOT / "web" / "shelf-data.js"

REQUIRED = ("id", "source", "action", "blurb", "title", "where", "url",
            "button", "mode", "capacity", "reach", "disposition", "verified",
            "family", "form")
MODES = {"understand", "do", "both"}
REACH = {"group", "solo", "either"}
DISPOSITIONS = {"make", "talk", "dig", "showup", "support", "learn"}


def validate(db):
    """Everything checkable without a network, checked before it ships."""
    problems = []
    seen = set()
    lib = db.get("library")
    if not lib:
        return ["no `library` block: a library must declare its own rule, "
                "families and time vocabulary rather than hardcode them"]
    # Declared per library, never hardcoded — that is what makes the format
    # portable to a collection about something else entirely.
    CAPS = set(lib["capacities"])
    FAMILIES = set(lib["families"])
    FORMS = set(lib["forms"])
    if lib.get("visibility") not in ("public", "private"):
        problems.append("library.visibility must be 'public' or 'private' — "
                        "it decides what may be on the shelf at all, not just "
                        "who can see it")
    if lib.get("visibility") == "private" and not lib.get("access"):
        problems.append("a private library must declare how access is "
                        "controlled: obscurity, passphrase or accounts")
    for key, fam in lib["families"].items():
        for f in ("label", "note", "colour", "emblem"):
            if not fam.get(f):
                problems.append(f"family {key!r}: missing {f}")
    for it in db["items"]:
        where = it.get("id", "<no id>")
        for f in REQUIRED:
            if not it.get(f):
                problems.append(f"{where}: missing {f}")
        if it.get("id") in seen:
            problems.append(f"{where}: duplicate id")
        seen.add(it.get("id"))
        if it.get("source") not in db["sources"]:
            problems.append(f"{where}: unknown source {it.get('source')!r}")
        if it.get("mode") not in MODES:
            problems.append(f"{where}: mode {it.get('mode')!r}")
        if it.get("capacity") not in CAPS:
            problems.append(f"{where}: capacity {it.get('capacity')!r} "
                            f"is not one this library declares")
        if it.get("family") not in FAMILIES:
            problems.append(f"{where}: family {it.get('family')!r} "
                            f"is not one this library declares")
        if it.get("form") not in FORMS:
            problems.append(f"{where}: form {it.get('form')!r}")
        if it.get("reach") not in REACH:
            problems.append(f"{where}: reach {it.get('reach')!r}")
        bad = set(it.get("disposition") or []) - DISPOSITIONS
        if bad:
            problems.append(f"{where}: disposition {sorted(bad)}")
        if not it.get("disposition"):
            problems.append(f"{where}: no disposition, so nothing can match it")
        # An outline that nobody read is a fabricated outline waiting to
        # happen. The two fields have to agree.
        if it.get("outline") and not it.get("outline_read"):
            problems.append(f"{where}: has an outline with no outline_read date")
        if it.get("outline_read") and not it.get("outline"):
            problems.append(f"{where}: outline_read set but no outline")
    return problems


def shippable(db):
    """Entries the page may serve.

    A flagged entry is one whose CONTENTS name a party, a figure or a
    contested position, even where its title and format are a capability
    — something only reading the guide reveals, which is why this exists
    at all. Held back rather than deleted, because the page's welcome is
    explicitly cross-partisan and serving these by default would
    contradict it before the reader got to the first question.

    Clearing one is a one-word edit in data/shelf.json, and Bill's call.
    """
    return [i for i in db["items"]
            if not i.get("framing_flag") or i.get("framing_cleared")]


def render(db):
    items = []
    for it in shippable(db):
        items.append({k: it[k] for k in (
            "id", "action", "blurb", "title", "where", "url", "button",
            "mode", "capacity", "reach", "disposition",
            "family", "form", "spine") if k in it})
        items[-1]["outline"] = it.get("outline")
    library = json.dumps(db["library"], indent=2, ensure_ascii=False)
    src = db["sources"]["opet"]
    body = json.dumps(items, indent=2, ensure_ascii=False)
    held = [i for i in db["items"] if i not in shippable(db)]
    stats = json.dumps({
        "considered": len(db["items"]) + len(db["excluded"]),
        "carried": len(shippable(db)),
        "held": len(held),
        "outOfScope": len(db["excluded"]),
        "read": sum(1 for i in db["items"] if i.get("outline")),
        "source": src["name"],
        "sourceHref": src["index"],
    }, indent=2, ensure_ascii=False)
    return f"""/* GENERATED by tools/shelfgen.py from data/shelf.json — do not edit.
 *
 * The shelf: capability resources, sorted out of the pantry by one test —
 * does this teach a capability the reader keeps? What was left off, and
 * why, is recorded in data/shelf.json rather than lost, so the sorting
 * stays auditable and reversible.
 *
 * Those are SCOPE decisions about this project, not judgements about the
 * documents or their publisher. This shelf carries no policy asks, no
 * pledges and no campaign activity — from any source, including our own.
 *
 * `outline` is null wherever nobody has read the guide yet. It is never
 * inferred from a title: inventing the contents of somebody else's
 * document is exactly what the primary-source rule forbids, and a
 * plausible outline is worse than none because nobody checks it.
 *
 * Nothing here is hosted. These are their documents and we link to them.
 */

const SHELF_SOURCE = {{
  name: {json.dumps(src["name"], ensure_ascii=False)},
  href: {json.dumps(src["index"], ensure_ascii=False)},
}};

const SHELF = {body};

/* The library declares its own rule, families and time vocabulary, so the
 * renderer holds no knowledge of this particular subject. */
const LIBRARY = {library};

/* Counts for the shelf page, generated so they cannot drift from the data.
 * "considered" is everything we looked at in this collection. */
const SHELF_STATS = {stats};
"""


def main():
    db = json.loads(DB.read_text())
    problems = validate(db)
    if problems:
        print("FAIL: data/shelf.json")
        for p in problems:
            print("   ", p)
        raise SystemExit(1)

    want = render(db)
    check = "--check" in sys.argv[1:]
    have = OUT.read_text() if OUT.exists() else ""
    if check:
        if have != want:
            raise SystemExit(
                "FAIL: web/shelf-data.js is out of date.\n"
                "      Edit data/shelf.json, then run: python3 tools/shelfgen.py")
        ship = shippable(db)
        held = len(db["items"]) - len(ship)
        msg = (f"shelf: up to date ({len(ship)} shipping, "
               f"{sum(1 for i in ship if i.get('outline'))} with outlines")
        print(msg + (f", {held} held for framing review)" if held else ")"))
        return
    OUT.write_text(want)
    ship = shippable(db)
    held = [i["id"] for i in db["items"] if i not in ship]
    print(f"wrote web/shelf-data.js ({len(ship)} items)")
    if held:
        print(f"  held for framing review: {', '.join(held)}")


if __name__ == "__main__":
    main()
