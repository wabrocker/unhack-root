// The Citizenship Basics badge — the first achievement badge (Bill,
// 2026-09-28; see "Achievements - badges, levels and counselors" in the
// vault). Three steps, all of them things this site already does:
//
//   1. Score 70% or better in one practice session (20 questions) — a
//      little above the real test's pass mark of 60% (Bill, 2026-09-28).
//   2. Pass the practice exam — 12 of 20, the real format.
//   3. Fill in your eight local answers.
//
// It reads what the three pages already save, so nothing here asks the
// person to do anything twice. Everything stays in this browser. Nothing
// is sent anywhere, and there is no score and no ranking: a badge is a
// record of what you did.
//
// ONCE EARNED, KEPT. The local answers change after every election, and
// clearing them doesn't take the badge away:
// the date it was earned is written down separately, the moment all three
// steps are true.
//
// Any page can show the card by including an element with
// id="badge-citizenship-basics". The pages announce changes with a
// "civics-change" event, and the card redraws.

const BADGE_KEY = "uhd-badges";
const BADGE_PRACTICE_KEY = "civics-practice-best";   // set by civics-quiz.js
const BADGE_PRACTICE_GOAL = 70;                       // percent, in one session
const LOCAL_ANSWER_QS = [38, 39, 30, 57, 23, 29, 61, 62];

function badgeRead(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (e) { return fallback; }
}

function citizenshipSteps() {
  const exams = badgeRead("civics-exams", []);
  const answers = badgeRead("civics-answers", {});
  return [
    { done: (badgeRead(BADGE_PRACTICE_KEY, {}).pct || 0) >= BADGE_PRACTICE_GOAL,
      label: "Score " + BADGE_PRACTICE_GOAL + "% in a practice session",
      how: "20 questions, like the real test — a little above its 60% pass mark.",
      href: "citizenship-test.html#play", open: "practice" },
    { done: exams.some((a) => a && a.passed),
      label: "Pass the practice exam",
      how: "20 questions, 12 right to pass — the real format.",
      href: "citizenship-test.html#exam", open: "exam" },
    { done: LOCAL_ANSWER_QS.every((n) => (answers["q" + n] || "").trim()),
      label: "Fill in your eight local answers",
      how: "Your governor, senators, representative and the rest.",
      href: "citizenship-answers.html" },
  ];
}

function citizenshipEarned() {
  const badges = badgeRead(BADGE_KEY, {});
  if (badges["citizenship-basics"]) return badges["citizenship-basics"];
  if (citizenshipSteps().every((s) => s.done)) {
    badges["citizenship-basics"] = new Date().toISOString().slice(0, 10);
    try { localStorage.setItem(BADGE_KEY, JSON.stringify(badges)); } catch (e) {}
    return badges["citizenship-basics"];
  }
  return null;
}

// The emblems: team-crest shields, like a sports league's logos (Bill,
// 2026-10-05). A locked badge is DRAWN in grays rather than filtered, so
// its colors aren't in the page at all until it's earned: only people who
// finish get to see what it looks like.
const BADGE_SHIELD = "M32 3 L58 11 V31 C58 46.5 46.5 56 32 61 C17.5 56 6 46.5 6 31 V11 Z";
const BADGE_INNER = "M32 8.5 L53 15 V31 C53 43.5 44 51.5 32 55.6 C20 51.5 11 43.5 11 31 V15 Z";
const BADGE_COLORS = {
  earned: { field: "#0f2c4c", rim: "#e6c26a", line: "#ffffff", mark: "#ffffff", accent: "#c8102e" },
  locked: { field: "#c3c9cf", rim: "#9aa3ab", line: "#e9ecef", mark: "#f4f6f8", accent: "#aab3bb" },
};

// Citizenship Basics: the Capitol dome under a star.
function citizenshipEmblem(earned) {
  const c = BADGE_COLORS[earned ? "earned" : "locked"];
  return '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<path d="' + BADGE_SHIELD + '" fill="' + c.field + '" stroke="' + c.rim + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="' + BADGE_INNER + '" fill="none" stroke="' + c.line + '" stroke-width="1.2" stroke-opacity=".55"/>' +
    '<path d="M32 12.5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="' + c.accent + '"/>' +
    '<rect x="30.6" y="24.5" width="2.8" height="3.5" fill="' + c.mark + '"/>' +
    '<path d="M21.5 34.5 A10.5 10.5 0 0 1 42.5 34.5 Z" fill="' + c.mark + '"/>' +
    '<rect x="19.5" y="34.5" width="25" height="2.4" fill="' + c.rim + '"/>' +
    '<g fill="' + c.mark + '"><rect x="21" y="37.6" width="2.4" height="7"/><rect x="25.9" y="37.6" width="2.4" height="7"/>' +
    '<rect x="30.8" y="37.6" width="2.4" height="7"/><rect x="35.7" y="37.6" width="2.4" height="7"/><rect x="40.6" y="37.6" width="2.4" height="7"/></g>' +
    '<rect x="17.5" y="45" width="29" height="3.2" fill="' + c.rim + '"/>' +
    '</svg>';
}

