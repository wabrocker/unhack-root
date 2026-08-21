#!/usr/bin/env python3
"""Write the shared header nav, its script, and each page's breadcrumb.

    python3 tools/navgen.py           rewrite web/*.html
    python3 tools/navgen.py --check   fail if any page is out of date

Six pages carry a byte-identical header. That duplication is fine to
*ship* — it keeps every page a complete, standalone document — but it is
not fine to *maintain* by hand, because a nav edited on five pages out of
six is a bug nobody notices until a visitor is stranded on the sixth.

So the nav lives here once, and the pages are generated from it.

`--check` is the half that matters. A generator you have to remember to
run is only half a fix; build.sh runs the check on every build, so a
hand-edited nav fails the build instead of reaching the server. Keep it
that way: a verification that cannot fail is not a verification.

SITE is also the site map. Adding a page means adding a line here — which
is deliberately the same edit that puts it in the menu and gives it a way
back out.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB = ROOT / "web"

# slug -> (own href, parent href, parent label). The root has no parent,
# so it gets no breadcrumb rather than a disabled one.
SITE = {
    "index":            (None,                    None,             None),
    "about":            ("about.html",            "index.html",     "Home"),
    "states":           ("states.html",           "index.html",     "Home"),
    "resources":        ("resources.html",        "index.html",     "Home"),
    "citizen-primer":   ("citizen-primer.html",   "resources.html", "All Resources"),
    "citizenship-test": ("citizenship-test.html", "resources.html", "All Resources"),
}

# The pages that live under the Resources group. Listed once so the menu
# and the section marker cannot disagree about what is in the section.
RESOURCES = ("resources.html", "citizen-primer.html", "citizenship-test.html")


def nav(current):
    def mark(href):
        return ' aria-current="page"' if href == current else ""

    here = ' data-section-current=""' if current in RESOURCES else ""
    return f'''    <nav id="site-menu" class="site-menu" hidden>
      <a href="about.html"{mark("about.html")}>About Us</a>
      <a href="states.html"{mark("states.html")}>State Apps</a>
      <div class="menu-group">
        <button type="button" class="submenu-toggle" id="resources-toggle"
                aria-expanded="false" aria-controls="resources-menu"{here}>Resources</button>
        <div id="resources-menu" class="submenu" hidden>
          <a href="resources.html"{mark("resources.html")}>All Resources</a>
          <a href="citizen-primer.html"{mark("citizen-primer.html")}>Citizen Primer</a>
          <a href="citizenship-test.html"{mark("citizenship-test.html")}>Citizenship Practice Test</a>
        </div>
      </div>
    </nav>'''


# The masthead line and the footer, repeated verbatim on all six pages for
# the same reason the nav is: a page is a complete document. Owned here so
# a wording change is one edit rather than six, and so five pages cannot
# quietly disagree with the sixth about what the project is for.
MASTHEAD = '''    <p class="subtitle">in the United States</p>
    <div class="lede-row">
      <p class="lede">Knowledgeable, cross-partisan citizens teaming up to
      save Democracy.</p>
      <details class="info">
        <summary aria-label="The fuller statement of purpose">i</summary>
        <div class="info-body">
          <p class="info-mastery">Educating citizens on how democratic
          systems have been exploited &mdash; and providing specific,
          actionable, and cross-partisan ways to help repair them using the
          &ldquo;tri-pronged&rdquo; power of verifiable knowledge, strength in
          numbers and clarity of our teams&rsquo; purposes.</p>
        </div>
      </details>
    </div>
  </header>'''

FOOTER = '''  <footer>
    <p>
      Open source, MIT licensed.
      <a href="https://github.com/wabrocker/unhack-root" rel="noopener">Unhack US on Github</a>.
    </p>
  </footer>'''

SCRIPT = '''<script>
// Two disclosures, not one: the menu itself, and the Resources group
// inside it. Closing the menu closes the group too, so reopening it
// never restores a half-open state the button no longer describes.
(function () {
  var btn = document.getElementById("menu-toggle");
  var menu = document.getElementById("site-menu");
  var subBtn = document.getElementById("resources-toggle");
  var sub = document.getElementById("resources-menu");

  function setSub(open) {
    if (!subBtn) return;
    subBtn.setAttribute("aria-expanded", String(open));
    sub.hidden = !open;
  }
  function setMenu(open) {
    btn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    if (!open) setSub(false);
  }

  btn.addEventListener("click", function () {
    setMenu(btn.getAttribute("aria-expanded") !== "true");
  });
  if (subBtn) {
    subBtn.addEventListener("click", function () {
      setSub(subBtn.getAttribute("aria-expanded") !== "true");
    });
  }
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") setMenu(false);
  });

  // The group deliberately does NOT spring open on its own pages. At
  // desktop width this panel is absolutely positioned, so opening it on
  // load dropped it straight over the site title. The button carries
  // data-section-current instead — it says "you are in here" without
  // covering anything.
})();
</script>'''


def render(slug, source):
    """The page as it should be, given the page as it is."""
    own, parent, plabel = SITE[slug]
    s = source

    s, n = re.subn(r'    <nav id="site-menu".*?</nav>', nav(own), s, flags=re.S)
    if n != 1:
        raise SystemExit(f"FAIL: {slug}.html has {n} site-menu blocks, expected 1")

    s, n = re.subn(r"<script>.*?</script>", SCRIPT, s, flags=re.S)
    if n != 1:
        raise SystemExit(f"FAIL: {slug}.html has {n} script blocks, expected 1")

    # Rebuilt from scratch rather than patched in place, so moving the
    # breadcrumb is one edit here instead of six by hand.
    s = re.sub(r'  <nav class="page-nav".*?</nav>\n\n?', "", s, flags=re.S)

    # Masthead and footer, from the single copies above.
    s, n = re.subn(r'    <p class="subtitle">.*?  </header>', MASTHEAD, s, flags=re.S)
    if n != 1:
        raise SystemExit(f"FAIL: {slug}.html has {n} mastheads, expected 1")
    s, n = re.subn(r'  <footer>.*?  </footer>', FOOTER, s, flags=re.S)
    if n != 1:
        raise SystemExit(f"FAIL: {slug}.html has {n} footers, expected 1")
    if parent:
        crumb = (f'  <nav class="page-nav" aria-label="Breadcrumb">\n'
                 f'    <a href="{parent}">&larr; {plabel}</a>\n  </nav>\n\n')
        s, n = re.subn(r"(  <header>\n)", crumb + r"\1", s, count=1)
        if n != 1:
            raise SystemExit(f"FAIL: {slug}.html has no <header>")

    return s


def main():
    check = "--check" in sys.argv[1:]
    stale = []

    for slug in SITE:
        p = WEB / f"{slug}.html"
        if not p.exists():
            raise SystemExit(f"FAIL: {p.relative_to(ROOT)} is listed in SITE but does not exist")
        source = p.read_text()
        out = render(slug, source)
        if out == source:
            continue
        if check:
            stale.append(f"{slug}.html")
        else:
            p.write_text(out)
            print(f"  rewrote web/{slug}.html")

    if check and stale:
        raise SystemExit(
            "FAIL: the header is hand-edited or out of date in: "
            + ", ".join(stale)
            + "\n      Run: python3 tools/navgen.py"
        )
    print("nav: all pages match" if check else "nav: up to date")


if __name__ == "__main__":
    main()
