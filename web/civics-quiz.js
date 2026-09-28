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
// Half the questions should arrive as recall. But 21 of them are recall
// ALWAYS — they have no honest distractors — so a plain coin flip on the
// rest overshoots. The flip has to be biased DOWN to compensate:
//
//   want:  RECALL_SHARE * N        of N questions
//   have:  alwaysRecall            for free
//   so:    p = (RECALL_SHARE*N - alwaysRecall) / (N - alwaysRecall)
//
// With 120 quizzable and 21 always-recall that is 39/99 ≈ 0.394, not the
// 1/3 it looks like by eye — a flat third would land at 54:66. Computed
// from the data rather than written down, so it stays balanced if the
// always-recall count changes when the categories are next edited.
// Three mixes, because people learn differently and the right balance is a
// preference rather than a fact. The number is the share of questions that
// should arrive as RECALL.
//
// "More multiple choice" cannot reach zero recall: 21 questions have no
// honest distractors and are recall whatever this says. That floor is 17.5%
// of the bank, which is why the low setting is 25% rather than something
// smaller — it leaves the flip doing visible work instead of pinning at 0.
const MIX = {
  choice: { share: 0.25, label: "More multiple choice" },
  even:   { share: 0.50, label: "An even mix" },
  recall: { share: 0.75, label: "More recall" },
};
const MIX_KEY = "civics-mix";

function mixKey() {
  const k = localStorage.getItem(MIX_KEY);
  return MIX[k] ? k : "even";
}

function setMix(k) {
  if (MIX[k]) localStorage.setItem(MIX_KEY, k);
  showMixEffect();
}

// The actual numbers for the chosen mix, because "more" and "less" mean
// nothing without them — and the always-recall floor makes the low setting
// behave differently from what the label implies.
function showMixEffect() {
  const el = document.getElementById("mix-effect");
  if (!el) return;
  const all = CIVICS.filter((c) => c.kind !== "lookup" && c.a.length);
  const always = all.filter((c) => c.r).length;
  const rec = Math.round(always + recallChance() * (all.length - always));
  el.textContent = `About ${rec} of the ${all.length} would be recall, `
                 + `${all.length - rec} multiple choice.`;
}

function recallChance() {
  const all = CIVICS.filter((c) => c.kind !== "lookup" && c.a.length);
  const always = all.filter((c) => c.r).length;
  const flexible = all.length - always;
  if (flexible <= 0) return 0;
  const p = (MIX[mixKey()].share * all.length - always) / flexible;
  return Math.max(0, Math.min(1, p));
}
const DISTRACTORS = 4;  // wrong options offered, however many are wanted

// Mastery is remembered between visits (2026-09-28), so learning 120
// questions can happen over days. Only this browser keeps it.
const SEEN_KEY = "civics-mastery";

function loadSeen() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; }
  catch (e) { return {}; }
}

function saveSeen() {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(state.seen));
  } catch (e) { /* a full quota must not stop the quiz */ }
}

const state = {
  seen: loadSeen(),     // n -> correct-sighting count
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
// error. This normalizer governs both grading and distractor selection, so
// a near-duplicate can no longer be offered against its own twin either.
function norm(s) {
  return s.toLowerCase()
    .replace(/\([^)]*\)/g, " ")      // (of the United States)
    .replace(/\[[^\]]*\]/g, " ")     // [editorial notes]
    .replace(/[^a-z0-9 ]/g, " ")
    // Articles AND prepositions. "Citizens from their state" answers Q32
    // while "Citizens of their state" answers Q31, and they mean the same
    // thing — so offering one against the other marked a correct answer
    // wrong. Stripping only articles caught "President"/"The President"
    // and missed this entire family.
    //
    // Checked before loosening rather than after: normalizing every answer
    // in the bank this way produces 26 cross-question collisions, and all
    // 26 are genuine synonym pairs. No two answers that differ in meaning
    // collapse together, so this cannot make a wrong answer count as right.
    .replace(/\b(the|a|an|of|from|for|in|to|at|by|on|with|and)\b/g, " ")
    .replace(/\s+/g, " ").trim();
}

