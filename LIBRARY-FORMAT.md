# The library format

A **library** is a small, deliberately chosen collection of things worth
someone's time, rendered as a room rather than a list.

One sentence, and the rest of this file is detail:

> **A library is a declared inclusion rule, a declared set of families, and
> a list of items each with a time cost, a provenance and an outline.**

Nothing here is specific to democracy. The subject lives entirely in the
data, which is the point: a library about beekeeping, or scripture, or
learning to cook changes `data/shelf.json` and nothing else.

## Why a room and not a list

A list of links is a menu, and a menu is what this exists to replace —
somebody arrives overwhelmed and a menu hands them the same problem in a
tidier font. A room is different. You can stand in it, look around, and
leave having taken one thing.

**The encoding does real work.** Size is what an item costs you. Colour is
what kind of help it gives. A thin volume is twenty minutes; a thick one is
a weekend. That is data visualisation wearing furniture, not furniture
pretending to be data — and if you ever make the sizes arbitrary you have
thrown the whole idea away and kept the wallpaper.

**Small is not a failure.** A bookmobile is every book somebody decided was
worth the trip. Empty shelf space is the promise of next month, not an
apology.

## The rule: browse the shelves, or ask a librarian

Two ways in, and both are first-class:

- **The shelves** — look around, by family or by what you last read.
- **The librarian** — a handful of questions, and one thing to do.

The librarian exists because *not knowing where to start* is the common
case, and the shelves exist because browsing is the pleasure of the place.
Neither is a fallback for the other.

## ⚠ Some libraries are private, and that changes more than the URL

Declare it:

```jsonc
"library": {
  "visibility": "private",          // or "public"
  "access": "obscurity",            // obscurity | passphrase | accounts
  "access_note": "Unguessable URLs plus noindex. Do not link from anywhere public."
}
```

**What changes when a library is private:**

- **Every page carries `noindex`,** and the deploy script should *refuse to
  upload* if one has lost it rather than notice later. Obscurity that
  depends on remembering is not obscurity.
- **The exclusion list changes job.** In a public library it is the only
  falsifiable evidence the rule is real, so it must be published. In a
  private one it is a working record — still worth keeping, still written
  as scope rather than judgement, but nobody is auditing you with it.
- **Access is a declared mechanism, not an accident.** *Obscurity* is
  genuinely fine for a small private collection and costs nothing, but it
  is binary and it does not survive forwarding. A *passphrase* is the first
  point at which you have a credential you can change.

⚠ **And the big one: visibility decides what may be on the shelf at all.**

A private library can hold things a public one cannot — readings from books
still in copyright, work in progress, material you have not cleared. **So
going public is not a deploy. It is a re-review of every item against a
rule that has just tightened**, and often a permissions conversation with
somebody else.

Which means `visibility` is not a hosting setting. It is the gate, and the
moment to notice it is before the room is built rather than after somebody
shares the link.

## `data/shelf.json`

### `library` — what makes this library this one

```jsonc
"library": {
  "name": "The Unhacking Democracy shelf",
  "rule": "Does this teach a capability you keep?",
  "rule_long": "...the same rule, said properly, shown on the page...",
  "ordered": false,
  "families":   { ... },
  "capacities": { ... },
  "forms":      { ... }
}
```

**`rule` is the heart of it.** Every library declares the one test an item
must pass, and *publishes it*. A reader who knows the rule can disagree
with a specific decision rather than vaguely mistrusting the whole shelf —
and can apply the rule themselves to things nobody here chose.

**`ordered`** says whether the collection has an intended sequence. A
library is `false`; a course is `true`. It changes what the room means:
shelves you wander, or a path you walk.

**`families`** — the colour groups, three to five of them. Each declares a
`label`, a `note`, a `colour` and an `emblem`:

```jsonc
"see": { "label": "See clearly", "note": "Knowing what is true",
         "colour": "#26374e", "emblem": "compass" }
```

⚠ **Choose families by the kind of help, not by subject matter.** Ours are
*see clearly / talk to people / act where you live / keep going*. The
tempting alternative — grouping by topic — is a trap in any contested
field, because **a taxonomy is an argument**. Deciding which subjects
exist, and which are the same subject, takes a position before a reader has
read a word. "Kind of help" is a claim nobody has to agree with.

⚠ **The emblem is not decoration, it is the accessibility of the colour.**
Dark blue against dark green is exactly the pair colourblind readers lose.
Anything colour tells you, the emblem must tell you too.

**`capacities`** — the time vocabulary, with a `thickness` that drives how
fat the book is drawn. Ours runs twenty minutes to several hours a week.
Another library might run a coffee break to a winter.

