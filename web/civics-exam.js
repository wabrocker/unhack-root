// Exam mode: what the real interview would have done to you.
//
// Separate from practice on purpose. Practice teaches — it corrects you the
// moment you slip, brings a question back until you have it twice, and lets
// you meet it as multiple choice when that is the gentler way in. None of
// that belongs in a measurement. A ruler that helps you is not a ruler.
//
// THE REAL TEST. 20 questions drawn from all 128, 12 correct to pass. The
// officer stops early: at 12 right, or at 9 wrong, whichever comes first.
// That stopping rule is new in the 2025 version and it is the reason this
// reports a stopping point rather than always showing twenty.
//
// BLIND, THEN GRADED. You type all twenty answers with no feedback, and
// only then see the answer key. That ordering is the whole integrity of the
// thing: somebody who watches themselves failing at question eight starts
// marking generously at question nine, and a baseline built that way
// measures optimism instead of knowledge.
//
// So early stopping cannot happen live — we do not know what is right until
// grading. It is computed afterwards from the graded sequence instead,
// which gives the honest score AND the faithful detail without letting
// either corrupt the other.
//
// ALL 128, INCLUDING THE EIGHT. Practice skips the questions whose answers
// change with elections or with where you live, because no answer key we
// ship stays true. An exam you grade yourself has no such problem: you are
// the key. So the simulation covers the whole bank exactly as the interview
// does, and is more complete than practice rather than less.

const EXAM_DRAW = 20;   // questions asked
const EXAM_PASS = 12;   // correct answers needed
const EXAM_FAIL = 9;    // wrong answers that end it
const EXAM_KEY = "civics-exams";

const exam = { qs: [], typed: [], at: 0, marks: [] };

