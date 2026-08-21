// The civics quiz: one question, five answers, one of them right.
//
// WHY FIVE. Four gives a lucky guess a 1-in-4 chance, five a 1-in-5. That
// matters more than it looks, because a lucky hit is worse than a miss: it
// fires no correction, it manufactures confidence, and it tells the
// progress counter you have learned something you have not.
//
// But the option count is the WEAK lever, and it is worth being honest
// about that. Both numbers are enormous next to the real interview, which
// is oral recall with no options at all. The two strong levers are below.
//
// STRONG LEVER 1 — distractors that could actually be picked. A wrong
// answer only teaches if it was tempting; an option eliminated on sight
// costs nothing but reading time. Distractors are matched on SUBJECT and
// on SHAPE: same subsection where possible, and always the same kind of
// thing — a number against numbers, a name against names. Subject alone
// was not enough, and testing proved it. See answerType() below.
//
// STRONG LEVER 2 — mastery needs repetition. One correct answer retires
// nothing; a question must be answered correctly MASTERY times, on
// separate sightings, before it stops coming back. This is what actually
// defeats the lucky guess: luck does not survive being asked again.

const MASTERY = 2;      // correct sightings before a question is retired
const DISTRACTORS = 4;  // wrong options offered, however many are wanted

const state = {
  seen: {},             // n -> correct-sighting count
  asked: 0,
  right: 0,
  wrongFirst: 0,        // got it wrong, then later got it right
  current: null,
};

// ---------- what counts as the same answer ----------

// Two answers mean the same thing when USCIS's optional wording is
// stripped. The list writes optional words in parentheses — "President (of
// the United States)" — and separate questions phrase the same answer
// differently, one with a leading "The" and one without.
//
// That is not cosmetic. Q42's answer and a distractor drawn from another
// question differed ONLY by that article, so picking the identical answer
// was marked WRONG. A study tool that fails a correct answer is worse than
// one that is merely unhelpful, because the learner corrects toward an
// error. This normaliser governs both grading and distractor selection, so
// a near-duplicate can no longer be offered against its own twin either.
function norm(s) {
  return s.toLowerCase()
    .replace(/\([^)]*\)/g, " ")      // (of the United States)
    .replace(/\[[^\]]*\]/g, " ")     // [editorial notes]
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ").trim();
}

function isCorrect(q, picked) {
  return q.a.some((a) => norm(a) === norm(picked));
}

// ---------- choosing what to ask ----------

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Everything with a real answer. The eight lookup questions are excluded
// from the quiz entirely rather than scored — see civics-data.js.
function pool() {
  return CIVICS.filter((c) => c.kind !== "lookup" && c.a.length);
}

function unmastered() {
  return pool().filter((c) => (state.seen[c.n] || 0) < MASTERY);
}

// What SHAPE of thing an answer is. Subsection alone turned out to be far
// too coarse: asked to name a document that influenced the Constitution,
// the first build offered "Federalist Papers" against "Twenty-seven (27)"
// and two full sentences. Every wrong option is discardable on shape
// alone, so the question can be answered correctly by someone who knows
// no civics whatsoever — and a distractor nobody could pick teaches
// nothing, which defeats the entire point of guessing wrong first.
// Surface shape, kept only as a tiebreaker BELOW category. On its own it
// was not enough: "War of 1812" contains digits, so a shape-only rule
// typed it as a number and offered it against amendments and years.
function answerShape(a) {
  if (/\d/.test(a)) return "number";
  return a.trim().split(/\s+/).length <= 4 ? "term" : "phrase";
}

// Distractors: other questions' answers, never one that is also correct
// here. Preference runs same-subsection-and-same-shape first, then same
// shape anywhere, then anything — so a thin subsection degrades to a
// weaker distractor rather than to no question at all.
function distractorsFor(q, want) {
  const correct = new Set(q.a.map(norm));

  const take = (list) =>
    list.filter((c) => c.n !== q.n)
        .flatMap((c) => c.a)
        .filter((a) => !correct.has(norm(a)));

  // A question that names its own wrong answers gets them, and nothing
  // else. See DISTRACTORS in tools/build-civics.py for why some must.
  if (q.d && q.d.length) {
    return shuffle(q.d).slice(0, want);
  }

  const shape = answerShape(q.a[0]);
  // Category and subsection are COMPLEMENTARY, not alternatives — category
  // is the shape of the answer, subsection is its subject. Matching on
  // category alone offered "It decides who is elected president" against
  // "Why did the US enter the Persian Gulf War": both are reason questions,
  // so the shape was right and the subject was absurd.
  //
  // Best tier is therefore both at once. For that Gulf War question it
  // yields the reasons the US entered WWI, WWII, Korea and Vietnam — four
  // options you cannot separate without knowing the history, which is the
  // whole objective.
  // "general" is the ABSENCE of a category, not one — three questions fall
  // there and matching them to each other means nothing. Treating the
  // catch-all as a match is how "Airplane", from the innovations question,
  // came to be offered against "How can people become US citizens?".
  const tagged = q.cat !== "general";
  const both = tagged ? take(pool().filter((c) => c.cat === q.cat && c.sub === q.sub)) : [];
  const sameCat = tagged ? take(pool().filter((c) => c.cat === q.cat)) : [];
  const near = take(pool().filter((c) => c.sub === q.sub));
  const far = take(pool());
  const tiers = [
    both,
    sameCat,
    near.filter((a) => answerShape(a) === shape),
    far.filter((a) => answerShape(a) === shape),
    near,
    far,
  ];

  const out = [];
  for (const tier of tiers) {
    for (const a of shuffle(tier)) {
      if (out.length >= want) return out;
      if (!out.some((x) => norm(x) === norm(a))) out.push(a);
    }
  }
  return out;
}

