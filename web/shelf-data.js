/* The shelf: capability resources, sorted out of the pantry.
 *
 * Source: ordinarypeopleaction.com, the companion site to Skye Perryman's
 * "Ordinary People, Extraordinary Times". Titles and URLs verified live
 * 2026-09-21 — these are the real deep links, not guesses.
 *
 * WHY THESE AND NOT THE OTHERS — the shelf test: does this teach a
 * capability the reader keeps, or recruit for a position? Excluded on
 * that test, recorded so the sorting is auditable rather than silent:
 * 100 Days of Action, the We Hold These Truths pledge, court reform
 * organizations, the ERA/gender justice guide, the fair courts guide, the
 * wealth gap guide, and canvassing *opportunities* (the how-to is in).
 *
 * `outline` is what the guide actually covers, and it is null wherever
 * nobody has read the guide yet. It is never inferred from the title —
 * inventing the contents of somebody else's document is exactly the thing
 * the primary-source rule forbids, and a plausible outline is worse than
 * none because nobody checks it. Six are read; nine are null.
 *
 * Nothing here is hosted. These are Democracy Forward's documents and we
 * link to them.
 */

const SHELF_SOURCE = {
  name: "Ordinary People, Extraordinary Times",
  href: "https://ordinarypeopleaction.com/resources/",
};

/* action:      the specific thing to do. This is the recommendation; the
 *              guide is what backs it up, not the other way round.
 * button:      what the link to the guide says, so the reader knows where
 *              they are going before they go there.
 * mode:        understand | do | both
 * capacity:    minutes | hour | day | many (the most it asks for)
 * reach:       group | solo | either
 * disposition: make | talk | dig | showup | support | learn
 * outline:     what it covers, or null if unread.
 */
