#!/usr/bin/env python3
"""Build web/civics-data.js from the USCIS civics-test PDF.

    python3 tools/build-civics.py ~/Downloads/2025-Civics-Test-128-Questions-and-Answers.pdf

Needs `pdftotext` (brew install poppler).

USE THE STRAIGHT DOWNLOAD FROM USCIS, not a print-to-PDF of the page. A
print-to-PDF carries a subsetted font whose character map is broken, and
it extracts as "VgYs hr sgd enpl" — a consistent letter shift that could
be reversed by inference. Doing that to a document people study from
before a government interview is not a risk worth taking, and it is not
necessary: the original downloads clean.

WHY THIS FILE EXISTS. The categories below were rebuilt four times, each
time from a throwaway script, while testing kept exposing bad distractors.
Rules that get edited that often belong in the repo where they can be read
and re-run, not in /tmp where the next person has to reconstruct them.
"""

import json
import pathlib
import re
import subprocess
import sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "civics-data.js"

# Answers that change with elections or with where you live. No answer is
# stored for these and they are never quizzed — a fixed answer here means
# confidently teaching the wrong President the day after an election.
LOOKUP = {23, 29, 30, 38, 39, 57, 61, 62}

# CLOSED-SET QUESTIONS need hand-written distractors, and this is the floor
# of automatic generation rather than a gap in it. "The President is in
# charge of which branch?" has exactly two meaningful wrong answers, and no
# amount of drawing from other questions' answers will produce them: no
# question in the bank has "Legislative" alone as an answer.
#
# Every distractor here must be ATTESTED IN THE SOURCE as a wrong answer to
# this question — the three branches are named in Q16's own answer. Do not
# invent plausible-sounding options from outside the document: the risk is
# authoring something that is actually acceptable, and marking a correct
# answer wrong is the one failure this tool must never commit.
DISTRACTORS = {
    17: ["Legislative", "Judicial"],                       # answer: Executive
    18: ["The executive branch", "The judicial branch"],   # answer: Congress
    66: ["(U.S.) Constitution", "The President (of the United States)",
         "(U.S.) Congress", "The Star-Spangled Banner"],   # answer: the US / the flag
}

# How many items the question actually asks for. Stated only in the stem.
WORDNUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5}


def required(q):
    for pat in (r'\bname (one|two|three|four|five)\b',
                r'\bwhat are (one|two|three|four|five)\b',
                r'\bdescribe (one|two|three)\b'):
        m = re.search(pat, q, re.I)
        if m:
            return WORDNUM[m.group(1).lower()]
    return 1


# What KIND of thing the ANSWER is — which is the whole point, because the
# category picks the distractors and distractors are answers.
#
# Two rules earned by failure, both worth keeping in mind before editing:
#
# FORM BEATS SUBJECT. "Why did the United States enter the Korean War" is
# a question about a war, but its answer is a reason. Ordering subject
# first tagged nine reason/person/event questions as "war" and offered
# Vietnam as a distractor for a question about motives.
#
# SPLIT ANY FORM COVERING TWO ANSWER KINDS. "How many" covers both counts
# of things and spans of years, so "elected for how many years" drew 435
# and 27 as distractors and only one option could possibly be a term. The
# same trap caught rights-vs-people, holiday-names-vs-descriptions, and
# Cabinet-posts-vs-branches.
RULES = [
    ("duration",   r'how long\b|elected for how many|serve for how'),
    ("reason",     r'^why\b|\bwhy\?|name one reason|reasons\.? name one'),
    ("when",       r'^when (did|was)\b'),
    ("count",      r'^how many\b|why does the flag'),
    ("nation",     r'main rival'),
    ("person",     r'^who wrote|^who was|name one leader'),
    ("who",        r'^who\b|\bwho becomes\b'),
    ("famous",     r'is famous for many things'),
    ("describes",  r'^what is (independence day|memorial day|veterans day)'
                   r'|what did the .* do|major event happened|what was the great depression'),
    ("holiday",    r'national u\.s\. holidays'),
    ("amendname",  r'^what amendment'),
    ("amendment",  r'\bamendment'),
    ("event",      r'important events?\.? name one'),
    # "During the Cold War, what was one main concern?" is a question about
    # a war whose answer is a concern — the same form-beats-subject trap
    # that put reasons among the wars, surviving in one last place. It was
    # offering "Communism" as a war fought in the 1800s.
    ("concern",    r'main concern'),
    ("war",        r'\bwar\b|military conflict'),
    ("document",   r'founding document|documents influenced|Federalist Papers|written in 1787'),
    ("state",      r'original states'),
    ("tribe",      r'American Indian tribe'),
    ("innovation", r'American innovation'),
    ("system",     r'form of government|economic system'),
    ("process",    r'how are changes made|how can people become'),
    ("group",      r'group of people|who lived in America'),
    ("place",      r'\bcapital\b|^where is|what territory'),
    ("power",      r'\bpower\b|writes laws|what does .*\bdo\b'),
    ("posts",      r'Cabinet-level positions|part of the judicial|highest court'),
    ("branch",     r'branch|parts of the u\.s\. congress'),
    ("right",      r'\bright[s]?\b|\bvote\b|protect'),
    ("duty",       r'civic participation|serve their country|promises|citizens make'
                   r'|taxes|Selective Service'),
    ("meaning",    r'what does .* mean|what is the rule of law'),
    # National things you can name: the Constitution, the anthem, the flag.
    # "Show loyalty to" joins them because its answers — the United States,
    # the flag — are exactly that, and it was otherwise uncategorised and
    # drawing "Run for office" from the civic-duty answers.
    ("named",      r'what is the name of|supreme law of the land|show loyalty to'),
]


