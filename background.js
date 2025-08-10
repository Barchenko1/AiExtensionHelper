const DEFAULT_API = "http://localhost:8080/text";

chrome.runtime.onInstalled.addListener(async () => {
  const { apiUrl, apiSecret } = await chrome.storage.local.get(["apiUrl", "apiSecret"]);
  if (!apiUrl) await chrome.storage.local.set({ apiUrl: DEFAULT_API });
  if (!apiSecret) await chrome.storage.local.set({ apiSecret: "" });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "trigger-capture") return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const { apiUrl, apiSecret } = await chrome.storage.local.get(["apiUrl", "apiSecret"]);
    const targetUrl = apiUrl || DEFAULT_API;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (url, secret) => {
        try {
          const bodyText = document.body ? document.body.innerText : document.documentElement.innerText;
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
              "X-Api-Secret": secret || ""
            },
            body: bodyText || ""
          });
        } catch (e) {
          console.error("Send failed:", e);
        }
      },
      args: [targetUrl, apiSecret]
    });
  } catch (err) {
    console.error("Capture failed:", err);
  }
});
