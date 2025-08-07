const apiUrlEl = document.getElementById("apiUrl");
const hotkeysEl = document.getElementById("hotkeys");
const statusEl = document.getElementById("status");

(async function load() {
  const { apiUrl, hotkeys } = await chrome.storage.local.get(["apiUrl", "hotkeys"]);
  apiUrlEl.value = apiUrl || "http://localhost:8080/text";
  hotkeysEl.value = Array.isArray(hotkeys) ? hotkeys.join("\n") : "Meta+Shift+X\nControl+Shift+X";
})();

document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiUrl = apiUrlEl.value.trim();
  const raw = hotkeysEl.value.split("\n").map(s => s.trim()).filter(Boolean);
  const hotkeys = Array.from(new Set(raw));

  await chrome.storage.local.set({ apiUrl, hotkeys });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "SET_SETTINGS", apiUrl, hotkeys });
    } catch {
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["contentScript.js"] });
        await chrome.tabs.sendMessage(tab.id, { type: "SET_SETTINGS", apiUrl, hotkeys });
      } catch {}
    }
  }

  statusEl.textContent = "Saved";
  setTimeout(() => (statusEl.textContent = ""), 1200);
});
