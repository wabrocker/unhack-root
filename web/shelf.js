/* The whole shelf, deliberately NOT ranked.
 *
 * A browsable catalogue is the menu, and the menu is what the next-step
 * page exists to replace. This page exists anyway for two reasons: some
 * people arrive wanting to see what is there rather than be handed
 * something, and a project whose whole currency is that you can check its
 * work cannot refuse to show its own catalogue.
 *
 * So: reachable from the result and from here, never from the opener;
 * grouped by time needed, which is neutral; and in no order that could be
 * read as best-first.
 */
(function () {
  "use strict";

  const GROUPS = [
    { cap: "minutes", label: "Twenty minutes",
      note: "Enough to finish in one sitting." },
    { cap: "hour",    label: "An hour or so",
      note: "Usually because other people are involved." },
    { cap: "day",     label: "A day",
      note: "Worth planning rather than squeezing in." },
    { cap: "many",    label: "Several hours a week",
      note: "Sustained, rather than one and done." },
  ];

  const root = document.getElementById("shelf");
  if (!root) return;

  function h(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Counts come from the generated data so the page cannot claim a number
  // the catalogue does not support.
  const counts = document.getElementById("counts");
  if (counts && typeof SHELF_STATS !== "undefined") {
    counts.replaceChildren();
    const p = h("p");
    p.append("We looked at " + SHELF_STATS.considered + " guides in ");
    const a = document.createElement("a");
    a.href = SHELF_STATS.sourceHref;
    a.rel = "noopener";
    a.textContent = SHELF_STATS.source;
    p.appendChild(a);
    p.append(", read " + SHELF_STATS.read + " of them, and carry " +
             SHELF_STATS.carried + ".");
    counts.appendChild(p);

    const p2 = h("p", "counts-detail");
    p2.append(SHELF_STATS.outOfScope + " are out of scope — policy asks, " +
              "pledges and campaign drives, which this shelf does not carry " +
              "from anyone, ourselves included. Another " + SHELF_STATS.held +
              " are held while we check how they are framed. None of that is " +
              "a judgement on the guides; it is what this page is for.");
    counts.appendChild(p2);
  }

  GROUPS.forEach(function (g) {
    const items = SHELF.filter(function (i) { return i.capacity === g.cap; });
    if (!items.length) return;

    const sec = h("section", "shelf-group");
    sec.appendChild(h("h3", null, g.label));
    sec.appendChild(h("p", "group-note", g.note));

    items.forEach(function (i) {
      const card = h("article", "shelf-card");
      card.appendChild(h("h4", "shelf-action", i.action));
      card.appendChild(h("p", "shelf-blurb", i.blurb));

      const meta = h("p", "shelf-meta");
      meta.append(i.reach === "group"
        ? "Needs a few other people. "
        : i.reach === "solo" ? "You can do this alone. " : "Alone or with others. ");
      meta.append(i.mode === "understand"
        ? "Understanding first."
        : i.mode === "do" ? "Doing first." : "Either way in.");
      card.appendChild(meta);

      const link = document.createElement("a");
      link.className = "shelf-link";
      link.href = i.url;
      link.rel = "noopener";
      link.target = "_blank";
      link.textContent = i.button + " →";
      card.appendChild(link);

      const d = document.createElement("details");
      d.className = "shelf-outline";
      const sum = document.createElement("summary");
      sum.textContent = i.outline ? "What this guide covers" : "About this guide";
      d.appendChild(sum);
      const body = h("div", "shelf-outline-body");
      body.appendChild(h("p", "guide-name", i.title));
      if (i.outline) {
        const ul = document.createElement("ul");
        i.outline.forEach(function (o) { ul.appendChild(h("li", null, o)); });
        body.appendChild(ul);
      } else {
        body.appendChild(h("p", null,
          "We have not been able to read this one yet, so rather than guess " +
          "at what is in it: open it and see."));
      }
      d.appendChild(body);
      card.appendChild(d);

      sec.appendChild(card);
    });
    root.appendChild(sec);
  });
})();
