# 🧠 AI Tuner – Setup & Build Checklist

### Step 1 – Clone or open project
Open the `AI Tuner` folder in **VS Code** or Replit.

---

### Step 2 – Load the extension in Chrome
1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select your `AI Tuner` project folder

---

### Step 3 – Enable Gemini Nano in Chrome
1. Go to:
   - `chrome://flags/#optimization-guide-on-device-model` → Enable  
   - `chrome://flags/#prompt-api-for-gemini-nano` → Enable  
2. Visit `chrome://components` → “Optimization Guide On Device Model” → **Check for update**  
3. Restart Chrome and confirm “Ready” at `chrome://on-device-model-internals`

---

### Step 4 – Add a Gemini API key (optional fallback)
- Open the **Options** page in AI Tuner  
- Paste your free **Google AI Studio** API key  
- The extension will automatically use it if Nano is unavailable

---

### Step 5 – Test it!
- In the address bar, type:  
  `aituner <your question>`
- You’ll see a notification with the AI’s answer
- The **AI Tuner side panel** opens automatically  
- Adjust sliders and re-run the prompt

---

### Step 6 – Update keyword trigger (optional)
To change the keyword (default is `aituner`) edit `manifest.json`:
```json
"omnibox": { "keyword": "aituner" }
```

---

# 🎛️ AI Tuner

**AI Tuner** lets you control how your AI thinks and speaks — from creative and chatty to factual and precise.  
Built on Chrome’s **Prompt API** with **Gemini Nano**, it runs entirely **on-device** for privacy and speed.

## Features
- 🎨 Creativity — literal ↔ imaginative  
- 📘 Factuality — flexible ↔ research‑anchored  
- 💬 Sociability — concise ↔ conversational  
- 🧭 Obedience — adaptive ↔ strict instruction‑following  
- 🧒 Parental Mode — G-rated, school‑safe tone (ON/OFF)

## How it works
- Uses Chrome’s Prompt API to create an on-device LLM session (Gemini Nano).  
- Sliders map to model rails (temperature, topK, verbosity, grounding).  
- Settings persist via `chrome.storage.sync`.

## Install (dev)
1. Unzip this folder.  
2. Open Chrome → `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the folder.  
3. Click the toolbar icon, adjust sliders, type a prompt, press **Run**.

## Privacy
- 100% on-device inference  
- No analytics or external API calls  
- Parental Mode adds extra safety constraints (best‑effort)

Not affiliated with Google LLC. “Google” and “Chrome” are trademarks of Google LLC.
