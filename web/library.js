/* The room.
 *
 * Spines are drawn from the data, not decorated by hand: colour is the
 * family, thickness is what the book asks of your week, the gilt emblem
 * repeats the family so the colour is not carrying it alone — dark blue
 * against dark green is exactly the pair colourblind readers lose.
 *
 * Height varies too, but height means nothing. Real shelves are not
 * uniform and a row of identical rectangles reads as a chart. It is
 * derived from the id so a book is the same height every visit; a book
 * that changed size between visits would look like a bug.
 */
(function () {
  "use strict";

  const EMBLEMS = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5z"/>',
    "two-figures": '<circle cx="8.5" cy="8" r="2.6"/><circle cx="16" cy="9" r="2.2"/>' +
      '<path d="M4 19c0-2.8 2-4.6 4.5-4.6S13 16.2 13 19"/><path d="M13.5 19c0-2.2 1.3-3.7 3-3.7S19.5 16.8 19.5 19"/>',
    rooftop: '<path d="M3 11 12 4l9 7"/><path d="M6 11v8h12v-8"/><path d="M10.5 19v-4.5h3V19"/>',
    "oak-leaf": '<path d="M12 21V8"/><path d="M12 8c0-3 2-5 5-5 0 4-2 6-5 6z"/>' +
      '<path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5z"/><path d="M12 17c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
  };

  const shelf = document.getElementById("shelf");
  if (!shelf || typeof SHELF === "undefined") return;

  // Stable pseudo-random from the id, so heights never move between visits.
  function jitter(id, range) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
    return h % range;
  }

  function emblem(name, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' +
      (EMBLEMS[name] || EMBLEMS.compass) + "</svg>";
  }

  let open = null, openItem = null;

  function close() {
    if (!open) return;
    open.classList.remove("is-open");
    open.setAttribute("aria-expanded", "false");
    open = null;
    openItem = null;
    document.body.classList.remove("has-open-book");
    const bar = document.getElementById("book-bar");
    if (bar) bar.hidden = true;
  }

  /* The control for the open book, in ordinary flow under the shelf. It
     lives here rather than on the cover because a cover rotated in 3D is
     not reliably hit-testable — the browser reports the shelf behind it
     even at the button's own centre, on desktop and on a phone. */
  function showBar(item) {
    const bar = document.getElementById("book-bar");
    if (!bar) return;
    const fam = LIBRARY.families[item.family];
    document.getElementById("bar-title").textContent = item.title;
    document.getElementById("bar-meta").textContent =
      fam.label + " · " + LIBRARY.capacities[item.capacity].label;
    bar.hidden = false;
  }

  function build(item) {
    const fam = LIBRARY.families[item.family];
    const cap = LIBRARY.capacities[item.capacity];

    const book = document.createElement("button");
    book.type = "button";
    book.className = "book book-t" + cap.thickness +
      (item.form === "pamphlet" ? " is-pamphlet" : "") +
      (item.source === "us" ? " is-ours" : "");
    book.style.setProperty("--leather", fam.colour);
    // Floor raised from 172: the cover has to hold an emblem, a title,
    // a rule, a line of meta and a button, and the shortest books were
    // clipping the button off the bottom.
    book.style.setProperty("--tall", (186 + jitter(item.id, 30)) + "px");
    book.setAttribute("aria-expanded", "false");
    book.setAttribute("aria-label",
      item.title + " — " + fam.label + ", " + cap.label);

    book.innerHTML =
      '<span class="spine">' +
        '<span class="band band-top"></span>' +
        emblem(fam.emblem, "gilt-emblem") +
        '<span class="spine-title">' + (item.spine || item.title) + "</span>" +
        '<span class="band band-bottom"></span>' +
      "</span>" +
      '<span class="face">' +
        '<span class="face-inner">' +
          emblem(fam.emblem, "face-emblem") +
          '<span class="face-title">' + item.title + "</span>" +
          '<span class="face-rule"></span>' +
          '<span class="face-meta">' + fam.label + " &middot; " + cap.label + "</span>" +
        "</span>" +
      "</span>";

    book.addEventListener("click", function (e) {
      e.stopPropagation();
      if (open === book) { close(); return; }   // push it back on the shelf
      close();
      open = book;
      openItem = item;
      book.classList.add("is-open");
      book.setAttribute("aria-expanded", "true");
      document.body.classList.add("has-open-book");
      showBar(item);
      book.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    });
    book.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      openSynopsis(item);
    });
    return book;
  }

  /* The synopsis. Deliberately the third step — shelf, spine, synopsis,
   * and only then the thing itself. The librarian hands you one book in
   * one step because you are overwhelmed; browsing is slower because
   * browsing is the pleasure. */
  function openSynopsis(item) {
    const fam = LIBRARY.families[item.family];
    const cap = LIBRARY.capacities[item.capacity];
    const back = document.getElementById("synopsis");
    const body = document.getElementById("synopsis-body");
    body.replaceChildren();

    const h = document.createElement("h2");
    h.className = "syn-title";
    h.textContent = item.title;
    body.appendChild(h);

    const meta = document.createElement("p");
    meta.className = "syn-meta";
    meta.innerHTML = emblem(fam.emblem, "syn-emblem") +
      fam.label + " &middot; " + cap.label +
      (item.source === "us" ? " &middot; ours" : " &middot; " + item.where);
    body.appendChild(meta);

    const act = document.createElement("p");
    act.className = "syn-action";
    act.textContent = item.action;
    body.appendChild(act);

    if (item.outline) {
      const ul = document.createElement("ul");
      ul.className = "syn-outline";
      item.outline.forEach(function (o) {
        const li = document.createElement("li");
        li.textContent = o;
        ul.appendChild(li);
      });
      body.appendChild(ul);
    } else {
      const p = document.createElement("p");
      p.className = "syn-unread";
      p.textContent = "Nobody here has read this one yet, so rather than " +
        "guess at what is in it: open it and see.";
      body.appendChild(p);
    }

    const take = document.createElement("a");
    take.className = "take-out";
    take.href = item.url;
    if (/^https?:/i.test(item.url)) { take.rel = "noopener"; take.target = "_blank"; }
    take.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5z"/>' +
      '<path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5z"/>' +
      "</svg><span>Take out the book</span>";
    body.appendChild(take);

    back.hidden = false;
    document.body.classList.add("modal-open");
    take.focus();
  }

  document.getElementById("bar-contents").addEventListener("click", function (e) {
    e.stopPropagation();
    if (openItem) openSynopsis(openItem);
  });
  document.getElementById("bar-back").addEventListener("click", function (e) {
    e.stopPropagation();
    close();
  });

  document.getElementById("synopsis").addEventListener("click", function (e) {
    if (e.target.id === "synopsis" || e.target.classList.contains("syn-close")) {
      e.currentTarget.hidden = true;
      document.body.classList.remove("modal-open");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    const back = document.getElementById("synopsis");
    if (!back.hidden) {
      back.hidden = true;
      document.body.classList.remove("modal-open");
    } else close();
  });
  document.addEventListener("click", close);

  /* Sorting. "Most recently read" uses the record the next-step page
   * already keeps in this browser, so the room quietly rearranges itself
   * around what you have actually done. */
  function recentIds() {
    try {
      const d = JSON.parse(localStorage.getItem("unhack-done")) || [];
      return d.map(function (r) { return r.id; }).filter(Boolean).reverse();
    } catch (e) { return []; }
  }

  function render(order) {
    close();
    shelf.replaceChildren();
    let items = SHELF.slice();
    if (order === "family") {
      const keys = Object.keys(LIBRARY.families);
      items.sort(function (a, b) {
        return keys.indexOf(a.family) - keys.indexOf(b.family) ||
               a.title.localeCompare(b.title);
      });
    } else if (order === "recent") {
      const r = recentIds();
      items.sort(function (a, b) {
        const ia = r.indexOf(a.id), ib = r.indexOf(b.id);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    } else {
      items.sort(function (a, b) {
        return LIBRARY.capacities[a.capacity].thickness -
               LIBRARY.capacities[b.capacity].thickness;
      });
    }
    items.forEach(function (i) { shelf.appendChild(build(i)); });
  }

  document.querySelectorAll("[data-order]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-order]").forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === b));
      });
      render(b.dataset.order);
    });
  });

  render("family");

  /* Arrows, because a horizontal scroll area with no affordance reads as
     a cropped picture rather than a shelf you can walk along. Hidden at
     each end so they never point at nothing. */
  (function () {
    const box = document.getElementById("shelf-case");
    const prev = document.getElementById("shelf-prev");
    const next = document.getElementById("shelf-next");
    if (!box || !prev || !next) return;

    function step() { return Math.max(160, box.clientWidth * 0.75); }
    prev.addEventListener("click", function (e) {
      e.stopPropagation();
      box.scrollBy({ left: -step(), behavior: "smooth" });
    });
    next.addEventListener("click", function (e) {
      e.stopPropagation();
      box.scrollBy({ left: step(), behavior: "smooth" });
    });

    function sync() {
      const over = box.scrollWidth - box.clientWidth;
      prev.hidden = box.scrollLeft < 8;
      next.hidden = over < 8 || box.scrollLeft > over - 8;
    }
    box.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    new MutationObserver(sync).observe(box, { childList: true, subtree: true });
    sync();
  })();

  const legend = document.getElementById("legend");
  if (legend) {
    Object.keys(LIBRARY.families).forEach(function (k) {
      const f = LIBRARY.families[k];
      const s = document.createElement("span");
      s.className = "legend-item";
      s.style.setProperty("--leather", f.colour);
      s.innerHTML = '<span class="legend-swatch">' +
        emblem(f.emblem, "legend-emblem") + "</span>" +
        "<b>" + f.label + "</b> " + f.note;
      legend.appendChild(s);
    });
  }
})();
