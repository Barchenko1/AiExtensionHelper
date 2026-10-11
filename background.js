chrome.runtime.onInstalled.addListener(async () => {
    const { apiUrl, apiCode } = await chrome.storage.local.get(["apiUrl", "apiCode"]);
    if (!apiUrl) await chrome.storage.local.set({ apiUrl: "" });
    if (!apiCode) await chrome.storage.local.set({ apiCode: "" });
});

// Heartbeat: lets the UI show a green light while this extension is running with a valid code.
async function ping() {
    try {
        const { apiUrl, apiCode } = await chrome.storage.local.get(["apiUrl", "apiCode"]);
        if (!apiUrl || !apiCode) return;
        await fetch(apiUrl + "/api/v1/ping", {
            method: "POST",
            headers: { "X-Auth-Code": apiCode, "X-Client": "extension" }
        });
    } catch (e) {
        // server unreachable: the UI light simply stays red
    }
}

chrome.alarms.create("ping", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === "ping") ping(); });
// Changing the code (or server) must turn the old connection red right away: tell the server the
// old code's extension is gone, then check in with the new settings.
chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === "local" && (changes.apiCode || changes.apiUrl)) {
        const { apiUrl: newUrl, apiCode: newCode } = await chrome.storage.local.get(["apiUrl", "apiCode"]);
        const oldUrl = changes.apiUrl ? changes.apiUrl.oldValue : newUrl;
        const oldCode = changes.apiCode ? changes.apiCode.oldValue : newCode;
        if (oldUrl && oldCode && (oldUrl !== newUrl || oldCode !== newCode)) {
            try {
                await fetch(oldUrl + "/api/v1/ping/offline", {
                    method: "POST",
                    headers: { "X-Auth-Code": oldCode, "X-Client": "extension" }
                });
            } catch (e) { /* old server unreachable */ }
        }
    }
    ping();
});
ping();

async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function captureTextFromPage(tabId) {
    const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => (document.body?.innerText || document.documentElement.innerText || "")
    });
    return result;
}

async function exportDocHtml(tabId) {
    const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId }, world: "MAIN",
        func: async () => {
            const m = location.pathname.match(/\/document\/(u\/\d+\/)?d\/([^/]+)/);
            if (!m) return { ok:false, error:"Not a Google Doc page" };
            const userPart = m[1] || ""; const id = m[2];
            const title = (document.title || "document").replace(/\s+-\s+Google Docs.*/, "").replace(/[\\/:*?"<>|]/g, "_");
            const res = await fetch(`/document/${userPart}d/${id}/export?format=html`, { credentials:"include" });
            if (!res.ok) return { ok:false, error:`Export failed: ${res.status}` };
            const blob = await res.blob(); const ab = await blob.arrayBuffer();
            return { ok:true, filename: `${title}.html`, type: blob.type || "text/html", bytes: Array.from(new Uint8Array(ab)) };
        }
    });
    if (!result?.ok) throw new Error(result?.error || "Export failed");
    return { filename: result.filename, type: result.type, bytes: new Uint8Array(result.bytes) };
}


chrome.commands.onCommand.addListener(async (command) => {
    try {
        const tab = await activeTab(); if (!tab?.id) return;
        const { apiUrl, apiCode, prompt, language, provider } = await chrome.storage.local.get(["apiUrl", "apiCode", "prompt", "language", "provider"]);
        const providerHeaders = { "X-AI-Provider": provider === "openai" ? "openai" : "claude" };

        if (command === "trigger-capture") {
            const text = await captureTextFromPage(tab.id);
            console.log(text);
            await fetch(apiUrl + "/api/v1/text", {
                method: "POST",
                headers: { "Content-Type": "application/json",
                    "X-Auth-Code": apiCode,
                    ...providerHeaders },
                body: JSON.stringify({ text, prompt, language })
            });
            console.log("Text sent ✓");
        }

        if (command === "trigger-capture-html") {
            const { filename, type, bytes } = await exportDocHtml(tab.id);
            const fd = new FormData();
            fd.append("file", new Blob([bytes], { type }), filename);

            const payload = { prompt, language };
            fd.append(
                "payload",
                new Blob([JSON.stringify(payload)], { type: "application/json" }),
                "payload.json"
            );

            const res = await fetch(apiUrl + "/api/v1/canvas", {
                method: "POST",
                headers: { "X-Auth-Code": apiCode, ...providerHeaders },
                body: fd
            });
            if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
            console.log("HTML sent ✓");
        }
    } catch (e) {
        console.error("Command error:", e);
    }
});

