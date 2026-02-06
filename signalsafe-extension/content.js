let lastScanned = "";

function getEmailBody() {
  // Gmail marks message containers with role="listitem"
  const messages = document.querySelectorAll('[role="listitem"]');

  if (!messages.length) return null;

  // Grab the newest (last) opened email
  const last = messages[messages.length - 1];

  const text = last.innerText?.trim();
  if (!text || text.length < 80) return null;

  if (text === lastScanned) return null;
  lastScanned = text;

  return text;
}

async function analyze(text) {
  try {
    const res = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const result = await res.json();

    if (result.riskScore >= 60) showBanner(result);
  } catch {}
}

function showBanner(result) {
  if (document.getElementById("signalsafe-gmail-banner")) return;

  const banner = document.createElement("div");
  banner.id = "signalsafe-gmail-banner";

  banner.style.background = "#7f1d1d";
  banner.style.color = "white";
  banner.style.padding = "12px";
  banner.style.fontSize = "14px";
  banner.style.textAlign = "center";
  banner.style.position = "sticky";
  banner.style.top = "0";
  banner.style.zIndex = "99999";

  banner.innerHTML = `
    ⚠ SignalSafe detected a risky email — ${result.verdict} (${result.riskScore}/100)
    <button id="ss-close" style="margin-left:10px">Dismiss</button>
  `;

  document.body.prepend(banner);

  document.getElementById("ss-close").onclick = () => banner.remove();
}

/* THIS is the important part */
const observer = new MutationObserver(() => {
  const text = getEmailBody();
  if (text) analyze(text);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
