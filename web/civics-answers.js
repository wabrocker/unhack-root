// The eight answers the practice test cannot give you.
//
// Seven of them you must look up: they change with elections, or they
// depend on where you live. The eighth — your state capital — never
// changes, so this page simply tells you. Grouping it with the other seven
// was a mistake: USCIS lists seven on its updates page and not the capital,
// because a capital cannot go out of date.
//
// PLAIN WORDS ON PURPOSE. Most people using this are preparing for a
// naturalization interview, and English is often not their first language.
// The civics is hard enough. Short sentences, common words, no idioms.
//
// The answers stay in this browser. Nothing is sent anywhere.

const ANSWERS_KEY = "civics-answers";

// Capitals do not change. The last one to move did so in 1910, so this
// table will still be right long after every other answer on this page has
// been replaced twice over.
const CAPITALS = {
  "Alabama": "Montgomery", "Alaska": "Juneau", "Arizona": "Phoenix",
  "Arkansas": "Little Rock", "California": "Sacramento", "Colorado": "Denver",
  "Connecticut": "Hartford", "Delaware": "Dover", "Florida": "Tallahassee",
  "Georgia": "Atlanta", "Hawaii": "Honolulu", "Idaho": "Boise",
  "Illinois": "Springfield", "Indiana": "Indianapolis", "Iowa": "Des Moines",
  "Kansas": "Topeka", "Kentucky": "Frankfort", "Louisiana": "Baton Rouge",
  "Maine": "Augusta", "Maryland": "Annapolis", "Massachusetts": "Boston",
  "Michigan": "Lansing", "Minnesota": "Saint Paul", "Mississippi": "Jackson",
  "Missouri": "Jefferson City", "Montana": "Helena", "Nebraska": "Lincoln",
  "Nevada": "Carson City", "New Hampshire": "Concord", "New Jersey": "Trenton",
  "New Mexico": "Santa Fe", "New York": "Albany", "North Carolina": "Raleigh",
  "North Dakota": "Bismarck", "Ohio": "Columbus", "Oklahoma": "Oklahoma City",
  "Oregon": "Salem", "Pennsylvania": "Harrisburg", "Rhode Island": "Providence",
  "South Carolina": "Columbia", "South Dakota": "Pierre", "Tennessee": "Nashville",
  "Texas": "Austin", "Utah": "Salt Lake City", "Vermont": "Montpelier",
  "Virginia": "Richmond", "Washington": "Olympia", "West Virginia": "Charleston",
  "Wisconsin": "Madison", "Wyoming": "Cheyenne",
};

// USCIS gives these places different correct answers, in square brackets on
// its own question list. A resident of Washington D.C. who answers with a
// governor's name is WRONG, and a tool that let them practise it that way
// would be doing harm.
const TERRITORIES = {
  "Puerto Rico": "San Juan", "Guam": "Hagatna",
  "U.S. Virgin Islands": "Charlotte Amalie", "American Samoa": "Pago Pago",
  "Northern Mariana Islands": "Saipan",
};

const DC = "Washington, D.C.";

function placeList() {
  return Object.keys(CAPITALS).concat([DC]).concat(Object.keys(TERRITORIES)).sort();
}

function isDC(p) { return p === DC; }
function isTerritory(p) { return Object.prototype.hasOwnProperty.call(TERRITORIES, p); }

// ---------- what we know without being told ----------

function capitalFor(place) {
  if (isDC(place)) {
    return "D.C. is not a state. It does not have a capital.";
  }
  if (isTerritory(place)) return TERRITORIES[place];
  return CAPITALS[place] || "";
}

function governorNote(place) {
  if (isDC(place)) return "D.C. does not have a governor. That is the answer.";
  return "";
}

function senatorNote(place) {
  if (isDC(place) || isTerritory(place)) {
    return "Your home has no U.S. senators. That is the answer.";
  }
  return "";
}

function repNote(place) {
  if (isTerritory(place)) {
    return "Territories have a Delegate or Resident Commissioner, not a voting "
         + "representative. You may name that person, or say your territory has "
         + "no voting representative.";
  }
  if (isDC(place)) {
    return "D.C. has a Delegate, not a voting representative. You may name the "
         + "Delegate, or say D.C. has no voting representative.";
  }
  return "";
}

// ---------- the eight, in the order you will find them ----------

