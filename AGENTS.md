# AGENTS.md — chinelato.com

Guide for AI assistants maintaining this site. The owner is a **graphic designer, not a developer**, and works entirely through an AI assistant. Your job is to keep the site correct, fast, accessible and on-brand while the owner focuses on content. Read this whole file before making any change.

---

## 1. How to work with the owner

- **Reply in the owner's language** (default: Brazilian Portuguese). Plain words, short sentences, no jargon. Say "the text under the CiBho? logo", not "the `<p>` in `.project__hero`".
- **Never make the owner touch code.** Don't paste code for them to copy. Don't ask them to run terminal commands. You do it; they review the result.
- **One question at a time**, and only when the answer changes what you would build. Otherwise pick the obvious option and mention it in one line.
- **Show, don't describe.** After any visual change, take screenshots (desktop *and* mobile — see §7) and show them before publishing.
- **Ask before publishing.** Preview first, then: "Quer que eu publique?" Publishing = pushing to `main` (§8). Everything else is reversible.
- **Report honestly.** If something didn't work, say so plainly. Don't declare success without having verified it (§7).
- **Explain trade-offs in one sentence**, e.g. "Essa foto tem 8 MB; vou reduzir para carregar rápido no celular, sem perda visível."
- Refuse gracefully anything that breaks §2 — explain *why in one sentence*, then offer the closest thing that works.

## 2. Non-negotiables (never drift from these)

1. **Plain HTML, CSS and JS only.** No frameworks, no build step, no `npm`, no bundlers, no CSS preprocessors, no CMS. If the site ever "needs" one of these, stop and explain the trade-off to the owner first.
2. **Two pages only: `index.html` (portfolio) and `curriculo.html` (résumé).** Portfolio sections are `<section>`/`<article>` blocks with `id`s; new portfolio content = new block in `index.html`, not a new page. The résumé is a separate page because it prints as an A4 document.
3. **Only two external requests: Google Fonts (Poppins + Inter).** No analytics, tracking pixels, chat widgets, cookie banners, embeds or third-party scripts unless the owner explicitly asks *and* you explain the privacy/speed cost.
4. **Relative asset paths** (`assets/img/…`, `css/style.css`). Never `/assets/…`. The site must work at `https://lucaazalim.github.io/chinelato.com/` and at `https://chinelato.com/`.
5. **Brand fidelity.** Colors and fonts come from the original PDF and live as CSS custom properties in `css/style.css` `:root`. Use the variables; never hard-code a new hex. Poppins = display (headings, pills, kickers, links); Inter = body.
6. **Accessibility is a requirement, not a polish step.** Every image has meaningful `alt` in Portuguese (or `alt=""` if purely decorative). Keep heading order (one `h1`, then `h2` per section, `h3` inside). Keep visible focus styles. Text on colored backgrounds must reach WCAG AA (4.5:1) — the `--aslain-deep` / `--estasong-deep` variables exist for exactly this reason.
7. **Motion must respect `prefers-reduced-motion`.** Any new animation goes inside the existing patterns (`.reveal`, `.float`, hero keyframes) which are already disabled under reduced motion.
8. **Performance budget:** each raster image ≤ 1600 px on its long side, WebP, with an 800 px `-sm` variant and `srcset`. Total page weight should stay under ~4 MB. No image over 400 KB without a reason.
9. **Both PDFs are generated from the site — never edited by hand, never replaced by a designer-exported file.** `node tools/build-pdf.mjs` builds `portfolio-2026-antonio-chinelato.pdf` from `index.html` (one 16:9 page per section, via the `@media print` block at the end of `style.css`) and `curriculo-antonio-chinelato.pdf` from `curriculo.html` (one A4 page, via `css/curriculo.css`). Regenerate after **every** content change, before publishing, so the PDFs and the pages never disagree. Any other `*.pdf` stays git-ignored. No file over 15 MB in the repo.
10. **Don't add a `CNAME` file or the custom domain in Pages settings until DNS points to GitHub** (§9). Doing it early breaks the working github.io URL.
11. **Keep the SEO scaffolding in sync:** `<title>`, meta description, Open Graph tags, JSON-LD `Person`, `sitemap.xml` `<lastmod>`, and `og-image.jpg` if the hero changes.
12. **Progressive enhancement.** The page must be fully readable with JavaScript disabled. `js/main.js` only adds animation, nav state and the letter-split effect.

## 3. Project map

