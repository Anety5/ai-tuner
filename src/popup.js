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
  const res = await chrome.runtime.sendMessage({ type:"RUN_EQ", eq, parental, input });
  $("out").textContent = res?.result || res?.error || "(no response)";
};