function nextQuestion() {
  const left = unmastered();
  if (!left.length) return finish();

  const q = left[Math.floor(Math.random() * left.length)];
  const need = q.need || 1;
  // Any member of the answer set is correct, so the ones SHOWN are chosen
  // at random — otherwise a question with several right answers would only
  // ever teach its first one.
  const shown = shuffle(q.a).slice(0, need);
  // Four distractors regardless of how many are wanted, so a "name five"
  // question is not accidentally easier than a "name one".
  const options = shuffle(shown.concat(distractorsFor(q, DISTRACTORS)));

  state.current = { q, need, shown, options, picked: [], answered: false };
  render();
}

// ---------- drawing ----------

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function render() {
  const { q, options } = state.current;
  const box = document.getElementById("quiz");
  box.innerHTML = "";

  const meta = el("p", "q-meta", q.sub);
  box.appendChild(meta);
  box.appendChild(el("h3", "q-text", q.q));
  const need = state.current.need;
  box.appendChild(el("p", "q-need",
    need > 1 ? "Choose " + need + "." : ""));

  const list = el("div", "q-options");
  options.forEach((opt) => {
    const b = el("button", "q-option", opt);
    b.type = "button";
    b.addEventListener("click", () => answer(b, opt));
    list.appendChild(b);
  });
  box.appendChild(list);
  box.appendChild(el("div", "q-feedback"));
  progress();
}

function answer(btn, picked) {
  const cur = state.current;
  if (cur.answered) return;

  const right = isCorrect(cur.q, picked);

  // A question asking for two takes two. Correct picks bank and the
  // question stays open; a wrong pick ends it immediately, because the
  // correction is the point and delaying it teaches nothing.
  if (right && cur.picked.length + 1 < cur.need) {
    cur.picked.push(picked);
    btn.classList.add("is-right");
    btn.disabled = true;
    const still = cur.need - cur.picked.length;
    document.querySelector(".q-need").textContent =
      still === 1 ? "One more." : still + " more.";
    return;
  }

  cur.answered = true;
  const correct = right;
  state.asked++;

  document.querySelectorAll(".q-option").forEach((b) => {
    b.disabled = true;
    if (isCorrect(cur.q, b.textContent)) b.classList.add("is-right");
  });
  if (!correct) btn.classList.add("is-wrong");

  if (correct) {
    state.right++;
    state.seen[cur.q.n] = (state.seen[cur.q.n] || 0) + 1;
    if (state.seen[cur.q.n] === 1 && cur.q._missed) state.wrongFirst++;
  } else {
    // A miss resets progress on that question rather than just failing to
    // advance it — the point is that it comes back until it is known.
    state.seen[cur.q.n] = 0;
    cur.q._missed = true;
  }

  showFeedback(correct);
  progress();
}

function showFeedback(correct) {
  const cur = state.current;
  const fb = document.getElementById("quiz").querySelector(".q-feedback");
  fb.className = "q-feedback " + (correct ? "ok" : "no");

  fb.appendChild(el("p", "fb-verdict", correct ? "Correct." : "Not quite."));

  // The others always show, right or wrong. A question with five accepted
  // answers is teaching that the idea has five legitimate framings, and
  // hiding four of them on a correct guess throws that away.
  const shownSet = new Set((cur.shown || []).map(norm));
  const others = cur.q.a.filter((a) => !shownSet.has(norm(a)));
  if (!correct) {
    fb.appendChild(el("p", "fb-answer",
      (cur.shown.length > 1 ? "The answers are: " : "The answer is: ")
      + cur.shown.join(" · ")));
  }
  if (others.length) {
    fb.appendChild(el("p", "fb-also",
      (others.length === 1 ? "Also accepted: " : "Also accepted: ") + others.join(" · ")));
  }

  const next = el("button", "btn", "Next question");
  next.type = "button";
  next.addEventListener("click", nextQuestion);
  fb.appendChild(next);
  next.focus();
}