// A looser key, used ONLY to stop two distractors saying the same thing.
// "Declare war" and "Declares war" are one idea in two conjugations, and
// offering both spends two of five option slots on it. Crude stemming is
// safe here and nowhere else: a false match merely drops a redundant
// option, and this key never touches grading, where a false match would
// mark a correct answer wrong.
function distractorKey(s) {
  return norm(s).split(" ").map((w) => w.replace(/s$/, "")).join(" ");
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
// Names the question itself puts on the table. A distractor that mentions
// the question's own subject is nonsense a reader discards instantly —
// "Aide to General George Washington" offered for "George Washington is
// famous for many things. Name one." Washington was not his own aide.
//
// Common words are dropped so this rejects on the DISTINCTIVE name only:
// nearly every question mentions the United States, and excluding every
// answer that does would gut the pool for no benefit.
const SUBJECT_STOP = new Set([
  "the", "and", "for", "one", "two", "three", "five", "name", "what", "who",
  "why", "when", "how", "many", "does", "did", "was", "were", "are", "his",
  "united", "states", "state", "american", "america", "president", "first",
  "constitution", "congress", "federal", "government", "u", "s", "us",
  // NOTE "president" is deliberately NOT here, so a question that names the
  // office in caps will not draw answers about it. That is worth having,
  // but be clear about what it does NOT do: this extractor reads only
  // CAPITALIZED words, and "Name one power of the president" writes the
  // office lowercase — so it contributes no subject name at all. The fix
  // for that question was retagging the Cabinet question, not this list.
]);

function subjectNames(q) {
  return (q.q.match(/\b[A-Z][a-zA-Z]+\b/g) || [])
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 2 && !SUBJECT_STOP.has(w));
}

function namesSubject(text, names) {
  const t = text.toLowerCase();
  return names.some((n) => t.includes(n));
}

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

  const subject = subjectNames(q);
  const take = (list) =>
    list.filter((c) => c.n !== q.n)
        .flatMap((c) => c.a.map((a) => ({ a: a, from: c.n })))
        .filter((x) => !correct.has(norm(x.a)) && !namesSubject(x.a, subject));

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
    near.filter((x) => answerShape(x.a) === shape),
    far.filter((x) => answerShape(x.a) === shape),
    near,
    far,
  ];

  // One answer per source question is a PREFERENCE, not a rule. Two answers
  // to the same question are usually two phrasings of one idea, so taking
  // both wastes an option slot — but a second answer from the right
  // category still beats a first answer from the wrong one.
  //
  // Enforcing it absolutely made Q91 worse, not better: the war category has
  // few source questions, so skipping repeats starved the tier and let an
  // amendment through as a "war fought in the 1800s". Two Revolutionary War
  // variants at least keep every option a war. So each tier is swept twice —
  // distinct sources first, then repeats — before moving down.
  const out = [];
  const usedSource = new Set();
  const add = (x) => {
    if (out.some((y) => norm(y) === norm(x.a))) return;
    usedSource.add(x.from);
    out.push(x.a);
  };
  for (const tier of tiers) {
    const shuffled = shuffle(tier);
    for (const x of shuffled) {
      if (out.length >= want) return out;
      if (!usedSource.has(x.from)) add(x);
    }
    for (const x of shuffled) {
      if (out.length >= want) return out;
      add(x);
    }
  }
  return out;
}

// ---------- practice sessions ----------
//
// Bill, 2026-09-28: practice comes in sessions the size of the real test,
// scored as a percentage, and every session ends with the chance to go
// back over what was missed. A session scoring GOAL_PCT or better — a
// little above the real pass mark of 12 of 20, 60% — is the first step of
// the Citizenship Basics badge (civics-badge.js reads PRACTICE_KEY).
const SESSION = 20;
const GOAL_PCT = 70;                          // 14 of 20
const PRACTICE_KEY = "civics-practice-best";  // {right, of, pct, on}

const session = { asked: 0, right: 0, missed: [], review: null, used: new Set() };

