# Sportsphere

**Every Sport. Every Story. One Universe.**

A sports news site for cricket, football, basketball, tennis, badminton, hockey, Formula 1, volleyball, kabaddi and other sports. React (Vite) frontend, Express backend, MongoDB storage, headlines from the GNews API.

```
sportsphere/
├── backend/                     Express API
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── server.js            entry: starts HTTP, connects MongoDB in the background, graceful shutdown
│   │   ├── app.js               Express app: helmet, CORS, rate limit, routes, error handling
│   │   ├── config/              env.js (only place that reads process.env), db.js (connect/retry/indexes)
│   │   ├── routes/              newsRoutes.js, healthRoutes.js
│   │   ├── controllers/         newsController.js (validate input → call service)
│   │   ├── services/            gnewsService.js (GNews client), newsService.js (cache/DB/fallback logic), articleService.js (MongoDB queries)
│   │   ├── models/              Article.js (Mongoose schema + indexes)
│   │   ├── middleware/          errorHandler.js, rateLimiter.js
│   │   └── utils/               cache.js, categories.js, validators.js, hash.js, serialize.js, AppError.js, logger.js, asyncHandler.js
│   └── tests/                   node:test suites (utils, GNews client, service layer)
└── frontend/                    React + Vite
    ├── .env.example
    ├── index.html, vite.config.js, package.json
    └── src/
        ├── api/                 axios client + endpoint functions
        ├── components/          Navbar, SearchBar, NewsCard, FeaturedStory, TrendingList, CategorySection, ArticleGrid, SafeImage, States, Footer...
        ├── pages/               Home, Category, Search, ArticleDetail, NotFound (+ shared NewsList)
        ├── hooks/               useFetch, usePagedNews, useDocumentTitle
        ├── data/ utils/ styles/
```

## What you need first

| Requirement | Notes |
|---|---|
| Node.js 18.17+ (20 or 22 recommended) | `node -v` |
| MongoDB | Local install **or** a free MongoDB Atlas cluster. The API still runs without it (see "Without MongoDB"). |
| GNews API key | Free at <https://gnews.io>. The free plan allows 100 requests/day and 10 articles per request. |

## Run it locally

Use two terminals.

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
# edit .env: set GNEWS_API_KEY and MONGODB_URI
npm run dev                 # http://localhost:5000
```
Check it: open <http://localhost:5000/api/health>. You want `"newsApi": "configured"` and, once MongoDB is up, `"database": "connected"`.

**2. Frontend**
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```
In development Vite proxies `/api` to `http://localhost:5000`, so `frontend/.env` is not needed. For a production build: `npm run build` (output in `frontend/dist`); set `VITE_API_URL` to your public API URL and add the site's origin to `CLIENT_ORIGIN` in the backend `.env`.

## Deploy on Render (free tier works)

The repo root contains `render.yaml`, a Blueprint that creates both services. **Do not upload `.env` files**; Render reads its own environment variables. (`backend/.env` is only for your computer and is git-ignored.)

