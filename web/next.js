/* One question at a time, then ONE next step.
 *
 * The output contract is deliberate and it is the whole point: a ranked
 * list is a menu, and the menu is the thing this page exists to replace.
 * So the page shows one recommendation, says out loud why that one, and
 * hides everything else behind a single "not this one?".
 *
 * Nothing is stored anywhere but this browser, and the page works with
 * JavaScript doing all of it — no account, no server, no key.
 */
(function () {
  "use strict";

  const QUESTIONS = [
    {
      id: "mode",
      q: "Do you want to understand it first, or do something first?",
      help: "Neither is the better answer. Some people cannot act until it " +
            "makes sense; others learn by doing and stall if handed a reading " +
            "list. Knowing which you are saves you months.",
      options: [
        { v: "understand", label: "Understand it first" },
        { v: "do",         label: "Do something first" },
      ],
    },
    {
      id: "capacity",
      q: "What can you actually spare?",
      help: "Asked first because it is the most predictive thing about you " +
            "and almost nobody asks it. Answer with what is true on a normal " +
            "week, not what you wish were true.",
      options: [
        { v: "minutes", label: "Twenty minutes, once" },
        { v: "hour",    label: "An hour a week" },
        { v: "day",     label: "A weekend day, sometimes" },
      ],
    },
    {
      id: "reach",
      q: "Is there a group of people who already listen to you?",
      help: "A congregation, a school, a team, a neighbourhood board, a " +
            "group chat, your customers. This is where the leverage actually " +
            "is, and most civic advice ignores it and sends everyone to the " +
            "same phone line.",
      options: [
        { v: "group", label: "Yes, there is" },
        { v: "solo",  label: "Not really — just me" },
      ],
    },
    {
      id: "disposition",
      q: "What kind of doing feels like you?",
      help: "Not what you ought to care about — what you are drawn to. This " +
            "is the difference between a next step you take and one you " +
            "agree with and never do.",
      options: [
        { v: "talk",    label: "Talking with people" },
        { v: "dig",     label: "Digging for facts" },
        { v: "make",    label: "Making or organising something" },
        { v: "showup",  label: "Showing up in a room" },
        { v: "support", label: "Quietly backing someone else" },
        { v: "learn",   label: "Getting it straight in my own head" },
      ],
    },
    {
      id: "why",
      q: "What brought you here?",
      help: "In your own words. There is no list to choose from on purpose " +
            "— any list we wrote would be a political document, and the " +
            "taxonomy would be the position.",
      free: true,
      placeholder: "The thing that made you open this…",
    },
  ];

  const CAP_RANK = { minutes: 1, hour: 2, day: 3 };

  const answers = {};
  let step = 0;
  let ranked = [];
  let shown = 0;

  const el = {
    stage: document.getElementById("stage"),
    progress: document.getElementById("progress"),
  };

  /* --- scoring ------------------------------------------------------ */

  function score(item) {
    let s = 0;

    // Capacity is a ceiling, not a preference. Recommending a weekend to
    // someone with twenty minutes is how this page would fail.
    if (CAP_RANK[item.capacity] > CAP_RANK[answers.capacity]) return -1;
    s += 3 - (CAP_RANK[answers.capacity] - CAP_RANK[item.capacity]);

    // Same for a group you do not have.
    if (item.reach === "group" && answers.reach !== "group") return -1;
    if (item.reach === answers.reach) s += 2;

    if (item.mode === answers.mode || item.mode === "both") s += 3;

    if (item.disposition.includes(answers.disposition)) s += 4;

    return s;
  }

  function reason(item) {
    const bits = [];
    if (answers.capacity === "minutes") bits.push("you have twenty minutes");
    if (answers.capacity === "hour") bits.push("you have about an hour a week");
    if (answers.capacity === "day") bits.push("you have a day now and then");
    if (item.reach === "group" && answers.reach === "group") {
      bits.push("you already have people who listen to you");
    }
    const disp = QUESTIONS[3].options.find(o => o.v === answers.disposition);
    if (disp && item.disposition.includes(answers.disposition)) {
      bits.push("you said " + disp.label.toLowerCase() + " is what feels like you");
    }
    if (item.mode === answers.mode) {
      bits.push(answers.mode === "understand"
        ? "you want it to make sense first"
        : "you would rather start doing");
    }
    return bits;
  }

  /* --- rendering ---------------------------------------------------- */

  function h(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderProgress() {
    el.progress.textContent = step < QUESTIONS.length
      ? "Question " + (step + 1) + " of " + QUESTIONS.length
      : "";
  }

  function renderQuestion() {
    const q = QUESTIONS[step];
    el.stage.replaceChildren();

    el.stage.appendChild(h("h2", "q", q.q));

    const help = h("p", "help", q.help);
    el.stage.appendChild(help);

    if (q.free) {
      const ta = document.createElement("textarea");
      ta.id = "free-answer";
      ta.rows = 3;
      ta.placeholder = q.placeholder;
      ta.setAttribute("aria-label", q.q);
      el.stage.appendChild(ta);

      const go = h("button", "btn-primary", "Show me one thing to do");
      go.addEventListener("click", function () {
        answers[q.id] = ta.value.trim();
        step++;
        finish();
      });
      el.stage.appendChild(go);

      const skip = h("button", "btn-link", "Skip this");
      skip.addEventListener("click", function () {
        answers[q.id] = "";
        step++;
        finish();
      });
      el.stage.appendChild(skip);
    } else {
      const list = h("div", "options");
      q.options.forEach(function (o) {
        const b = h("button", "option", o.label);
        b.addEventListener("click", function () {
          answers[q.id] = o.v;
          step++;
          render();
        });
        list.appendChild(b);
      });
      el.stage.appendChild(list);
    }

    if (step > 0) {
      const back = h("button", "btn-link", "← Back");
      back.addEventListener("click", function () { step--; render(); });
      el.stage.appendChild(back);
    }
    renderProgress();
  }

  function finish() {
    ranked = SHELF
      .map(function (i) { return { item: i, s: score(i) }; })
      .filter(function (r) { return r.s >= 0; })
      .sort(function (a, b) { return b.s - a.s; });
    shown = 0;
    renderResult();
  }

  function renderResult() {
    el.stage.replaceChildren();
    renderProgress();

    if (!ranked.length || shown >= ranked.length) {
      el.stage.appendChild(h("h2", "q", "Nothing on the shelf fits that."));
      el.stage.appendChild(h("p", null,
        "That is a real answer rather than a failure. This shelf is small " +
        "and deliberately sorted, and saying so beats inventing something " +
        "that half fits."));
      const again = h("button", "btn-primary", "Start over");
      again.addEventListener("click", reset);
      el.stage.appendChild(again);
      return;
    }

    const pick = ranked[shown].item;

    if (answers.why) {
      const echo = h("p", "echo");
      echo.append("You came here because: ");
      echo.appendChild(h("em", null, answers.why));
      el.stage.appendChild(echo);
    }

    el.stage.appendChild(h("p", "eyebrow", "Your next step"));
    el.stage.appendChild(h("h2", "pick-title", pick.title));
    el.stage.appendChild(h("p", "pick-blurb", pick.blurb));

    const why = h("div", "why");
    why.appendChild(h("p", "why-lead", "Why this one:"));
    const ul = document.createElement("ul");
    reason(pick).forEach(function (r) { ul.appendChild(h("li", null, r)); });
    why.appendChild(ul);
    el.stage.appendChild(why);

    const link = document.createElement("a");
    link.className = "btn-primary";
    link.href = SHELF_SOURCE.href;
    link.rel = "noopener";
    link.target = "_blank";
    link.textContent = "Open it →";
    el.stage.appendChild(link);

    const src = h("p", "source");
    src.append("Find it under ");
    src.appendChild(h("strong", null, pick.where));
    src.append(" on " + SHELF_SOURCE.name + "’s resource page. It is " +
               "their document, not ours — we only decided it was the " +
               "one to hand you.");
    el.stage.appendChild(src);

    const more = h("button", "btn-link", "Not this one?");
    more.addEventListener("click", function () { shown++; renderResult(); });
    el.stage.appendChild(more);

    const again = h("button", "btn-link", "Start over");
    again.addEventListener("click", reset);
    el.stage.appendChild(again);
  }

  function reset() {
    Object.keys(answers).forEach(function (k) { delete answers[k]; });
    step = 0;
    render();
  }

  function render() {
    if (step < QUESTIONS.length) renderQuestion();
    else finish();
  }

  /* --- help mode ----------------------------------------------------
   * Ported from fl.unhackdemocracy.us, where it earned its place: one
   * flag governs every explainer, so the page reads clean for someone
   * returning without losing the scaffolding for someone new. Off by
   * default, and set in <head> before paint so it never flashes.
   */
  (function () {
    const KEY = "unhack-help-mode";
    const box = document.getElementById("help-mode-toggle");
    if (!box) return;
    let on = false;
    try { on = localStorage.getItem(KEY) === "on"; } catch (e) { on = false; }
    box.checked = on;
    document.documentElement.setAttribute("data-help-mode", on ? "on" : "off");
    box.addEventListener("change", function () {
      const now = box.checked;
      document.documentElement.setAttribute("data-help-mode", now ? "on" : "off");
      try { localStorage.setItem(KEY, now ? "on" : "off"); } catch (e) { /* private mode */ }
    });
  })();

  render();
})();
