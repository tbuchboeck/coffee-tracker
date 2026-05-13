# Coffee Tracker — Documentation

## Overview

A personal coffee collection tracker built as a React single-page application. Tracks 30+ espresso coffees with detailed tasting notes, brewing parameters, cost analysis, and analytics charts. Deployed to GitHub Pages with Supabase as the cloud backend and localStorage as offline fallback.

**Status:** Fully functional, actively maintained. Recent additions: collapsible cards with condensed stats, cost efficiency metric, product images with name overlay, dark mode fixes.

**Live URL:** https://tbuchboeck.github.io/coffee-tracker
**Repository:** https://github.com/tbuchboeck/coffee-tracker

## Architecture

### Tech Stack
- **Frontend:** React 18.2 (Create React App), Tailwind CSS (CDN with `darkMode: 'class'`), Inter font
- **Charts:** Recharts (Line, Bar, Pie, Radar)
- **Icons:** Lucide React (28 icons)
- **PDF:** jsPDF for collection export
- **Backend:** Supabase (PostgreSQL) with localStorage fallback
- **Auth:** PIN-based (SHA-256 hash in Supabase `app_config` table)
- **Deploy:** GitHub Pages via GitHub Actions
- **Keep-alive:** Cron workflow pings Supabase Mon+Thu to prevent free-tier pausing

### Data Flow
1. On mount, `coffeeService.getAllCoffees()` queries Supabase
2. If Supabase returns empty, falls back to `personal_coffees.js` seed data
3. If Supabase errors, falls back to localStorage (read-only; writes still require Supabase)
4. All CRUD operations go through `coffeeService` which handles camelCase↔lowercase column mapping
5. Equipment profiles are localStorage-only (not synced to Supabase)

### Component Architecture
```
App.js (1861 lines — main orchestrator)
├── PinScreen (4-digit PIN gate)
├── GlassCard (glassmorphism wrapper, forwardRef)
├── Modal (reusable dialog)
├── StarRating (0-5 stars, read-only or interactive)
├── ComboBox (text input + filterable dropdown, country mode)
├── TasteProfile (12 taste attribute sliders)
├── SkeletonLoader (StatsSkeleton, CoffeeListSkeleton)
├── EquipmentSelector (header dropdown)
├── EquipmentManager (CRUD modal)
└── CoffeeCardDisplay (standalone card component)
```

### Supabase Schema
Table `coffees` with columns: id (BIGINT PK), cuppingtime, roaster, description, origin, url, imageurl, percentarabica, percentrobusta, roastlevel, brewingmethod, recommendedmethod, grinded, grindingtime, grindingdegree, preparationnotes, coffeeamount, servings, cremarating, tasterating, tastenotes, comment, favorite, price, packagesize, currency, coffeegroup, equipmentid, created_at.

Table `app_config` with `pin_hash` (SHA-256) for PIN authentication.

RLS policies: Read access for anon key, insert/update/delete for anon key.

## File Inventory

