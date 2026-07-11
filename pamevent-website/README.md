# PAM Event — Website Clone

A static, single-page recreation of an event-planning company website inspired by pamevent.com.

> **Note:** The live site at pamevent.com was not reachable from the build environment (network policy blocked the domain), so this is a from-scratch recreation styled around the "PAM Event" name and typical event-planning-agency content — not a pixel-for-pixel scrape. Swap in real copy, photography, and contact details from the actual business before using this in production.

## What's included

- `index.html` — hero, about, services, process, gallery, testimonials, contact form, footer
- `assets/css/style.css` — burgundy/gold event-styling design system, fully responsive
- `assets/js/main.js` — mobile nav toggle, scroll-reveal animations, demo contact form handling

## Running locally

No build step required — it's plain HTML/CSS/JS.

```bash
cd pamevent-website
python3 -m http.server 8000
# then open http://localhost:8000
```
