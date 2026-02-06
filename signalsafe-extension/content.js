let lastEmailText = "";

function extractEmailText() {
  const emailBody = document.querySelector("div.a3s");
  if (!emailBody) return null;

  const text = emailBody.innerText.trim();
  if (text.length < 40) return null;

  if (text === lastEmailText) return null;

  lastEmailText = text;
  return text;
}

async function scanEmail() {
  const text = extractEmailText();
  if (!text) return;

  try {
    const res = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const result = await res.json();

    if (result.riskScore >= 60) {
      showWarning(result);
    }
  } catch {}
}

function showWarning(result) {
  if (document.getElementById("signalsafe-gmail-banner")) return;

  const banner = document.createElement("div");
  banner.id = "signalsafe-gmail-banner";

  banner.style.background = "#7f1d1d";
  banner.style.color = "white";
  banner.style.padding = "10px";
  banner.style.fontSize = "14px";
  banner.style.textAlign = "center";
  banner.style.position = "sticky";
  banner.style.top = "0";
  banner.style.zIndex = "99999";

  banner.innerHTML = `
    ⚠ SignalSafe Warning — ${result.verdict} (${result.riskScore}/100)
    <button id="ss-view" style="margin-left:12px;padding:4px 8px;">Details</button>
  `;

  document.body.prepend(banner);

  document.getElementById("ss-view").onclick = () => {
    alert(result.summary || "Suspicious message detected");
  };
}

setInterval(scanEmail, 2500);
