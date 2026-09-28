// The Citizenship Basics badge — the first achievement badge (Bill,
// 2026-09-28; see "Achievements - badges, levels and counselors" in the
// vault). Three steps, all of them things this site already does:
//
//   1. Master the practice quiz — every quiz question right twice.
//   2. Pass the practice exam — 12 of 20, the real format.
//   3. Fill in your eight local answers.
//
// It reads what the three pages already save, so nothing here asks the
// person to do anything twice. Everything stays in this browser. Nothing
// is sent anywhere, and there is no score and no ranking: a badge is a
// record of what you did.
//
// ONCE EARNED, KEPT. The quiz's "Start again" clears its progress, and the
// local answers change after every election. Neither takes the badge away:
// the date it was earned is written down separately, the moment all three
// steps are true.
//
// Any page can show the card by including an element with
// id="badge-citizenship-basics". The pages announce changes with a
// "civics-change" event, and the card redraws.

const BADGE_KEY = "uhd-badges";
const MASTERED_KEY = "civics-mastered";   // set by civics-quiz.js on finishing
const LOCAL_ANSWER_QS = [38, 39, 30, 57, 23, 29, 61, 62];

function badgeRead(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (e) { return fallback; }
}

function citizenshipSteps() {
  const exams = badgeRead("civics-exams", []);
  const answers = badgeRead("civics-answers", {});
  return [
    { done: !!localStorage.getItem(MASTERED_KEY),
      label: "Master the practice quiz",
      how: "Answer every question right twice.",
      href: "citizenship-test.html#play" },
    { done: exams.some((a) => a && a.passed),
      label: "Pass the practice exam",
      how: "20 questions, 12 right to pass — the real format.",
      href: "citizenship-test.html#play" },
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

// The emblem: a star in a ring, in the site's own blue and the shelf's gold.
const BADGE_SVG =
  '<svg viewBox="0 0 64 64" aria-hidden="true">' +
  '<circle cx="32" cy="32" r="30" fill="#123f52"/>' +
  '<circle cx="32" cy="32" r="25" fill="none" stroke="#e6c26a" stroke-width="2.5"/>' +
  '<path d="M32 17l4.4 9 9.9 1.4-7.2 7 1.7 9.8L32 39.6l-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4z" fill="#e6c26a"/>' +
  '</svg>';

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
  head.innerHTML = '<span class="badge-emblem">' + BADGE_SVG + "</span>";
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