| File | Purpose | Status |
|------|---------|--------|
| `src/App.js` | Main app: state, CRUD, forms, analytics, rendering | Active |
| `src/index.js` | React 18 entry point, service worker registration | Active |
| `src/index.css` | Glassmorphism, animations, range input styling | Active |
| `src/personal_coffees.js` | Seed data: 29 coffee entries with imageUrl (Gran Cremoso removed) | Active |
| `src/personal_coffees.backup.js` | Backup of older seed data | Archive |
| `src/supabaseClient.js` | Supabase client with 5s fetch timeout | Active |
| `src/services/coffeeService.js` | Dual-mode CRUD (Supabase + localStorage fallback) | Active |
| `src/services/equipmentService.js` | Equipment CRUD (localStorage only) | Active |
| `src/services/pinService.js` | PIN verification via Supabase `app_config` | Active |
| `src/constants/brewingMethods.js` | 9 brewing methods with emoji icons | Active |
| `src/constants/countries.js` | 28 country flags, roast badge colors, prep notes | Active |
| `src/constants/tasteAttributes.js` | 12 taste attributes with emoji icons | Active |
| `src/hooks/useDarkMode.js` | Dark mode toggle + localStorage + Tailwind `dark` class | Active |
| `src/hooks/useEquipment.js` | React state wrapper for equipmentService | Active |
| `src/components/PinScreen.js` | 4-digit PIN entry with auto-submit, shake animation | Active |
| `src/components/shared/GlassCard.js` | Card wrapper with glassmorphism (forwardRef) | Active |
| `src/components/shared/Modal.js` | Reusable dialog with backdrop blur, click-outside | Active |
| `src/components/shared/StarRating.js` | 5-star rating with read-only mode | Active |
| `src/components/shared/ComboBox.js` | Filterable dropdown with country flag mode | Active |
| `src/components/shared/TasteProfile.js` | 12 taste sliders with text output | Active |
| `src/components/shared/SkeletonLoader.js` | Loading skeletons for stats and card list | Active |
| `src/components/equipment/EquipmentManager.js` | Equipment profile CRUD modal | Active |
| `src/components/equipment/EquipmentSelector.js` | Header dropdown for equipment switching | Active |
| `public/index.html` | HTML shell: Tailwind CDN, Inter font, dark mode config | Active |
| `public/manifest.json` | PWA manifest (standalone, amber theme) | Active |
| `public/service-worker.js` | Basic cache-first SW (hardcoded paths — broken) | Broken |
| `.github/workflows/deploy.yml` | GitHub Pages deploy on push to master | Active |
| `.github/workflows/keep-supabase-alive.yml` | Cron Mon+Wed+Fri — UPSERTs into `keep_alive` to prevent Supabase pausing | Active |
| `package.json` | Dependencies: react 18, supabase-js, recharts, jspdf, lucide-react | Active |
| `.env.example` | Template for Supabase URL and anon key | Active |
| `.gitignore` | Ignores node_modules, build, .env, .claude | Active |
| `CLOUD_SETUP.md` | Step-by-step Supabase + GitHub Pages setup guide | Active |
| `SUPABASE_PIN_SETUP.sql` | SQL for `app_config` table + PIN hash + RLS | Active |
| `SUPABASE_KEEP_ALIVE_SETUP.sql` | SQL for the `keep_alive` table + RLS used by the cron | Active |
| `README.md` | Full feature docs, tech stack, data model | Active |
| `OFFLINE_IMPLEMENTATION_PLAN.md` | 5-phase offline support plan (not implemented) | Planning |
| `OFFLINE_TEST_RESULTS.md` | Offline capability test results (2025-12-26) | Archive |
| `gorilla-delicato-import.json` | Sample import file (1 coffee entry) | Active |
| `lavazza-vibrante-import.json` | Sample import file (1 coffee entry) | Active |
| `coffee-recovery-2026-04-01.json` | 30-coffee phone export — recovery snapshot from the April 2026 pause incident | Backup (gitignored) |
| `docs/session-summary-2024.md` | Historical session summary | Archive |
| `docs/session-summary-2025-06-16.md` | Session summary | Archive |
| `docs/deployment-changes-2025-06-15.md` | Deployment changelog | Archive |
| `docs/updates-2025-06-16.md` | Feature update log | Archive |
| `docs/features/improved-form-ui.md` | Form UI improvement docs | Archive |
| `docs/features/enhanced-coffee-editing.md` | Editing enhancement docs | Archive |
| `docs/SUPABASE_KEEP_ALIVE.md` | Keep-alive workflow docs | Active |

## Usage

### Prerequisites
- Node.js 18+
- npm
- Supabase project (free tier works) with tables created per `CLOUD_SETUP.md`
- GitHub repo with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` secrets

### Local Development
```bash
# Clone and install
git clone https://github.com/tbuchboeck/coffee-tracker.git
cd coffee-tracker
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run locally
npm start
# Opens http://localhost:3000/coffee-tracker
```

### Build and Deploy
```bash
# Build for production
npm run build

# Deploy to GitHub Pages (automatic on push to master)
git push origin master
# GitHub Actions builds and deploys to gh-pages branch
```

### Manual Supabase Setup
```bash
# Link Supabase CLI
npx supabase link --project-ref <your-ref>