// Which questions have ever been asked, so later sessions can lean toward
// new ones and the summary can say how much of the bank has been covered
// (Bill, 2026-09-28). Separate from mastery, which a miss resets to zero.
const TRIED_KEY = "civics-tried";
const NEW_SHARE = 0.8;                        // share of questions drawn from untried ones
const tried = new Set((function () {
  try { return JSON.parse(localStorage.getItem(TRIED_KEY)) || []; } catch (e) { return []; }
})());

function tally(q, correct) {
  if (!tried.has(q.n)) {
    tried.add(q.n);
    try { localStorage.setItem(TRIED_KEY, JSON.stringify([...tried])); } catch (e) {}
  }
  if (session.review) return;                 // going back over misses doesn't score
  session.asked++;
  if (correct) session.right++;
  else if (!session.missed.includes(q)) session.missed.push(q);
}

function metaText(q) {
  const where = session.review
    ? `Review ${session.review.at} of ${session.review.qs.length}`
    : `Question ${session.asked + 1} of ${SESSION}`;
  return q.sub + " · " + where;
}

function sessionSummary() {
  const pct = Math.round(session.right / session.asked * 100);
  const on = new Date().toISOString().slice(0, 10);
  let best = null;
  try { best = JSON.parse(localStorage.getItem(PRACTICE_KEY)); } catch (e) {}
  if (!best || pct > best.pct) {
    try {
      localStorage.setItem(PRACTICE_KEY, JSON.stringify(
        { right: session.right, of: session.asked, pct: pct, on: on }));
    } catch (e) {}
    document.dispatchEvent(new Event("civics-change"));
  }

  const box = document.getElementById("quiz");
  box.innerHTML = "";
  box.appendChild(el("p", "q-meta", "Practice session"));
  box.appendChild(el("h3", "q-text",
    `You got ${session.right} of ${session.asked} right: ${pct}%.`));
  box.appendChild(el("p", null,
    `The real test needs ${TEST_PASS} of ${TEST_DRAW}, which is `
    + `${Math.round(TEST_PASS / TEST_DRAW * 100)}%. `
    + (pct >= GOAL_PCT
      ? `This session meets the Citizenship Basics goal of ${GOAL_PCT}%.`
      : `The Citizenship Basics goal is ${GOAL_PCT}% in one session.`)));
  const total = pool().length;
  const covered = pool().filter((c) => tried.has(c.n)).length;
  box.appendChild(el("p", "session-coverage",
    `You have now tried ${covered} of the ${total} practice questions `
    + `(${Math.round(covered / total * 100)}%).`
    + (covered < total ? " Your next session will be mostly ones you haven't tried yet." : "")));
  if (!unmastered().length) {
    box.appendChild(el("p", null, `You have now learned all ${total} questions.`));
  }

  const row = el("div", "session-actions");
  const missed = session.missed.slice();
  if (missed.length) {
    const rev = el("button", "btn", missed.length === 1
      ? "Review the one you missed" : `Review the ${missed.length} you missed`);
    rev.type = "button";
    rev.addEventListener("click", () => {
      session.review = { qs: missed, at: 0 };
      nextQuestion();
    });
    row.appendChild(rev);
  }
  const again = el("button", missed.length ? "btn ghost" : "btn", "Start a new session");
  again.type = "button";
  again.addEventListener("click", newSession);
  row.appendChild(again);
  box.appendChild(row);
  (row.querySelector("button")).focus();
}

function newSession() {
  session.asked = 0; session.right = 0; session.missed = []; session.review = null;
  session.used = new Set();
  nextQuestion();
}

function reviewDone() {
  const box = document.getElementById("quiz");
  box.innerHTML = "";
  const n = session.review.qs.length;
  box.appendChild(el("p", "q-meta", "Review"));
  box.appendChild(el("h3", "q-text",
    n === 1 ? "That was the one you missed." : `That was all ${n} you missed.`));
  const again = el("button", "btn", "Start a new session");
  again.type = "button";
  again.addEventListener("click", newSession);
  box.appendChild(again);
  again.focus();
}