const SHELF = [
  {
    id: "fact-check",
    action: "Take one claim you nearly shared, and check it before you do.",
    blurb: "Where to check something before you pass it on.",
    title: "How to Check Facts and Become “News Literate”",
    where: "Action 02",
    url: "https://ordinarypeopleaction.com/2026/08/24/how-to-check-facts-and-become-news-literate/",
    button: "Action 02 · News Literacy Guide",
    mode: "both", capacity: "minutes", reach: "solo",
    disposition: ["dig", "learn"],
    outline: ["What today’s media environment does to a story — sensationalism, algorithms, consolidation", "Bias and literacy tools: AdFontes Media Bias Chart, AllSides, the News Literacy Project", "Fact-checking services: PolitiFact and FactCheck.org", "Who owns what, via the Future Media Project at Harvard", "Disinformation resources, and a list of independent and nonprofit newsrooms"],
  },
  {
    id: "media-literacy",
    action: "Pick one post that made you angry this week, and work out why it was shown to you.",
    blurb: "Where your news actually comes from, and what that changes.",
    title: "Media Literacy Starter Kit",
    where: "Action 02",
    url: "https://ordinarypeopleaction.com/2026/08/24/media-literacy-starter-kit/",
    button: "Action 02 · Media Literacy Kit",
    mode: "understand", capacity: "minutes", reach: "solo",
    disposition: ["learn", "dig"],
    outline: ["Local media — why community papers and public radio see things national outlets miss", "Public and independent media, and how each is funded", "Fact checking — FactCheck.org and PolitiFact", "Newsletters and new media — the newer shapes news arrives in"],
  },
  {
    id: "talk-to-children",
    action: "Answer the question a kid in your life has already asked you.",
    blurb: "For when someone small has been asking you things you did not have an answer for.",
    title: "How to Talk With Children About What is Happening in the United States",
    where: "Action 01",
    url: "https://ordinarypeopleaction.com/2026/08/24/how-to-talk-with-children-about-what-is-happening-in-the-united-states/",
    button: "Action 01 · Talking With Children",
    mode: "do", capacity: "minutes", reach: "solo",
    disposition: ["talk", "support"],
    outline: ["Multimedia and educational resources — PBS LearningMedia, KidCitizen", "Reading lists for children and teenagers", "How to talk about politics and the news, from mental-health and education groups", "Ways to get young people into civic life in their own community"],
  },
  {
    id: "discussion-guide",
    action: "Ask four people to read one chapter, and set a date to talk about it.",
    blurb: "Ready-made questions, so nobody has to invent them on the night.",
    title: "Chapter Discussion Guides",
    where: "Actions 01–07",
    url: "https://ordinarypeopleaction.com/2026/08/25/chapter-1-discussion-guide/",
    button: "Action 01 · Chapter Discussion Guide",
    mode: "both", capacity: "hour", reach: "group",
    disposition: ["talk", "learn"],
    outline: ["What a democracy is made of, and the signs it is coming apart", "People-powered action — the “pick up a shovel” half", "Spectator mindset against agent mindset, side by side", "A reflection exercise turning a worry into something you could do", "Discussion questions for a group to work through together"],
  },
  {
    id: "civic-desert",
    action: "Find out who actually covers local news where you live, and what nobody is covering.",
    blurb: "For places with no local paper and no obvious way in.",
    title: "How To Engage If You’re In A Civic Desert",
    where: "Action 03",
    url: "https://ordinarypeopleaction.com/2026/08/24/how-to-engage-if-youre-in-a-civic-desert/",
    button: "Action 03 · Civic Desert Guide",
    mode: "both", capacity: "hour", reach: "either",
    disposition: ["dig", "showup"],
    outline: ["Use what is already there — the library as the community hub it already is", "Invest in your news ecosystem: public radio, local journalism", "Meet the people who actually decide things, at meetings that are already public", "Third spaces — holding something in the coffee shop rather than waiting for a venue", "National organisations that work in small places: AmeriCorps Seniors, Weave, Idealist, Mutual Aid Hub", "A list of concrete starting points, from nature clubs to serving as an election official"],
  },
  {
    id: "joy-pathways",
    action: "Put one thing on this week’s calendar that has nothing to do with the news.",
    blurb: "The people who keep going are not the ones who are angriest.",
    title: "Pathways to Joy",
    where: "Action 05",
    url: "https://ordinarypeopleaction.com/2026/08/24/pathways-to-joy/",
    button: "Action 05 · Pathways to Joy",
    mode: "do", capacity: "minutes", reach: "solo",
    disposition: ["support", "make"],
    outline: ["Daily routines — small practices that actually bring you joy", "Regular rituals, weekly or monthly, that you keep", "Gratitude, and how to make it a habit rather than a mood", "Embodiment — laughter, movement, eating like you noticed", "Community: film nights, volunteering, classes", "Mindfulness, and putting your attention where you meant to", "Sharing it — telling the story so somebody else starts"],
  },
  {
    id: "spectator-to-agent",
    action: "Write down one thing you have been watching happen — and one thing you could do about it.",
    blurb: "For the specific feeling of watching it all happen and not knowing where to stand.",
    title: "Moving from a Spectator Mindset to an Agent Mindset through Civic Engagement",
    where: "Action 01",
    url: "https://ordinarypeopleaction.com/2026/08/24/moving-from-a-spectator-mindset-to-an-agent-mindset-through-civic-engagement/",
    button: "Action 01 · Spectator to Agent",
    mode: "understand", capacity: "minutes", reach: "solo",
    disposition: ["learn", "support"],
    outline: null,
  },
  {
    id: "dinners",
    action: "Invite five people to dinner and let their questions start it.",
    blurb: "A format for having the conversation over a meal, with people you already eat with.",
    title: "Dinners for Democracy",
    where: "Act Today",
    url: "https://democracyforward.org/dinnersfordemocracy/",
    button: "Act Today · Dinners for Democracy",
    mode: "do", capacity: "hour", reach: "group",
    disposition: ["talk", "make"],
    outline: null,
  },
  {
    id: "empty-chair",
    action: "Book a room and hold the town hall your representative is not holding.",
    blurb: "A real format, run by ordinary people, when the meeting will not happen otherwise.",
    title: "How to Host an “Empty Chair” Town Hall",
    where: "Action 01",
    url: "https://ordinarypeopleaction.com/2026/08/25/how-to-host-an-empty-chair-town-hall/",
    button: "Action 01 · Empty Chair Town Hall",
    mode: "do", capacity: "day", reach: "group",
    disposition: ["showup", "make"],
    outline: null,
  },
  {
    id: "canvassing",
    action: "Practise the first thirty seconds at a door, before you ever stand at one.",
    blurb: "The craft of knocking on a stranger’s door and having it go well.",
    title: "How to Canvass and Canvassing Opportunities",
    where: "Action 01",
    url: "https://ordinarypeopleaction.com/2026/08/24/how-to-canvass-and-canvassing-opportunities/",
    button: "Action 01 · How to Canvass",
    mode: "do", capacity: "day", reach: "either",
    disposition: ["talk", "showup"],
    outline: null,
  },
  {
    id: "community-protection",
    action: "Pick one thing your street could organise for itself, and ask three neighbours.",
    blurb: "Concrete things a neighbourhood can organise for itself, at neighbourhood scale.",
    title: "Act Now, Prepare Now: Protecting Your Neighbors and Community Members",
    where: "Action 03",
    url: "https://ordinarypeopleaction.com/2026/08/24/act-now-prepare-now-protecting-your-neighbors-and-community-members/",
    button: "Action 03 · Protecting Your Neighbors",
    mode: "do", capacity: "day", reach: "group",
    disposition: ["make", "showup"],
    outline: null,
  },
  {
    id: "voting-rights",
    action: "Run the checklist on your own registration, then send it to five people.",
    blurb: "A checklist, which is the right shape when you have twenty minutes.",
    title: "Ways to Support Voting Rights",
    where: "Action 01",
    url: "https://ordinarypeopleaction.com/2026/08/04/ways-to-support-voting-rights/",
    button: "Action 01 · Supporting Voting Rights",
    mode: "do", capacity: "minutes", reach: "solo",
    disposition: ["support", "dig"],
    outline: null,
  },
  {
    id: "front-door",
    action: "Find out what your town actually decides, and when it next meets.",
    blurb: "What local actually means, in practice, where you live.",
    title: "Find Ways to Be More Civically Active",
    where: "Action 03",
    url: "https://ordinarypeopleaction.com/2026/08/24/find-ways-to-be-more-civically-active/",
    button: "Action 03 · Be More Civically Active",
    mode: "understand", capacity: "hour", reach: "solo",
    disposition: ["learn", "showup"],
    outline: null,
  },
  {
    id: "courage-films",
    action: "Watch one film about somebody who did it anyway.",
    blurb: "For an evening when you do not have another chapter in you.",
    title: "Movies About Courageous and Inspiring People",
    where: "Action 05",
    url: "https://ordinarypeopleaction.com/2026/08/25/movies-about-courageous-and-inspiring-people/",
    button: "Action 05 · Films Worth Watching",
    mode: "understand", capacity: "hour", reach: "either",
    disposition: ["learn", "support"],
    outline: null,
  },
  {
    id: "keep-going",
    action: "Decide now what you will do on the week you stop feeling like it.",
    blurb: "For the second month, which is when most of this stops.",
    title: "More Tools for the Journey Ahead",
    where: "Action 07",
    url: "https://ordinarypeopleaction.com/2026/08/24/more-tools-for-the-journey-ahead/",
    button: "Action 07 · Tools for the Journey",
    mode: "both", capacity: "minutes", reach: "solo",
    disposition: ["support", "learn"],
    outline: null,
  },
];