```
index.html            the portfolio (semantic sections, pt-BR)
curriculo.html        the résumé (screen + A4 print layout)
css/style.css         all portfolio styles; tokens in :root; sections in order; responsive; print slides at the end
css/curriculo.css     résumé styles (uses the same tokens) + A4 print rules
js/main.js            reveal-on-scroll, header state, active nav link, hero letter split
assets/img/           optimized WebP (+ -sm variants), vector logos (.svg), og-image.jpg
tools/build-pdf.mjs   regenerates both PDFs (headless Chrome, no dependencies)
portfolio-2026-antonio-chinelato.pdf   generated — do not edit; rebuild with the script
curriculo-antonio-chinelato.pdf        generated — do not edit; rebuild with the script
favicon.svg, apple-touch-icon.png
robots.txt, sitemap.xml, .nojekyll
.gitignore            excludes *.pdf (except the generated one) and .DS_Store
```

`curriculo.html` loads `style.css` (for tokens and base styles) and then `curriculo.css`; it has its own small nav (back link + "Baixar em PDF") instead of the portfolio header.

Section order in `index.html`: hero (`#inicio`) → about (`#sobre`) → projects wrapper (`#projetos`) containing the intro/index and one `<article class="project">` per project (`#cibho`, `#aslain`, `#estasong`) → contact (`#contato`) → footer.

## 4. Design system (use, don't reinvent)

| Token / class | Meaning |
|---|---|
| `--cream` `#fffdf6` · `--purple` `#513fac` · `--ink` `#2f2f2f` | site palette |
| `--cibho` `--aslain` `--estasong` (+ `-deep` for text panels) | per-project palette |
| `.pill` (`.pill--lg`, `.pill--purple`) | dark rounded heading box, Poppins 600 |
| `.kicker` | italic Poppins label ("me interesso por…") |
| `.chips` `<ul>` | tag list (skills, tools) |
| `.split` / `.split--reverse` | text + media two-column block |
| `.bleed` | text + full-bleed image (image touches the viewport edge) |
| `.card-img` (`.card-img--wide`) | rounded image card, `object-fit: cover` |
| `.reveal` (+ `style="--d:.1s"`) | fade/slide in on scroll; `--d` staggers |
| `.float` (`--r` rotate, `--t` duration, `--delay`) | gentle floating for cut-out objects |
| `.project__hero` / `.project__title` / `.project__body--*` | project header and body panels |

A new visual element should be composed from these. If none fits, add **one** new class following the same naming (`block__element--modifier`) and place it in the matching CSS section.

## 5. Common tasks — recipes

