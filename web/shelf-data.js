/* The shelf: capability resources, sorted out of the pantry.
 *
 * Source: ordinarypeopleaction.com, the companion site to Skye Perryman's
 * "Ordinary People, Extraordinary Times". Inventoried 2026-09-20.
 *
 * WHY THESE AND NOT THE OTHERS — the shelf test: does this teach a
 * capability the reader keeps, or recruit for a position? Fact-checking
 * is a capability. "100 Days of Action" is recruitment. The capability
 * half is also the durable half: a get-out-the-vote push expires in
 * November, a media literacy kit does not.
 *
 * EXCLUDED on that test, recorded so the sorting is auditable rather than
 * silent: 100 Days of Action, the We Hold These Truths pledge, court
 * reform organizations, the ERA/gender justice guide, the fair courts
 * guide, the wealth gap guide, and canvassing *opportunities* (the
 * canvassing how-to is in; where to show up is not).
 *
 * PROVISIONAL. Every classification below is Claude's first pass and
 * wants Bill's review. Two known gaps, both deliberate:
 *   1. `href` points at the section, not the item, because the deep URLs
 *      have not been verified. Verify them before this page is deployed.
 *   2. Nothing here is hosted. These are Democracy Forward's documents
 *      and we link to them; mirroring the PDFs would be a copyright
 *      problem and a partnership is the better long game anyway.
 */

const SHELF_SOURCE = {
  name: "Ordinary People, Extraordinary Times",
  href: "https://ordinarypeopleaction.com/resources/",
};

/* mode:        understand | do | both
 * capacity:    minutes | hour | day | many (the most it asks for)
 *              `many` is several hours a week, sustained. Nothing on the
 *              shelf needs it yet — the tier exists so someone with that
 *              much to give is not told their only options are small ones.
 * reach:       group | solo | either
 * disposition: make | talk | dig | showup | support | learn
 * branch:      spotting | doing            (which practice branch it feeds)
 */