# Run schema migrations
# See CLOUD_SETUP.md for full SQL, or run:
npx supabase db query --linked "$(cat SUPABASE_PIN_SETUP.sql)"
```

### Import/Export
- **Export JSON:** Overflow menu → Export JSON (downloads `coffee-collection.json`)
- **Export PDF:** Overflow menu → Export PDF (generates multi-page collection PDF)
- **Import JSON:** Overflow menu → Import → choose replace or merge

### Adding a new coffee via Claude (recommended)
The fastest path is the `/add-coffee` skill (defined at `~/.claude/skills/add-coffee/SKILL.md`). Tell Claude the product URL — it scrapes price, image, blend, notes via WebFetch with a `curl + grep` fallback for JS-rendered shops, cross-checks blend ratio with a WebSearch + two reseller pages, shows the rendered `INSERT` for confirmation, then writes the row directly via the Supabase MCP plugin (project `hrgdmjzouzntloyngcrh`). Supports a dry-run mode ("trockenlauf") that stops before execution. Replaces the previous workflow of hand-writing a `*-import.json` file → uploading to Drive → downloading on phone → using the in-app Merge import.

## Technical Patterns

### Dual Storage with Column Mapping
`coffeeService.js` abstracts Supabase and localStorage behind a unified API. PostgreSQL uses lowercase column names (`roastlevel`), while JavaScript uses camelCase (`roastLevel`). The `COLUMN_MAPPING` object handles bidirectional conversion:
```javascript
const COLUMN_MAPPING = {
  'cuppingtime': 'cuppingTime',
  'roastlevel': 'roastLevel',
  'imageurl': 'imageUrl',
  // ... 20+ mappings
};
```
`toLowerCaseKeys()` converts outgoing data; `toCamelCaseKeys()` converts incoming data.

### Glassmorphism CSS Pattern
Two CSS classes provide the frosted-glass effect:
```css
.glass-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.18); }
.glass-card-dark { background: rgba(17,24,39,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); }
```
The `GlassCard` component wraps this with `text-white`/`text-gray-900` and optional hover effects.

### Dark Mode via Tailwind CDN
Since the app uses Tailwind CDN (not a build-time config), dark mode is configured in `index.html`:
```html
<script>tailwind.config = { darkMode: 'class' }</script>
```
The `useDarkMode` hook toggles `document.documentElement.classList.toggle('dark')` and persists to localStorage. Components use conditional classes: `${darkMode ? 'bg-gray-800' : 'bg-white'}`.

### Supabase Keep-Alive Cron (write-based)
Free-tier Supabase projects pause after 7 days of inactivity. As of April 2026, **read-only REST pings no longer count as activity** — the project paused despite Mon+Thu pings returning HTTP 200 for 5 months without a gap (verified via GitHub Actions run history). The fix is a write-based ping: `keep-supabase-alive.yml` UPSERTs a single row in a dedicated `keep_alive` table.

```yaml
schedule:
  - cron: '0 10 * * 1,3,5'  # Mon/Wed/Fri — 3-day max gap
```

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/keep_alive" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=minimal" \
  -d '{"id":1,"last_ping":"2026-04-26T11:55:52Z"}'
```

The `keep_alive` table is a singleton (`CHECK (id = 1)`) with anon RLS allowing `FOR ALL`. Schema is in `SUPABASE_KEEP_ALIVE_SETUP.sql`. The workflow exits non-zero on non-2xx responses, so silent failures show as red runs in GitHub Actions.

### Multi-Step Form Wizard
The add/edit form uses a 4-step wizard (`formStep` state, `FORM_STEPS` array). Navigation enforces sequential flow with Back/Next buttons and a progress indicator. State persists across steps in the `formData` object.

### Taste Profile Parsing
`TasteProfile.js` bidirectionally converts between structured slider data and text like `"Chocolate: 4, Nutty: 1, Fruity: 2"`. The parser uses regex: `tasteNotes.match(/(\w+):\s*(\d+)/gi)`.

