const apiUrlEl = document.getElementById("apiUrl");
const apiCodeEl = document.getElementById("apiCode");
const promptEl = document.getElementById("promptText");
const langEl = document.getElementById("langSelect");
const modelEl = document.getElementById("modelSelect");
const statusEl  = document.getElementById("status");

(async () => {
  const { apiUrl, apiCode, prompt, language, provider } = await chrome.storage.local.get(["apiUrl", "apiCode", "prompt", "language", "provider"]);
  apiUrlEl.value = apiUrl || "";
  apiCodeEl.value = apiCode || "";
  promptEl.value = prompt || "";
  langEl.value = language || "Java";
  modelEl.value = provider || "openai";

})();

document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiUrl = apiUrlEl.value.trim();
  const apiCode = apiCodeEl.value.trim();
  const prompt = promptEl.value;
  const language = langEl.value;
  const provider = modelEl.value;

  await chrome.storage.local.set({ apiUrl, apiCode, prompt, language, provider });
  statusEl.textContent = "Saved";
  setTimeout(() => (statusEl.textContent = ""), 1200);
});
