"use strict";

const express = require("express");
const app = express();
app.use(express.json({ limit: "10mb" }));

const GEMINI_URL  = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
const CLAUDE_URL  = "https://api.anthropic.com/v1/messages";
const PORT        = process.env.PORT || 3003;
const CLAUDE_KEY  = process.env.CLAUDE_API_KEY || "";
const GEMINI_KEY  = process.env.GEMINI_API_KEY || "";

if (!CLAUDE_KEY) console.warn("WARNING: CLAUDE_API_KEY not set");
if (!GEMINI_KEY) console.warn("WARNING: GEMINI_API_KEY not set");

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, claude: !!CLAUDE_KEY, gemini: !!GEMINI_KEY }));

// ── Step 1: Claude writes the meme prompt ─────────────────────────────────────
app.post("/api/generate-prompt", async (_req, res) => {
  if (!CLAUDE_KEY) return res.status(500).json({ error: "CLAUDE_API_KEY not configured on server" });

  try {
    const r = await fetch(CLAUDE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: CLAUDE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: "Write an image generation prompt for a new Kunal Khemu meme." }]
      })
    });

    const b = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status).json({ error: "Claude error " + r.status + ": " + (b?.error?.message || "") });
    }

    const text = (b.content || []).map(c => c.text || "").join("").trim();
    if (!text) return res.status(500).json({ error: "Claude returned empty response" });
    return res.json({ prompt: text });
  } catch (e) {
    return res.status(500).json({ error: "Claude: " + e.message });
  }
});

// ── Step 2: Gemini generates the image ────────────────────────────────────────
app.post("/api/generate-image", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "prompt is required" });
  if (!GEMINI_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });

  try {
    const r = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      })
    });

    const b = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status).json({ error: "Gemini error " + r.status + ": " + (b?.error?.message || "") });
    }

    const parts = b?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);
    if (!imgPart) {
      return res.status(422).json({ error: "Gemini returned no image. It may have refused the prompt — try again." });
    }

    return res.json({
      mimeType: imgPart.inlineData.mimeType,
      data: imgPart.inlineData.data
    });
  } catch (e) {
    return res.status(500).json({ error: "Gemini: " + e.message });
  }
});

// ── Claude system prompt ──────────────────────────────────────────────────────
const CLAUDE_SYSTEM_PROMPT = `You are an absurdist meme prompt writer. You write image generation prompts for Kunal Khemu memes.

The Kunal Khemu meme format: Kunal Khemu (Indian Bollywood actor, known for movies like Go Goa Gone, Kalank, Dhol) is aggressively inserted into contexts where he doesn't belong. The humor is deadpan, low-effort edit aesthetic, and treats him as universally important for no reason.

Meme types you can create (pick one randomly each time):
- Evolution meme: human evolution silhouettes but the final stage is Kunal Khemu smiling in a green shirt
- Fake quote: dramatic dark background, philosophical quote attributed to "— Kunal Khemu"
- Family tree: a famous person's family tree where every single node is Kunal Khemu's face
- Breaking news: fake news broadcast with Kunal Khemu as the source/expert on something absurd
- Multiplication: Kunal Khemu's face multiplying exponentially from 1 to 2 to 4 to 8 filling the frame
- Mount Rushmore but all four faces are Kunal Khemu
- Last Supper painting but every person at the table is Kunal Khemu
- Solar system diagram but every planet is Kunal Khemu's smiling face
- School class photo where every student and teacher is Kunal Khemu
- Currency note with Kunal Khemu's face instead of the leader
- Magazine "Person of the Year" cover featuring Kunal Khemu
- Museum painting gallery where every painting is a portrait of Kunal Khemu

Return ONLY the image generation prompt. No explanation, no JSON, no markdown, no preamble. Just the raw prompt text. Make it detailed, vivid, and funny. Describe the scene so an image model can render it.`;

// ── Serve frontend ────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(getHTML());
});

app.listen(PORT, () => console.log("Kunal Khemu Meme Generator running on port " + PORT));