function nextQuestion() {
  let q;
  if (session.review) {
    if (session.review.at >= session.review.qs.length) return reviewDone();
    q = session.review.qs[session.review.at++];
  } else {
    if (session.asked >= SESSION) return sessionSummary();
    // Mostly questions never tried; the rest go back over ones not yet
    // learned. Nothing repeats within a session. Once everything has been
    // tried and learned, sessions draw from the whole bank.
    const fresh = pool().filter((c) => !tried.has(c.n) && !session.used.has(c.n));
    const weak = unmastered().filter((c) => tried.has(c.n) && !session.used.has(c.n));
    let left = fresh.length && (!weak.length || Math.random() < NEW_SHARE) ? fresh : weak;
    if (!left.length) left = pool().filter((c) => !session.used.has(c.n));
    if (!left.length) left = pool();
    q = left[Math.floor(Math.random() * left.length)];
    session.used.add(q.n);
  }
  const need = q.need || 1;
  // Any member of the answer set is correct, so the ones SHOWN are chosen
  // at random — otherwise a question with several right answers would only
  // ever teach its first one.
  // Questions with no honest distractors are ALWAYS recall. The rest are a
  // coin flip between the two formats.
  if (q.r || Math.random() < recallChance()) {
    state.current = { q, need, recall: true, shown: q.a.slice(),
                      options: [], picked: [], answered: false };
    return render();
  }
  const shown = shuffle(q.a).slice(0, need);
  // Four distractors regardless of how many are wanted, so a "name five"
  // question is not accidentally easier than a "name one".
  const options = shuffle(shown.concat(distractorsFor(q, DISTRACTORS)));

  state.current = { q, need, recall: false, shown, options, picked: [], answered: false };
  render();
}

// ---------- drawing ----------

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Recall: the question, a moment to think, then every accepted answer and
// your own honest verdict. Used where the accepted answers exhaust their
// category and no valid distractor exists — see MIN_DISTRACTORS in
// tools/build-civics.py. Self-assessment is the point rather than a
// compromise: it is how flashcards have always worked, and it is closer to
// an oral interview than picking from a list ever gets.
function renderRecall() {
  const { q } = state.current;
  const box = document.getElementById("quiz");
  box.innerHTML = "";
  box.appendChild(el("p", "q-meta", metaText(q)));
  box.appendChild(el("h3", "q-text", q.q));
  box.appendChild(el("p", "q-need",
    q.need > 1 ? "The interview asks for " + q.need + "." : ""));

  // Writing it down before looking is the whole mechanism. Committing to an
  // answer is what makes the verdict afterwards honest — "I was thinking of
  // that" does not survive having typed something else. It is deliberately
  // NOT graded: "Federalist Papers", "the federalist papers" and
  // "Federalist" are one answer, and no matcher gets every form right.
  // Marking a correct answer wrong is the one failure to avoid, so the
  // person who wrote it decides.
  const entry = el("div", "recall-entry");
  const input = el("input", "recall-input");
  input.type = "text";
  input.setAttribute("aria-label", "Your answer");
  input.placeholder = q.need > 1 ? "Type your answers, separated by commas"
                                 : "Type your answer";
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") revealRecall();
  });
  entry.appendChild(input);
  const show = el("button", "btn recall-show", "Show the answer");
  show.type = "button";
  show.addEventListener("click", revealRecall);
  entry.appendChild(show);
  box.appendChild(entry);
  input.focus();
  box.appendChild(el("div", "q-feedback"));
  progress();
}

function revealRecall() {
  const { q } = state.current;
  const box = document.getElementById("quiz");
  const typed = (box.querySelector(".recall-input") || {}).value || "";
  const entry = box.querySelector(".recall-entry");
  if (entry) entry.hidden = true;

  const fb = box.querySelector(".q-feedback");
  fb.className = "q-feedback";
  if (typed.trim()) fb.appendChild(el("p", "fb-typed", "You wrote: " + typed.trim()));
  fb.appendChild(el("p", "fb-answer",
    q.a.length === 1 ? "The answer:" : "Any of these counts (" + q.a.length + "):"));
  const ul = el("ul", "recall-answers");
  q.a.forEach((a) => ul.appendChild(el("li", null, a)));
  fb.appendChild(ul);

  const row = el("div", "recall-judge");
  [["I had it", true], ["I didn't", false]].forEach(([label, knew]) => {
    const b = el("button", knew ? "btn" : "btn ghost", label);
    b.type = "button";
    b.addEventListener("click", () => judgeRecall(knew));
    row.appendChild(b);
  });
  fb.appendChild(row);
}