### Server-Side Coffee Insertion (bypassing the app UI)
New coffees can be added directly via Supabase SQL when the app's add form is inconvenient (e.g., remote insertion, batch import from research). Required columns to satisfy the schema and render the card correctly:

```sql
INSERT INTO public.coffees (
  id, cuppingtime, roaster, description, origin, url,
  percentarabica, percentrobusta, roastlevel,
  brewingmethod, recommendedmethod, grinded,
  price, packagesize, currency, comment, favorite, imageurl
) VALUES (
  1777206427926,                              -- Date.now() in ms; matches client-side new-entry pattern
  NOW(),                                      -- cuppingtime serves as "added to collection" date in practice
  'Caffè Borbone', 'Miscela Oro',
  'Italy', 'https://www.vettore.at/Borbone-oro',
  50, 50,                                     -- percentarabica / percentrobusta
  'dark',                                     -- roastlevel: light | medium | medium-dark | dark
  'espresso', 'espresso',                     -- brewingmethod / recommendedmethod tokens (lowercase, no emoji)
  false,                                      -- grinded: false = whole bean
  '19.29',                                    -- price is TEXT, not numeric — use decimal-as-string
  1000, 'EUR',                                -- packagesize in grams
  'Tasting notes per shop: ...', false,
  'https://www.vettore.at/media/image/product/612/lg/borbone-oro.jpg'
);
```

Tokens used in `brewingmethod` / `recommendedmethod`: `espresso`, `caffe-crema`, `v60`, `chemex`, `frenchpress`, `aeropress`, `mokapot`, `dripper`, `filter`, `coldbrew`. Discovered by `SELECT DISTINCT recommendedmethod FROM coffees`. Roast levels: `light`, `medium`, `medium-dark`, `dark`.

This pattern is now wrapped in the `/add-coffee` skill (see `~/.claude/skills/add-coffee/SKILL.md`) which handles URL → scrape → preview → confirm → execute → verify, with a documented dry-run mode. The skill encodes three reliability findings from the May 2026 dry-run on Borbone Red: (1) WebFetch's AI-summarizer strips schema.org microdata on JS-rendered shops, so prefer a `curl + grep itemprop="price"` fallback; (2) blend ratio is the most-often-missing field and **must not** be extrapolated from sister products in the same line (Borbone Linea Bar has three distinct ratios: Oro 50/50, Blu 30/70, Red 100% Robusta); (3) dry-run mode is a documented path, not an ad-hoc opt-out, so trial scrapes don't pollute production.

### vettore.at Product Images (JTL-Shop)
vettore.at runs on JTL-Shop. Product image URLs follow the pattern `https://www.vettore.at/media/image/product/<numeric-id>/<size>/<slug>.jpg` where `<size>` is one of `xs`, `sm`, `md`, `lg`. The `lg` variant is 800×800. Easiest extraction: `curl -sL <product-page> | grep -oE 'og:image[^>]*content="[^"]+"'` returns the canonical image directly from the OpenGraph meta tag.

### Image Error Handling with React State
Product images use `React.useState(false)` for error tracking instead of DOM mutation:
```jsx
const [imgError, setImgError] = React.useState(false);
{coffee.imageUrl && !imgError && (
  <img src={coffee.imageUrl} onError={() => setImgError(true)} referrerPolicy="no-referrer" loading="lazy" />
)}
```

### Cost Calculation with Cold Brew Support
`calculateCostPerCup()` handles both espresso (single dose) and cold brew (batch with servings):
- Standard: `(price / packageSize) * coffeeAmount`
- Cold brew: divides by `servings` count
Returns `{ costPerCup, currency, gramsUsed, batchInfo }`.

### Collapsible Cards with Condensed Stats
`CoffeeCardDisplay` uses `React.useState(false)` for expand/collapse. Compact view shows:
- Product image with roaster name overlay (gradient `from-black/70`)
- Roaster name + roast level badge
- Condensed stats bar: `0.35 EUR | T5 C5 | 14.3 ★★★` (cost, taste/crema abbreviations, efficiency score with label)