**Change a text.** Edit it in `index.html`. Keep `<strong>` for the emphasized phrases (that's how the PDF highlights key words). Watch Portuguese accents and typographic characters (`…`, `“ ”`).

**Add or remove a skill/tool.** Add/remove an `<li>` inside the relevant `.chips` list in `#sobre`. Nothing else needed.

**Replace or add an image.**
1. Ask the owner for the original at the highest resolution they have.
2. Export WebP: long side ≤ 1600 px (`name.webp`) and ≤ 800 px (`name-sm.webp`), quality ~82. Cut-out objects keep transparency. Use Python/Pillow or `cwebp`; keep filenames lowercase-kebab, prefixed by project (`estasong-…`).
3. In HTML: `src`, `srcset` (both sizes with `w` descriptors), `sizes`, real `width`/`height`, `loading="lazy"`, `decoding="async"`, and a descriptive Portuguese `alt`.
4. Delete the old files if no longer referenced.

**Add a new project.** Copy an existing `<article class="project project--NAME" id="NAME">` block (Aslain is the simplest), then:
- add `--NAME` and `--NAME-deep` colors in `:root` and the three `.project--NAME .project__hero` / `.project__body--NAME-deep` rules next to the existing ones;
- add an entry to the `.index` list in the projects intro (number, name, one-line type) — keep `--accent` set;
- logo: prefer SVG; otherwise transparent WebP;
- write the "projeto acadêmico"-style label honestly (academic / freelance / personal);
- check heading order and the `aria-labelledby` id pairing.

**Update contact links.** Edit `#contato` *and* the JSON-LD `sameAs`/`email` in `<head>`. Behance/LinkedIn get `rel="me noopener" target="_blank"` plus the visually-hidden "(abre em nova aba)" span.

**New year / new edition.** Change "2026" in: hero band, `<title>`, meta/OG text, footer ©, JSON-LD, `sitemap.xml` `<lastmod>`. Regenerate `og-image.jpg` (1200×675) from the new hero.

**Update the résumé.** Edit the text in `curriculo.html` — it is plain semantic HTML: one `<section>` per heading, `<article class="cv-entry">` per school/job (title, place, description, dates, optional bullet list). Keep the order and the tone (first person, past tense for finished things). The phone number and e-mail are public by the owner's choice; confirm before adding any new personal data. Then rebuild the PDF (below) and check it is still **one** A4 page — if it spills to two, tighten the wording rather than shrinking the type below 10 pt.

**Regenerate the PDFs (after any content change).**
```bash
node tools/build-pdf.mjs              # both
node tools/build-pdf.mjs curriculo    # just one (portfolio | curriculo)
```
Needs Google Chrome installed (set `CHROME=/path/to/chrome` if it's elsewhere) and internet for the fonts. It prints size and page count — expect **13 pages** for the portfolio (one per section) and **1 page** for the résumé, each under ~15 MB. Then render a page or two (`pdftoppm -r 40 -png -f 5 -l 6 portfolio-2026-antonio-chinelato.pdf /tmp/p`) and look at them: text must not be clipped at the bottom of a slide. If a slide overflows, shorten the text or reduce that block's media size inside the `@media print` rules — don't hack the script. When you add a new portfolio section, add its class to the slide list in the `@media print` block so it gets its own page.

**Change a color or font.** Almost never the right move — the brand comes from the PDF. If the owner insists, change the token in `:root` only, re-check contrast (§6), and re-screenshot.

## 6. Checks before you say "done"

- [ ] HTML is valid (no unclosed tags; every `id` unique; `aria-labelledby` targets exist).
- [ ] Every `<img>` has `alt`, `width`, `height`, and files exist for every `src`/`srcset` entry.
- [ ] Contrast of any new text/background pair ≥ 4.5:1 (large text ≥ 3:1).
- [ ] Keyboard: Tab reaches every link; focus ring visible; skip link works.
- [ ] Reduced motion: page fully visible with animations off.
- [ ] No console errors; no requests to hosts other than the site and Google Fonts.
- [ ] Desktop (1440) and mobile (390) screenshots reviewed — no horizontal scroll, nothing clipped, hero fits.
- [ ] `sitemap.xml` `<lastmod>` updated if content changed.
- [ ] PDFs regenerated (`node tools/build-pdf.mjs`) and spot-checked if any text, image or section changed (13 pages / 1 page).
- [ ] Both pages still link to each other: portfolio footer → `curriculo.html`; résumé nav → `index.html` and the résumé PDF.

## 7. Previewing locally

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```
Open `http://127.0.0.1:8765/`. For screenshots, use headless Chrome; force `prefers-reduced-motion` and eagerly decode images before capturing full-page, otherwise reveal blocks and lazy images show blank. A 100 vh hero makes "one giant viewport" captures useless — capture at a real viewport size with `captureBeyondViewport`. Stop the server when done.

## 8. Publishing

The site is GitHub Pages, repo `lucaazalim/chinelato.com`, branch `main`, root folder. **Pushing to `main` publishes.**

1. Run the §6 checks and show screenshots.
2. Regenerate the PDF if content changed (§5) and commit it together with the change.
3. Get the owner's OK.
4. Commit with a short message that says what changed in human terms (e.g. `Add Vento project`, `Update contact e-mail`). One change per commit.
5. `git push`. Wait ~1 minute, then load the live URL with a hard refresh and confirm the change is there. Tell the owner the URL.

Live URL today: `https://lucaazalim.github.io/chinelato.com/` (until the custom domain is connected, then `https://chinelato.com/`).

If something goes wrong after publishing: `git revert` the last commit and push — don't hand-edit backwards.

## 9. Custom domain (chinelato.com) — pending

DNS currently points the apex at a name.com forwarding server without HTTPS, and `www` is on Cloudflare redirecting to the broken apex. When the owner is ready:
1. In the DNS provider, set apex `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; set `www` as `CNAME` → `lucaazalim.github.io`. Remove the old forwarding / Cloudflare redirect rule.
2. Only then: repo Settings → Pages → Custom domain → `chinelato.com`, enable "Enforce HTTPS" once the certificate is issued (can take up to an hour).
3. Confirm `https://chinelato.com/` and `https://www.chinelato.com/` both load, then update nothing else — canonical/OG URLs already point at `https://chinelato.com/`.

## 10. Things that look wrong but aren't

- `.reveal` elements have `opacity: 0` in CSS until JS adds `.is-visible` — but only under `html.js`; with JS off they're visible. Don't "fix" this.
- The hero is intentionally `100svh`: one screen, then the content begins.
- `--aslain-deep` / `--estasong-deep` differ slightly from the logo header colors on purpose (contrast).
- `Portfolio 2026 - Antonio Chinelato.pdf` (the original Canva export) may sit in the folder but is not in git. Leave it that way; the site's PDF is the generated `portfolio-2026-antonio-chinelato.pdf`.
- In the generated PDF, the header, "rolar ↓" hint and footer are hidden on purpose, and the last page has no page break after it.
- The e-mail is `ajchnelato@gmail.com` as in the PDF. Confirm with the owner before "correcting" it.

## 11. When to stop and ask

- Anything in §2 would have to be broken.
- The owner asks for a feature that needs a server (forms, comments, login, a blog with many pages).
- A change touches DNS, the domain, or repository settings.
- You are about to delete content or images that are still referenced anywhere.
- You are unsure whether a text is a typo or intentional (names, e-mails, project titles).
