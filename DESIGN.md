# ianskim.com design system

Read this before writing or editing any code. It describes the site as built. When a value you need is not here, take the nearest one that is, or ask Ian. When Ian changes direction, update this file in the same change set.

**Design read:** a product designer's portfolio for hiring managers and design recruiters. About 90% clean, conventional, usable structure; the remaining 10% is one personal material that everything comes from.

**The idea: sunlight on paper, in cyanotype blue.** The page is a sheet of paper lying in late-morning light. Light falls through the trees in Ian's forest pastel and a flowering branch at the window, and moves slowly over the paper. Type is printed into the paper. Project covers are printed onto it. A few watercolor blotches, in the same blue as the shade, are painted in as you scroll. Nothing is a standalone gimmick: if an element cannot be explained as part of this one scene, it does not belong.

**Built with:** Astro 7, plain TypeScript and JavaScript modules (no UI framework), Lenis for smooth scroll, self-hosted fonts, WebGL2 for the light and the blotches.

---

## 1. Principles

1. **One theme, one composition.** Light, paper, ink and blue paint belong to the same scene. Every new element must come from it. Ian rejected ideas that felt "placed there just because" (the lanyard badge, registration marks, the exposure hero, postcards, botanical clip art).
2. **Simple outranks spectacle.** Modern, calm and intentional. Interactions throughout, never overloaded. When in doubt, take something away.
3. **The work stays readable.** Covers are shown in their true colours and are never obscured. Hovering a cover brings it into full sun.
4. **One colour.** Cyanotype blue, and the sky blue of the shade, which is the same hue lighter. No other colour exists in UI.
5. **Original, not referenced.** Inspiration (billguo.me, jeanxcrj.com, Komi's light, recent.design) informs the feeling, never the form. Do not copy a reference's signature element.

---

## 2. Tokens

Every value on the site is a token on `:root` in `src/styles/global.css`. Components use tokens only. If a value you need is missing, use the nearest token; add a new one only with Ian, and add it here in the same change. These sit outside the tokens on purpose:
- **The app UI replica** (`.ride`), which mirrors Moober's own type.
- **The blotch positions,** which are composition set by eye.
- **The opening's sunlight colours,** which live with the opening.
- **Circles** (`50%`).

Audited on 2026-10-15:

| Measure | Before the audit | After |
|---|---|---|
| Font sizes | 36 | 12, plus the replica |
| Line heights | 29 | 5 |
| Radii | 7 | 4 |
| Shadows | 5 | 2 |

### 2.1 Colour

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F4F2EC` | Page background, under the fixed paper texture |
| `--ink` | `#221F1B` | Headings, strong text, strong rules. Warm ink, not screen black. |
| `--ink-2` | `#4A4A47` | Body text, inactive menu items |
| `--ink-3` | `#6A6863` | Labels, captions, inactive index items. 5.0:1 on paper, 4.6:1 in the deepest shade. |
| `--rule` | `#DAD6CC` | Hairlines |
| `--blue` | `#1F3A93` | The only colour. See the rules below for where it goes. |
| `--on-blue` | `#F1EEE6` | Text on blue (the cursor pill) |
| `--surface` | `#FFFFFF` | Product screens and app UI lying on the paper |
| `--tint` | `rgb(34 31 27 / 0.04)` | Panels and cards: a slightly deeper patch of the same paper |
| `--blue-tint` | `rgb(31 58 147 / 0.16)` | Halos around blue marks |

The light and paint use their own fixed palette, in the shaders (section 6):
- **Light:** sun `(0.985, 0.965, 0.92)`, shade `(0.77, 0.835, 0.965)`, warm wash `(1.0, 0.95, 0.885)`, cool wash `(0.86, 0.92, 1.0)`, strength 1.05.
- **Paint:** ultramarine `(0.16, 0.27, 0.62)` and cerulean `(0.28, 0.47, 0.78)`, drying toward `(0.42, 0.53, 0.8)`.

**Rules**
- **Blue goes in five places only:**
  - the current navigation item;
  - labels that mark a part of something (section labels, `.label--accent`);
  - links inside text;
  - data and emphasis (the statement's italic word, the 44%, the progress bar, the rider's stop, annotation dots);
  - the focus ring and the cursor pill.
- **No second accent,** and no warmer or more saturated light without Ian (an earlier vibrant version felt "less premium").
- **Light theme only.**
- **Contrast:** every text colour passes WCAG AA on `--paper`, even under the deepest leaf shadow. Measured lit and then shaded: `--ink` 14.7 and 12.0, `--ink-2` 7.9 and 7.1, `--blue` 9.0 and 7.6, `--ink-3` 5.0 and 4.6. Re-measure before introducing any lighter grey for text.

### 2.2 Typography

Families:
- **Serif:** Newsreader Variable, with opsz and italic. Every heading and every line of navigation. It carries the ink filter.
- **Sans:** Geist. Everything you read.
- **Mono:** Geist Mono. Labels and small numbers.

| Token | Value (1440 wide) | Family, weight | Used for |
|---|---|---|---|
| `--fs-display` | `clamp(40px, min(6.2vw, 10svh), 120px)` (89) | Serif 350, -0.025em, line height 1.02 | The homepage statement |
| `--fs-title` | `clamp(36px, min(4vw, 7.5svh), 72px)` (57) | Serif 350, -0.025em | Page titles (case study, "Hi, I'm Ian."), the closing note, the stat number |
| `--fs-heading-l` | `clamp(32px, 3.2vw, 52px)` (46) | Serif 450, -0.025em | "Selected work", the signature |
| `--fs-heading` | `clamp(28px, 2.4vw, 36px)` (35) | Serif 450, -0.012em, line height 1.2 | Case study section headings, statements (the question, the north star), project summaries |
| `--fs-subheading` | `clamp(22px, 1.8vw, 26px)` (26) | Serif 450, -0.012em | Subheadings, tier titles, the homepage project list |
| `--fs-nav` | `19px` | Serif 450, line height 26px | Name, menu, breadcrumb |
| `--fs-body` | `clamp(17px, 1.25vw, 19px)` (18) | Sans 400, line height 1.65 | Reading text; with 500, titles in cards and lists |
| `--fs-body-s` | `17px` | Sans 400, line height 1.6 | Text in cards, lists, notes; the hero lede |
| `--fs-small` | `15px` | Sans 400, line height 1.6 | Info rows, captions, links, the case study index |
| `--fs-label-l` | `13px` | Mono, uppercase, 0.08em | Section labels (blue) |
| `--fs-label` | `12px` | Mono, uppercase, 0.06em (`.label`); or 0.02em, mixed case (`.mono`) | Labels and mono text |

**Weights:** serif 350 (`--w-serif-light`) for display and titles, 450 (`--w-serif`) for everything else; sans 400, and 500 (`--w-strong`) for titles inside components. Nothing else.

**Printed type.** Serif type is printed, not rendered. The SVG filter `#ink` (in `Base.astro`) wanders the edges a hair, bleeds slightly and leaves a few tiny gaps where the ink did not take. Serif elements also use `mix-blend-mode: multiply` at opacity 0.97. Ian set the strength: displacement 1.75, blur 0.35; he found it stronger "too blended". Every serif line gets it; sans and mono stay crisp.

**Labels.** `.label` is grey by default, for information. Add `.label--accent` to mark a part of a component in blue (a tier number, "North star", Before/After). Section labels (`.sec__label`) are the larger blue size.

**Captions.** `.caption` is one style everywhere: 15px, `--ink-3`, and centred only under a screen in a panel.

**Rules**
- Sentence case everywhere; uppercase only in mono labels.
- At most one italic blue accent per heading.
- Headings stay at one or two lines; if one wraps to three, shorten the copy.

### 2.3 Space

| Token | Value | Typical use |
|---|---|---|
| `--s-1` | 4px | Inside a label and value pair |
| `--s-2` | 8px | Label to heading pull-up, gaps inside a card, mono list gaps |
| `--s-3` | 12px | Caption to image, a subheading to its content |
| `--s-4` | 16px | Between cards, paragraphs, stack items |
| `--s-5` | 24px | Between blocks inside a section; padding after a rule |
| `--s-6` | 32px | The page top (`--page-top`), list row padding, wide link gaps |
| `--s-7` | 48px | Above a subheading; the signature's offset |
| `--s-8` | 64px | Above the question; between stacked projects |
| `--s-9` | 96px | The statement's offset; the About page top |
| `--s-10` | 128px | Before the footer's final row |
| `--section` | `clamp(96px, 10vw, 160px)` | Between major sections, on every page |

**Section rhythm (case study):** label, then the heading 16px below it, then everything else 24px apart. A subheading has 48px above it and 12px below it, so it belongs to what follows.

### 2.4 Radius, depth, measure, motion

| Token | Value | Use |
|---|---|---|
| `--r-s` | 8px | Product screens |
| `--r-m` | 12px | Photographs, app UI cards |
| `--r-l` | 16px | Panels and cards |
| `--r-pill` | 999px | Badges, the cursor pill |
| `--shadow-card` | hairline plus a 6/18 soft shadow | App UI cards on the paper |
| `--shadow-screen` | hairline, a 1/2 contact shadow, a 20/48 soft shadow | Product screens |
| `--measure` | 680px | One reading column (About, prose) |
| `--measure-wide` | 940px | The case study column |
| `--dur-fast` / `--dur-base` / `--dur-slow` / `--dur-enter` | 300 / 500 / 900 / 1100ms | Hovers / state changes / images and filters / entrances |
| `--ease` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Everything, except the ink reveal and the opening, which have their own curves |

Covers on the homepage and the case study hero are square-cornered on purpose: they are printed onto the paper, not lying on it.

---

## 3. Layout

### 3.1 Grid

| Breakpoint | Min width | Columns | Margin | Gutter |
|---|---|---|---|---|
| mobile | 0 | 4 | 20 | 16 |
| tablet | 768 | 8 | 40 | 24 |
| desktop | 1024 | 12 | 48 | 24 |
| wide | 1440 | 12 | 64 | 32 |

`.grid` sets up the columns; content is at most 2048 wide, centred. Use CSS grid for multi-column layouts. Absolute positioning is only for layers: covers in the stage, blotches, the cursor pill, annotation notes and the light.

**Navigation is the same everywhere:** Work, About, Résumé, in serif 19px. Inactive items are `--ink-2`; the current page is italic blue. The homepage shows it in its dense top row; inner pages show it in the slim bar (`Bar.astro`) with a breadcrumb. The first line of every page sits 32px from the top.

### 3.2 Homepage

1. **First screen** (`.first`, at least `100svh`). The **top row** is information-dense small columns, as on billguo.me: the name and role; the menu (Work, About, Résumé); Contact; Profile; Now. Below it sits the **statement**, a single serif sentence across columns 1 to 9. The work heading must appear on the first scroll.
2. **Selected work** (`.work`). The heading row has a strong 1px ink rule under it and a project count.
   - **Desktop (1024 and up): the pinned scene.**
     - Columns 1 to 4 hold the numbered project list, the blue progress bar, and the active project's meta, summary and "View case study".
     - Columns 6 to 12 hold the cover stage, with height `min(72svh, 41vw)`.
     - Each project holds for part of its 130svh chapter. Then the next cover rises from below as a whole card, the stack transition, while the covered one sinks back 5% and dims (section 5).
   - **Below 1024: a simple stack.** Each cover sits full width, with meta, summary and link under it.
3. **Closing note** (`.foot`, a placeholder that Ian still wants to iterate on).
   - A strong rule.
   - The "A note" label.
   - A short serif note ending in an italic blue link.
   - The signature "Ian" with Email, LinkedIn and Résumé.
   - A final row: "Ian Kim, 2026" / "Designed and built by Ian".

### 3.3 Case study (`/work/moober`)

The light, paper and type carry over. A recruiter scans a case study, so the body reads like a document: everything is visible at once. These rules were measured on the references Ian collected (Claire Yokota, Jess Fong, Audrey Leo, Austin Lee, Bill Guo, Lilith Yu).

1. **First screen: everything fits in one view.**
   - **Contents:** the slim bar, the label, the serif title, the lede, the facts (Role, Timeline, Team) and the visit link.
   - **Desktop:** the text sits in columns 1 to 5. The cover sits in columns 6 to 12 at `min(72svh, 41vw)`, the same place and size as the homepage stage, so it barely moves in the page transition.
   - **Below 1024:** the title, then the cover, then the rest.
2. **The framework.**
   - **The column:** a reading column of `--measure-wide`, centred.
   - **The index:** a quiet sticky index at the left margin from 1200; below that, none.
   - **Each section:** a blue section label, a `--fs-heading` serif heading (at most two lines), then content (section rhythm in 2.3).
   - **Subheadings:** serif `.sub` leading straight into its intro (`.sub__lead`).
3. **The story, in order** (October 2026, rebuilt from Ian's portfolio review deck; the slides are reference only, never used as images): Overview, Solution, Problem, Explorations, **Constraint**, How it works, Takeaways, Team. The constraint comes before the final design because it shaped the tiers.
   - **Problem:** `.evidence` puts the 44% `.stat` panel beside three short rider stories (`.story`, on white cards). The stories are Ian's paraphrases, so they are written as stories, never in quotation marks. Then the root cause, then the question.
   - **Constraint:** the map-call breakdown, `.panel.calls`. On the left, `.chip` groups for what's stored once per ride, cached per rider, and called per match check (`.chip--spent`, in blue). On the right, "5 → 2" calls per check and about 1,500 checks a day. Then one paragraph that credits the TPM for storage and caching.
   - **Solution → "On a phone, too":** `.phones` holds three mobile screens from Ian's Figma (file DtZ62hrBt1eFVaMAS9G63q, section "Tiered Search"): results, trip details with the stops opened, and posting a ride. They're exported at 2x and cropped to one phone screen.
   - Ian tried and removed "The gap, stated up front" (a close-up of the Nearby card) and a team-in-numbers row. Keep How it works and Team as they were.
   - **Plain words.** Write the case study for someone with no context: a little technical is fine where it is the real story (the constraint says API calls, storage and caching, and the stat cites PostHog), but explain each term in passing; "Fixed zones" and "Drivers list every city", not static zones and waypoints; captions that name the search ("Davis to Fresno").
   - **Text width.** In a case study, paragraphs run the full column width, the same as the screens (`.cs-col .prose p`). The 680px measure read as narrow there.
   Earlier notes on the order follow.

   - **Overview:** context first, so a recruiter knows what Moober is right away. It has a heading, one short paragraph, then the three summary cards: the problem, what I did, and where it stands (handed off, in build). Never claim results the feature hasn't produced. Summary and Context used to be separate sections.
   - **Copy budget:** Ian finds most portfolios lighter on copy. Keep each card to one sentence and paragraphs to two, and let headings and images carry the story. Explain jargon in plain words, for example "map lookups" rather than API calls.
   - **Solution:** placed straight after Overview, so a recruiter sees the impact first. It holds the before/after wipe, then "Three honest tiers" as a ranked list. Each row has the tier's label, title and text in a 300px column, and the real result card, exported from the Moober UI (`tier-*.png`), filling the rest (about 576 wide on desktop). The earlier HTML replica (`.ride`) is gone.
   - **Problem:** the heading, a paragraph, then "What I found". The 44% is a `.panel.stat`: the source, a big blue number and one line. Ian rejected a bar under it. The heading doesn't repeat the number. Then the two rider quotes as `.cards--2`, then the question.
   - **Explorations:** the ideas the team weighed before tiers, as three short cards, one line each. Each card's mono label says what happened to the idea (Dropped, or Shipped alongside). Ian found the longer version too long to scan. Ideas without mockups go here as text; don't invent visuals for them.
   - **How it works:** Riders is the annotated screen. It uses a crop of the results screen (`moober-search-results-crop.png`, the UI's middle 66% without the nav), so the UI reads about 1.7 times larger, and its margin notes are 156 wide. It has notes in the margins and leader lines to dots at each element's edge. Drivers is the GIF in a panel with a caption, then three decision cards. Ian tried crops of the final UI beside each decision and found it looked worse; keep it simple. Never use the Claude-made v1 prototypes as iterations.
   - **Takeaways:** three short paragraphs in `.prose`, each opening with a bold lead-in. These were cards before; Ian wanted them simpler. The last one, "What's next", briefly carries what Measuring used to cover (in build, the north star). Ian dropped Measuring as a section because build status isn't the story.
   - **Spacing:** sections are `--s-6` apart inside, subheadings sit `--s-8` above their block, and cards are `--s-5` apart. Ian asked for more room to breathe.
   - **Team:** a photo row with captions.
4. **Motion.** The before/after wipe is the only animation in the body. The page title keeps the ink reveal; every other serif line carries the ink texture without animating. Leaf shadows clear over screens, the tier list and the annotated screen while they cross the middle of the viewport, and drop to a quarter past the hero (`data-light="quiet"`).
5. **Ian has rejected these, so don't bring them back:**
   - large display headings that wrap to four lines;
   - grey caps captions used as subheadings;
   - a coloured rule down the left of a quote (an AI tell);
   - a lone ride card used as a picture of the problem;
   - a big blue "How might we" block;
   - painted backdrops behind screenshots;
   - route diagrams for the tiers;
   - scroll-pinned step scenes and click-to-reveal tabs;
   - count-ups and fade-ins in the body.

### 3.4 About (`/about`)

One quiet reading column, after lilithyu.com/about (inspiration only). Earlier versions were rejected: the draggable prints, then a portrait-and-rows layout with the pastels.

1. **The bar**, as on every inner page (section 3.1).
2. **A photo:** Ian at Crissy Field at sunset, printed as a cyanotype with `scripts/print-photo.mjs`. The script maps grey to Prussian blue shadows, cerulean midtones and paper highlights, with a gentle S-curve. It also writes a warm black and white alternative (`ian-beach-bw.jpg`). Use the script for any future photo, so every photo on the site is printed the same way. It is cropped to 2:1, keeping Ian, the bridge and the beach and dropping empty sky, with `--r-m` corners. From 768 it shares the text's left edge and is 80% of the column wide, ending short of the text's right edge, so the column isn't rigid. Ian wants the left edges aligned for cohesion.
3. **The greeting:** "Hi, I'm Ian." in italic serif, the page's only animated line.
4. **Text:** a short paragraph of design background (Fine Arts to product design; Moober and Buzzit), one line on sports with friends and good food, then **Off the clock**: a `.label` and `.ab__list`, three fun facts as a plain list with small blue dots (Tottenham, FL Studio, trips on a whim). Modelled on lilithyu.com/about. Keep design talk to that one paragraph.
5. **Lately:** a `.label` and a `.gallery` row of three portrait prints at 3:4, with one-word captions (Eating, Snowboarding, Wandering). Below 640 the first print is full width and the other two sit side by side. They are printed darker than the default to match the beach photo's deep blue: `scripts/print-photo.mjs <in> <out> 1.9`, or 2.35 for snow. Higher values read too dark. An earlier version linked words in a sentence to the prints on hover; Ian replaced it with plain copy. Any photo added here goes through `scripts/print-photo.mjs` first.
6. **Contact:** Email · LinkedIn · Résumé in mono, then the closing note.

---

## 4. Materials

**Paper.** A seamless 512px tile is generated once in canvas (`src/scripts/paper.js`): 120 soft mottles, 900 fibres and 160 specks, with a fixed seed. It is set as `--paper-tex` and multiplied over `--paper` as a **fixed** background on `html`. The paper never scrolls; content moves over it. Ian asked for this specifically, because a scrolling paper texture broke the immersion. A 5% grain tile (`/assets/grain-tile.png`) sits over everything on `body::after`.

**Case study covers.** Ian designs these himself. Every cover follows this spec, so the set reads as one series:
- **Canvas:** 2000 x 1424 (1.4:1), exported as a high quality JPG into `src/assets/covers/<slug>-cover.jpg`.
- **Safe area:** on desktop the stage is between about 1.33:1 and 1.45:1 and crops with `object-fit: cover`. Keep anything important at least 120px from the left and right edges and 50px from the top and bottom.
- **Backdrop:** a consistent treatment across projects. Covers show in true colour, so the backdrop is exactly what the page shows.
- **Screens:** the same device treatment, scale and shadow on every cover. Use 1 to 3 screens and fill about 60 to 75% of the width. Real UI only: no stock photos, no AI imagery, no marketing frames.

`scripts/make-cover.mjs` is a working reference for this spec: paper or blue backdrop, leaf shadows from `plate-forest-bw.jpg`, 18px screen radius with a contact and long shadow, and screens placed as fractions of the canvas.

**Covers in true colour.** Covers keep their exported colours: no `multiply` blend and no print filter, because Ian found the printed treatment made the colours look off. A `::after` layer still lays the paper texture and grain over them at 30%, so they sit in the page. On hover the light clears over the cover (section 6). Covers come from `src/assets/covers` through `astro:assets` (responsive WebP). Each cover may have its own background, but framing, scale and device treatment must stay consistent between projects.

**Watercolor blotches** (`canvas.spill`, `src/scripts/spill.js`). These are small pools of blue watercolor in the same blue as the shade. Each one paints itself in once it is 30% visible. Water runs ahead, then pigment follows with a soft feathered front. The pigment drifts while wet and granulates into the tooth. It dries lighter, with pale blooms and a faint tide line. Placement:

- `--quiet-l`: work, top left, strength 0.6.
- `--quiet-r`: work, bottom right, strength 0.55.
- `--foot`: closing note, left, strength 0.7.

They are delicate accents to fill space, never a feature. Below 1024 only the footer blotch shows. They fade to nothing at the canvas edges, so no rectangle can ever show. Ian rejected flowers inside the blotches and botanical clip art.

---

## 5. Motion

Every motion is part of the scene: light moving, paper receiving ink, paint spreading. Nothing bounces, flips or spins.

```css
--ease: cubic-bezier(0.2, 0.7, 0.2, 1);
```

**The complete list of motion on the site**

0. **Opening (every full page load, about 1.2s).** There is no type, and it is CSS only (`global.css` and `src/scripts/intro.js`).
   - **The sweep:** the page starts in shade, on the same paper under a soft sky-blue shadow. Sunlight sweeps in from the top right along a soft diagonal over 900ms, led by a warm bright band.
   - **The warm moment:** as the light finishes pouring in, the paper flares warm (peak 42% at about 780ms) and settles by 1.2s. The top row and statement start about 120 to 180ms late, so they arrive with the light.
   - **Skipping:** any click, key or scroll finishes it quickly.
   - **When it plays:** it is skipped for reduced motion and does not play on page-to-page navigation.
   - **Tried and rejected:** a heavier version modelled on the Komi clip, with shards, glitter and a shader. It did not fit the site.
   - **Quick flash on arriving at About** from inside the site (`flash()` in `intro.js`, on `astro:after-swap`). It is the same overlay, faster: the sweep starts at 120ms and runs 620ms, and a softer flare (peak 22%, against 42% for the opening) starts at 380ms and runs 520ms. Ian found the full flare too much here. That is about 1s, playing as the page swaps in. It is skipped for reduced motion. A full load of /about plays the normal opening instead.
1. **The light.** Always moving, slowly (section 6). It fades in over 2400ms on the first visit and then never stops, including across page changes.
2. **Entrance.** Each top-row item rises 14px and fades in over 1100ms, staggered 80ms (`.enter`).
3. **Ink reveal.** The homepage statement and headings, page titles and the closing note arrive the way ink takes on wet paper (case study section headings do not animate). Each word bleeds in from a 5px blur along a feathered left-to-right edge, starting a little bluer while wet, then drying to ink. Words are staggered 45ms, like a pen, and every part shares one curve and finishes together, about 1.2s after each word starts. It plays once, when 30% visible (`.words`). Once a heading is split into words, the ink texture lives on each word (`#ink-w`, a roomier filter region) instead of on the whole heading. A word being written then only re-renders its own patch, so the reveal stays smooth. The texture is also present from the first frame, so nothing changes when the words settle. Never toggle the filter during the reveal: that caused a visible switch from crisp to inked.
4. **Reveal.** Anything else that comes into view rises 16px and fades over 1100ms (`.reveal`).
5. **Pinned work scene.** Driven by scroll position in rAF.
   - **Hold.** Each project holds for 55% of its 130svh chapter, then transitions.
   - **Stack.** The next cover rises from at least a full screen below, eased with a cubic out. It carries a soft shadow only while moving. The previous cover scales to 0.95 and darkens to 78%.
   - **Text handover.** The old line leaves in the first half (fade, 24px up), and the new line arrives in the second half.
   - **List and bar.** The list marks the active project halfway through. The progress bar fills.
6. **Cursor pill.** Over a cover, a blue "View case study" pill follows the pointer with a 0.22 lerp and scales in over `--dur-fast`. Ian likes this one; keep it. It is hidden on touch.
7. **Hover into sun.** Over a cover, the light clears over the cover's rectangle. At rest the light already falls on every image (covers, photos, screens, ride cards) at only about a third of its strength, through `imgMask` in `light.js`. Fully clear looked pasted on, and full strength hid the content.
8. **Watercolor blotches.** They paint in once: a 5.6s surge, then a slow creep, drying over 11s.
9. **Smooth scroll.** Lenis with lerp 0.09.
10. **Links.** The arrow in "View case study" nudges 4px right.
11. **Page transition.** The page lifts off: it fades and rises 12px over 420ms. The next page settles on after 260ms, over 760ms. On the way into a case study and back, the clicked cover morphs between its two places over 900ms. The light never restarts. The shade canvas has its own `view-transition-name` (`light-shade`), sitting above the cover group and multiplied onto it. `light.js` eases the cover's box along the same curve, so the light and its image mask follow the cover the whole way. Without this, the cover flew with no light on it and the blend popped in a second after landing.
12. **Before and after** in the case study: pinned, the result wipes across the empty search with the scroll.

**Reduced motion** (`prefers-reduced-motion: reduce`):

- The light renders a still frame at time 20.
- There are no entrances or word reveals; everything is in place.
- The blotches render fully dried.
- Smooth scroll is off.
- The pinned scene still follows the scroll, because it is user-driven.

---

## 6. The light

There are two fixed, full-viewport WebGL2 canvases (`src/scripts/light.js`). Both sample one leaf field, so glints always sit in the gaps between the shadows.

- **Shade** (`z-index: 20`, multiply, half resolution).
  - **Leaf shadows** come from Ian's forest pastel (`/assets/plate-forest-bw.jpg`). The image is cover-mapped, tilted -0.12 rad and moved by wind, sway and occasional gusts. The focus breathes between mipmap levels 1.6 and 4.4, like a lens pulling focus.
  - **The flowering branch** is Redouté's rose (`/assets/botanicals/redoute-rose.jpg`, public domain, The Met). It hangs in from the top right, only as a shadow. It is softer and grainier than a print, but still a little sharper than the trees, because it is nearer the window.
  - **Washes:** a warm wash top right and a cool wash bottom left.
  - **Refracted light threads:** they drift through the shade and are strongest in a breeze.
  - **Motes:** soft, out-of-focus specks that float up through the light.
- **Glint** (`z-index: -1`, screen, 0.75 resolution).
  - **Sparkles:** tiny twinkling points of sun in the brightest gaps, plus a soft bloom.
  - **Placement:** the layer sits behind the type, so it never breaks up letters.

The light is strongest top right, with one patch wandering over the statement. It softens by 40% down the page and fades by 85% into the closing note. Reading pages (the case study body, marked `data-light="quiet"`) soften it by 75% past the first screen, so moving shadows don't sweep across paragraphs. The pointer shifts it slightly, with the branch moving more than the trees.

The canvases and cursor live in `Base.astro` with `transition:persist`, so they survive navigation. Do not restart the light on page changes.

---

## 7. Components and files

| File | What it is |
|---|---|
| `src/layouts/Base.astro` | Document, fonts, the `#ink` filter, the light canvases, the cursor pill, `ClientRouter` |
| `src/components/Top.astro` | The top row. `current` marks the menu item. |
| `src/components/Work.astro` | Selected work: the pinned scene (desktop) and the stack (below 1024) |
| `src/components/Foot.astro` | The closing note |
| `src/components/Bar.astro` | The slim bar for inner pages. "Ian Kim" sits left, a serif italic breadcrumb ("Work / Moober", "Home / About") sits centre from 768, and Work, About and Résumé sit inline right, with the current page in italic. |
| `src/data/projects.ts` | Projects: title, meta, summary, cover, alt, link |
| `src/data/site.ts` | Ian's email, LinkedIn and résumé links, used everywhere |
| `src/pages/work/moober.astro` | The Moober case study |
| `src/pages/about.astro` | About |
| `src/styles/global.css` | All styles |
| `src/scripts/main.js` | Starts the visit-long systems once, and the per-page systems on every `astro:page-load` (stopped on `astro:before-swap`) |
| `src/scripts/*.js` | `paper`, `light`, `smooth`, `words`, `scene`, `page` (reveals and cursor), `spill`, `case` (case study explainers), `table` (about prints), `transition` (cover morph), `util` |
| `public/prototypes/` | The HTML mocks the site was ported from. Reference only. |
| `legacy/` | The previous static site |

**Links.** Text links underline on hover (1px, offset 4px). Arrows are text characters followed by `&#65038;`.

**Focus.** `outline: 2px solid var(--blue); outline-offset: 4px` on every interactive element. Never remove it.

**Adding a project.** Add a cover to `src/assets/covers`, then add an entry to `projects.ts`. The scene's height and the count follow `projects.length`.

---

## 8. Imagery

- **Product covers.** Never quantize. Source files about 2000px wide; `astro:assets` makes WebP at 800 to 2000. Always describe the screens in the alt text.
- **Light and paint sources.** Ian's pastel and public-domain botanicals from The Met Open Access. Credits are in `public/assets/botanicals/SOURCES.md`. Downloading new images needs Ian's go-ahead.
- **Decorative layers** (light, blotches, grain, cursor) are `aria-hidden`.

---

## 9. Copy

- No em dashes or en dashes anywhere, including alt text. Use periods, commas or colons.
- No sparkle glyphs, no emoji, no scroll cues.
- Plain functional labels: "Selected work", "Contact", "Profile", "Now", "View case study", "Résumé", "Email", "LinkedIn".
- Be honest: Moober is designed and in build, with no outcome numbers. Credit shared work as shared.
- Placeholders still to replace (marked `TODO(Ian)`): the statement, Profile, Now, the closing note, the About intro and lists, and possibly a scanned handwritten signature.

---

## 10. Responsiveness and accessibility

- **Every screen is a first-class target.** Check 1920x1080, 1536x864, 1440x900, 1366x768, 1280x720, 2560x1440, 1024x768, 768x1024, 390x844, 375x812, 360x740 and 812x375.
- **The page never scrolls sideways.** `.work` and `.foot` use `overflow-x: clip` so blotches can hang past the edge. Use `clip`, not `hidden`, which would break the sticky scene.
- **Contrast:** WCAG AA for all reading text.
- **Headings:** one `h1` per page, with sections in `h2`.
- **Pinned scene:** off-screen project text is `inert`.
- **Touch targets:** minimum 44 by 44 on touch.

---

## 11. Engineering guardrails

1. Run `npm run dev` for development and `npm run build` before calling a change done. The build must be clean.
2. Per-page scripts must return a stop function, and must not leak listeners, observers, rAF loops or WebGL contexts across page changes. Spill canvases release their context with `WEBGL_lose_context`.
3. Shaders share one pattern (`glProgram`, `texture` in `util.js`). Keep resolution scaled down; the light does not need full resolution.
4. Every scripted find-and-replace must assert that the replacement happened.
5. Performance targets: LCP under 2.5s, CLS under 0.1, INP under 200ms. Watch GPU cost on low-end laptops and phones.

---

## 12. Pre-flight checklist (run after every change set)

- [ ] `npm run build` is clean, and the console has no errors.
- [ ] The change belongs to the scene (light, paper, ink, blue paint), or Ian asked for it.
- [ ] Only tokens from section 2 are used, and only the motion in section 5 exists.
- [ ] `node scripts/audit-css.mjs` shows no new literal values and no unused classes.
- [ ] Layout is checked at the viewports in section 10, with no sideways scroll.
- [ ] Reduced motion behaves as described.
- [ ] No em dashes, emoji or scroll cues.
- [ ] Every content image has alt text and dimensions.
- [ ] Per-page scripts clean up after a navigation.

## Recent rules (October 2026)

- **Ink on desktop.** The ink is kept gentle, with displacement 1.4, fine specks at frequency 2 and a hole threshold of 2.52. The original (1.75 / 1.6 / 2.3) read as grainy and dotted.
- **Ink on phones and tablets.** Below 768, and on any touch screen (`hover: none`), the ink filter is off. Phones render SVG filters at low resolution, so the type looked blurry and cost frames. Type there stays crisp, still multiplied into the paper.
- **Projects without a case study.** Mark them `soon: true` with no `href` in `projects.ts`. The cover and name stop being links, the text link becomes a grey "Case study coming soon", and the cursor pill says "Coming soon" as soon as the pointer enters. It follows whichever project the scene is showing.
- **Screens on phones.** Below 640, `.compare__panel` and `.shot-panel` pad by `--s-2`, so the UI gets the width.
- **Annotated dots.** Dots sit just outside the element they name, never on it. On phones they are 16px.
- **Copy voice.** Plain and standard, nothing clever. The homepage headline is a conventional portfolio line that fits on two lines on desktop: "Designer with an artist's eye for detail" (no closing period) (two lines from tablet up, three on phones) The footer note is two short sentences, "Thanks for stopping by. Let's work together.", with the second linking to email. A single line looked lost in the footer. Ian draws and doesn't paint.
- **Footer bottom row.** One line, "Designed and built by Ian", right aligned across the full width.
- **Links inside split type.** `.words` wraps each word in inline-blocks, and underlines don't pass into those. So a link inside split type underlines its inner word spans too (`.closing p a .w > span`); otherwise only the spaces get underlined.
- **Shipping basics.** `Base.astro` sets the canonical URL, Open Graph and Twitter tags, and the tab icon. The icon is the three-leaf sprig from Anna Atkins's cyanotype of *Spiraea aruncus* (ca. 1851-54, public domain, the Met), lifted out of the plate and printed in `--blue` and `--on-blue` by `scripts/make-icon.mjs` into `/favicon.png` (64) and `/apple-touch-icon.png` (180). The source plate is `_archive/public-unused/assets/botanicals/atkins-spiraea.jpg`. It ties the icon to the site's cyanotype idea: a real leaf printed by sunlight. `/og.jpg` (1200 x 630) is a capture of the homepage hero. `src/pages/404.astro` uses the About column. Assets that nothing references are moved to `_archive/public-unused/` rather than deployed; `public/` only holds files the site uses.
- **Checking renders.** The in-app browser pane is often hidden. To see real pages, capture them with headless Chrome over the DevTools protocol at 390, 1440 and so on, with reduced motion on so the intro is skipped.
- **Covers are never cropped.** The homepage stage and the case study cover share one box: as wide as columns 6 to 12 allow, at the covers' own shape (`--cover-ratio`, 1989 / 1416), and narrower if that would be taller than `--cover-max-h` (72svh). The text beside the stage stretches to the same height. The old rule, height `min(72svh, 41vw)`, cropped up to a quarter of the cover's width on big screens, because the grid stops growing at 2048 while the height kept growing. Measured at 16 sizes from 390 to 3840 wide: under 0.2% crop everywhere, and the homepage and case study boxes are identical, so the cover morph stays exact.
- **Scene speed.** Going down, once the change to the next project has begun (raw progress above 0.04), it plays on by itself in about half a second, so moving on takes less scrolling. Going up, it follows the scroll exactly, as before (`scene.js`, `shown[]`).
- **Scrolling on phones.** Lenis smooth scroll runs only with a mouse (`hover: hover`). On touch screens it fought iOS's address bar, so the page seemed to grow and content jumped mid-scroll.
- **The light on phones.** The fixed layers (the light canvases and the grain) are `100lvh` tall from the top and resize only when the width or the large viewport changes. They no longer stretch, or rebuild every frame, while the address bar slides away; that read as the page growing. On touch screens the glint layer is skipped and the shade draws at 0.4 resolution and 30fps.
- **Homepage nav on phones.** It matches the inner pages: the name on the left and Work, About, Résumé across on the right. The "Product designer" line under the name is hidden below 768, because the Profile says it.
- **How much light, per page** (October 2026). Ian found the light too heavy a brand to build on, so it now steps back everywhere except the homepage's first screen: `LEVELS` in `light.js` (start, after the first screen). Home is 1 then 0.2. Case studies (`data-light="quiet"`) are 1 then 0.18. About and 404 (`data-light="soft"`) are 0.26 then 0.2. The warm and cool colour wash fades with it, so a quiet page reads as paper with faint leaf shadows instead of a blue cast.

