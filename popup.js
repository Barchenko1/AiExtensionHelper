const apiUrlEl = document.getElementById("apiUrl");
const statusEl  = document.getElementById("status");

(async () => {
  const { apiUrl } = await chrome.storage.local.get(["apiUrl"]);
  apiUrlEl.value = apiUrl || "http://localhost:8080/text";
})();

document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiUrl = apiUrlEl.value.trim();
  await chrome.storage.local.set({ apiUrl });
  statusEl.textContent = "Saved";
  setTimeout(() => (statusEl.textContent = ""), 1200);
});
