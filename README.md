This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

## OpenAI (Responses API)

This project uses the OpenAI Responses API server-side in `/api/miteru/analyze`.

1) Set env var in `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
# Optional (cost-first defaults are used if omitted)
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_VISION_MODEL=gpt-4o-mini
```

## MVP: Screenshot → Diagnosis

### How to use

1) Start dev server:

```bash
npm run dev
```

2) Open the analyzer page:

- `http://localhost:3000/miteru/analyze`

3) Upload LINE chat screenshots:

- png/jpg
- up to 10 images
- total up to 20MB (processed in memory only; not saved)

4) Click "解析を始める" to get a strict JSON result:

- `score` (0-100)
- `summary`
- `red_flags` (string[])
- `advice` (string[])

### API

- `POST /api/miteru/analyze-image` (multipart/form-data)
	- field name: `images` (multiple)
	- rate limit (simple in-memory): 12 requests / 5 minutes per IP

2) Example request (metrics only; do not send raw talk logs):

```bash
curl -s http://localhost:3000/api/miteru/analyze \
	-H 'Content-Type: application/json' \
	-d '{"metrics":{"reply_rate":0.72,"avg_response_minutes":18,"positivity":0.63,"conflict_rate":0.08}}' | jq
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