function examAttempts() {
  try {
    return JSON.parse(localStorage.getItem(EXAM_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveAttempt(a) {
  const all = examAttempts().concat([a]).slice(-25);
  try {
    localStorage.setItem(EXAM_KEY, JSON.stringify(all));
  } catch (e) {
    /* a full quota must not cost somebody their result on screen */
  }
}

// Where a real officer would have put the pen down.
function stoppingPoint(marks) {
  let right = 0, wrong = 0;
  for (let i = 0; i < marks.length; i++) {
    marks[i] ? right++ : wrong++;
    if (right >= EXAM_PASS || wrong >= EXAM_FAIL) return i + 1;
  }
  return marks.length;
}

// ---------- taking it ----------

// Shown before the draw, not after. Practice covers 120 questions; this
// draws from all 128, so somebody who has mastered everything practice
// offers can still meet a question they have never seen here. That is
// exactly what the real interview does — but arriving as a surprise it
// reads as a bug, and it would quietly depress a baseline that is supposed
// to mean something.
//
// So the eight are named up front, with the link, and looking them up
// first is offered rather than discouraged. That is not cheating: knowing
// who the President is today is the actual expectation, and USCIS itself
// tells applicants to go and check.
// What the real interview does — the same facts whether you are about to
// simulate it or about to sit it. Most applicants do not know the stopping
// rule at all, and it is new in the 2025 version, so this is preparation in
// its own right rather than instructions for a game. Built once and shown
// in two places: behind a fold on the page, always readable, and again in
// the pre-flight where it is immediately relevant.
function interviewFacts() {
  const ul = el("ul", "exam-brief");
  [
    `${EXAM_DRAW} questions drawn from all 128. ${EXAM_PASS} correct to pass.`,
    `A real officer stops at ${EXAM_PASS} correct or ${EXAM_FAIL} wrong, `
      + `whichever comes first. Many applicants do not know this.`,
    "The officer asks aloud and you answer aloud. Any accepted answer "
      + "counts \u2014 most questions have several.",
  ].forEach((t) => ul.appendChild(el("li", null, t)));

  // Point at our own walkthrough, not at USCIS. USCIS answers seven of the
  // eight; the state capital is not on that page, because a capital does
  // not go out of date and an updates page is for answers that do.
  const li = el("li", null, "");
  li.appendChild(document.createTextNode(
    "This includes the eight questions practice does not ask. Their answers "
    + "change, or they depend on where you live. Find them first: "));
  const a = el("a", null, "Your Eight Answers");
  a.href = "citizenship-answers.html";
  li.appendChild(a);
  li.appendChild(document.createTextNode(
    ". The interview expects you to know them, so looking them up now is "
    + "preparation, not cheating."));
  ul.appendChild(li);
  return ul;
}

function startExam() {
  const box = document.getElementById("exam");
  document.getElementById("play").hidden = true;
  box.hidden = false;
  box.innerHTML = "";
  box.appendChild(el("h3", "q-text", "Before you start"));
  box.appendChild(interviewFacts());

  const row = el("div", "recall-judge");
  const go = el("button", "btn", "Begin");
  go.type = "button";
  go.addEventListener("click", beginExam);
  row.appendChild(go);
  const no = el("button", "btn ghost", "Not now");
  no.type = "button";
  no.addEventListener("click", leaveExam);
  row.appendChild(no);
  box.appendChild(row);
  go.focus();
}

function beginExam() {
  exam.qs = shuffle(CIVICS).slice(0, EXAM_DRAW);
  exam.typed = [];
  exam.marks = [];
  exam.at = 0;
  askExam();
}

function leaveExam() {
  document.getElementById("exam").hidden = true;
  document.getElementById("play").hidden = false;
  const practice = document.querySelector('input[name="mode"][value="practice"]');
  if (practice) practice.checked = true;
  showExamStatus();
}

function askExam() {
  const q = exam.qs[exam.at];
  const box = document.getElementById("exam");
  box.innerHTML = "";

  box.appendChild(el("p", "q-meta", `Question ${exam.at + 1} of ${EXAM_DRAW}`));
  box.appendChild(el("h3", "q-text", q.q));
  if ((q.need || 1) > 1) {
    box.appendChild(el("p", "q-need", `The interview asks for ${q.need}.`));
  }

  const row = el("div", "recall-entry");
  const input = el("input", "recall-input");
  input.type = "text";
  input.setAttribute("aria-label", "Your answer");
  input.placeholder = (q.need || 1) > 1 ? "Your answers, separated by commas"
                                        : "Your answer";
  input.value = exam.typed[exam.at] || "";
  const go = () => {
    exam.typed[exam.at] = input.value;
    if (exam.at < EXAM_DRAW - 1) {
      exam.at++;
      return askExam();
    }
    // Asked ONCE, at the end. A blank counts as wrong, so it is worth
    // knowing before the answers are revealed and it is too late.
    const blank = exam.typed.filter((t) => !(t || "").trim()).length
                + (EXAM_DRAW - exam.typed.length);
    if (blank && !confirm(
        blank === 1
          ? "One answer is still blank. A blank counts as wrong. Finish anyway?"
          : blank + " answers are still blank. A blank counts as wrong. "
            + "Finish anyway?")) {
      return;
    }
    exam.at++;
    gradeExam();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  row.appendChild(input);

  const next = el("button", "btn",
    exam.at === EXAM_DRAW - 1 ? "Finish and see the answers" : "Next");
  next.type = "button";
  next.addEventListener("click", go);
  row.appendChild(next);

  // Going BACK is the fix for a mis-tapped Next, and it is better than a
  // confirmation on every blank. Somebody skipping a question they truly do
  // not know should not be interrogated about it twenty times; somebody who
  // fat-fingered past one they DID know needs a way to undo, and only that.
  // Answers are already kept per question, so stepping back costs nothing.
  if (exam.at > 0) {
    const back = el("button", "btn ghost", "Back");
    back.type = "button";
    back.addEventListener("click", () => {
      exam.typed[exam.at] = input.value;
      exam.at--;
      askExam();
    });
    row.appendChild(back);
  }
  box.appendChild(row);

  // No feedback here, deliberately. Nothing is revealed until all twenty
  // are in — see the note at the top about what watching yourself fail
  // does to your own marking.
  const out = el("p", "exam-note",
    "No answers shown until the end. Leave it blank if you do not know.");
  box.appendChild(out);

  const quit = el("button", "btn ghost small", "Abandon this attempt");
  quit.type = "button";
  quit.addEventListener("click", leaveExam);
  box.appendChild(quit);

  input.focus();
}

// ---------- grading it ----------

function gradeExam() {
  const box = document.getElementById("exam");
  box.innerHTML = "";
  box.appendChild(el("h3", "q-text", "Mark your own answers"));
  box.appendChild(el("p", "exam-note",
    "Nothing here is graded for you — too many wordings are right for any "
    + "checker to judge fairly. Be honest: the only person a generous mark "
    + "fools is the one sitting the real interview."));

  exam.qs.forEach((q, i) => {
    const card = el("div", "exam-item");
    card.appendChild(el("p", "q-meta", `${i + 1}. ${q.sub}`));
    card.appendChild(el("p", "exam-q", q.q));
    card.appendChild(el("p", "fb-typed",
      exam.typed[i] && exam.typed[i].trim()
        ? "You wrote: " + exam.typed[i].trim()
        : "You left this blank."));

    if (q.kind === "lookup") {
      const p = el("p", "fb-also");
      p.appendChild(document.createTextNode("This one changes — check "));
      const a = el("a", null, "USCIS test updates");
      a.href = CIVICS_UPDATES;
      a.rel = "noopener";
      p.appendChild(a);
      p.appendChild(document.createTextNode(", or your state's official site."));
      card.appendChild(p);
    } else {
      card.appendChild(el("p", "fb-also",
        (q.a.length === 1 ? "Answer: " : "Any of these: ") + q.a.join(" · ")));
    }

    const judge = el("div", "recall-judge");
    [["Correct", true], ["Not correct", false]].forEach(([label, ok]) => {
      const b = el("button", ok ? "btn small" : "btn ghost small", label);
      b.type = "button";
      b.addEventListener("click", () => {
        exam.marks[i] = ok;
        judge.querySelectorAll("button").forEach((x) => x.classList.remove("chosen"));
        b.classList.add("chosen");
        const done = exam.marks.filter((m) => m !== undefined).length;
        document.getElementById("exam-tally").textContent =
          `${done} of ${EXAM_DRAW} marked`;
        document.getElementById("exam-score").disabled = done < EXAM_DRAW;
      });
      judge.appendChild(b);
    });
    card.appendChild(judge);
    box.appendChild(card);
  });

  const foot = el("div", "exam-foot");
  const tally = el("span", null, `0 of ${EXAM_DRAW} marked`);
  tally.id = "exam-tally";
  foot.appendChild(tally);
  const score = el("button", "btn", "See how you did");
  score.type = "button";
  score.id = "exam-score";
  score.disabled = true;
  score.addEventListener("click", showResult);
  foot.appendChild(score);
  box.appendChild(foot);
}

// ---------- the verdict ----------

function showResult() {
  const marks = exam.marks.map((m) => !!m);
  const right = marks.filter(Boolean).length;
  const passed = right >= EXAM_PASS;
  const stop = stoppingPoint(marks);

  saveAttempt({ on: new Date().toISOString().slice(0, 10), right: right,
                of: EXAM_DRAW, passed: passed, stop: stop });

  const box = document.getElementById("exam");
  box.innerHTML = "";
  const verdict = el("h3", "exam-verdict " + (passed ? "pass" : "fail"),
    passed ? "You would have passed." : "You would not have passed.");
  box.appendChild(verdict);
  box.appendChild(el("p", "exam-big", `${right} of ${EXAM_DRAW} correct — `
    + `${EXAM_PASS} needed.`));

  // The stopping rule is the part people do not know about, so it is worth
  // stating rather than just applying.
  box.appendChild(el("p", "exam-note",
    `A real officer would have stopped after question ${stop}: the test ends `
    + `at ${EXAM_PASS} correct or ${EXAM_FAIL} wrong, whichever comes first.`));

  // The eight are NOT available during the test, and that is deliberate:
  // they are meant to be learned beforehand, and a sheet within reach would
  // hide the very gap this measures — recognising a name but not being able
  // to produce it cold. Afterwards is different. Missing one is specific and
  // fixable, so name which and say where to go.
  const missedEight = exam.qs.filter((q, i) => q.kind === "lookup" && !marks[i]);
  if (missedEight.length) {
    const card = el("div", "missed-eight");
    card.appendChild(el("p", "fb-verdict",
      missedEight.length === 1
        ? "One of these came from the eight you look up:"
        : `${missedEight.length} of these came from the eight you look up:`));
    const ul = el("ul", null);
    missedEight.forEach((q) => ul.appendChild(el("li", null, q.q)));
    card.appendChild(ul);
    const line = el("p", null, "");
    line.appendChild(document.createTextNode(
      "Their answers change, or depend on where you live, so practice cannot "
      + "teach them. Find them once and keep them: "));
    const a = el("a", null, "Your Eight Answers");
    a.href = "citizenship-answers.html";
    line.appendChild(a);
    line.appendChild(document.createTextNode("."));
    card.appendChild(line);
    box.appendChild(card);
  }

  const hist = examAttempts();
  if (hist.length > 1) {
    box.appendChild(el("h3", "q-text", "Your attempts"));
    const ul = el("ul", "exam-history");
    hist.slice().reverse().forEach((a) => {
      ul.appendChild(el("li", a.passed ? "pass" : "fail",
        `${a.on} — ${a.right}/${a.of}${a.passed ? " ✓" : ""}`));
    });
    box.appendChild(ul);
  }

  const back = el("button", "btn", "Back to practice");
  back.type = "button";
  back.addEventListener("click", leaveExam);
  box.appendChild(back);
}

// ---------- the way in ----------

function showExamStatus() {
  const el0 = document.getElementById("exam-status");
  if (!el0) return;
  const hist = examAttempts();
  const last = hist[hist.length - 1];
  el0.textContent = last
    ? `Last attempt ${last.on}: ${last.right}/${last.of}`
      + (last.passed ? " — a pass." : " — not a pass yet.")
    : "Never sat it? Take it cold. A first score you did not study for is the "
      + "only honest baseline you will ever get.";

}

document.addEventListener("DOMContentLoaded", function () {
  // The Test switch is the way in now. Choosing the simulation runs the
  // pre-flight; leaving it, however you leave it, puts the switch back.
  // BOTH directions. Handling only the exam side left the switch able to
  // flip to Practice while the exam stayed on screen — which is exactly
  // how turning Options off mid-exam stranded you, since the rescue in
  // applyOptions() works by clicking this radio. A guard that fires and
  // changes nothing is worse than none: it reads as covered.
  //
  // No loop: leaveExam() sets .checked directly rather than clicking, so
  // it raises no second change event.
  document.querySelectorAll('input[name="mode"]').forEach((r) => {
    r.addEventListener("change", () => {
      if (!r.checked) return;
      if (r.value === "exam") startExam(); else leaveExam();
    });
  });
  const facts = document.getElementById("interview-facts");
  if (facts) facts.appendChild(interviewFacts());
  showExamStatus();
});
