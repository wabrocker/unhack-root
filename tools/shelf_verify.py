#!/usr/bin/env python3
"""Check the shelf against the live web. Run deliberately, never in a build.

    python3 tools/shelf_verify.py            check everything
    python3 tools/shelf_verify.py --stale 90 also flag entries older than N days
    python3 tools/shelf_verify.py --json     machine-readable

What it checks, per entry and per excluded entry:

  * the URL still resolves
  * the page's own <title> still looks like the title we recorded, which is
    how a silently rewritten or replaced guide gets caught
  * how long ago we verified it, and how long ago anybody read it

What it CANNOT check is whether an outline is still accurate — a guide can
be rewritten under the same title and the same URL. So an old outline_read
date is reported as something for a human to re-read, not as a pass.

It reports and exits 0 unless something is actually broken. It never edits
data/shelf.json: what to do about a dead link is a judgement, and a script
that silently rewrites the catalogue would be the failure it exists to
catch.
"""

import argparse
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "shelf.json"
UA = "unhack-root shelf_verify (+https://unhackdemocracy.us)"
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.S | re.I)


def norm(s):
    s = re.sub(r"&#8217;|&#8216;|&rsquo;|&lsquo;", "'", s)
    s = re.sub(r"&#8220;|&#8221;|&ldquo;|&rdquo;", '"', s)
    s = re.sub(r"&amp;", "&", s)
    s = re.sub(r"[^a-z0-9]+", " ", s.lower())
    return s.strip()


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read(200_000).decode("utf-8", "replace")


def days_since(iso):
    if not iso:
        return None
    try:
        return (dt.date.today() - dt.date.fromisoformat(iso)).days
    except ValueError:
        return None


def check(entry, stale):
    out = {"title": entry.get("title"), "url": entry.get("url"), "flags": []}
    url = entry.get("url")
    if not url:
        out["flags"].append(("ERROR", "no url"))
        return out
    try:
        status, body = fetch(url)
    except urllib.error.HTTPError as e:
        out["flags"].append(("ERROR", f"HTTP {e.code}"))
        return out
    except Exception as e:                       # noqa: BLE001 — report, don't crash
        out["flags"].append(("ERROR", f"unreachable: {type(e).__name__}"))
        return out

    if status != 200:
        out["flags"].append(("ERROR", f"HTTP {status}"))

    m = TITLE_RE.search(body)
    page_title = norm(m.group(1)) if m else ""
    recorded = norm(entry["title"])
    # Substring both ways: sites append " — Site Name", and we sometimes
    # record a shorter label than the page carries.
    if page_title and recorded not in page_title and page_title.split(" ")[0:3] != recorded.split(" ")[0:3]:
        out["flags"].append(("CHANGED", f"page title is {m.group(1).strip()[:70]!r}"))

    v = days_since(entry.get("verified"))
    if stale and v is not None and v > stale:
        out["flags"].append(("STALE", f"last verified {v} days ago"))
    if entry.get("outline"):
        o = days_since(entry.get("outline_read"))
        if stale and o is not None and o > stale:
            out["flags"].append(("REREAD", f"outline read {o} days ago; may be out of date"))
    elif "outline" in entry:
        out["flags"].append(("UNREAD", "no outline — nobody has read this guide"))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stale", type=int, default=90,
                    help="flag entries not verified in this many days (0 to skip)")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    db = json.loads(DB.read_text())
    results = {"items": [], "excluded": []}
    for entry in db["items"]:
        results["items"].append(check(entry, args.stale))
    for entry in db["excluded"]:
        r = check(dict(entry, outline=None), args.stale)
        r["flags"] = [f for f in r["flags"] if f[0] != "UNREAD"]
        results["excluded"].append(r)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for bucket in ("items", "excluded"):
            print(f"\n=== {bucket} ===")
            for r in results[bucket]:
                if not r["flags"]:
                    print(f"  ok       {r['title'][:64]}")
                for kind, msg in r["flags"]:
                    print(f"  {kind:<8} {r['title'][:52]} — {msg}")

    broken = sum(1 for b in results.values() for r in b
                 for k, _ in r["flags"] if k in ("ERROR", "CHANGED"))
    print(f"\n{broken} entr{'y needs' if broken == 1 else 'ies need'} attention.")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
