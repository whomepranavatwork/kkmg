# Kunal Khemu Meme Generator

Claude writes the meme prompt. Gemini generates the image. Every meme is one-of-a-kind.

## Deploy

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "init"
gh repo create kunal-meme-generator --public --push
```

Or create a repo on github.com, then push manually.

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
2. Select `kunal-meme-generator`
3. Go to **Variables** tab and add:
   - `CLAUDE_API_KEY` → your key from [console.anthropic.com](https://console.anthropic.com)
   - `GEMINI_API_KEY` → your key from [aistudio.google.com](https://aistudio.google.com)
4. Go to **Settings** → **Networking** → **Generate Domain**
5. Open your public URL — hit Generate Meme

### 3. Use

Just open the URL and click **Generate Meme**. No keys needed in the browser — they're set server-side.

## How It Works

```
Browser → POST /api/generate-prompt
                ↓
       Server calls Claude (using CLAUDE_API_KEY env var) → returns meme prompt
                ↓
Browser → POST /api/generate-image
                ↓
       Server calls Gemini (using GEMINI_API_KEY env var) → returns base64 image
                ↓
       Image displayed in browser
```

## Environment Variables

| Variable | Required | Source |
|---|---|---|
| `CLAUDE_API_KEY` | Yes | [console.anthropic.com](https://console.anthropic.com) |
| `GEMINI_API_KEY` | Yes | [aistudio.google.com](https://aistudio.google.com) |

## Stack

- **Server**: Express.js (Node 18+)
- **AI**: Claude Sonnet 4 (prompt) + Gemini 3 Flash (image)
- **Frontend**: Vanilla HTML/CSS/JS served by Express
- **Hosting**: Railway