1. **MongoDB Atlas:** create a free cluster, add a database user, and under *Network Access* allow `0.0.0.0/0` (Render's free IPs change). Copy the connection string (`mongodb+srv://...`) and put `/sportsphere` before the `?`.
2. **Push the project to GitHub** (the `.gitignore` keeps `.env` out).
3. In Render: **New > Blueprint**, pick the repo. Render creates `sportsphere-api` and `sportsphere-web` and asks for the secret values:
   - `GNEWS_API_KEY`: your GNews key
   - `MONGODB_URI`: the Atlas string from step 1
   - `CLIENT_ORIGIN`: `https://sportsphere-web.onrender.com`
   - `VITE_API_URL`: `https://sportsphere-api.onrender.com/api`

   If Render gives your services different names or a suffix, use the real URLs it shows. Neither value has a trailing slash.
4. If you had to correct `CLIENT_ORIGIN` or `VITE_API_URL` afterwards: edit it under the service's *Environment* tab. `CLIENT_ORIGIN` restarts the API; `VITE_API_URL` is baked in at build time, so trigger **Manual Deploy > Clear build cache & deploy** on `sportsphere-web`.
5. Verify: open `https://<api>.onrender.com/api/health` (expect `"newsApi": "configured"`, `"database": "connected"`), then the site.

Notes: free web services sleep after ~15 minutes without traffic, so the first request can take about a minute (the site waits up to 60 seconds). The API sets `trust proxy` automatically in production so the rate limiter sees each visitor's real IP.

## Configuration (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `GNEWS_API_KEY` | none | Required for live news. Never sent to the browser. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/sportsphere` | Local or Atlas connection string |
| `PORT` | `5000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Comma-separated browser origins allowed by CORS |
| `GNEWS_LANG` / `GNEWS_COUNTRY` | `en` / empty | Language and optional country (e.g. `in`) |
| `GNEWS_MAX_PER_REQUEST` | `10` | Page size. Keep 10 on the free plan. |
| `CACHE_TTL_SECONDS` | `3600` | In-memory cache lifetime, and how long stored articles count as fresh |
| `HOME_SECTIONS` | `cricket,football,basketball,tennis` | Category sections on the homepage |
| `RATE_LIMIT_PER_MIN` | `120` | Per-IP request limit |
| `SEARCH_SPORTS_ONLY` | `false` | Adds sports words to searches (can reduce result counts) |
| `TRUST_PROXY` | `1` in production, off locally | Reverse-proxy hops to trust for client IPs |

### Staying inside the free GNews quota
Every cache miss costs one GNews request. With the defaults, a busy site spends about 5 requests per hour on the homepage (1 headlines + 4 sections), plus any category pages and searches people open. To stay under 100/day: keep `CACHE_TTL_SECONDS=3600` or higher, and use fewer `HOME_SECTIONS`. Stored articles in MongoDB also act as a persistent cache, so a server restart does not re-spend quota.

## API reference

Base URL: `http://localhost:5000/api`. All endpoints are `GET`. Errors always look like:
```json
{ "error": { "code": "INVALID_QUERY", "message": "Search keywords must be at least 2 characters." } }
```

| Endpoint | Description |
|---|---|
| `/health` | Status, database connection, whether a GNews key is configured, cache size |
| `/news/categories` | The ten sports, with how many stored articles each has |
| `/news/home` | `{ featured, trending[5], latest[≤9], sections[{slug,name,articles}], meta }` |
| `/news/category/:slug?page=1` | Stories for a sport. `slug`: `cricket football basketball tennis badminton hockey formula-1 volleyball kabaddi other` |
| `/news/search?q=keywords&page=1` | `q` is 2 to 100 characters |
| `/news/article/:id` | One story plus up to 4 related stories. `id` is the 40-character hex `id` from any list |

List responses: `{ "articles": [...], "meta": { page, pageSize, source, cached, stale, total, hasMore } }`.
`meta.source` is `live` (just fetched from GNews), `cache`, or `database`. `meta.stale: true` means GNews was unavailable and stored stories were served instead.

**Pagination:** page 1 is live from GNews (cached). Pages 2+ come from the MongoDB archive of previously fetched stories, which works the same on every GNews plan.

Article object:
```json
{ "id": "3f2a…40 hex", "title": "…", "description": "…", "contentSnippet": "…", "url": "https://publisher…",
  "image": "https://…|null", "publishedAt": "2026-11-20T10:00:00.000Z",
  "source": { "name": "…", "url": "…" }, "category": "cricket", "categories": ["cricket"] }
```

| Status | Code | Meaning |
|---|---|---|
| 400 | `INVALID_QUERY`, `INVALID_PAGE`, `INVALID_ARTICLE_ID` | Bad parameter |
| 404 | `UNKNOWN_CATEGORY`, `ARTICLE_NOT_FOUND`, `NOT_FOUND` | Nothing there |
| 429 | `RATE_LIMITED`, `NEWS_API_QUOTA`, `NEWS_API_RATE_LIMIT` | You or the GNews quota hit a limit (`Retry-After` header when known) |
| 502/504 | `NEWS_API_UNAVAILABLE`, `NEWS_API_TIMEOUT`, `NEWS_API_AUTH`... | GNews problem |
| 503 | `NEWS_API_KEY_MISSING` | Add `GNEWS_API_KEY` to `backend/.env` |

When a GNews failure happens and stored stories exist, the API returns those with `meta.stale: true` instead of an error.

## MongoDB model: `articles`

| Field | Type | Notes |
|---|---|---|
| `urlHash` | String, unique | SHA-1 of the normalised publisher URL (tracking params and fragments removed). Duplicate guard and public `id`. |
| `title`, `description`, `url`, `image` | String | From GNews |
| `content` | String | GNews's truncated excerpt (never the full article) |
| `publishedAt` | Date | |
| `source` | `{ name, url }` | |
| `category` | enum | Primary section |
| `categories` | [enum] | Every sport the story mentions; merged with `$addToSet` when the same story is seen again |
| `fetchedAt`, `createdAt`, `updatedAt` | Date | `fetchedAt` has a TTL index: stored stories expire 90 days after they were last fetched |

Indexes: unique `urlHash`; `{categories, publishedAt}`; `{publishedAt}`; text index on `title` + `description`; TTL on `fetchedAt`. Queries: freshness check, paged archive, text search, latest feed, related stories, per-category counts (aggregation).

## Behaviour worth knowing

- **Full article text is never invented.** GNews supplies a headline, a description and a truncated excerpt. The story page shows those plus a button to the publisher's article.
- **Without MongoDB** the API still serves news from GNews with in-memory caching and article pages work for recently fetched stories. Archive pages (page 2+), "latest stories" depth, related stories and offline fallback need MongoDB. It reconnects automatically every 15 seconds.
- **Images** are the publisher's own URLs. Missing or broken images are replaced with a branded Sportsphere placeholder.
- The homepage "Trending now" list is GNews's top sports headlines in the order GNews ranks them.

## Testing

```bash
cd backend && npm test      # 15 tests, uses only Node's built-in test runner
```
They cover the cache, URL de-duplication, category detection, input validation, the GNews client (success, every error status, timeout, missing key, key never leaked) and the service layer with GNews mocked and MongoDB disconnected (home composition, caching, tagging, search, article lookup, quota failure).

### What was and was not verified when this project was generated
Verified (actually run):
- All backend files pass `node --check`.
- 15/15 backend tests pass. **Caveat:** the build sandbox had no network access, so `dotenv` and `mongoose` were replaced by tiny stand-ins for that run. The tests that touch them exercise the "database disconnected" path only.
- The whole frontend (every page, hook, component, API module) bundles with esbuild, so there are no broken imports or exports. Components were server-rendered in a smoke test, and the homepage was screenshotted at desktop and mobile widths with no horizontal overflow.

**Not verified (could not be run in the sandbox):** `npm install`, `vite build`, starting Express, a real MongoDB connection, any real GNews request, and the live behaviour of React Router and axios. Nothing here was tested against the real GNews service. Please run the steps above and check `/api/health` first; if something fails, the first error message will say which piece.

## Known limitations
- GNews free plan: 100 requests/day, 10 articles per request, and article content is truncated. Search results can include non-sports stories unless `SEARCH_SPORTS_ONLY=true`.
- GNews may return a story's image from the publisher that later disappears; the placeholder covers this.
- The rate limiter and cache are in memory: fine for one server instance; use a shared store (e.g. Redis) if you scale out.
- The category list exists in both `backend/src/utils/categories.js` and `frontend/src/data/categories.js`; update both when adding a sport.
- Football detection includes "football" generally, so American football stories can appear in Football.
- No user accounts, bookmarks or comments (not in the brief).
- Google Fonts (Barlow Condensed, Newsreader) load from the internet; system fonts are used as a fallback.
