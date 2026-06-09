# Previewing changes before they go live

Production is served from the **root** of the `gh-pages` branch.
Every pull request gets its own preview at:

```
https://antonuspishnyi.github.io/auction-price-check/pr-preview/pr-<N>/
```

## One-time setup (required after the first deploy)

The repo now deploys via the `gh-pages` branch instead of the "GitHub Actions"
artifact flow, because Pages can only serve previews on sub-paths from a branch.

1. Push these workflow changes to `main`. The `pages.yml` job runs and creates
   the `gh-pages` branch with the production build at its root.
2. In GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **/(root)** → Save
3. Done. The production URL stays the same.

## Day-to-day flow

1. Create a branch, make changes, open a PR against `main`.
2. The `pr-preview` workflow builds it and comments the live preview URL on the PR.
3. Open that URL in a real browser (or point a test Telegram bot at it) to review.
4. Merge when happy — `pages.yml` redeploys production; the preview folder is
   removed automatically when the PR closes.

## Notes

- The app uses relative asset paths (`./src/...`), so it works correctly under
  the `/pr-preview/pr-<N>/` sub-path with no base-path changes.
- The production deploy uses `keep_files: true` so it never deletes open PR
  previews. The trade-off: a renamed/deleted production asset can linger at the
  root until manually cleaned — harmless for this static site.
