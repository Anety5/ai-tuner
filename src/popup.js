const ids = ["creativity","factuality","sociability","obedience"];
const $ = id => document.getElementById(id);
const updateLabels = () => ids.forEach(i => $("v_"+i).textContent = $(i).value);

(async function init(){
  const saved = await chrome.storage.sync.get(["eq","parental"]);
  if (saved.eq) ids.forEach(i => { $(i).value = saved.eq[i] ?? $(i).value; });
  if (typeof saved.parental === "boolean") $("parental").checked = saved.parental;
  updateLabels();
})();

ids.forEach(i => $(i).addEventListener("input", updateLabels));

$("save").onclick = async () => {
  const eq = Object.fromEntries(ids.map(i => [i, Number($(i).value)]));
  const parental = $("parental").checked;
  await chrome.storage.sync.set({ eq, parental });
};

$("run").onclick = async () => {
  const eq = Object.fromEntries(ids.map(i => [i, Number($(i).value)]));
  const parental = $("parental").checked;
  const input = $("prompt").value.trim();
  $("out").textContent = "Running…";
  let res = await chrome.runtime.sendMessage({ type:"RUN_EQ", eq, parental, input });
  if (res?.error && res.error.includes("Gemini Nano not available")) {
    // Fallback: use Gemini 1.5 cloud API
    try {
      const { GEMINI_API_KEY } = await import("../../config.js");
      const system = [
        parental ? "Parental Mode: ON (G-rated, school-safe). Avoid mature topics; use kid-safe wording." : "Parental Mode: OFF (standard academic tone).",
        `Rails: temp=${eq.creativity} topK=${eq.creativity} verbosityCap=${eq.sociability} praiseLimit=${eq.sociability} strictness=${eq.obedience} grounding=${eq.factuality}`,
        "Rules: Avoid exaggerated praise. Be precise; cite/hedge when unsure. Ask ONE short clarifying question if constraints conflict."
      ].join("\n");
      const prompt = [system, input].join("\n\nUser: ");
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY;
      const body = JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
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
      $("out").textContent = text + "\n\n[Cloud fallback: Gemini 1.5]";
      return;
    } catch (e) {
      $("out").textContent = "Cloud fallback failed: " + (e.message || e);
      return;
    }
  }
  $("out").textContent = res?.result || res?.error || "(no response)";
};

$("diag").onclick = async () => {
  $("out").textContent = "Running diagnostics...";
  const details = {
    hasGlobalAI: !!globalThis.ai,
    hasGlobalAILM: !!globalThis.ai?.languageModel,
    hasLanguageModel: !!globalThis.LanguageModel,
    hasNavigatorAI: !!globalThis.navigator?.ai
  };
  try {
    if (typeof globalThis.ai?.languageModel?.canCreate === 'function') {
      const v = await globalThis.ai.languageModel.canCreate();
      $("diagResult").textContent = `ai.languageModel.canCreate() => ${v}`;
    } else if (typeof globalThis.LanguageModel?.availability === 'function') {
      const s = await globalThis.LanguageModel.availability();
      $("diagResult").textContent = `LanguageModel.availability() => ${s}`;
    } else {
      $("diagResult").textContent = `Prompt API not found in popup context. Details: ${JSON.stringify(details)}`;
    }
    $("out").textContent = JSON.stringify(details, null, 2);
  } catch (e) {
    $("diagResult").textContent = `Diagnostics error: ${e.message}`;
    $("out").textContent = (e.stack || e.message || String(e));
  }
};
