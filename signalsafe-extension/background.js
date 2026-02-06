chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeText",
    title: "Analyze with SignalSafe",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "analyzeText") return;

  const text = info.selectionText;

  const pageUrl = info?.pageUrl || info?.frameUrl || tab?.url || tab?.pendingUrl || "";
  if (isRestrictedUrl(pageUrl)) {
    // Chrome blocks extensions from injecting into internal pages like chrome://extensions
    console.warn("SignalSafe: cannot access restricted URL:", pageUrl);
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    if (!tab?.id) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showResult,
        args: [data]
      });
    } catch (e) {
      if (isAccessDeniedError(e)) return;
      throw e;
    }

  } catch {
    try {
      if (!tab?.id) return;
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showError
      });
    } catch (e) {
      // If we can't access the page (chrome://, etc), just ignore.
      if (isAccessDeniedError(e)) return;
      console.warn("SignalSafe: failed to inject error UI", e);
    }
  }
});

function isRestrictedUrl(url) {
  if (!url) return false;

  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  );
}

function isAccessDeniedError(err) {
  const message = String(err?.message || err || "");
  return (
    message.includes("Cannot access a chrome:// URL") ||
    message.includes("Cannot access contents of the page") ||
    message.includes("Cannot access")
  );
}

function showResult(result) {
  const existing = document.getElementById("signalsafe-panel");
  if (existing) existing.remove();

  const panel = document.createElement("div");
  panel.id = "signalsafe-panel";

  panel.style.position = "fixed";
  panel.style.top = "20px";
  panel.style.right = "20px";
  panel.style.width = "320px";
  panel.style.background = "#0b0b0b";
  panel.style.color = "white";
  panel.style.border = "2px solid #444";
  panel.style.padding = "14px";
  panel.style.zIndex = 999999;
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.boxShadow = "0 0 20px rgba(0,0,0,.6)";
  panel.style.borderRadius = "10px";

  panel.innerHTML = `
    <div style="font-weight:bold;font-size:18px;margin-bottom:6px;">
      SignalSafe
    </div>

    <div style="margin-bottom:10px;">
      <b>${result.verdict}</b> — Risk ${result.riskScore}/100
    </div>

    <div style="margin-bottom:8px;">
      ${result.summary || ""}
    </div>

    <div style="font-size:13px;margin-top:8px;">
      <b>Recommended Action:</b>
      <ul style="margin-top:4px;padding-left:18px;">
        ${(result.actions || [])
          .map(a => `<li>${a}</li>`)
          .join("")}
      </ul>
    </div>

    <button id="signalsafe-close"
      style="margin-top:12px;padding:6px 10px;border:none;background:#444;color:white;border-radius:6px;cursor:pointer;">
      Close
    </button>
  `;

  document.body.appendChild(panel);

  document.getElementById("signalsafe-close").onclick = () => panel.remove();
}

function showError() {
  alert("SignalSafe could not reach the local analyzer.");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SCAN_TEXT") {

    fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: request.text })
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }
        return res.json();
      })
      .then(data => sendResponse(data))
      .catch((e) => sendResponse({ error: true, message: String(e?.message || e || "") }));

    return true; // keeps channel open
  }
});
