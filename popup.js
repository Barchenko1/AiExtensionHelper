const apiUrlEl = document.getElementById("apiUrl");
const apiUrlCanvasEl = document.getElementById("apiCanvasUrl");
const apiSecretEl = document.getElementById("apiSecret");
const promptEl = document.getElementById("promptText");
const langEl = document.getElementById("langSelect");
const statusEl  = document.getElementById("status");

(async () => {
  const { apiUrl, apiCanvasUrl, apiSecret, prompt, language } = await chrome.storage.local.get(["apiUrl", "apiCanvasUrl", "apiSecret", "prompt", "language"]);
  apiUrlEl.value = apiUrl || "";
  apiUrlCanvasEl.value = apiCanvasUrl || "";
  apiSecretEl.value = apiSecret || "";
  promptEl.value = prompt || "";
  langEl.value = language || "Java";

})();

document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiUrl = apiUrlEl.value.trim();
  const apiCanvasUrl = apiUrlCanvasEl.value.trim();
  const apiSecret = apiSecretEl.value.trim();
  const prompt = promptEl.value;
  const language = langEl.value;

  await chrome.storage.local.set({ apiUrl, apiCanvasUrl, apiSecret, prompt, language });
  statusEl.textContent = "Saved";
  setTimeout(() => (statusEl.textContent = ""), 1200);
});
