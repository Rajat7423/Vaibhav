# CINEVERSE AI

A full-stack movie discovery app built with React, Vite, Express, SQLite and TMDB. Browse Hollywood, Bollywood (Hindi/India) and Tollywood (Telugu/India), search titles, filter genres, choose moods, inspect cast/trailers and save favorites/watchlists to an account.

## Requirements

- Node.js 20.19+ (22 LTS recommended)
- pnpm (or npm)
- TMDB API Read Access Token from [TMDB API settings](https://www.themoviedb.org/settings/api)

## Local setup

```bash
pnpm install
cp .env.example .env
```

Set `TMDB_READ_ACCESS_TOKEN` in `.env`; it is read only by the Express server and never sent to the client. Then run:

```bash
pnpm dev
```

Open <http://localhost:3000>. The app can start without TMDB credentials, but the live catalog, posters, cast, trailers and TMDB recommendations require a token. Gemini is optional; its existing AI endpoint uses `GEMINI_API_KEY` when present.

## Catalog size and regions

Catalogs are requested page by page from TMDB. Each page has up to 20 results and page navigation supports TMDB's maximum of 500 pages, so each industry collection can expose up to 10,000 entries when TMDB has that many matching results. TMDB's reported catalog counts change over time; the app shows the current count and does not manufacture records to meet a fixed count. Hollywood is US-origin English-language cinema, Bollywood is Indian Hindi-language cinema, and Tollywood is Indian Telugu-language cinema.

## Accounts and data

Account passwords are scrypt-hashed. HTTP-only, SameSite session cookies and CSRF tokens protect account list mutations. SQLite stores accounts, sessions, favorites, and watchlists. For production, set `DATABASE_PATH` to persistent storage; the included Render Blueprint mounts a 1 GB persistent disk at `/data`.

## Deploy with Docker / Render

Build and run locally:

```bash
docker build -t cineverse-ai .
docker run --rm -p 3000:3000 -e TMDB_READ_ACCESS_TOKEN='your-token' -v cineverse-data:/data cineverse-ai
```

For Render, push this repository to GitHub, create a Blueprint from `render.yaml`, and enter `TMDB_READ_ACCESS_TOKEN` in the service environment. The SQLite disk is persistent. For horizontal multi-instance scaling, migrate to managed PostgreSQL and shared session storage before scaling beyond one instance.

## TMDB attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie posters, metadata, cast, ratings and videos are served from TMDB. Streaming availability is not represented as verified.

## Scripts

- `pnpm dev` — Express + Vite development server
- `pnpm build` — production frontend build
- `pnpm start` — production server
- `pnpm lint` — TypeScript check
