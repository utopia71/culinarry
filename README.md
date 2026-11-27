# Culinary

A browser-based recipe book. Recipes and reviews are stored by a local REST API
and are synchronized through HTTP requests.

## Run locally

1. Install dependencies with `npm install`.
2. Start the API: `npm run api`.
3. Build the TypeScript sources: `npm run build`.
4. Serve this directory: `npm run serve`.
5. Open the page at `http://localhost:5000`.

The application entry point is `src/main.ts`; the build outputs browser modules
to `dist/`.
