chrome.runtime.onInstalled.addListener(async () => {
  const cur = await chrome.storage.local.get(["apiUrl", "hotkeys"]);
  const next = {};
  if (!cur.apiUrl) next.apiUrl = "http://localhost:8080/text";
  if (!Array.isArray(cur.hotkeys) || cur.hotkeys.length === 0) {
    next.hotkeys = ["Meta+Shift+X", "Control+Shift+X"]; // mac + win/linux example
  }
  if (Object.keys(next).length) await chrome.storage.local.set(next);
});