**`forms`** — `book` or `pamphlet`. ⚠ **A pamphlet is a *thin thing*, not
somebody else's thing.** We tried defining it by ownership first and
counting killed it: ten of fourteen items were then pamphlets, which is a
leaflet rack rather than a library. A pamphlet is a bare link-out, a tool, a
directory, one page. Whose it is shows in the binding instead.

### `sources` — who published each thing

```jsonc
"sources": {
  "us":   { "name": "...", "hosting": "ours" },
  "opet": { "name": "...", "index": "https://...", "hosting": "link-only",
            "hosting_note": "Their documents. We link, never mirror." }
}
```

**Link, never mirror**, unless it is yours. The licence on your code covers
your catalogue, not the things it points at.

### `items` — the books

```jsonc
{
  "id": "own-town",
  "source": "us",
  "family": "act",
  "form": "book",
  "action": "Find out what your town actually decides, and when it meets.",
  "blurb": "One line, for the spine's back.",
  "title": "What your town decides, and when it meets",
  "where": "Our guide",
  "url": "howto-town.html",
  "button": "Our guide · What your town decides",
  "capacity": "hour",
  "mode": "understand",          // librarian: understand | do | both
  "reach": "solo",               // librarian: solo | group | either
  "disposition": ["learn", "dig", "showup"],
  "outline": [ "what it covers, in order" ],
  "outline_read": "2026-09-21",
  "verified": "2026-09-21",
  "reviewed_by_bill": false
}
```

**`action` is the recommendation; the item is what backs it up.** A reading
list is not a next step. Lead with the thing to do.

⚠ **`outline` is null until somebody reads it.** Never infer contents from
a title. A plausible invented outline is *worse* than none, because nobody
checks it. `outline_read` records when a human actually looked.

**`verified` / `reviewed_by_*`** — when the link was last confirmed, and
whether a person has approved the classification. Ours are all `false`,
which the review sheet says out loud.

### `excluded` — what was left off, and why

```jsonc
"excluded": [
  { "title": "...", "url": "...",
    "reason": "Out of scope: policy. This shelf carries no policy asks from
               any source, including our own. Not a comment on the position." }
]
```

⚠ **Write reasons as scope, not as judgement.** These are decisions about
*your* shelf, not assessments of other people's work — and the difference
matters most when the file is public, which it should be. A published
exclusion list is the only falsifiable evidence that the rule is real.

## The tools

| | |
|---|---|
| `tools/shelfgen.py` | Generates `web/shelf-data.js`. `--check` fails the build if the generated file was hand-edited or the data is invalid. |
| `tools/shelf_verify.py` | Checks the catalogue against the live web — dead links, silently renamed pages, stale dates, unread items. **Never in the build**: a build that makes HTTP calls fails on bad wifi and teaches people to work around it. |
| `tools/shelf_review.py` | The review sheet. Tags for precision, worked examples for sanity. |

**The generator is the contract.** Edit the data, never the generated file;
`--check` runs in `build.sh` so getting that backwards fails loudly instead
of silently.

## The librarian

Five questions, then **one** thing. Not a ranked list — a ranked list is
the menu again.

- **Capacity is a ceiling, not a preference.** Never offer a weekend to
  somebody with twenty minutes.
- **Ties are split, not ordered.** Equal scores mean equally good; letting
  position in the file decide means one item wins forever and its equals
  are never seen. Shuffle within each band.
- **Say why.** *"Because you have twenty minutes and you're already in a
  PTA."* The reasoning is content, not a disclaimer.
- **One escape.** *Suggest another*, and everything else stays hidden.

### If the librarian can answer questions

It may know **the catalogue, not the subject**. *"Which of these covers
checking a claim?"* is retrieval over outlines you wrote. *"What should I
think about X?"* is a model answering from memory about a contested thing,
and it is out.

⚠ **And the gap is the feature.** A librarian that only knows the
catalogue will constantly be asked for things it does not have — which
makes every unanswerable question a request for the shelf, from the person
who wanted it, at the moment they wanted it. Better acquisition data than
any survey.

⚠ **The room must work with no API key at all.** If the librarian is an
attraction and a lapsed key silences it, the whole room looks broken — and
keys lapse silently.

## Using this for another subject

1. Write `library`: the rule, three to five families, a time vocabulary.
2. Read the candidates. **Actually read them** — a listing page cannot tell
   you that a guide's contents lean or that its title promises a method it
   does not teach.
3. Sort with the rule. Record the rejects and why.
4. Fill `items`. Outlines only for what somebody read.
5. Run `shelfgen.py`, `shelf_verify.py`, `shelf_review.py`.
6. Review the tags against the worked examples, not in the abstract.

Nothing in steps 1–6 mentions democracy, which is the test this format had
to pass.
