# MemoryVerse

MemoryVerse is an immersive 3D scrapbook for exploring memories through space, ocean, forest, and train themes.

## Run Locally

**Prerequisites:** Node.js and pnpm

1. Install dependencies:
   `pnpm install`
2. Start the development server:
   `pnpm dev`
3. Open `http://localhost:3000`

## Production

Build and run the production app locally:

```bash
pnpm build
pnpm start
```

The app stores worlds and metadata in the browser. Uploaded video and audio files are kept in IndexedDB, while lightweight world data is stored in local storage.

## Deployment

The project can be deployed with Vercel using the standard Next.js build settings. Keep `pnpm-lock.yaml` committed so dependency installation remains reproducible.
