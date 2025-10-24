// AI Tuner — background.js
function mapEq(eq) {
  const temperature = 0.1 + (eq.creativity/100)*0.9;     // 0.1..1.0
  const topK        = Math.round(10 + eq.creativity*0.6);// 10..70
  const verbosityCap= Math.round(1 + (eq.sociability/100)*5); // 1..6 sentences
  const praiseLimit = eq.sociability < 40 ? 0 : (eq.sociability < 70 ? 1 : 2);
  const strictness  = Math.round(50 + eq.obedience*0.5); // 50..100
  const grounding   = Math.round(eq.factuality/10);      // 0..10
  return { temperature, topK, verbosityCap, praiseLimit, strictness, grounding };
}
function parentalHeader(isOn){
  return isOn
   ? "Parental Mode: ON (G-rated, school-safe). Avoid mature topics; use kid-safe wording."
   : "Parental Mode: OFF (standard academic tone).";
}

async function canCreateLM() {
  const details = {
    hasGlobalAI: !!globalThis.ai,
    hasGlobalAILM: !!globalThis.ai?.languageModel,
    hasLanguageModel: !!globalThis.LanguageModel,
    hasNavigatorAI: !!globalThis.navigator?.ai
  };
  console.debug("AI availability check details:", details);
  try {
    if (typeof globalThis.ai?.languageModel?.canCreate === "function") {
      const v = await globalThis.ai.languageModel.canCreate();
      console.debug("ai.languageModel.canCreate() =>", v);
      return { ok: !!v, details };
    }
  } catch (e) { console.warn("ai.languageModel.canCreate() threw", e); }
  try {
    if (typeof globalThis.LanguageModel?.availability === "function") {
      const s = await globalThis.LanguageModel.availability();
      console.debug("LanguageModel.availability() =>", s);
      const ok = (s === "readily" || s === "available" || s === "ready" || s === "downloaded" || s === "maybe");
      return { ok, details: { ...details, availability: s } };
    }
  } catch (e) { console.warn("LanguageModel.availability() threw", e); }
  // Fallback: check if create functions exist at known locations
  const createPresent = !!(globalThis.ai?.languageModel?.create || globalThis.LanguageModel?.create || globalThis.navigator?.ai?.create);
  return { ok: createPresent, details };
}
async function createSession({ systemPrompt, temperature, topK }) {
  // Try known Prompt API shapes. Include navigator.ai as a fallback.
  try {
    if (typeof globalThis.ai?.languageModel?.create === "function") {
      return await globalThis.ai.languageModel.create({ systemPrompt, temperature, topK });
    }
  } catch (e) { console.warn("ai.languageModel.create() threw", e); }
  try {
    if (typeof globalThis.LanguageModel?.create === "function") {
      return await globalThis.LanguageModel.create({
        initialPrompts: [{ role: "system", content: systemPrompt }],
        temperature, topK
      });
    }
  } catch (e) { console.warn("LanguageModel.create() threw", e); }
  try {
    if (typeof globalThis.navigator?.ai?.create === "function") {
      return await globalThis.navigator.ai.create({ systemPrompt, temperature, topK });
    }
  } catch (e) { console.warn("navigator.ai.create() threw", e); }
  throw new Error("Chrome Prompt API not available in this environment. Update Chrome to the latest version and check extension context/permissions.");
}
async function promptSession(session, userInput, opts={}) {
  const res = await session.prompt(userInput, opts);
  if (res && typeof res === "object" && typeof res.text === "function") return await res.text();
  if (typeof res === "string") return res;
  return String(res ?? "");
}
async function runWithPromptAPI(input, rails, parental) {
  const system = [
    parentalHeader(parental),
    `Rails: temp=${rails.temperature.toFixed(2)} topK=${rails.topK} verbosityCap=${rails.verbosityCap} praiseLimit=${rails.praiseLimit} strictness=${rails.strictness} grounding=${rails.grounding}`,
    "Rules: Avoid exaggerated praise. Be precise; cite/hedge when unsure. Ask ONE short clarifying question if constraints conflict."
  ].join("\n");
  const can = await canCreateLM();
  console.debug("canCreateLM ->", can);
  if (!can || !can.ok) {
    // Fallback: Use Gemini 1.5 cloud API
    const apiKey = "AIzaSyAKga8TjDeC1Fy7XMnoGXfGR2Athq0Vx9M";
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey;
    const prompt = [system, input].join("\n\nUser: ");
    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: rails.temperature,
        topK: rails.topK,
        maxOutputTokens: 512
      }
    });
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    if (!resp.ok) throw new Error("Gemini 1.5 API error: " + resp.status);
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "(no response)";
    const limited = text.split(/(?<=[.?!])\s+/).slice(0, rails.verbosityCap).join(" ");
    return limited + "\n\n[Cloud fallback: Gemini 1.5]";
  }
  // Local Gemini Nano
  const session = await createSession({ systemPrompt: system, temperature: rails.temperature, topK: rails.topK });
  const draft = await promptSession(session, input);
  const limited = draft.split(/(?<=[.?!])\s+/).slice(0, rails.verbosityCap).join(" ");
  return limited;
}

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  (async () => {
    try {
      if (msg.type === "RUN_EQ") {
        const rails = mapEq(msg.eq);
        const result = await runWithPromptAPI(msg.input || "", rails, msg.parental);
        send({ ok:true, result });
        return;
      }
      send({ ok:false, error:"Unknown message" });
    } catch (e) {
      send({ ok:false, error: e.message });
    }
  })();
  return true;
});

// Omnibox event handler: listens for Chrome address bar queries using the 'aituner' keyword
chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  // Default EQ settings for omnibox trigger
  const eq = { creativity: 50, factuality: 50, sociability: 50, obedience: 50 };
  const parental = false;
  try {
    const rails = mapEq(eq);
    const result = await runWithPromptAPI(text, rails, parental);
    // Show result as a notification (or update omnibox suggestion)
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "AI Tuner Result",
      message: result.slice(0, 200)
    });
  } catch (e) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "AI Tuner Error",
      message: e.message || "Unknown error"
    });
  }
});
