chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeText",
    title: "Analyze with SignalSafe",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "analyzeText") return;

  const text = info.selectionText;

  const tabUrl = tab?.url || "";
  if (isRestrictedUrl(tabUrl)) {
    // Chrome blocks extensions from injecting into internal pages like chrome://extensions
    console.warn("SignalSafe: cannot access restricted URL:", tabUrl);
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
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showResult,
      args: [data]
    });

  } catch {
    try {
      if (!tab?.id) return;
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showError
      });
    } catch (e) {
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
