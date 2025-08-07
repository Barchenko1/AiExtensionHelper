let apiUrl = "http://localhost:8080/text";
let hotkeySet = new Set(["Meta+Shift+X", "Control+Shift+X"]);

function chordFromEvent(e) {
  const parts = [];
  if (e.ctrlKey) parts.push("Control");
  if (e.metaKey) parts.push("Meta");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  let key = e.code?.startsWith("Key")
    ? e.code.slice(3).toUpperCase()
    : (e.key?.length === 1 ? e.key.toUpperCase() : e.key);

  const map = { " ": "Space", Esc: "Escape", Return: "Enter" };
  key = map[key] || key;

  if (key && !["Shift","Control","Alt","Meta"].includes(key)) parts.push(key);
  return parts.join("+");
}

async function init() {
  const stored = await chrome.storage.local.get(["apiUrl", "hotkeys", "hotkey"]);
  if (stored.apiUrl) apiUrl = stored.apiUrl;

  let list = Array.isArray(stored.hotkeys) ? stored.hotkeys : [];
  if (stored.hotkey && !list.includes(stored.hotkey)) list.push(stored.hotkey);
  if (list.length === 0) list = ["Meta+Shift+X", "Control+Shift+X"];

  hotkeySet = new Set(list);
}
init();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.apiUrl) apiUrl = changes.apiUrl.newValue || apiUrl;
  if (changes.hotkeys) {
    const list = Array.isArray(changes.hotkeys.newValue) ? changes.hotkeys.newValue : [];
    if (list.length) hotkeySet = new Set(list);
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "SET_SETTINGS") {
    if (typeof msg.apiUrl === "string") apiUrl = msg.apiUrl;
    if (Array.isArray(msg.hotkeys)) hotkeySet = new Set(msg.hotkeys);
    sendResponse({ ok: true });
  }
});

async function sendHTML() {
  try {
    const html = document.body ? document.body.innerHTML : document.documentElement.outerHTML;
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: html
    });
  } catch (e) {
    console.error("Send failed:", e);
  }
}

window.addEventListener("keydown", (e) => {
  const chord = chordFromEvent(e);
  if (!hotkeySet.size) return;

  if (hotkeySet.has(chord)) {
    const hasMod = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
    if (hasMod) e.preventDefault();
    sendHTML();
  }
});
