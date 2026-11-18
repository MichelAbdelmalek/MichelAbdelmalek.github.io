# Michel Abdelmalek – Portfolio

Personal portfolio built with plain HTML5, CSS3 and vanilla JavaScript. No frameworks, no npm, no build step, no third-party scripts or trackers.

Live site: https://michelabdelmalek.github.io/

## Structure

```
index.html            Main page (all sections)
404.html              Not-found page
robots.txt
assets/css/styles.css Styles, theme tokens, animations
assets/js/main.js     Theme toggle, typing, particles, reveal, count-up, nav
assets/img/           favicon.svg, og-image.svg
```

## Edit content

- **Text, roles, skills, links:** edit `index.html` (each section has an `id`: `about`, `experience`, `highlights`, `skills`, `education`, `contact`).
- **Typing phrases:** the `phrases` array in `assets/js/main.js`.
- **Colors / theme:** the CSS variables at the top of `assets/css/styles.css`.
- **Impact numbers:** `data-target` / `data-suffix` attributes on `.impact-number` elements.
- **Download CV button:** add the public CV PDF at `assets/Michel_Abdelmalek_CV_public.pdf`. The button appears automatically when the file exists. `.gitignore` blocks all other PDFs.
- **Social preview image:** most platforms need a PNG. Export `assets/img/og-image.svg` as a 1200x630 `assets/img/og-image.png`, which the meta tags reference.

The page uses a strict Content Security Policy, so do not add inline `<script>`, `<style>`, `style="..."` or `onclick="..."`. Put code in the `assets/` files.

## Preview locally

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open http://127.0.0.1:8000

## Redeploy

The site is served by GitHub Pages from the `main` branch root.

```bash
git add .
git commit -m "Update portfolio"
git push
```

Changes go live within a minute or two.
