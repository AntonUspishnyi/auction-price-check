# Auction Price Check

A tiny static React calculator for estimating Japan auction bids and all-in costs in euros. It is ready for GitHub Pages hosting and can be opened inside Telegram as a Mini App/Web App URL.

## Local development

No package install is required. The page uses browser-loaded React and Babel CDNs so it can be served as plain static files.

```bash
npm run dev
```

Then open <http://localhost:5173>.

## Build a static page

```bash
npm run build
npm run preview
```

The production build is emitted to `dist/`. The build step copies the static entrypoint and app assets without bundling, so the output remains compatible with GitHub Pages project URLs such as `/auction-price-check/`.

## GitHub Pages deployment

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml` that builds the app and publishes `dist/` to GitHub Pages when changes are pushed to `main`.

To enable it:

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or run the workflow manually.

## Telegram Mini App wiring

`index.html` loads Telegram's `telegram-web-app.js`, and the app calls `ready()`, `expand()`, `setHeaderColor()`, and `setBackgroundColor()` when opened inside Telegram.

Use the deployed GitHub Pages URL as the Mini App/Web App URL in BotFather.
