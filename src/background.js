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
  try {
    if (globalThis.ai?.languageModel?.canCreate) {
      return await globalThis.ai.languageModel.canCreate();
    }
  } catch(e) {}
  try {
    if (globalThis.LanguageModel?.availability) {
      const s = await globalThis.LanguageModel.availability();
      return (s === "readily" || s === "available" || s === "ready" || s === "downloaded" || s === "maybe");
    }
  } catch(e) {}
  return !!(globalThis.ai?.languageModel?.create || globalThis.LanguageModel?.create);
}
async function createSession({ systemPrompt, temperature, topK }) {
  if (globalThis.ai?.languageModel?.create) {
    return await globalThis.ai.languageModel.create({ systemPrompt, temperature, topK });
  }
  if (globalThis.LanguageModel?.create) {
    return await globalThis.LanguageModel.create({
      initialPrompts: [{ role: "system", content: systemPrompt }],
      temperature, topK
    });
  }
  throw new Error("Chrome Prompt API not available. Update Chrome to v138+.");
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
  if (!can) throw new Error("Gemini Nano not available. Click again to allow download, or update Chrome.");
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
