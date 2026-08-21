# unhack-root

The root site for **[unhackdemocracy.us](https://unhackdemocracy.us)** —
the mission, the state apps index, and the resources that teach how the
system actually works.

The per-state tools live in their own repos. Florida is
[unhack-fl](https://github.com/wabrocker/unhack-fl), and deploys into
`fl/` inside this same document root, which is why the rsync here must
never use `--delete`. See [DEPLOY.md](DEPLOY.md).

## What's here

**The Citizenship Practice Test** is the substantial piece: all 128
questions from the 2025 USCIS naturalization civics test, asked as
multiple choice or as recall.

It exists to test one claim — that you learn a fact better by committing
to an answer, getting it wrong, and being corrected, than by reading the
right answer first. So the design is shaped around making a *wrong* answer
possible and informative:

- **Distractors have to be pickable.** An option discarded on sight
  teaches nothing and lets someone answer correctly while knowing nothing.
  They are matched on both the kind of thing the answer is and its
  subject — a war against other wars, a term of office against other
  terms.
- **Some questions can't be multiple choice at all.** Where the accepted
  answers exhaust their own category — 25 tribes, or every woman named in
  the bank — no honest distractor exists. Those are asked by recall: type
  it, then see every accepted answer and say whether you had it. What you
  type is never graded, because too many wordings are right.
- **Mastery needs repetition.** A question is learned after two correct
  answers on separate showings. One could be luck, and luck does not
  survive being asked again.
- **Eight questions are never asked.** Current officeholders change with
  elections; senators, representative, governor and state capital depend
  on where you live. Storing a fixed answer means confidently teaching the
  wrong President the day after an election, so those link to USCIS
  instead.

Readiness is measured against the real thing: the interview draws 20
questions from the 128 and needs 12 right, so roughly 77 learned is the
mark, and the page says so rather than showing an abstract percentage.

## Provenance

The civics questions are from
[USCIS](https://www.uscis.gov/citizenship/2025test), a work of the U.S.
government. `tools/build-civics.py` extracts them from the published PDF
and checks the parse against the document's own preamble.

**Use the straight download from USCIS, not a print-to-PDF.** A
print-to-PDF carries a subsetted font with a broken character map and
extracts as gibberish that *looks* reversible. Guessing at it, for a
document people study from before a government interview, is not a risk
worth taking.

## Building

No framework, no dependencies, no build step you have to learn.

```bash
./build.sh            # build dist/
./build.sh --deploy   # build, then rsync over SSH
```

Two generators own things that would otherwise drift across six pages:

- **`tools/navgen.py`** — the nav, masthead, footer and breadcrumbs. Also
  the site map: adding a page is one line in `SITE`. `build.sh` runs
  `navgen.py --check` first, so a hand-edited header fails the build
  rather than stranding a visitor on the one page nobody updated.
- **`tools/build-civics.py`** — `web/civics-data.js` from the USCIS PDF,
  including which questions can be multiple choice and which cannot.

Assets get a content hash stamped into the pages. A stale cached quiz that
scores answers against last week's data is worse than a broken one,
because it looks like it is working.

## Contributing

Issues and pull requests are welcome, particularly:

- **Bad distractors.** The wrong answers are the hard part and the part
  most likely to be wrong. If an option is obviously discardable, or
  worse, arguably correct, that is a real bug.
- **The 2008 civics test.** Anyone who filed Form N-400 before 20 October
  2025 sits a different 100-question test, which this does not yet cover.
  The page tells them so and sends them to USCIS.

If you are reporting a distractor, the question number and what it offered
you is enough.

## Licence

MIT — see [LICENSE](LICENSE). The USCIS questions are a U.S. government
work and carry no copyright.