// The real test: 20 questions drawn from all 128, 12 correct to pass. That
// turns "do I know this well enough" from a feeling into arithmetic —
// knowing a fraction p of the bank, a 20-question draw is expected to
// yield 20p, so 12 needs p of about 0.6, or ~77 of the 128.
//
// Deliberately conservative in two ways. Unknown questions are counted as
// wrong, though five options mean you would guess a few right; and the
// eight lookup questions count against the total even though they are not
// drilled here, because the officer can still ask them. Telling somebody
// they are ready when they are not is the one error this must not make.
const TEST_DRAW = 20;
const TEST_PASS = 12;
const READY_AT = Math.ceil(TEST_PASS / TEST_DRAW * CIVICS.length);   // 77

function progress() {
  const total = pool().length;
  const done = pool().filter((c) => (state.seen[c.n] || 0) >= MASTERY).length;
  const started = pool().filter((c) => {
    const v = state.seen[c.n] || 0;
    return v > 0 && v < MASTERY;
  }).length;

  const bar = document.getElementById("progress");
  bar.querySelector(".bar-learned").style.width = (done / total * 100) + "%";
  bar.querySelector(".bar-started").style.width = (started / total * 100) + "%";
  bar.querySelector(".bar-mark").style.left = (READY_AT / total * 100) + "%";

  bar.querySelector(".counts-text").textContent =
    `${done} learned · ${started} started · ${total - done - started} not seen yet`;

  const expect = Math.round(done / CIVICS.length * TEST_DRAW);
  const ready = done >= READY_AT;
  const verdict = bar.querySelector(".bar-verdict");
  verdict.className = "bar-verdict " + (ready ? "ready" : "");
  verdict.textContent = ready
    ? `On track to pass. The actual citizenship test asks ${TEST_DRAW} of the `
      + `${CIVICS.length} and needs ${TEST_PASS} right; at this rate you would `
      + `expect about ${expect}.`
    : `The actual citizenship test asks ${TEST_DRAW} of the ${CIVICS.length} and `
      + `needs ${TEST_PASS} right. Right now you would expect about ${expect}. `
      + `Around ${READY_AT} learned is the mark.`;
}

function finish() {
  const box = document.getElementById("quiz");
  box.innerHTML = "";
  box.appendChild(el("h3", "q-text", "That is all " + pool().length + " of them."));
  box.appendChild(el("p", null,
    `You answered ${state.right} of ${state.asked} correctly along the way. `
    + `Every question here has now been answered right ${MASTERY} times.`));
  const again = el("button", "btn", "Start again");
  again.type = "button";
  again.addEventListener("click", () => {
    state.seen = {}; state.asked = 0; state.right = 0;
    pool().forEach((c) => { delete c._missed; });
    nextQuestion();
  });
  box.appendChild(again);
}

// ---------- start ----------

// This used to open with a blocking question: which test applies to you?
// The intent was sound — somebody who filed before 20 October 2025 sits
// the 2008 test, and drilling them here teaches the wrong material for a
// real interview. But it put a form in front of EVERY visitor to protect
// a small minority of them, and most people arriving are curious citizens
// rather than applicants. So the warning stays and the barrier goes: the
// page says plainly which test this is, and folds the other case beneath
// it for whoever it applies to.
document.addEventListener("DOMContentLoaded", function () {
  nextQuestion();

  // Where to actually FIND each of the eight, which is the part that makes
  // this section useful rather than merely honest. Kept here and not in
  // civics-data.js: that file is a faithful transcription of the USCIS
  // document, and telling somebody which website to open is our editorial
  // addition, not theirs.
  //
  // The USCIS page is not merely *a* source for the four federal offices —
  // it is *the* source. The officer grades against what USCIS publishes,
  // so a newer name found elsewhere is still the wrong answer to give.
  const FIND = [
    { where: "USCIS test updates",
      href: CIVICS_UPDATES,
      note: "USCIS publishes the current names, and the interview is graded "
          + "against what it says here \u2014 so this is the answer to learn, "
          + "not just a place to check.",
      qs: [30, 38, 39, 57] },
    { where: "senate.gov",
      href: "https://www.senate.gov/senators/senators-contact.htm",
      note: "Choose your state to see both of its senators.",
      qs: [23] },
    { where: "house.gov",
      href: "https://www.house.gov/representatives/find-your-representative",
      note: "Takes your ZIP code, because representatives go by district "
          + "rather than by state \u2014 which is why your neighbours two "
          + "streets over may have a different one.",
      qs: [29] },
    { where: "usa.gov state directory",
      href: "https://www.usa.gov/state-governments",
      note: "Your state's own site carries the governor and the capital.",
      qs: [61, 62] },
  ];

  const box = document.getElementById("lookup-list");
  FIND.forEach((f) => {
    const grp = el("div", "find-group");
    const qs = el("ul", "find-qs");
    f.qs.forEach((n) => {
      const c = CIVICS.find((x) => x.n === n);
      if (c) qs.appendChild(el("li", null, c.q));
    });
    grp.appendChild(qs);
    const p = el("p", "find-where");
    const a = el("a", null, f.where);
    a.href = f.href; a.rel = "noopener";
    p.appendChild(document.createTextNode("Look these up at "));
    p.appendChild(a);
    p.appendChild(document.createTextNode(". " + f.note));
    grp.appendChild(p);
    box.appendChild(grp);
  });
});
