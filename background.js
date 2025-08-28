const DEFAULT_API = "http://localhost:8080/api/v1/text";
const DEFAULT_API_CANVAS = "http://localhost:8080/api/v1/canvas";


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

chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "trigger-capture-html") return;

    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (!tab?.id) return;

        const {apiCanvasUrl, apiSecret} = await chrome.storage.local.get(["apiUrl", "apiSecret"]);
        const targetUrl = apiCanvasUrl || DEFAULT_API_CANVAS;

        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            world: "MAIN",
            func: async (url, secret) => {
                try {
                    // Ensure we're on a Google Doc
                    const m = location.pathname.match(/\/document\/(u\/\d+\/)?d\/([^/]+)/);
                    if (!m) {
                        console.warn("[capture-html] Not a Google Doc page");
                        return;
                    }
                    const userPart = m[1] || "";   // e.g. "u/2/"
                    const id = m[2];

                    // Build a nice filename from the doc title
                    const base = (document.title || "document")
                        .replace(/\s+-\s+Google Docs.*/, '')
                        .replace(/[\\/:*?"<>|]/g, "_");
                    const filename = base + ".html";

                    // Same-origin export (uses your Google session cookies)
                    const exportPath = `/document/${userPart}d/${id}/export?format=html`;
                    const res = await fetch(exportPath, {credentials: "include"});
                    if (!res.ok) throw new Error(`Export failed: ${res.status} ${res.statusText}`);

                    const blob = await res.blob();

                    // Build multipart body; DON'T set Content-Type manually (avoids boundary/ISO-8859-1 issues)
                    const fd = new FormData();
                    const file =
                        (typeof File !== "undefined")
                            ? new File([blob], filename, {type: blob.type || "text/html"})
                            : blob;
                    fd.append("file", file, filename);

                    const up = await fetch(url, {
                        method: "POST",
                        body: fd,
                        headers: {"X-Api-Secret": secret || ""}
                    });

                    if (!up.ok) throw new Error(`Upload failed: ${up.status} ${up.statusText}`);
                    console.log("[capture-html] Uploaded ✔");
                } catch (e) {
                    console.error("[capture-html] Error:", e);
                }
            },
            args: [targetUrl, apiSecret || ""]
        });
    } catch (err) {
        console.error("Capture HTML failed:", err);
    }

});

