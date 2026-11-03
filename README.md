# Verity

An interactive mathematical proof platform built with JavaScript ES modules, Vite, Supabase, and Vercel Functions. The existing visual design, hash routes, course IDs, and local progress storage are preserved.

## Development

Use Node.js 22.12+ and npm:

```sh
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`, and `Copy-Item .env.example .env.local` to create the environment file.

Open http://localhost:3000. The Vite development server runs the same `/api/config` and `/api/evaluate` handlers used on Vercel. Without credentials, the app still supports guest progress and offline proof evaluation.

```sh
npm run check
npm test
npm run build
npm run preview
```

`preview` serves the production frontend only. Use `dev` for local API endpoints. Build output is generated in `dist/`; never edit it directly.

## Where to make changes

| Change | Source |
| --- | --- |
| Course lessons, hints, solutions | [src/data/courses/](src/data/courses/) — one file per course |
| Proof rules and path labels | [src/data/rubrics.js](src/data/rubrics.js) |
| Page markup | [src/views/](src/views/) |
| Styles | [src/styles/](src/styles/) — ordered by feature in `index.css` |
| UI events, navigation, exercise and account flows | [src/app.js](src/app.js) |
| Offline evaluator | [src/services/proof-evaluator.js](src/services/proof-evaluator.js) |
| AI requests and model discovery | [src/services/gemini.js](src/services/gemini.js) |
| Supabase progress synchronization | [src/services/progress.js](src/services/progress.js) |
| Local storage and HTML escaping | [src/lib/](src/lib/) |
| Server API endpoints | [api/](api/) |
| Static images | [public/assets/](public/assets/) |

[index.html](index.html) is a small page shell. The Vite plugin in [vite.config.js](vite.config.js) inserts the view templates before processing the page, so the deployed site does not need extra requests to load its markup. Template changes trigger a full reload during development. JavaScript and CSS are bundled with cacheable asset hashes. Supabase is installed through npm rather than a floating CDN script.

When adding a problem, keep its ID stable and add its matching rubric. Existing learner progress refers to these IDs. Course visuals are trusted application content; do not insert untrusted HTML into course definitions.

## Supabase

Run [supabase/schema.sql](supabase/schema.sql) in your project's SQL editor for a new installation. Existing projects do not need a schema migration for this refactor. The schema enables row level security for learner data.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` and Vercel. Legacy `VITE_SUPABASE_ANON_KEY` remains supported. Existing deployments can also continue using `SUPABASE_URL` and `SUPABASE_ANON_KEY` through `/api/config`; `SUPABASE_PUBLISHABLE_KEY` is supported too.

Use only a publishable or legacy anon key in browser configuration. Never use a secret or service role key. Configure Supabase Auth's Site URL and redirect allowlist for your production URL and any development/preview URLs you use.

## Vercel

Import this repository into Vercel and keep the project root at the repository root. [vercel.json](vercel.json) selects Vite, `npm run build`, and `dist` output. The root `api/` directory remains Vercel Functions; hash navigation does not require a catch-all rewrite.

Configure the Supabase variables above and server-only `GEMINI_API_KEY` (or the existing `GOOGLE_GEMINI_API_KEY` alias), then deploy. Redeploy after changing `VITE_` variables because those are embedded at build time. Never prefix server secrets with `VITE_` or `NEXT_PUBLIC_`.

Live sign-in, cloud persistence, and AI responses require your own configured services. Existing demo/local account fallbacks and the personal Gemini-key setting are retained; local accounts are not authenticated Supabase sessions. This refactor does not add API authentication or rate limiting to the existing evaluation endpoint.