// ═══════════════════════════════════════════════════════════════════════════════
// HTML
// ═══════════════════════════════════════════════════════════════════════════════
function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Kunal Khemu Meme Generator</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0f;
  --card:#14141f;
  --border:#1e1e32;
  --text:#f0f0f5;
  --muted:#6b6b8a;
  --accent:#f97316;
  --accent2:#8b5cf6;
  --danger:#ef4444;
  --green:#22c55e;
}
body{background:var(--bg);color:var(--text);font-family:'Space Grotesk',system-ui,sans-serif;min-height:100vh;display:flex;justify-content:center;padding:24px 16px}
.app{max-width:580px;width:100%}
h1{font-size:28px;font-weight:700;margin-bottom:4px;letter-spacing:-0.02em}
h1 span{font-size:13px;font-weight:400;color:var(--accent);vertical-align:middle;margin-left:8px;padding:3px 10px;border:1px solid var(--accent);border-radius:20px}
.sub{font-size:13px;color:var(--muted);margin-bottom:28px;line-height:1.5}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
button{font-family:inherit;cursor:pointer;border:none;border-radius:10px;font-size:14px;font-weight:600;padding:12px 28px;transition:all .15s}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{background:#ea580c}
.btn-primary:disabled{opacity:0.35;cursor:not-allowed}
.btn-secondary{background:transparent;border:1px solid var(--border);color:var(--text);padding:12px 20px}
.btn-secondary:hover{border-color:var(--muted)}
.status{font-size:13px;color:var(--accent2);margin-bottom:12px;min-height:20px}
.error{font-size:13px;color:var(--danger);background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:10px;margin-bottom:12px}
.img-wrap{border-radius:14px;overflow:hidden;border:1px solid var(--border);margin-bottom:16px;background:var(--card)}
.img-wrap img{display:block;width:100%}
details{margin-top:8px}
summary{font-size:12px;color:var(--muted);cursor:pointer}
.prompt-box{font-size:12px;padding:14px;border-radius:10px;margin-top:8px;background:var(--card);border:1px solid var(--border);color:var(--muted);line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow:auto}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid var(--border);font-size:11px;color:var(--muted);text-align:center}
</style>
</head>
<body>
<div class="app">
  <h1>Kunal Khemu Meme Generator <span>AI</span></h1>
  <p class="sub">Claude writes the prompt. Gemini generates the image. Every meme is one-of-a-kind.</p>

  <div class="row">
    <button class="btn-primary" id="genBtn" onclick="generate()">Generate Meme</button>
    <button class="btn-secondary" id="dlBtn" style="display:none" onclick="download()">Download PNG</button>
  </div>

  <div class="status" id="status"></div>
  <div class="error" id="error" style="display:none"></div>

  <div class="img-wrap" id="imgWrap" style="display:none">
    <img id="memeImg" alt="Kunal Khemu meme"/>
  </div>

  <details id="promptDetails" style="display:none">
    <summary>View prompt sent to Gemini</summary>
    <div class="prompt-box" id="promptBox"></div>
  </details>

  <div class="footer">Powered by Claude + Gemini &middot; Every meme is unique &middot; Kunal Khemu is inevitable</div>
</div>

<script>
var currentImage = null;

async function generate() {
  var btn = document.getElementById("genBtn");
  btn.disabled = true; btn.textContent = "Generating...";
  hideError();
  document.getElementById("imgWrap").style.display = "none";
  document.getElementById("dlBtn").style.display = "none";
  document.getElementById("promptDetails").style.display = "none";
  currentImage = null;

  try {
    // Step 1: Claude writes the prompt
    setStatus("Step 1/2: Claude is crafting the meme concept...");
    var promptRes = await fetch("/api/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    var promptData = await promptRes.json();
    if (!promptRes.ok) throw new Error(promptData.error || "Claude failed");
    var memePrompt = promptData.prompt;

    document.getElementById("promptBox").textContent = memePrompt;
    document.getElementById("promptDetails").style.display = "block";

    // Step 2: Gemini generates the image
    setStatus("Step 2/2: Gemini is generating the image...");
    var imgRes = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: memePrompt })
    });
    var imgData = await imgRes.json();
    if (!imgRes.ok) throw new Error(imgData.error || "Gemini failed");

    currentImage = "data:" + (imgData.mimeType || "image/png") + ";base64," + imgData.data;
    document.getElementById("memeImg").src = currentImage;
    document.getElementById("imgWrap").style.display = "block";
    document.getElementById("dlBtn").style.display = "inline-block";
    setStatus("");

  } catch (e) {
    showError(e.message);
    setStatus("");
  }

  btn.disabled = false; btn.textContent = "Generate Meme";
}

function download() {
  if (!currentImage) return;
  var a = document.createElement("a");
  a.download = "kunal-khemu-meme.png";
  a.href = currentImage;
  a.click();
}

function setStatus(msg) { document.getElementById("status").textContent = msg; }
function showError(msg) { var el = document.getElementById("error"); el.textContent = msg; el.style.display = "block"; }
function hideError() { document.getElementById("error").style.display = "none"; }
</script>
</body>
</html>`;
}
