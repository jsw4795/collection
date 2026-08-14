# Whisky Collection — Codex Instructions

## Project purpose

This repository contains a personal, read-only whisky collection website. It is statically hosted on GitHub Pages and uses JSON instead of a database.

## Work Scope

- Perform only the task explicitly requested by the user.
- Make the minimum changes necessary to complete the request.
- Do not perform unrelated refactoring, cleanup, renaming, file moves, deletions, or dependency changes.
- Do not fix unrelated issues unless explicitly requested.
- Do not modify files that are not necessary for the requested task.

## Technology constraints

- Use only plain HTML, CSS, and vanilla JavaScript.
- Do not add Node.js, npm, React, Vite, TypeScript, bundlers, preprocessors, package manifests, build steps, or generated build output.
- The repository root is the deployable site. GitHub Pages must serve it directly without a build.
- Do not add a backend, database, authentication, admin interface, or editing UI unless explicitly requested.
- Keep all asset and data paths compatible with a GitHub Pages repository subpath.

## Primary data rule

Each object in `data/whiskies.json` represents one purchased bottle. Application changes must not be required when bottles are added or updated. Preserve the schema described below unless the user explicitly requests a schema change.

```json
{
  "id": "lagavulin-16-001",
  "whisky": {
    "name": "Lagavulin 16",
    "nameKo": "라가불린 16년",
    "distillery": "Lagavulin",
    "country": "Scotland",
    "region": "Islay",
    "category": "Single Malt Scotch",
    "age": 16,
    "abv": 43.0,
    "volumeMl": 700,
    "cask": null,
    "finish": null,
    "peated": true,
    "image": "/images/lagavulin-16.webp"
  },
  "purchase": {
    "date": "2026-07-18",
    "place": { "name": "Liquor Mountain", "city": "Tokyo", "country": "Japan" },
    "price": {
      "amount": 9800,
      "currency": "JPY",
      "convertedKrw": 92000,
      "paidKrw": 92500,
      "exchangeRate": 9.3878,
      "exchangeRateDate": "2026-07-18"
    },
    "purchaseType": "tax_free"
  },
  "bottle": { "status": "opened", "openedDate": "2026-08-01", "remainingPercent": 75 },
  "personal": { "rating": 4.5, "memo": "", "tags": [] },
  "createdAt": "2026-07-18",
  "updatedAt": "2026-08-13"
}
```

## Data rules

- Never guess uncertain values. Use `null`.
- Public product facts may be researched from reliable sources, preferably the official brand or distillery.
- Never guess purchase date, location, price, actual KRW payment, purchase type, opened date, remaining amount, rating, memo, or tags.
- `purchase.purchaseType` is only `normal`, `tax_free`, `duty_free`, or `null`. Do not create separate tax-free booleans.
- `bottle.status` is only `sealed`, `opened`, `finished`, `sold`, or `gifted`.
- `bottle.remainingPercent` ranges from 0 to 100.
- Dates use `YYYY-MM-DD`.
- IDs are unique lowercase kebab-case. For another bottle of the same whisky, increment the suffix. Do not change existing IDs unless explicitly requested.
- For KRW calculations, use `paidKrw`, then `convertedKrw`; exclude records with neither.
- Preserve foreign-currency `amount` and `currency` even when KRW values are available.
- When an overseas purchase is provided only in its local currency, obtain the exchange rate on the record's creation date, set `convertedKrw` to the nearest won, and record the rate and date in `exchangeRate` and `exchangeRateDate`. Leave `paidKrw` as `null` unless the actual KRW amount paid is known.
- Images live in `images/`; use `null` when absent.

## Updating collection data

- For an update, identify the correct record, change only requested or logically required fields, preserve unrelated data, update `updatedAt`, and keep JSON valid.
- For an addition, check duplicates, generate a unique ID, preserve the full schema, use `null` for unknown values, and set `createdAt` and `updatedAt`.
- Do not delete records unless explicitly requested. Finished, sold, or gifted bottles remain as history; update their status instead.
- When a request could match multiple bottles, ask for clarification.
- A routine collection update should normally change only `data/whiskies.json`.
- When adding a new bottle, search for a suitable background-free product bottle image from a reliable source, add it under `images/`, and set `whisky.image` to that repository asset path. Use `null` only when no suitable image is available.

## Application behavior

Maintain the read-only collection cards and detail view, case-insensitive search, filters, sorting, statistics, missing-image placeholder, responsive layout, and repository-subpath compatibility. Current inventory counts only `sealed` and `opened` bottles.

- Search Korean name, English name, and distillery without case sensitivity.
- Keep filters for whisky country, region, category, bottle status, peated state, purchase country, and purchase type.
- Keep sorting by name; purchase date ascending/descending; KRW price ascending/descending; ABV ascending/descending; and rating descending.
- Price sorting and totals use `paidKrw`, then `convertedKrw`, with unknown prices placed last for sorting.
- Statistics show current inventory, sealed bottles, opened bottles, and total known purchase value.
- Cards show image, Korean and English names, distillery, origin, category, age, ABV, volume, status, purchase price, and personal rating when available.
- Details remain grouped into Whisky, Purchase, Bottle, and Personal sections.
- Never render the literal string `null`; hide unavailable optional details or show `-`.

## Validation

- For data-only changes, validate that `data/whiskies.json` parses as JSON.
- For application changes, serve the repository with any simple static HTTP server and check the browser console, empty data, populated data, responsive layout, and repository-subpath asset behavior.
- Do not introduce a build command as part of validation.

## Git Workflow

- Do not run `git commit` unless the user explicitly asks for it.
- Do not run `git push` unless the user explicitly asks for it.
- Do not create or modify branches unless explicitly requested.
- Do not create pull requests unless explicitly requested.
- Do not modify remote GitHub resources, including issues, pull requests, or labels, unless explicitly requested.
- After completing a task, do not commit automatically.
- Instead, provide exactly one suggested commit message that briefly and clearly summarizes the completed changes.
