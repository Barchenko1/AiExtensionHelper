const DEFAULT_API = "http://localhost:8080/text";

chrome.runtime.onInstalled.addListener(async () => {
  const { apiUrl } = await chrome.storage.local.get(["apiUrl"]);
  if (!apiUrl) await chrome.storage.local.set({ apiUrl: DEFAULT_API });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "trigger-capture") return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const { apiUrl } = await chrome.storage.local.get(["apiUrl"]);
    const targetUrl = apiUrl || DEFAULT_API;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (url) => {
        try {
          const bodyText = document.body ? document.body.innerText : document.documentElement.innerText;
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: bodyText || ""
          });
        } catch (e) {
          console.error("Send failed:", e);
        }
      },
      args: [targetUrl]
    });
  } catch (err) {
    console.error("Capture failed:", err);
  }
});