const STEPS = [
  {
    id: "uscis",
    title: "Step 1 — Four answers from USCIS",
    plain: "USCIS puts these four answers on its own website. Use those words. "
         + "The officer marks your answer against what USCIS says.",
    href: "https://www.uscis.gov/citizenship/testupdates",
    linkText: "Open the USCIS answers page",
    // The answers are not on the front of that page. Without this, people
    // open it, see nothing that looks like an answer, and give up.
    after: "On that page, scroll down to near the bottom. Find the line that "
         + "says \u201cCivics Test (2025 Naturalization Civics Test) "
         + "Updates\u201d. Click the down arrow next to it. The four answers "
         + "are inside.",
    // All four are behind one accordion, so reading all four before coming
    // back turns four trips between tabs into one. That is worth more than
    // any control we could add on this side.
    tip: "Read all four answers before you come back. They are in the same "
       + "place, so you only need to go once. To come back here, use the "
       + "back button on your phone or browser. Your answers are saved.",
    fields: [
      { n: 38, q: "Who is the President of the United States now?" },
      { n: 39, q: "Who is the Vice President of the United States now?" },
      { n: 30, q: "Who is the Speaker of the House of Representatives now?" },
      { n: 57, q: "Who is the Chief Justice of the United States now?" },
    ],
  },
  {
    id: "senate",
    title: "Step 2 — Your senators",
    plain: "Every state has two senators. You only need to name one.",
    href: "https://www.senate.gov/senators/senators-contact.htm",
    linkText: "Open senate.gov and choose your state",
    note: senatorNote,
    fields: [{ n: 23, q: "Who is one of your state's U.S. senators now?" }],
  },
  {
    id: "house",
    title: "Step 3 — Your representative",
    plain: "This one is not by state. It is by district. People a few streets "
         + "away can have a different representative. The website asks for your "
         + "ZIP code.",
    href: "https://www.house.gov/representatives/find-your-representative",
    linkText: "Open house.gov and enter your ZIP code",
    note: repNote,
    fields: [{ n: 29, q: "Name your U.S. representative." }],
  },
  {
    id: "governor",
    title: "Step 4 — Your governor",
    plain: "Choose your state to open its own website. The governor's name is "
         + "on the front page.",
    href: "https://www.usa.gov/state-governments",
    linkText: "Open the list of state websites",
    note: governorNote,
    fields: [{ n: 61, q: "Who is the governor of your state now?" }],
  },
];

// ---------- saving ----------