// Trust Basics: a magnifying glass with a check mark — check before you
// trust. Drawn here so the badge has one look wherever it appears; the
// badge itself isn't built yet, so for now it is only ever shown locked.
function trustEmblem(earned) {
  const c = earned
    ? { field: "#0d4a3f", rim: "#e6c26a", line: "#ffffff", mark: "#ffffff", accent: "#e6c26a" }
    : BADGE_COLORS.locked;
  return '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<path d="' + BADGE_SHIELD + '" fill="' + c.field + '" stroke="' + c.rim + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="' + BADGE_INNER + '" fill="none" stroke="' + c.line + '" stroke-width="1.2" stroke-opacity=".55"/>' +
    '<circle cx="29" cy="29" r="10.5" fill="none" stroke="' + c.mark + '" stroke-width="4"/>' +
    '<path d="M36.6 36.6 L45 45" stroke="' + c.mark + '" stroke-width="5.5" stroke-linecap="round"/>' +
    '<path d="M24 29.5 l3.6 3.6 l6.8 -7.4" fill="none" stroke="' + c.accent + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
}

function drawCitizenshipBadge() {
  const box = document.getElementById("badge-citizenship-basics");
  if (!box) return;
  const steps = citizenshipSteps();
  const earned = citizenshipEarned();
  const doneCount = steps.filter((s) => s.done).length;
  box.innerHTML = "";
  box.className = "card badge-card" + (earned ? " is-earned" : "");

  const head = document.createElement("div");
  head.className = "badge-head";
  head.innerHTML = '<span class="badge-emblem">' + citizenshipEmblem(!!earned) + "</span>";
  const words = document.createElement("div");
  const h = document.createElement("h3");
  h.textContent = "Citizenship Basics";
  const sub = document.createElement("p");
  sub.className = "badge-sub";
  sub.textContent = earned
    ? "Badge earned on " + new Date(earned + "T12:00:00").toLocaleDateString(undefined,
        { year: "numeric", month: "long", day: "numeric" }) + "."
    : "A badge, in " + steps.length + " steps. " + doneCount + " of " + steps.length + " done.";
  words.appendChild(h);
  words.appendChild(sub);
  head.appendChild(words);
  box.appendChild(head);

  const ol = document.createElement("ol");
  ol.className = "badge-steps";
  steps.forEach((s) => {
    const li = document.createElement("li");
    li.className = s.done ? "done" : "";
    const mark = document.createElement("span");
    mark.className = "badge-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = s.done ? "✓" : "";
    li.appendChild(mark);
    const t = document.createElement("span");
    if (s.done) {
      t.innerHTML = "<b></b> <span class=\"sr-only\">(done)</span>";
      t.querySelector("b").textContent = s.label;
    } else {
      const a = document.createElement("a");
      a.href = s.href;
      a.textContent = s.label;
      // Already on the practice test page: switch to the right mode here
      // rather than following a link to the page you're on, which does
      // nothing when the exam is tucked behind the Options switch.
      a.addEventListener("click", (e) => {
        if (s.open === "exam" && typeof openExam === "function") {
          e.preventDefault(); openExam();
        } else if (s.open === "practice" && typeof leaveExam === "function") {
          e.preventDefault(); leaveExam();
          document.getElementById("play").scrollIntoView({ block: "start" });
        }
      });
      t.appendChild(a);
      t.appendChild(document.createTextNode(" — " + s.how));
    }
    li.appendChild(t);
    ol.appendChild(li);
  });
  box.appendChild(ol);

  const note = document.createElement("p");
  note.className = "badge-note";
  note.textContent = "Kept in this browser only. Nothing is sent anywhere, and nobody else sees it.";
  box.appendChild(note);
}

document.addEventListener("civics-change", drawCitizenshipBadge);
document.addEventListener("DOMContentLoaded", drawCitizenshipBadge);
if (document.readyState !== "loading") drawCitizenshipBadge();