function judgeRecall(knew) {
  const cur = state.current;
  if (cur.answered) return;
  cur.answered = true;
  state.asked++;
  tally(cur.q, knew);
  if (knew) {
    state.right++;
    state.seen[cur.q.n] = (state.seen[cur.q.n] || 0) + 1;
  } else {
    state.seen[cur.q.n] = 0;
  }
  saveSeen();
  const fb = document.getElementById("quiz").querySelector(".q-feedback");
  fb.querySelector(".recall-judge").remove();
  const next = el("button", "btn", "Next question");
  next.type = "button";
  next.addEventListener("click", nextQuestion);
  fb.appendChild(next);
  next.focus();
  progress();
}

function render() {
  if (state.current.recall) return renderRecall();
  const { q, options } = state.current;
  const box = document.getElementById("quiz");
  box.innerHTML = "";

  const meta = el("p", "q-meta", metaText(q));
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
  tally(cur.q, correct);

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
  saveSeen();

  showFeedback(correct);
  progress();
}

function showFeedback(correct) {
  const cur = state.current;
  const fb = document.getElementById("quiz").querySelector(".q-feedback");
  fb.className = "q-feedback " + (correct ? "ok" : "no");

  fb.appendChild(el("p", "fb-verdict", correct ? "Correct." : "Not correct."));

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
      "These answers also count: " + others.join(" · ")));
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
    ? `You are ready. The real test asks ${TEST_DRAW} questions. You need `
      + `${TEST_PASS} right. At this rate you would get about ${expect}.`
      
    : `The real test asks ${TEST_DRAW} questions. You need ${TEST_PASS} right. `
      + `At this rate you would get about ${expect}. `
      + `Learn about ${READY_AT} to be ready.`;
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
// ---------- page chrome ----------

// Options off is the default and the point: somebody arriving to answer
// questions should not have to read a control panel first. The switch is
// remembered, so anyone who wants the dials gets them every visit.
const OPTS_KEY = "civics-options";

function optionsOn() {
  return localStorage.getItem(OPTS_KEY) === "on";
}

function applyOptions(on) {
  localStorage.setItem(OPTS_KEY, on ? "on" : "off");
  document.body.classList.toggle("options-on", on);
  // Leaving the simulation switched on while hiding its control would strand
  // somebody in exam mode with no way back, so turning Options off returns
  // to practice.
  if (!on) {
    const practice = document.querySelector('input[name="mode"][value="practice"]');
    if (practice && !practice.checked) practice.click();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const on = optionsOn();
  document.querySelectorAll('input[name="opts"]').forEach((r) => {
    r.checked = (r.value === "on") === on;
    r.addEventListener("change", () => applyOptions(r.value === "on"));
  });
  applyOptions(on);

  // Get started opens the heading panel rather than duplicating it. One
  // explanation, two ways in — a button for people who want telling, and a
  // small circle for people who already know where to look.
  const gs = document.getElementById("get-started");
  const intro = document.querySelector(".h2-row details.info");
  if (gs && intro) {
    gs.addEventListener("click", () => {
      intro.open = !intro.open;
      if (intro.open) intro.scrollIntoView({ block: "nearest" });
    });
  }

  const chosen = mixKey();
  document.querySelectorAll('input[name="mix"]').forEach((r) => {
    r.checked = r.value === chosen;
    r.addEventListener("change", () => setMix(r.value));
  });
  showMixEffect();

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
          + "rather than by state \u2014 which is why your neighbors two "
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

  // One place that does all four stops, keeps what you find, and prints.
  const go = el("p", "find-go");
  const link = el("a", "btn", "Find all eight and keep them");
  link.href = "citizenship-answers.html";
  go.appendChild(link);
  box.appendChild(go);
});
