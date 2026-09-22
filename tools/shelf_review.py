#!/usr/bin/env python3
"""Print the shelf for review, from data/shelf.json.

    python3 tools/shelf_review.py            the sheet
    python3 tools/shelf_review.py --who      only the worked examples
    python3 tools/shelf_review.py --tags     only the per-item tags

Generated rather than written down, so it cannot go stale: re-run it after
any edit to data/shelf.json and it tells you what actually changed.

TWO VIEWS, BECAUSE TAGS ARE THE WRONG THING TO REVIEW ALONE.

Judging whether an item is "understand" or "do" in the abstract is hard
and the answer does not feel like anything. Judging whether a person with
twenty minutes and nobody to talk to should be handed THIS is easy, and it
is the question the tags exist to answer. So the sheet shows the tags for
precision and a set of worked examples for sanity, and disagreeing with an
example is usually how you find a wrong tag.
"""

import itertools
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = json.loads((ROOT / "data" / "shelf.json").read_text())

# Read from the data, not hardcoded: this tool works on any library in
# the format, not only this one.
LIB = DB["library"]
CAP = {k: v["thickness"] for k, v in LIB["capacities"].items()}
CAP_LABEL = {k: v["label"][:9] for k, v in LIB["capacities"].items()}
FAM = LIB["families"]
DISPOSITIONS = ["talk", "dig", "make", "showup", "support", "learn"]
DISP_LABEL = {"talk": "talking", "dig": "digging", "make": "making",
              "showup": "showing up", "support": "backing", "learn": "learning"}


def shipping():
    return [i for i in DB["items"]
            if not i.get("framing_flag") or i.get("framing_cleared")]


def score(item, a):
    if CAP[item["capacity"]] > CAP[a["capacity"]]:
        return -1
    s = 3 - (CAP[a["capacity"]] - CAP[item["capacity"]])
    if item["reach"] == "group" and a["reach"] != "group":
        return -1
    if item["reach"] == a["reach"]:
        s += 2
    if item["mode"] in (a["mode"], "both"):
        s += 3
    hits = len(set(item["disposition"]) & set(a["disposition"]))
    if hits:
        s += 4 + (hits - 1)
    return s


def rank(items, a):
    out = [(score(i, a), i) for i in items]
    return [i for s, i in sorted((x for x in out if x[0] >= 0),
                                 key=lambda x: -x[0])]


def all_answers():
    for mode, cap, reach in itertools.product(
            ("understand", "do"), CAP, ("group", "solo")):
        for r in range(1, len(DISPOSITIONS) + 1):
            for combo in itertools.combinations(DISPOSITIONS, r):
                yield {"mode": mode, "capacity": cap, "reach": reach,
                       "disposition": list(combo)}


def shares(items):
    """How often each item is the single thing someone is handed.

    Ties are SPLIT, because that is what the page now does. next.js
    shuffles within each equal-score band rather than letting position in
    the data file decide, so an item tied with three others is offered to
    about a quarter of the people in that cell. Counting first-past-the-
    post here would report a distribution no reader ever experiences.
    """
    top, total, tied = {}, 0, 0
    for a in all_answers():
        total += 1
        scored = [(score(i, a), i["id"]) for i in items]
        scored = [x for x in scored if x[0] >= 0]
        if not scored:
            continue
        best = max(s for s, _ in scored)
        winners = [i for s, i in scored if s == best]
        if len(winners) > 1:
            tied += 1
        for w in winners:
            top[w] = top.get(w, 0) + 1.0 / len(winners)
    return top, total, tied


WHO = [
    ("20 min, on my own, wants to understand first",
     dict(mode="understand", capacity="minutes", reach="solo", disposition=["learn"])),
    ("20 min, on my own, wants to DO something",
     dict(mode="do", capacity="minutes", reach="solo", disposition=["support"])),
    ("20 min, on my own, likes digging for facts",
     dict(mode="do", capacity="minutes", reach="solo", disposition=["dig"])),
    ("1 hr a week, has a group, likes talking",
     dict(mode="do", capacity="hour", reach="group", disposition=["talk"])),
    ("1 hr a week, on my own, wants to understand",
     dict(mode="understand", capacity="hour", reach="solo", disposition=["learn", "dig"])),
    ("a weekend day, has a group, likes showing up",
     dict(mode="do", capacity="day", reach="group", disposition=["showup", "make"])),
    ("hours a week, on my own, wants to do",
     dict(mode="do", capacity="many", reach="solo", disposition=["make", "dig"])),
    ("20 min, on my own, would rather back someone else",
     dict(mode="understand", capacity="minutes", reach="solo", disposition=["support"])),
]


def main():
    args = sys.argv[1:]
    only = "--who" if "--who" in args else "--tags" if "--tags" in args else None
    items = shipping()
    top, total, tied = shares(items)
    held = [i for i in DB["items"] if i not in items]

    if only != "--who":
        print("=" * 74)
        print(f"{LIB['name'].upper()}")
        print(f"rule: {LIB['rule']}")
        print("every tag below is Claude's and none is reviewed")
        print("=" * 74)
        from collections import Counter
        byfam = Counter(i["family"] for i in items)
        print("  " + " · ".join(f"{FAM[k]['label']} {byfam.get(k,0)}"
                                for k in FAM))
        for i in sorted(items, key=lambda x: -top.get(x["id"], 0.0)):
            pct = round(top.get(i["id"], 0) / total * 100)
            ours = "OURS " if i["source"] == "us" else "     "
            bar = "#" * max(0, round(pct / 2))
            print(f"\n  {ours}{i['id']}   top pick for {pct:>2}% of answers {bar}")
            print(f"    action : {i['action']}")
            print(f"    guide  : {i['title'][:62]}")
            print(f"    tags   : {i['mode']:<10} {CAP_LABEL[i['capacity']]:<9} "
                  f"{i['reach']:<6} {', '.join(i['disposition'])}")
            fam = FAM[i["family"]]
            print(f"    shelf  : {fam['label']} ({fam['colour']})"
                  f"{'' if i['form'] == 'book' else '  [' + i['form'] + ']'}")
            if top.get(i["id"], 0) < 0.5:
                print("    ⚠ effectively never offered first")
        if held:
            print("\n" + "-" * 74)
            print("HELD — not served, awaiting a ruling on framing")
            for i in held:
                print(f"  {i['id']:<22} {i['action'][:48]}")

    if only != "--tags":
        print("\n" + "=" * 74)
        print("WHAT REAL PEOPLE GET — disagree here and a tag above is wrong")
        print("=" * 74)
        for label, a in WHO:
            r = rank(items, a)
            print(f"\n  {label}")
            if not r:
                print("    → nothing at all  ⚠")
                continue
            print(f"    1st → {r[0]['action']}")
            if len(r) > 1:
                print(f"    2nd → {r[1]['action']}")
            print(f"    ({len(r)} options in total)")

    print("\n" + "=" * 74)
    print(f"{tied} of {total} answers have a tie at the top, split fairly.")
    print(f"{len(items)} shipping · {len(held)} held · "
          f"{sum(1 for i in items if i['source'] == 'us')} ours · "
          f"{total} answer combinations, "
          f"{sum(1 for a in all_answers() if not rank(items, a))} with nothing to offer")
    print("To change one: edit data/shelf.json, then python3 tools/shelfgen.py")
    print("=" * 74)


if __name__ == "__main__":
    main()