def category(q):
    for name, pat in RULES:
        if re.search(pat, q, re.I):
            return name
    return "general"


def parse(pdf):
    txt = subprocess.run(["pdftotext", "-layout", str(pdf), "-"],
                         capture_output=True, text=True, check=True).stdout
    if "VgYs" in txt or "sgd" in txt:
        sys.exit("FAIL: this PDF's font map is broken (a print-to-PDF). "
                 "Download the original from uscis.gov instead.")

    sec = sub = None
    items, cur = [], None
    for line in txt.split("\n"):
        s = line.strip()
        if re.fullmatch(r'[A-Z][A-Z ]{6,}', s):
            sec = s.title(); continue
        m = re.match(r'^([A-Z]):\s+(.+)$', s)
        if m and len(s) < 70:
            sub = m.group(2).strip(); continue
        m = re.match(r'^(\d{1,3})\.\s+(.+)$', s)
        if m:
            q = m.group(2).strip()
            cur = {"n": int(m.group(1)), "sub": sub, "q": q.replace("*", "").strip(),
                   "star": "*" in q, "answers": []}
            items.append(cur); continue
        if cur is not None and s.startswith("•"):
            cur["answers"].append(s.lstrip("• ").strip())
        elif (cur is not None and s and cur["answers"] and not s[0].isdigit()
              and len(s) < 90 and not re.match(r'^(\d+ of \d+|uscis\.gov)', s)):
            cur["answers"][-1] += " " + s

    for it in items:
        it["need"] = required(it["q"])
        it["cat"] = category(it["q"])
        it["kind"] = "lookup" if it["n"] in LOOKUP else "static"
        it["d"] = DISTRACTORS.get(it["n"], [])
        if it["kind"] == "lookup":
            it["answers"] = []
    return items


# RECALL QUESTIONS. Some questions cannot be multiple choice at all,
# because their accepted answers exhaust their own category and the source
# contains no valid wrong answer. Q117 accepts twenty-five tribes; Q99
# accepts all six women named anywhere in the bank. Nineteen of the 120 are
# like this, and inventing distractors for them would mean asserting from
# outside the document that something is NOT a tribe or NOT a suffrage
# leader — precisely the way to mark a correct answer wrong.
#
# So they are asked as recall instead: the question, a moment to think, then
# every accepted answer, and you say whether you knew it. That is not a
# consolation prize. Retrieval practice beats recognition for retention, and
# the real interview is oral recall with no options at all — so the
# questions that resist multiple choice get the format closest to the test.
MIN_DISTRACTORS = 4


def mark_recall(items):
    def norm(s):
        s = re.sub(r'\([^)]*\)', ' ', s.lower())
        s = re.sub(r'[^a-z0-9 ]', ' ', s)
        s = re.sub(r'\b(the|a|an|of|from|for|in|to|at|by|on|with|and)\b', ' ', s)
        return re.sub(r'\s+', ' ', s).strip()

    pool = [i for i in items if i["kind"] != "lookup" and i["answers"]]
    for q in pool:
        if q["d"]:
            q["recall"] = False
            continue
        mine = {norm(a) for a in q["answers"]}
        others = {norm(a) for c in pool if c["cat"] == q["cat"] and c["n"] != q["n"]
                  for a in c["answers"]} - mine
        q["recall"] = len(others) < MIN_DISTRACTORS
    for i in items:
        i.setdefault("recall", False)


def check(items):
    """Fail loudly rather than emit a data file nobody has verified."""
    if len(items) != 128:
        sys.exit(f"FAIL: parsed {len(items)} questions, expected 128")
    missing = sorted(set(range(1, 129)) - {i["n"] for i in items})
    if missing:
        sys.exit(f"FAIL: missing questions {missing}")
    # The document's own preamble says 20 questions carry the asterisk, so
    # this is the parse checking itself against the source.
    stars = sum(1 for i in items if i["star"])
    if stars != 20:
        sys.exit(f"FAIL: {stars} asterisked questions, the document says 20")
    blank = [i["n"] for i in items if i["kind"] == "static" and not i["answers"]]
    if blank:
        sys.exit(f"FAIL: static questions with no answer: {blank}")


def emit(items):
    head = OUT.read_text().split("const CIVICS = [")[0] if OUT.exists() else ""
    esc = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')
    rows = []
    for it in items:
        ans = ", ".join(f'"{esc(a)}"' for a in it["answers"])
        star = ", star: true" if it["star"] else ""
        kind = "" if it["kind"] == "static" else ', kind: "lookup"'
        need = f', need: {it["need"]}' if it["need"] > 1 else ""
        dis = (", d: [" + ", ".join(f'"{esc(x)}"' for x in it["d"]) + "]") if it["d"] else ""
        rec = ", r: true" if it.get("recall") else ""
        rows.append(f'  {{ n: {it["n"]}, sub: "{esc(it["sub"])}", cat: "{it["cat"]}"{need},\n'
                    f'    q: "{esc(it["q"])}",\n    a: [{ans}]{dis}{rec}{star}{kind} }},')
    OUT.write_text(head + "const CIVICS = [\n" + "\n".join(rows) + "\n];\n")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    items = parse(pathlib.Path(sys.argv[1]).expanduser())
    mark_recall(items)
    check(items)
    emit(items)
    c = Counter(i["cat"] for i in items if i["kind"] != "lookup")
    print(f"  {len(items)} questions, {sum(1 for i in items if i['star'])} asterisked, "
          f"{sum(1 for i in items if i['kind'] == 'lookup')} lookup")
    print(f"  {len(c)} categories, {c['general']} uncategorised")
    print(f"  {sum(1 for i in items if i.get('recall'))} asked as recall, "
          f"{sum(1 for i in items if i['d'])} with written distractors")
    print(f"  -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