const SHELF = [
  {
    id: "media-literacy",
    action: "Pick one post that made you angry this week, and work out why it was shown to you.",
    title: "Media Literacy Starter Kit",
    where: "Action 02 — Achieve Information Sobriety",
    blurb: "How the feed decides what you see, and how to tell when you are being worked on.",
    mode: "understand", capacity: "minutes", reach: "solo",
    disposition: ["learn", "dig"], branch: "spotting",
  },
  {
    id: "fact-check",
    action: "Take one claim you nearly shared, and check it before you do.",
    title: "Fact-checking and news literacy guide",
    where: "Action 02 — Achieve Information Sobriety",
    blurb: "Check a claim before you pass it on. The single highest-leverage twenty minutes here.",
    mode: "both", capacity: "minutes", reach: "solo",
    disposition: ["dig", "learn"], branch: "spotting",
  },
  {
    id: "spectator-to-agent",
    action: "Write down one thing you have been watching happen — and one thing you could do about it.",
    title: "From spectator to agent",
    where: "Action 01 — Stop Spiraling & Pick Up a Shovel",
    blurb: "For the specific feeling of watching it all happen and not knowing where to stand.",
    mode: "understand", capacity: "minutes", reach: "solo",
    disposition: ["learn", "support"], branch: "spotting",
  },
  {
    id: "talk-to-children",
    action: "Answer the question a kid in your life has already asked you.",
    title: "How to talk with children about what is happening",
    where: "Kids Corner",
    blurb: "If someone small has been asking you questions you did not have an answer for.",
    mode: "do", capacity: "minutes", reach: "solo",
    disposition: ["talk", "support"], branch: "doing",
  },
  {
    id: "discussion-guide",
    action: "Ask four people to read one chapter, and set a date to talk about it.",
    title: "Chapter discussion guides",
    where: "Actions 01–07",
    blurb: "Ready-made questions for a group that wants to talk about this properly.",
    mode: "both", capacity: "hour", reach: "group",
    disposition: ["talk", "learn"], branch: "doing",
  },
  {
    id: "dinners",
    action: "Invite five people to dinner and let their questions start it.",
    title: "Dinners for Democracy",
    where: "Act Today",
    blurb: "A format for having the conversation over a meal, with people you already eat with.",
    mode: "do", capacity: "hour", reach: "group",
    disposition: ["talk", "make"], branch: "doing",
  },
  {
    id: "empty-chair",
    action: "Book a room and hold the town hall your representative is not holding.",
    title: "Empty Chair Town Hall",
    where: "Action 01 — Stop Spiraling & Pick Up a Shovel",
    blurb: "What to do when your representative will not hold one. A real format, run by ordinary people.",
    mode: "do", capacity: "day", reach: "group",
    disposition: ["showup", "make"], branch: "doing",
  },
  {
    id: "canvassing",
    action: "Practise the first thirty seconds at a door, before you ever stand at one.",
    title: "Canvassing how-to",
    where: "Action 01 — Stop Spiraling & Pick Up a Shovel",
    blurb: "The craft of knocking on a door and having it go well. The skill, not a shift sign-up.",
    mode: "do", capacity: "day", reach: "either",
    disposition: ["talk", "showup"], branch: "doing",
  },
  {
    id: "civic-desert",
    action: "Find out who actually covers local news where you live, and what nobody is covering.",
    title: "Civic desert engagement guide",
    where: "Action 03 — Begin at Your Front Door",
    blurb: "For places where there is no local paper and no obvious way in. Start here rather than nationally.",
    mode: "both", capacity: "hour", reach: "either",
    disposition: ["dig", "showup"], branch: "doing",
  },
  {
    id: "community-protection",
    action: "Pick one thing your street could organise for itself, and ask three neighbours.",
    title: "Community protection action guide",
    where: "Action 03 — Begin at Your Front Door",
    blurb: "Concrete things a neighbourhood can organise for itself, at neighbourhood scale.",
    mode: "do", capacity: "day", reach: "group",
    disposition: ["make", "showup"], branch: "doing",
  },
  {
    id: "voting-rights",
    action: "Run the checklist on your own registration, then send it to five people.",
    title: "Voting rights support checklist",
    where: "Action 01 — Stop Spiraling & Pick Up a Shovel",
    blurb: "A checklist, which is the right shape when you have twenty minutes and want them to count.",
    mode: "do", capacity: "minutes", reach: "solo",
    disposition: ["support", "dig"], branch: "doing",
  },
  {
    id: "front-door",
    action: "Find out what your town actually decides, and when it next meets.",
    title: "Civic activism starter",
    where: "Action 03 — Begin at Your Front Door",
    blurb: "The argument for starting local, and what local actually means in practice.",
    mode: "understand", capacity: "hour", reach: "solo",
    disposition: ["learn", "showup"], branch: "doing",
  },
  {
    id: "joy-pathways",
    action: "Put one thing on this week's calendar that has nothing to do with the news.",
    title: "Joy pathways checklist",
    where: "Action 05 — Get Serious About Fear, Courage, and Joy",
    blurb: "Because the people who keep going are not the ones who are angriest.",
    mode: "do", capacity: "minutes", reach: "solo",
    disposition: ["support", "make"], branch: "doing",
  },
  {
    id: "courage-films",
    action: "Watch one film about somebody who did it anyway.",
    title: "Films about people who did it anyway",
    where: "Action 05 — Get Serious About Fear, Courage, and Joy",
    blurb: "For an evening when you do not have another chapter in you.",
    mode: "understand", capacity: "hour", reach: "either",
    disposition: ["learn", "support"], branch: "spotting",
  },
  {
    id: "keep-going",
    action: "Decide now what you will do on the week you stop feeling like it.",
    title: "Journey tools",
    where: "Action 07 — Keep Going",
    blurb: "For the second month, which is when most of this stops.",
    mode: "both", capacity: "minutes", reach: "solo",
    disposition: ["support", "learn"], branch: "doing",
  },
];
