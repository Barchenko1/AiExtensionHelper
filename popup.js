const apiUrlEl = document.getElementById("apiUrl");
const apiUrlCanvasEl = document.getElementById("apiCanvasUrl");
const apiSecretEl = document.getElementById("apiSecret");
const statusEl  = document.getElementById("status");

(async () => {
  const { apiUrl, apiCanvasUrl, apiSecret } = await chrome.storage.local.get(["apiUrl", "apiCanvasUrl", "apiSecret"]);
  apiUrlEl.value = apiUrl || DEFAULT_API;
  apiUrlCanvasEl.value = apiCanvasUrl || DEFAULT_API_CANVAS;
  apiSecretEl.value = apiSecret || "";
})();

document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiUrl = apiUrlEl.value.trim();
  const apiCanvasUrl = apiUrlCanvasEl.value.trim();
  const apiSecret = apiSecretEl.value.trim();
  await chrome.storage.local.set({ apiUrl, apiCanvasUrl, apiSecret });
  statusEl.textContent = "Saved";
  setTimeout(() => (statusEl.textContent = ""), 1200);
});
