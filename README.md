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