Expanded view adds: description, arabica/robusta %, brewing method, grinder settings, date, origin flags, taste notes, prep notes, star ratings, product link, comment, action buttons.

Click handler uses `e.target.closest('button, a, input')` to prevent expand/collapse when interacting with child elements.

### Cost Efficiency Metric
`calculateValueScore()` computes a value-for-money ratio combining taste rating and cost per cup. Three color-coded tiers with labels:
- `getEfficiencyColor(score, darkMode)` — green/amber/red based on thresholds
- `getEfficiencyBgColor(score, darkMode)` — matching background tints
- `getEfficiencyLabel(score)` — "Great"/"Good"/"Fair" labels

Default sort is by Efficiency, default filter is Favorites.

## Known Issues

1. **Write operations don't fall back to localStorage** — if Supabase is unreachable, add/edit/delete will fail (reads fall back correctly)
2. **Service worker caches hardcoded paths** — CRA generates hashed filenames (`main.abc123.js`), but the SW caches `main.js`. Needs Workbox integration per `OFFLINE_IMPLEMENTATION_PLAN.md`
3. **Equipment is localStorage-only** — not synced to Supabase, will be lost on browser clear
4. **2 coffees without product images** — 220 Grad Guatemala La Labor and Guatemala Robusta (products discontinued, no online images available)
5. **`getRoastBadge()` uses `dark:` Tailwind prefix** — works because `darkMode: 'class'` is configured and `useDarkMode` toggles the class on `<html>`, but this is a different pattern from the ternary-based dark mode used elsewhere in the codebase

## Lessons Learned

