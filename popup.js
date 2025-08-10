const apiUrlEl = document.getElementById("apiUrl");
const apiSecretEl = document.getElementById("apiSecret");
const statusEl  = document.getElementById("status");

(async () => {
  const { apiUrl, apiSecret } = await chrome.storage.local.get(["apiUrl", "apiSecret"]);
  apiUrlEl.value = apiUrl || DEFAULT_API;
  apiSecretEl.value = apiSecret || "";
})();

document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiUrl = apiUrlEl.value.trim();
  const apiSecret = apiSecretEl.value.trim();
  await chrome.storage.local.set({ apiUrl, apiSecret });
  statusEl.textContent = "Saved";
  setTimeout(() => (statusEl.textContent = ""), 1200);
});
