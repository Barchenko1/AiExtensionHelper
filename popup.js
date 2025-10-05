const apiUrlEl = document.getElementById("apiUrl");
const apiUrlCanvasEl = document.getElementById("apiCanvasUrl");
const apiCodeEl = document.getElementById("apiCode");
const promptEl = document.getElementById("promptText");
const langEl = document.getElementById("langSelect");
const statusEl  = document.getElementById("status");

(async () => {
  const { apiUrl, apiCanvasUrl, apiCode, prompt, language } = await chrome.storage.local.get(["apiUrl", "apiCanvasUrl", "apiCode", "prompt", "language"]);
  apiUrlEl.value = apiUrl || "";
  apiUrlCanvasEl.value = apiCanvasUrl || "";
  apiCodeEl.value = apiCode || "";
  promptEl.value = prompt || "";
  langEl.value = language || "Java";

})();

document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiUrl = apiUrlEl.value.trim();
  const apiCanvasUrl = apiUrlCanvasEl.value.trim();
  const apiCode = apiCodeEl.value.trim();
  const prompt = promptEl.value;
  const language = langEl.value;

  await chrome.storage.local.set({ apiUrl, apiCanvasUrl, apiCode, prompt, language });
  statusEl.textContent = "Saved";
  setTimeout(() => (statusEl.textContent = ""), 1200);
});