- **Always migrate the database when adding columns in code** — the `equipmentid` and `imageurl` columns were added to `coffeeService` column mapping but not to the Supabase table, breaking all saves/updates until the `ALTER TABLE` was run
- **Tailwind CDN `dark:` variants require explicit configuration** — `tailwind.config = { darkMode: 'class' }` must be set in the HTML, and the `dark` class must be toggled on `<html>`
- **CoffeeCardDisplay doesn't use GlassCard** — it rolls its own card div with `glass-card-dark`, so `text-white` must be added explicitly (caused black-on-dark text bug)
- **Product image URLs can have double encoding** — Lavazza's CDN uses `%40` in URLs which got stored as `%2540` (double-encoded), working in browsers but failing in programmatic fetches
- **Dynamic Tailwind class construction doesn't work** — `hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'}` fails because Tailwind can't detect classes built at runtime. Must use full static strings in ternaries
- **Supabase free tier pausing is aggressive** — 7 days of inactivity triggers a pause; the keep-alive cron is essential
- **Read-only REST pings no longer count as Supabase activity** — `SELECT id FROM coffees LIMIT 1` returning HTTP 200 every 3 days kept the cron green for 5 months but the project paused anyway. Switched to UPSERT against a dedicated `keep_alive` table; writes are unambiguous activity. (April 2026)
- **DNS not resolving for a Supabase project means paused, not deleted** — `*.supabase.co` API hostnames stop resolving when paused. The dashboard at `supabase.com/dashboard/project/<ref>` still works and shows a Restore button. Don't assume "deleted" without checking the dashboard first
- **PIN auth has no offline fallback** — `coffeeService` falls back to localStorage on read errors, but `pinService.verifyPin()` requires Supabase. If the backend is unreachable, the app is fully locked out. Workaround during outages: bypass PIN by setting `sessionStorage.coffeeTrackerPinVerified='true'` via DevTools or a temp deploy
- **The phone is a viable recovery source** — localStorage on the user's phone PWA holds a complete cached copy of the most recent Supabase sync. Combined with the Export JSON feature, this is the canonical "what does the user actually have" snapshot during a backend outage
- **The "JSON file → Drive → phone → in-app merge import" loop was reverse-engineered busywork** — every step was simulating what an `INSERT` already does. Once the project ran on Supabase, the import flow remained because it predated the cloud migration. The right replacement is direct DB writes via the Supabase MCP plugin, wrapped in a skill so the user doesn't need to remember the column quirks. (May 2026)
- **WebFetch is not enough for JS-rendered e-commerce** — the AI-summarizer drops schema.org microdata even when it's present in the response. `curl -sL <url> | grep -iE 'itemprop="(price|image)"|og:image'` recovers price and canonical image reliably from JTL-Shop / Shopware / Magento pages where WebFetch returned `null`. Discovered while scraping Vettore's Borbone Red listing (May 2026)
- **Sister products in a "line" do not share blend ratios** — Borbone Linea Bar Oro is 50/50, Blu is 30/70, Red is 100% Robusta. Extrapolating from a sister product was wrong twice in one session. Always verify externally (two independent reseller pages) before committing a percentage

## Timeline

| Date | Milestone |
|------|-----------|
| 2024 (various) | Initial development: core CRUD, ratings, local storage |
| 2025-06-15 | GitHub Pages deployment, improved form UI |
| 2025-06-16 | Enhanced coffee editing, session summaries |
| 2025-10-22 | Supabase cloud migration, PIN auth setup |
| 2025-12-26 | Offline testing, keep-alive workflow fixes |
| 2026-01-23 | Data sync (26→30 entries), Gorilla Delicato import |
| 2026-03-14 | Major refactoring: component extraction (3300→1850 lines), equipment tracking, glassmorphism UI |
| 2026-03-21 | Dark mode fixes (31 issues), product images (28/30 coffees), dead URL fixes, Supabase schema migration (imageurl + equipmentid columns) |
| 2026-03-22 | Cost efficiency metric, collapsible cards with condensed stats bar, image name overlay, default sort by efficiency, removed fake Gran Cremoso entry |
| 2026-04-26 | Supabase project paused (despite green keep-alive cron); restored from dashboard. Recovered 30-coffee snapshot via phone JSON export. Switched cron from read-only `SELECT` to write-based `UPSERT` into a new `keep_alive` table (Mon/Wed/Fri schedule). PIN auth restored after a one-deploy bypass to extract phone localStorage data. Added Caffè Borbone Miscela Oro (id 1777206427926) directly via SQL — first server-side insertion (bypassing the app UI) using the Supabase MCP plugin |
| 2026-05-12 | Added Caffè Borbone Miscela Blu Linea Bar (id 1777206427927) via the same SQL-INSERT pattern. Generated `borbone-blu-import.json` as part of an aborted JSON-file/Drive workaround before switching to direct INSERT |
| 2026-05-13 | Wrapped the SQL-INSERT pattern in a `/add-coffee` Claude skill at `~/.claude/skills/add-coffee/SKILL.md` — URL → scrape (WebFetch + `curl/grep` fallback) → blend cross-check → preview → confirmation → Supabase MCP INSERT → verify. Dry-run on Borbone Miscela Red revealed: WebFetch loses schema.org microdata on JS-rendered shops; Borbone Linea Bar has three different blend ratios (Oro/Blu/Red), so sister-product extrapolation fails. Both lessons baked into the skill's pitfalls section. No row added to DB — Red was a dry-run target only |
| 2026-05-13 | Plan D-3 of the personal-apps auth rollout: replaced the React `PinScreen` with new `AuthScreen` component, `pinService.js` with `authService.js`. WebAuthn passkey gate via `auth.apps.buchboeck.at` (Biometric + Recovery-Code paths, no PIN UI). Dropped `homepage: https://tbuchboeck.github.io/coffee-tracker` from `package.json` so CRA builds with root-relative asset paths for Vercel root-deploy. New coffee-bean icon set (SVG + PNG sizes incl. maskable) replacing the React-default logos; `public/manifest.json` rewritten with `background_color: #e8c878` (caught a subtle bug on first deploy: my earlier `Write` to manifest.json silently failed with a Read-precondition error, so the published manifest kept `background_color: #ffffff` — that's the white frame Android painted around the maskable icon on PWA install). App now at `https://coffee.apps.buchboeck.at` (CNAME via easyname API + Playwright UI-Save). Per-app rpId = `coffee.apps.buchboeck.at` |