function loadAnswers() {
  try {
    return JSON.parse(localStorage.getItem(ANSWERS_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function saveAnswers(a) {
  try {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(a));
  } catch (e) {
    /* nothing here is worth losing the page over */
  }
}

const answers = loadAnswers();

function setAnswer(key, value) {
  answers[key] = value;
  saveAnswers(answers);
  renderSheet();
}

// ---------- drawing ----------

function ael(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function renderPlacePicker() {
  const box = document.getElementById("place-step");
  box.innerHTML = "";
  box.appendChild(ael("h3", null, "First — where do you live?"));
  box.appendChild(ael("p", "plain",
    "Four of the eight answers depend on where you live. Choose your state "
    + "or territory. We will fill in what we can."));

  const sel = document.createElement("select");
  sel.id = "place";
  sel.setAttribute("aria-label", "Your state or territory");
  const blank = document.createElement("option");
  blank.value = ""; blank.textContent = "Choose…";
  sel.appendChild(blank);
  placeList().forEach((p) => {
    const o = document.createElement("option");
    o.value = p; o.textContent = p;
    if (answers.place === p) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener("change", () => {
    answers.place = sel.value;
    // The capital is ours to answer, so it is filled in rather than asked.
    answers["q62"] = sel.value ? capitalFor(sel.value) : "";
    saveAnswers(answers);
    renderSteps();
    renderSheet();
  });
  box.appendChild(sel);
}

function renderSteps() {
  const box = document.getElementById("steps");
  box.innerHTML = "";
  const place = answers.place || "";

  STEPS.forEach((step) => {
    const card = ael("div", "card step");
    card.appendChild(ael("h3", null, step.title));
    card.appendChild(ael("p", "plain", step.plain));

    const special = step.note ? step.note(place) : "";
    if (special) card.appendChild(ael("p", "step-note", special));

    // SAME TAB, deliberately. These used to open a new tab so this page
    // would "stay where it is" — but it saves every keystroke already, so
    // the new tab bought nothing and cost the Back button, which is the one
    // way back everyone knows on a phone. Reported: no easy way back.
    const a = ael("a", "btn", step.linkText);
    a.href = step.href;
    a.addEventListener("click", () => {
      answers.wentOut = true;
      saveAnswers(answers);
    });
    card.appendChild(a);

    if (step.after) card.appendChild(ael("p", "step-how", step.after));
    // Honest about depth. senate.gov makes you pick a state, house.gov
    // takes a ZIP, usa.gov sends you on to a state site — so you are often
    // two or three pages deep and one Back press is not enough.
    card.appendChild(ael("p", "step-back",
      "When you have the answer, press your back button until you are here "
      + "again. If you clicked through more than one page, press it more "
      + "than once. Nothing you have typed is lost."));
    if (step.tip) card.appendChild(ael("p", "step-tip", step.tip));

    // The instructions matter once, before you leave. The fields matter
    // every time you come back. Measured: step 1 stands 993px tall on an
    // 812px phone, but its four fields span only 351px — so a returning
    // visitor scrolls past prose they have already read to reach the only
    // part they still need. Grouping the fields lets them be jumped to.
    const fieldBox = ael("div", "fields");
    if (step.fields.length > 1) {
      fieldBox.appendChild(ael("p", "fields-head", "Write the answers here"));
    }
    step.fields.forEach((f) => {
      const wrap = ael("div", "field");
      const lab = ael("label", null, f.q);
      lab.htmlFor = "q" + f.n;
      const inp = document.createElement("input");
      inp.type = "text";
      inp.id = "q" + f.n;
      inp.className = "recall-input";
      inp.placeholder = "Write the answer here";
      inp.value = answers["q" + f.n] || "";
      inp.addEventListener("input", () => setAnswer("q" + f.n, inp.value));
      wrap.appendChild(lab);
      wrap.appendChild(inp);
      fieldBox.appendChild(wrap);
    });
    card.appendChild(fieldBox);
    box.appendChild(card);
  });

  // The capital, answered rather than asked.
  const cap = ael("div", "card step");
  cap.appendChild(ael("h3", null, "Step 5 — Your state capital"));
  if (!place) {
    cap.appendChild(ael("p", "plain", "Choose where you live above and this "
      + "answer will appear. You do not have to look it up."));
  } else {
    cap.appendChild(ael("p", "plain",
      "You do not need to look this one up. A capital does not change."));
    const ans = ael("p", "cap-answer", capitalFor(place));
    cap.appendChild(ael("p", "field-q", "What is the capital of your state?"));
    cap.appendChild(ans);
  }
  document.getElementById("steps").appendChild(cap);
}

const SHEET_ORDER = [
  [38, "Who is the President of the United States now?"],
  [39, "Who is the Vice President of the United States now?"],
  [30, "Who is the Speaker of the House of Representatives now?"],
  [57, "Who is the Chief Justice of the United States now?"],
  [23, "Who is one of your state's U.S. senators now?"],
  [29, "Name your U.S. representative."],
  [61, "Who is the governor of your state now?"],
  [62, "What is the capital of your state?"],
];

function renderSheet() {
  const box = document.getElementById("sheet");
  box.innerHTML = "";
  const done = SHEET_ORDER.filter(([n]) => (answers["q" + n] || "").trim()).length;

  box.appendChild(ael("h3", null, "Your eight answers"));
  box.appendChild(ael("p", "plain",
    done === 8 ? "All eight are filled in. You can print this page and keep it."
               : `${done} of 8 filled in. Finish the steps above.`));
  if (answers.place) {
    box.appendChild(ael("p", "plain-small", "For " + answers.place + "."));
  }

  const dl = ael("dl", "sheet-list");
  SHEET_ORDER.forEach(([n, q]) => {
    dl.appendChild(ael("dt", null, q));
    const v = (answers["q" + n] || "").trim();
    dl.appendChild(ael("dd", v ? "" : "empty", v || "— not filled in yet —"));
  });
  box.appendChild(dl);

  const print = ael("button", "btn", "Print this sheet");
  print.type = "button";
  print.addEventListener("click", () => window.print());
  box.appendChild(print);

  const clear = ael("button", "btn ghost", "Clear my answers");
  clear.type = "button";
  clear.addEventListener("click", () => {
    if (!confirm("Delete all eight answers from this browser?")) return;
    Object.keys(answers).forEach((k) => delete answers[k]);
    saveAnswers(answers);
    renderPlacePicker(); renderSteps(); renderSheet();
  });
  box.appendChild(clear);
}

// Once you have opened one of the other websites, coming back should not
// mean hunting. This bar appears after the first outward click and jumps
// straight to the boxes you are filling in.
function armReturnBar() {
  const bar = document.getElementById("return-bar");
  if (!bar) return;
  let target = null;

  // Shown on RETURN, which means after a full page load — so whether we
  // went out has to be remembered in storage, not in a variable that the
  // navigation discards.
  if (answers.wentOut) bar.hidden = false;

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("#steps a.btn");
    if (!a) return;
    target = a.closest(".step").querySelector(".fields");
    bar.hidden = false;
  });

  bar.querySelector("button").addEventListener("click", () => {
    const box = target || document.querySelector("#steps .fields");
    if (!box) return;
    box.scrollIntoView({ block: "center", behavior: "smooth" });
    const first = box.querySelector("input");
    if (first) first.focus();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  renderPlacePicker();
  renderSteps();
  renderSheet();
  armReturnBar();
});
